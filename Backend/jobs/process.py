import logging
import time

from sqlalchemy import text

from ai.pipeline import analyse_report
from api.database import engine
from db.duplicates import suggest_duplicate
from enrichment.service import enrich_report
from ai.severity_service import score_and_store
from routing.service import route_report

log = logging.getLogger("fixit.jobs")


def _missing_context(report_id):
    try:
        with engine.connect() as c:
            m = c.execute(text("SELECT context->'missing' FROM reports WHERE id = :i"), {"i": report_id}).scalar()
        return list(m or [])
    except Exception:
        return []


def process_report(report_id: str) -> None:
    """Background workflow: AI analysis, duplicate check, then location context.

    Every step saves its own outcome and never raises, so one failing step
    never stops the next.
    """
    status = analyse_report(report_id)
    log.info("analysis finished for %s: %s", report_id, status)

    if status == "analysed":
        log.info("duplicate check for %s: %s", report_id, suggest_duplicate(report_id))

    log.info("enrichment finished for %s: %s", report_id, enrich_report(report_id))
    if _missing_context(report_id):
        time.sleep(20)
        log.info("enrichment retry for %s: %s", report_id, enrich_report(report_id))

    log.info("severity scored for %s: %s", report_id, score_and_store(report_id))

    log.info("routing finished for %s: %s", report_id, route_report(report_id))
