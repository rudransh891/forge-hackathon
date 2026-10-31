import sys, json
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from ai.severity import score_report

with engine.connect() as c:
    rows = c.execute(text(
        "SELECT id, issue_type, confirmations, context, ai_result FROM reports ORDER BY created_at"
    )).fetchall()
for r in rows:
    vis = (r.ai_result or {}).get("vision", {})
    res = score_report(r.issue_type, vis, r.context, r.confirmations)
    print("=====", str(r.id)[:8], r.issue_type)
    print("score:", res["score"], res["level"], "| deadline_h:", res["deadline_hours"], "| coverage:", res["coverage"])
    for k, f in res["factors"].items():
        print(f"  {k:14} {f['state']:14} {f['points']:>2}/{f['max']:<2}  {f['note']}")
