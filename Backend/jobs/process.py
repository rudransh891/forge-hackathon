"""Background workflow: analysis, duplicate check, scoring, routing.

Three things keep this honest and quick:

- Vision and enrichment do not depend on each other, so they run together.
- Enrichment is timeboxed. A slow Overpass mirror must not hold the score hostage:
  if the lookups have not answered in time, the report is scored with what is
  known and marked provisional, which the report page states plainly.
- Every external call has a short timeout, because the fallback chain is the
  safety net, not a blanket wait.
"""
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

from sqlalchemy import text

from ai.pipeline import analyse_report
from ai.severity_service import score_and_store
from api.database import engine
from db.duplicates import suggest_duplicate
from enrichment.service import enrich_report
from routing.service import route_report

log = logging.getLogger("fixit.jobs")

ENRICH_RETRY_SECONDS = float(os.getenv("ENRICH_RETRY_SECONDS", "3"))
ENRICH_WAIT_SECONDS = float(os.getenv("ENRICH_WAIT_SECONDS", "25"))


def _missing_context(report_id):
    try:
        with engine.connect() as c:
            m = c.execute(
                text("SELECT context->'missing' FROM reports WHERE id = :i"), {"i": report_id}
            ).scalar()
        return list(m or [])
    except Exception:
        return []


def _enrich_with_retry(report_id: str) -> dict:
    result = enrich_report(report_id)
    if _missing_context(report_id):
        time.sleep(ENRICH_RETRY_SECONDS)
        result = enrich_report(report_id)
    return result


def process_report(report_id: str) -> None:
    """Run the workflow for one report. Every step saves its own outcome and never
    raises, so one failing step never stops the next."""
    pool = ThreadPoolExecutor(max_workers=2)
    try:
        analysis = pool.submit(analyse_report, report_id)
        enrichment = pool.submit(_enrich_with_retry, report_id)

        status = analysis.result()
        log.info("analysis finished for %s: %s", report_id, status)

        try:
            log.info("enrichment finished for %s: %s", report_id, enrichment.result(timeout=ENRICH_WAIT_SECONDS))
        except FutureTimeout:
            # Score with what is known; the enrichment keeps running in the
            # background and its result lands on the report when it finishes.
            log.warning("enrichment still running for %s after %.0fs", report_id, ENRICH_WAIT_SECONDS)
    finally:
        pool.shutdown(wait=False)

    if status == "analysed":
        log.info("duplicate check for %s: %s", report_id, suggest_duplicate(report_id))

    log.info("severity scored for %s: %s", report_id, score_and_store(report_id))
    log.info("routing finished for %s: %s", report_id, route_report(report_id))
