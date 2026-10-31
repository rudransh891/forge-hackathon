import os, httpx
from dotenv import load_dotenv
load_dotenv()
ua = {"User-Agent": f"FixItBharat-hackathon-test/0.1 ({os.getenv('NOMINATIM_CONTACT','')})"}

r = httpx.get("https://nominatim.openstreetmap.org/search", headers=ua, timeout=30,
              params={"q": "Prayagraj, Uttar Pradesh, India", "format": "jsonv2",
                      "limit": 3, "polygon_geojson": 0})
print("status", r.status_code)
for x in r.json():
    print(x.get("osm_type"), x.get("osm_id"), "|", x.get("category"), x.get("type"),
          "|", x.get("display_name")[:70])
    print("   bbox (south, north, west, east):", x.get("boundingbox"))

pts = {"pothole 96249e3f": (25.42712, 81.77141), "drain e73a7619": (25.44419, 81.82582)}
for name, (lat, lng) in pts.items():
    q = httpx.get("https://nominatim.openstreetmap.org/reverse", headers=ua, timeout=30,
                  params={"lat": lat, "lon": lng, "format": "jsonv2", "zoom": 10,
                          "addressdetails": 1}).json()
    a = q.get("address", {})
    print(name, "->", a.get("city") or a.get("town") or a.get("village"), "|",
          a.get("county"), "|", a.get("state_district"), "|", a.get("state"))
