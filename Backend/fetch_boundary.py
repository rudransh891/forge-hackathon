import os, json, httpx
from dotenv import load_dotenv
load_dotenv()
ua = {"User-Agent": f"FixItBharat-hackathon-test/0.1 ({os.getenv('NOMINATIM_CONTACT','')})"}

r = httpx.get("https://nominatim.openstreetmap.org/lookup", headers=ua, timeout=60,
              params={"osm_ids": "R10029487", "format": "jsonv2", "polygon_geojson": 1})
r.raise_for_status()
geo = r.json()[0]["geojson"]
assert geo["type"] in ("Polygon", "MultiPolygon"), geo["type"]

out = {"name": "Prayagraj pilot area (OSM relation 10029487)",
       "source": "OpenStreetMap contributors, via Nominatim (ODbL)",
       "geometry": geo}
with open("routing/pilot_boundary.json", "w", encoding="utf-8") as f:
    json.dump(out, f)

polys = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
print("type:", geo["type"], "| polygons:", len(polys),
      "| boundary points:", sum(len(ring) for p in polys for ring in p))
