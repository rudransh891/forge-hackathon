import sys, json
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine

with engine.connect() as c:
    r = c.execute(text(
        "SELECT severity_score, severity_level, confirmations, created_at, deadline_at, "
        "ai_result->'severity'->'factors' AS f, ai_result->'vision'->>'estimated_size' AS size, "
        "ai_result->>'analysed_at' AS analysed_at "
        "FROM reports WHERE id::text LIKE '96249e3f%'")).fetchone()
print(r.severity_score, r.severity_level, "| confirmations:", r.confirmations, "| size:", r.size)
print("analysed_at:", r.analysed_at)
for k, f in r.f.items():
    print(f"  {k:14} {f['state']:8} {f['points']}/{f['max']}  {f['note']}")
