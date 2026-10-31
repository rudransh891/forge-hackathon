import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("uvicorn.error")


def is_live() -> bool:
    return os.getenv("ESCALATION_LIVE", "").strip().lower() == "true"


def interval_minutes() -> int:
    try:
        return max(1, int(os.getenv("ESCALATION_INTERVAL_MINUTES", "5")))
    except ValueError:
        return 5


def escalation_tick() -> None:
    """One scheduler cycle. Never raises."""
    live = is_live()
    mode = "LIVE" if live else "DRY-RUN, nothing sent"
    try:
        from agents import escalation
        result = escalation.run(dry_run=not live)
        log.info("escalation tick (%s): %s", mode, str(result)[:300])
    except Exception as exc:
        log.error("escalation tick (%s) failed: %s", mode, exc)


def start_scheduler() -> BackgroundScheduler:
    sched = BackgroundScheduler(timezone="UTC")
    sched.add_job(
        escalation_tick, "interval", minutes=interval_minutes(),
        id="escalation", max_instances=1, coalesce=True,
    )
    sched.start()
    log.info("scheduler started: escalation every %d min, live=%s",
             interval_minutes(), is_live())
    return sched
