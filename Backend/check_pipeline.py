import sys, time, httpx
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine

with engine.connect() as c:
    rid = str(c.execute(text("SELECT id FROM reports WHERE id::text LIKE '96249e3f%'")).scalar())
r = httpx.post(f"http://127.0.0.1:8000/reports/{rid}/analyse", timeout=30)
print("analyse ->", r.status_code, r.text[:120])
time.sleep(60)
with engine.connect() as c:
    row = c.execute(text("SELECT status, severity_score, severity_level, severity_reason FROM reports WHERE id = :i"), {"i": rid}).fetchone()
print(row)
