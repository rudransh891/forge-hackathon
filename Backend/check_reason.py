import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from ai.severity_service import score_and_store

with engine.connect() as c:
    ids = [str(x) for (x,) in c.execute(text("SELECT id FROM reports ORDER BY created_at"))]
for i in ids:
    print(i[:8], score_and_store(i))
with engine.connect() as c:
    for r in c.execute(text("SELECT id, ai_result->'severity'->>'reason_source' AS src FROM reports ORDER BY created_at")):
        print(str(r.id)[:8], "reason_source =", r.src)
