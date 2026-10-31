import json
import logging
from datetime import datetime, timezone

from sqlalchemy import text

from ai.similarity import compare
from api.database import engine
from db.geo import duplicate_radius_m, find_nearby_candidates

log = logging.getLogger("fixit.duplicates")

SET_SUGGESTION = (
    "ai_result = jsonb_set(COALESCE(ai_result, CAST('{}' AS jsonb)), "
    "'{duplicate_suggestion}', CAST(:s AS jsonb), true)"
)


def _event(conn, report_id: str, status: str, note: str) -> None:
    conn.execute(
        text("INSERT INTO status_events (report_id, status, note) "
             "VALUES (CAST(:id AS uuid), :s, :n)"),
        {"id": report_id, "s": status, "n": note},
    )


def suggest_duplicate(report_id: str) -> dict:
    """Find the most similar older open report and store a pending suggestion. Never raises."""
    report_id = str(report_id)
    try:
        with engine.connect() as conn:
            me = conn.execute(
                text("SELECT status, created_at, duplicate_of, ai_result "
                     "FROM reports WHERE id = CAST(:id AS uuid)"),
                {"id": report_id},
            ).mappings().first()
        if me is None:
            return {"ok": False, "error": "report not found"}
        if me["duplicate_of"] is not None:
            return {"ok": True, "suggested": False, "reason": "already merged"}
        ai = me["ai_result"] or {}
        vision_me = ai.get("vision")
        if not vision_me:
            return {"ok": True, "suggested": False, "reason": "not analysed yet"}
        old = ai.get("duplicate_suggestion")
        if old and old.get("response"):
            return {"ok": True, "suggested": False, "reason": "already answered by citizen"}

        found = find_nearby_candidates(report_id)
        if not found["ok"]:
            return {"ok": False, "error": found["error"]}

        radius = found["radius_m"]
        best = None
        for c in found["candidates"]:
            # Only compare with OLDER reports, so the newer one is the duplicate.
            if not c["created_at"] or datetime.fromisoformat(c["created_at"]) >= me["created_at"]:
                continue
            with engine.connect() as conn:
                v = conn.execute(
                    text("SELECT ai_result->'vision' FROM reports WHERE id = CAST(:id AS uuid)"),
                    {"id": c["id"]},
                ).scalar()
            if not v:
                continue
            r = compare(vision_me, v, c["distance_m"], radius)
            if best is None or r["score"] > best[1]["score"]:
                best = (c, r)

        if best is None or best[1]["label"] == "different":
            return {"ok": True, "suggested": False, "reason": "no similar older report nearby"}

        c, r = best
        suggestion = {
            "candidate_id": c["id"],
            "candidate_summary": c["summary"],
            "candidate_photo_url": f"/uploads/{c['photo_path']}" if c["photo_path"] else None,
            "distance_m": c["distance_m"],
            "score": r["score"],
            "label": r["label"],
            "parts": r["parts"],
            "shared_terms": r["shared_terms"],
            "suggested_at": datetime.now(timezone.utc).isoformat(),
            "response": None,
        }
        with engine.begin() as conn:
            conn.execute(
                text(f"UPDATE reports SET {SET_SUGGESTION} WHERE id = CAST(:id AS uuid)"),
                {"id": report_id, "s": json.dumps(suggestion)},
            )
            _event(conn, report_id, me["status"],
                   f"Possible duplicate of {c['id'][:8]} ({r['label']}, score {r['score']}, "
                   f"{c['distance_m']} m); waiting for citizen to confirm")
        return {"ok": True, "suggested": True, "candidate_id": c["id"],
                "label": r["label"], "score": r["score"]}
    except Exception as e:
        log.exception("suggest_duplicate failed for %s", report_id)
        return {"ok": False, "error": type(e).__name__}


def respond_to_suggestion(report_id: str, same_problem: bool) -> dict:
    """Apply the citizen's answer. Returns {"ok": False, "code": <http status>, "error": ...} on refusal."""
    report_id = str(report_id)
    try:
        with engine.begin() as conn:
            me = conn.execute(
                text("SELECT status, ai_result FROM reports "
                     "WHERE id = CAST(:id AS uuid) FOR UPDATE"),
                {"id": report_id},
            ).mappings().first()
            if me is None:
                return {"ok": False, "code": 404, "error": "report not found"}
            sug = (me["ai_result"] or {}).get("duplicate_suggestion")
            if not sug:
                return {"ok": False, "code": 409, "error": "no pending duplicate suggestion"}
            if sug.get("response"):
                return {"ok": False, "code": 409, "error": "suggestion already answered"}

            cand = sug["candidate_id"]
            now = datetime.now(timezone.utc).isoformat()

            if same_problem:
                confirmations = conn.execute(
                    text("UPDATE reports SET confirmations = confirmations + 1 "
                         "WHERE id = CAST(:c AS uuid) AND duplicate_of IS NULL "
                         "AND status <> 'resolved' RETURNING confirmations"),
                    {"c": cand},
                ).scalar()
                if confirmations is None:
                    return {"ok": False, "code": 409,
                            "error": "the earlier report is no longer open; nothing was merged"}
                sug.update(response="same", responded_at=now)
                conn.execute(
                    text(f"UPDATE reports SET duplicate_of = CAST(:c AS uuid), status = 'merged', "
                         f"{SET_SUGGESTION} WHERE id = CAST(:id AS uuid)"),
                    {"c": cand, "id": report_id, "s": json.dumps(sug)},
                )
                _event(conn, report_id, "merged",
                       f"Citizen confirmed this is the same problem as {cand[:8]}")
                _event(conn, cand, "analysed",
                       f"Confirmed by another citizen (report {report_id[:8]}); "
                       f"{confirmations} confirmations")
                return {"ok": True, "merged_into": cand, "confirmations": confirmations}

            sug.update(response="different", responded_at=now)
            conn.execute(
                text(f"UPDATE reports SET {SET_SUGGESTION} WHERE id = CAST(:id AS uuid)"),
                {"id": report_id, "s": json.dumps(sug)},
            )
            _event(conn, report_id, me["status"],
                   f"Citizen said this is a different problem from {cand[:8]}")
            return {"ok": True, "merged_into": None}
    except Exception as e:
        log.exception("respond_to_suggestion failed for %s", report_id)
        return {"ok": False, "code": 500, "error": type(e).__name__}
