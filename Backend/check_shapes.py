import sys, json
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine

with engine.connect() as c:
    rows = c.execute(text(
        "SELECT id, issue_type, confirmations, context, ai_result FROM reports ORDER BY created_at"
    )).fetchall()

for r in rows:
    ctx = r.context or {}
    vis = (r.ai_result or {}).get("vision", {})
    print("=====", str(r.id)[:8], r.issue_type, "confirmations =", r.confirmations)
    print("vision      :", json.dumps(vis, ensure_ascii=False))
    print("weather     :", json.dumps(ctx.get("weather"), ensure_ascii=False))
    print("air_quality :", json.dumps(ctx.get("air_quality"), ensure_ascii=False))
