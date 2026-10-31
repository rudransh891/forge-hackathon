import json
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from sqlalchemy import text

from api.database import engine
from enrichment.geocode import reverse_geocode
from enrichment.overpass import nearby_places, road_class
from enrichment.weather import live_conditions

log = logging.getLogger("fixit.enrich")


def _safe(name: str, fn, *args) -> dict:
    """Run one lookup; a bug or crash in it must never stop the others."""
    try:
        return fn(*args)
    except Exception as e:
        log.exception("lookup %s crashed", name)
        return {"ok": False, "error": f"unexpected {type(e).__name__}"}


def enrich_report(report_id: str) -> dict:
    """Gather location context for one report and save it. Never raises.

    Returns {"saved": bool, "missing": [...]}.
    """
    report_id = str(report_id)
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT lat, lng FROM reports WHERE id = CAST(:id AS uuid)"),
                {"id": report_id},
            ).first()
        if row is None:
            return {"saved": False, "missing": [], "error": "report not found"}
        lat, lng = row.lat, row.lng

        # Run the independent lookups at the same time.
        with ThreadPoolExecutor(max_workers=4) as pool:
            f_geo = pool.submit(_safe, "geocode", reverse_geocode, lat, lng)
            f_places = pool.submit(_safe, "places", nearby_places, lat, lng)
            f_road = pool.submit(_safe, "road", road_class, lat, lng)
            f_live = pool.submit(_safe, "live", live_conditions, lat, lng)
            geo, places, road, live = (f.result() for f in (f_geo, f_places, f_road, f_live))

        weather = live.get("weather", {"ok": False, "error": "no weather result"})
        air = live.get("air_quality", {"ok": False, "error": "no air quality result"})

        parts = {"geocode": geo, "places": places, "road": road,
                 "weather": weather, "air_quality": air}
        missing = [name for name, part in parts.items() if not part.get("ok")]

        context = {
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            **parts,
            "missing": missing,
        }

        address = geo.get("address") if geo.get("ok") else None
        note = "Location context added"
        if missing:
            note += " (unavailable: " + ", ".join(missing) + ")"

        with engine.begin() as conn:
            current_status = conn.execute(
                text(
                    "UPDATE reports SET context = CAST(:c AS jsonb), "
                    "address = COALESCE(CAST(:a AS text), address) "
                    "WHERE id = CAST(:id AS uuid) RETURNING status"
                ),
                {"c": json.dumps(context, default=str), "a": address, "id": report_id},
            ).scalar()
            conn.execute(
                text(
                    "INSERT INTO status_events (report_id, status, note) "
                    "VALUES (CAST(:id AS uuid), :s, :n)"
                ),
                {"id": report_id, "s": current_status or "received", "n": note},
            )
        return {"saved": True, "missing": missing}

    except Exception as e:  # last-resort guard for the background task
        log.exception("enrich_report failed for %s", report_id)
        return {"saved": False, "missing": [], "error": type(e).__name__}
