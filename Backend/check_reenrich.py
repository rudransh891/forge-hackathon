import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from enrichment.service import enrich_report

with engine.connect() as c:
    rid = str(c.execute(text("SELECT id FROM reports WHERE id::text LIKE 'e73a7619%'")).scalar())
enrich_report(rid)
print("done")
