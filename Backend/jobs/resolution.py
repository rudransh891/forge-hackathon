"""Before/after check for a report the citizen says is fixed.

Runs in a background task, calls ai/resolution.py, and records what happened.
Never raises: a failure becomes a status event, not a broken request.
"""
import logging
import math
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import text

from ai.resolution import check_resolution, decide
from ai.vision import VisionUnavailable
from api.database import engine

log = logging.getLogger("fixit.resolution")

UPLOADS_DIR = Path("uploads")
EARTH_RADIUS_M = 6_371_000.0


def distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _record(report_id, status, note, resolved: bool) -> None:
    with engine.begin() as conn:
        if resolved:
            conn.execute(
                text(
                    "update reports set status = 'resolved', resolved_at = :t "
                    "where id = :i"
                ),
                {"t": datetime.now(timezone.utc), "i": report_id},
            )
        conn.execute(
            text(
                "insert into status_events (report_id, status, note) "
                "values (:i, :s, :n)"
            ),
            {"i": report_id, "s": status, "n": note},
        )


def process_resolution(report_id: str, after_path: str, lat: float, lng: float) -> dict:
    """Compare the after photo with the original and record the outcome."""
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("select photo_path, lat, lng, status from reports where id = :i"),
                {"i": report_id},
            ).first()
        if row is None:
            return {"ok": False, "reason": "report not found"}

        before_file = UPLOADS_DIR / Path(row.photo_path or "").name
        after_file = UPLOADS_DIR / Path(after_path).name
        if not before_file.is_file():
            _record(report_id, "needs_review", "After photo received, but the original photo is missing on the server", False)
            return {"ok": False, "reason": "original photo missing"}
        if not after_file.is_file():
            return {"ok": False, "reason": "after photo missing"}

        gap = distance_m(row.lat, row.lng, lat, lng)

        try:
            check, model = check_resolution(before_file.read_bytes(), after_file.read_bytes())
        except VisionUnavailable as exc:
            _record(
                report_id,
                "needs_review",
                f"Could not compare the after photo: {str(exc)[:300]}",
                False,
            )
            return {"ok": False, "reason": "vision unavailable"}

        outcome, reason = decide(check, gap)

        if outcome == "resolved":
            _record(
                report_id,
                "resolved",
                f"Fix confirmed from the after photo ({model}, confidence "
                f"{check.confidence:.2f}). {reason}.".capitalize(),
                True,
            )
        elif outcome == "not_fixed":
            _record(
                report_id,
                row.status,
                f"After photo checked ({model}, confidence {check.confidence:.2f}). {reason}.",
                False,
            )
        else:
            _record(
                report_id,
                row.status,
                f"After photo could not be verified ({model}). {reason}.",
                False,
            )

        return {"ok": True, "outcome": outcome, "reason": reason, "distance_m": round(gap)}
    except Exception as exc:  # last-resort guard for the background task
        log.exception("resolution check failed for %s", report_id)
        try:
            _record(report_id, "needs_review", f"Resolution check failed: {type(exc).__name__}", False)
        except Exception:
            log.exception("could not record the resolution failure for %s", report_id)
        return {"ok": False, "reason": type(exc).__name__}
