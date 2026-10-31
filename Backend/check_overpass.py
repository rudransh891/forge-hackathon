import time, httpx

LAT, LNG = 25.42712, 81.77141
QUERY = f'[out:json][timeout:15];way(around:40,{LAT},{LNG})["highway"];out tags 5;'
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
headers = {"User-Agent": "FixItBharat-hackathon-test/0.1"}

for url in SERVERS:
    t = time.time()
    try:
        r = httpx.post(url, data={"data": QUERY}, headers=headers, timeout=20)
        took = round(time.time() - t, 1)
        if r.status_code == 200:
            els = r.json().get("elements", [])
            hw = [e.get("tags", {}).get("highway") for e in els]
            print(f"OK    {took}s  {url}  ways={len(els)} highway={hw}")
        else:
            print(f"HTTP {r.status_code}  {took}s  {url}")
    except Exception as e:
        print(f"FAIL  {round(time.time()-t,1)}s  {url}  {type(e).__name__}: {e}")
