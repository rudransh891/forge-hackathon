import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import text

from ai.vision import VisionUnavailable, analyse_image
from api.database import engine

log = logging.getLogger("fixit.pipeline")

UPLOADS_DIR = Path("uploads")
MIN_CONFIDENCE = 0.5


def _save_outcome(report_id: str, status: str, note: str,
                  issue_type: str | None = None, ai_result: dict | None = None) -> None:
    """Update the report and append a status event in one transaction."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE reports
                SET status = CASE WHEN status IN ('routed', 'escalated', 'acknowledged', 'in_progress') THEN status ELSE :status END,
                    issue_type = COALESCE(CAST(:issue_type AS text), issue_type),
                    ai_result = CASE WHEN CAST(:ai_result AS jsonb) IS NULL THEN ai_result ELSE COALESCE(ai_result, '{}'::jsonb) || CAST(:ai_result AS jsonb) END
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {
                "id": report_id,
                "status": status,
                "issue_type": issue_type,
                "ai_result": json.dumps(ai_result) if ai_result is not None else None,
            },
        )
        conn.execute(
            text(
                """
                INSERT INTO status_events (report_id, status, note)
                VALUES (CAST(:id AS uuid), :status, :note)
                """
            ),
            {"id": report_id, "status": status, "note": note},
        )


def analyse_report(report_id: str) -> str:
    """Analyse one report. Always ends in a saved status and never raises.

    Returns the final status string.
    """
    report_id = str(report_id)
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT photo_path, description FROM reports "
                    "WHERE id = CAST(:id AS uuid)"
                ),
                {"id": report_id},
            ).first()
        if row is None:
            log.error("report not found: %s", report_id)
            return "not_found"

        photo_file = UPLOADS_DIR / Path(row.photo_path).name
        if not photo_file.is_file():
            _save_outcome(report_id, "needs_review", "Photo file missing on server")
            return "needs_review"

        try:
            result, model = analyse_image(photo_file.read_bytes(), row.description)
        except VisionUnavailable as e:
            _save_outcome(report_id, "needs_review", f"AI unavailable: {str(e)[:300]}")
            return "needs_review"

        ai_result = {
            "vision": result.model_dump(),
            "model_used": model,
            "analysed_at": datetime.now(timezone.utc).isoformat(),
        }

        if not result.is_civic_issue or result.confidence < MIN_CONFIDENCE:
            note = (
                f"Please send a clearer photo of the problem. "
                f"(not a civic issue or low confidence {result.confidence:.2f}; model {model})"
            )
            _save_outcome(report_id, "needs_better_photo", note, ai_result=ai_result)
            return "needs_better_photo"

        note = f"{result.issue_type} detected, confidence {result.confidence:.2f}; model {model}"
        _save_outcome(report_id, "analysed", note,
                      issue_type=result.issue_type, ai_result=ai_result)
        return "analysed"

    except Exception as e:  # last-resort guard: never crash the background task
        log.exception("unexpected pipeline error for %s", report_id)
        try:
            _save_outcome(report_id, "needs_review", f"Unexpected error: {type(e).__name__}")
        except Exception:
            log.exception("could not even save needs_review for %s", report_id)
        return "needs_review"
