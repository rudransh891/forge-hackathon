"""Is a location inside the Prayagraj pilot area? Pure code, uses the saved OSM boundary."""
import json
import os

PILOT_CITY = "Prayagraj"
_PATH = os.path.join(os.path.dirname(__file__), "pilot_boundary.json")
_data = None


def _load():
    global _data
    if _data is None:
        with open(_PATH, encoding="utf-8") as f:
            _data = json.load(f)
    return _data


def _in_ring(lng, lat, ring):
    inside, j = False, len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _in_polygon(lng, lat, poly):
    if not _in_ring(lng, lat, poly[0]):
        return False
    return not any(_in_ring(lng, lat, hole) for hole in poly[1:])


def in_pilot_area(lat, lng):
    try:
        data = _load()
        geo = data["geometry"]
        polys = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
        inside = any(_in_polygon(lng, lat, p) for p in polys)
        return {"ok": True, "inside": inside, "city": PILOT_CITY, "source": data["source"]}
    except Exception as e:
        return {"ok": False, "inside": None, "city": PILOT_CITY,
                "reason": f"{type(e).__name__}: {e}"}
