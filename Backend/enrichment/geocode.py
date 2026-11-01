import logging
import os
import threading
import time

import httpx
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("fixit.geocode")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
TIMEOUT_SECONDS = 10.0
MIN_INTERVAL_SECONDS = 1.1  # Nominatim policy: max 1 request per second

_lock = threading.Lock()
_last_call = 0.0
_cache: dict[tuple[float, float], dict] = {}


def _first(addr: dict, *keys: str) -> str | None:
    for k in keys:
        if addr.get(k):
            return addr[k]
    return None


def reverse_geocode(lat: float, lng: float) -> dict:
    """Convert coordinates to an address. Never raises.

    Success: {"ok": True, "address": ..., "road": ..., "locality": ..., "city": ...,
              "state": ..., "postcode": ..., "source": "OpenStreetMap Nominatim"}
    Failure: {"ok": False, "error": "<short reason>"}
    """
    global _last_call

    contact = os.getenv("NOMINATIM_CONTACT", "").strip()
    if not contact:
        return {"ok": False, "error": "NOMINATIM_CONTACT not set in .env"}

    key = (round(lat, 4), round(lng, 4))  # about 11 m, so nearby reports share a result
    if key in _cache:
        return {**_cache[key], "cached": True}

    headers = {"User-Agent": f"FixItBharat/0.1 (civic grievance hackathon; {contact})"}
    params = {
        "format": "jsonv2", "lat": lat, "lon": lng,
        "zoom": 18, "addressdetails": 1, "accept-language": "en",
    }

    with _lock:  # one request at a time, spaced out
        wait = MIN_INTERVAL_SECONDS - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        try:
            resp = httpx.get(NOMINATIM_URL, params=params, headers=headers,
                             timeout=TIMEOUT_SECONDS)
            _last_call = time.monotonic()
            resp.raise_for_status()
            data = resp.json()
        except httpx.TimeoutException:
            _last_call = time.monotonic()
            return {"ok": False, "error": "Nominatim timed out"}
        except httpx.HTTPStatusError as e:
            return {"ok": False, "error": f"Nominatim HTTP {e.response.status_code}"}
        except (httpx.HTTPError, ValueError) as e:
            return {"ok": False, "error": f"Nominatim unreachable: {type(e).__name__}"}

    if not isinstance(data, dict) or "error" in data or "address" not in data:
        return {"ok": False, "error": "No address found for these coordinates"}

    addr = data["address"]
    result = {
        "ok": True,
        "address": data.get("display_name"),
        "road": _first(addr, "road", "pedestrian", "footway"),
        "locality": _first(addr, "suburb", "neighbourhood", "city_district", "quarter"),
        "city": _first(addr, "city", "town", "village", "municipality"),
        "district": addr.get("state_district") or addr.get("county"),
        "state": addr.get("state"),
        "postcode": addr.get("postcode"),
        "source": "OpenStreetMap Nominatim",
    }
    _cache[key] = result
    return result


# Search is biased towards the pilot city but not restricted to it: a citizen
# outside the boundary should still find their street and be told (by routing)
# that no complaint was sent.
SEARCH_URL = "https://nominatim.openstreetmap.org/search"
SEARCH_VIEWBOX = "81.60,25.55,81.95,25.30"  # left,top,right,bottom


def search_places(query: str, limit: int = 6) -> list[dict]:
    """Forward geocode within the pilot area. Returns [] on any failure; never raises."""
    global _last_call

    text = (query or "").strip()
    if len(text) < 3:
        return []

    contact = os.getenv("NOMINATIM_CONTACT", "").strip()
    if not contact:
        return []

    params = {
        "format": "jsonv2",
        "q": text,
        "limit": max(1, min(limit, 8)),
        "addressdetails": 1,
        "accept-language": "en",
        "viewbox": SEARCH_VIEWBOX,
        "bounded": 0,
    }
    headers = {"User-Agent": f"FixItBharat/0.1 (civic grievance hackathon; {contact})"}

    with _lock:  # one request at a time, spaced out
        wait = MIN_INTERVAL_SECONDS - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        try:
            response = httpx.get(
                SEARCH_URL, params=params, headers=headers, timeout=TIMEOUT_SECONDS
            )
            _last_call = time.monotonic()
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            log.warning("nominatim search failed: %s", type(exc).__name__)
            return []

    if not isinstance(data, list):
        return []

    places = []
    for item in data:
        try:
            lat = float(item["lat"])
            lng = float(item["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        addr = item.get("address") or {}
        places.append(
            {
                "lat": lat,
                "lng": lng,
                "road": _first(addr, "road", "pedestrian", "footway"),
                "locality": _first(
                    addr, "suburb", "neighbourhood", "city_district", "quarter"
                )
                or _first(addr, "city", "town", "village", "municipality"),
                "display": item.get("display_name"),
            }
        )
    return places
