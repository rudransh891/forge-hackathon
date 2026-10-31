import sys, json
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from routing.service import route_report

with engine.connect() as c:
    rid = str(c.execute(text("SELECT id FROM reports WHERE id::text LIKE '96249e3f%'")).scalar())
print("route_report ->", route_report(rid))
with engine.connect() as c:
    rec = c.execute(text("SELECT ai_result->'routing' FROM reports WHERE id = :i"), {"i": rid}).scalar()
print("delivery record:", json.dumps(rec.get("delivery"), indent=2))
print("body_confirmed:", rec.get("body_confirmed"))
