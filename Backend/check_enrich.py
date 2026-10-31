import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from enrichment.service import enrich_report

with engine.connect() as c:
    rid = str(c.execute(text("SELECT id FROM reports WHERE id::text LIKE '96249e3f%'")).scalar())

enrich_report(rid)

with engine.connect() as c:
    ctx = c.execute(text("SELECT context FROM reports WHERE id = :i"), {"i": rid}).scalar()

print("keys   :", list(ctx.keys()))
print("missing:", ctx.get("missing"))
print("road   :", ctx.get("road"))
print("places :", ctx.get("places"))
