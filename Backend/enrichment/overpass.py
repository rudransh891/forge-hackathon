import logging
import math
import os

import httpx
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("fixit.overpass")

ENDPOINTS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
TIMEOUT_SECONDS = 12.0
PLACE_RADIUS_M = 200
ROAD_RADIUS_M = 40
SOURCE = "OpenStreetMap Overpass"
_cache: dict[tuple, dict] = {}

SCHOOL_TYPES = {"school", "kindergarten", "college"}
HEALTH_TYPES = {"hospital", "clinic"}
SKIP_HIGHWAYS = {"footway", "path", "steps", "pedestrian", "cycleway", "corridor", "bridleway", "track"}


def _headers() -> dict:
    contact = os.getenv("NOMINATIM_CONTACT", "").strip()
    return {"User-Agent": f"FixItBharat/0.1 (civic grievance hackathon; {contact})"}


def _run_query(ql: str) -> tuple[dict | None, str | None]:
    """Try each Overpass server in turn. Returns (data, error)."""
    errors = []
    for url in ENDPOINTS:
        try:
            resp = httpx.post(url, data={"data": ql}, headers=_headers(), timeout=TIMEOUT_SECONDS)
            if resp.status_code in (429, 502, 503, 504):
                errors.append(f"HTTP {resp.status_code}")
                continue
            resp.raise_for_status()
            return resp.json(), None
        except httpx.TimeoutException:
            errors.append("timed out")
        except httpx.HTTPStatusError as e:
            errors.append(f"HTTP {e.response.status_code}")
        except (httpx.HTTPError, ValueError) as e:
            errors.append(type(e).__name__)
    return None, "Overpass unavailable: " + ", ".join(errors)


def _haversine_m(lat1, lng1, lat2, lng2) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearby_places(lat: float, lng: float) -> dict:
    """Schools, hospitals/clinics and bus stops within PLACE_RADIUS_M. Never raises."""
    key = ("places", round(lat, 4), round(lng, 4))
    if key in _cache:
        return {**_cache[key], "cached": True}

    ql = (
        "[out:json][timeout:20];("
        f'nwr(around:{PLACE_RADIUS_M},{lat},{lng})["amenity"~"^(school|kindergarten|college|hospital|clinic)$"];'
        f'node(around:{PLACE_RADIUS_M},{lat},{lng})["highway"="bus_stop"];'
        ");out center tags;"
    )
    data, error = _run_query(ql)
    if data is None:
        return {"ok": False, "error": error}

    schools, health, bus_stops = {}, {}, 0
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        point = el if "lat" in el else el.get("center")
        if not point:
            continue
        dist = round(_haversine_m(lat, lng, point["lat"], point["lon"]))
        if tags.get("highway") == "bus_stop":
            bus_stops += 1
            continue
        amenity = tags.get("amenity")
        entry = {"name": tags.get("name") or "(unnamed)", "type": amenity, "distance_m": dist}
        bucket = schools if amenity in SCHOOL_TYPES else health if amenity in HEALTH_TYPES else None
        if bucket is None:
            continue
        k = (entry["name"], entry["type"]) if entry["name"] != "(unnamed)" else (id(entry),)
        if k not in bucket or dist < bucket[k]["distance_m"]:
            bucket[k] = entry

    result = {
        "ok": True,
        "radius_m": PLACE_RADIUS_M,
        "schools": sorted(schools.values(), key=lambda e: e["distance_m"]),
        "hospitals": sorted(health.values(), key=lambda e: e["distance_m"]),
        "bus_stops": bus_stops,
        "note": "Empty lists mean none are mapped in OpenStreetMap, not that none exist.",
        "source": SOURCE,
    }
    _cache[key] = result
    return result


def _dist_to_polyline_m(lat0, lng0, geometry) -> float:
    """Distance from the point to the nearest segment of a way, in metres."""
    kx = 111320.0 * math.cos(math.radians(lat0))
    ky = 110540.0
    pts = [((g["lon"] - lng0) * kx, (g["lat"] - lat0) * ky) for g in geometry]
    if len(pts) == 1:
        return math.hypot(*pts[0])
    best = float("inf")
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dx, dy = x2 - x1, y2 - y1
        seg2 = dx * dx + dy * dy
        t = 0.0 if seg2 == 0 else max(0.0, min(1.0, -(x1 * dx + y1 * dy) / seg2))
        best = min(best, math.hypot(x1 + t * dx, y1 + t * dy))
    return best


def road_class(lat: float, lng: float) -> dict:
    """Class of the nearest road within ROAD_RADIUS_M. Never raises."""
    key = ("road", round(lat, 4), round(lng, 4))
    if key in _cache:
        return {**_cache[key], "cached": True}

    ql = f'[out:json][timeout:20];way(around:{ROAD_RADIUS_M},{lat},{lng})["highway"];out geom tags;'
    data, error = _run_query(ql)
    if data is None:
        return {"ok": False, "error": error}

    best = None
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        if tags.get("highway") in SKIP_HIGHWAYS or not el.get("geometry"):
            continue
        d = _dist_to_polyline_m(lat, lng, el["geometry"])
        if best is None or d < best[0]:
            best = (d, tags)

    if best is None:
        result = {"ok": True, "highway": None, "note": f"No road mapped within {ROAD_RADIUS_M} m", "source": SOURCE}
    else:
        d, tags = best
        result = {
            "ok": True,
            "highway": tags.get("highway"),
            "name": tags.get("name"),
            "ref": tags.get("ref"),
            "distance_m": round(d),
            "source": SOURCE,
        }
    _cache[key] = result
    return result
