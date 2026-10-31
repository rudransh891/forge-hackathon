import logging
import os

from dotenv import load_dotenv
from sqlalchemy import text

from api.database import engine

load_dotenv()
log = logging.getLogger("fixit.geo")

POINT = "ST_SetSRID(ST_MakePoint({t}.lng, {t}.lat), 4326)::geography"
CLOSED_STATUSES = ("resolved",)


def duplicate_radius_m() -> float:
    try:
        return float(os.getenv("DUPLICATE_RADIUS_M", "50"))
    except ValueError:
        return 50.0


def find_nearby_candidates(report_id: str, radius_m: float | None = None, limit: int = 5) -> dict:
    """Open, same-type, primary reports within radius_m of this report. Never raises.

    Success: {"ok": True, "radius_m": ..., "candidates": [ {id, distance_m, status,
              confirmations, created_at, summary, photo_path}, ... ]}
    Failure: {"ok": False, "error": "..."}  (or ok True with a "reason" and no candidates)
    """
    radius = radius_m if radius_m is not None else duplicate_radius_m()
    try:
        with engine.connect() as conn:
            me = conn.execute(
                text("SELECT issue_type FROM reports WHERE id = CAST(:id AS uuid)"),
                {"id": str(report_id)},
            ).first()
            if me is None:
                return {"ok": False, "error": "report not found"}
            if not me.issue_type or me.issue_type in ("other", "none"):
                return {"ok": True, "radius_m": radius, "candidates": [],
                        "reason": "issue type unknown, so no duplicate search"}

            rows = conn.execute(
                text(
                    f"""
                    SELECT o.id, o.status, o.confirmations, o.created_at, o.photo_path,
                           o.ai_result->'vision'->>'summary' AS summary,
                           ROUND(ST_Distance({POINT.format(t='r')}, {POINT.format(t='o')})::numeric, 1) AS distance_m
                    FROM reports r
                    JOIN reports o
                      ON o.id <> r.id
                     AND o.issue_type = r.issue_type
                     AND o.duplicate_of IS NULL
                     AND o.status <> ALL(:closed)
                     AND ST_DWithin({POINT.format(t='r')}, {POINT.format(t='o')}, :radius)
                    WHERE r.id = CAST(:id AS uuid)
                    ORDER BY distance_m
                    LIMIT :lim
                    """
                ),
                {"id": str(report_id), "radius": radius, "lim": limit, "closed": list(CLOSED_STATUSES)},
            ).mappings().all()

        candidates = [
            {
                "id": str(r["id"]),
                "distance_m": float(r["distance_m"]),
                "status": r["status"],
                "confirmations": r["confirmations"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "summary": r["summary"],
                "photo_path": r["photo_path"],
            }
            for r in rows
        ]
        return {"ok": True, "radius_m": radius, "candidates": candidates}
    except Exception as e:
        log.exception("duplicate search failed for %s", report_id)
        return {"ok": False, "error": f"{type(e).__name__}"}
