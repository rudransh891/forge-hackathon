import httpx, json
base = "http://127.0.0.1:8000"
lst = httpx.get(f"{base}/reports", timeout=20).json()
print("LIST keys:", sorted(lst[0].keys()))
rid = lst[0]["id"]
d = httpx.get(f"{base}/reports/{rid}", timeout=20).json()
print("DETAIL top-level keys:", list(d.keys()))
sev = d["severity"]
print("score/level:", sev["score"], sev["level"], "| coverage:", sev["coverage"], "| missing:", sev["missing"])
print("reason:", sev["reason"])
print("deadline_at:", sev["deadline_at"])
print("deadline_note:", sev["deadline_note"])
for k, f in sev["factors"].items():
    print(f"  {k:14} {f['state']:14} {f['points']}/{f['max']}  {f['note']}")
