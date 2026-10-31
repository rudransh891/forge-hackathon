import os, time, httpx
from dotenv import load_dotenv
load_dotenv()

LAT, LNG = 25.42712, 81.77141
contact = os.getenv("NOMINATIM_CONTACT", "")
ua = {"User-Agent": f"FixItBharat-hackathon-test/0.1 ({contact})"}

print("== More Overpass mirrors ==")
Q = f'[out:json][timeout:15];way(around:40,{LAT},{LNG})["highway"];out tags 5;'
for url in ["https://overpass.private.coffee/api/interpreter",
            "https://overpass.openstreetmap.fr/api/interpreter"]:
    t = time.time()
    try:
        r = httpx.post(url, data={"data": Q}, headers=ua, timeout=20)
        if r.status_code == 200:
            hw = [e.get("tags", {}).get("highway") for e in r.json().get("elements", [])]
            print(f"OK    {round(time.time()-t,1)}s {url} highway={hw}")
        else:
            print(f"HTTP {r.status_code} {round(time.time()-t,1)}s {url}")
    except Exception as e:
        print(f"FAIL  {round(time.time()-t,1)}s {url} {type(e).__name__}")

print("\n== Nominatim reverse (road) ==")
r = httpx.get("https://nominatim.openstreetmap.org/reverse", headers=ua, timeout=20,
              params={"lat": LAT, "lon": LNG, "format": "jsonv2", "zoom": 18})
print("status", r.status_code)
if r.status_code == 200:
    j = r.json()
    print("category:", j.get("category"), "| type:", j.get("type"), "| name:", j.get("name"))

print("\n== Nominatim nearby search (about 300 m box) ==")
d_lat, d_lng = 0.0027, 0.0030
view = f"{LNG-d_lng},{LAT+d_lat},{LNG+d_lng},{LAT-d_lat}"
for term in ["school", "hospital"]:
    time.sleep(1.1)
    r = httpx.get("https://nominatim.openstreetmap.org/search", headers=ua, timeout=20,
                  params={"q": term, "viewbox": view, "bounded": 1, "format": "jsonv2", "limit": 5})
    if r.status_code == 200:
        print(term, "->", [x.get("name") or x.get("display_name", "")[:40] for x in r.json()])
    else:
        print(term, "-> HTTP", r.status_code)
