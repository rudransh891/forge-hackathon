import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from enrichment.service import enrich_report
from ai.severity_service import score_and_store

with engine.connect() as c:
    rid = str(c.execute(text("SELECT id FROM reports WHERE id::text LIKE '96249e3f%'")).scalar())
enrich_report(rid)
print(score_and_store(rid))
with engine.connect() as c:
    r = c.execute(text("SELECT severity_score, severity_level, deadline_at, context->'missing' AS missing "
                       "FROM reports WHERE id = :i"), {"i": rid}).fetchone()
print(r.severity_score, r.severity_level, r.deadline_at, "| missing:", r.missing)
