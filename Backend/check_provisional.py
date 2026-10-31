import sys, copy
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from ai.severity import score_report

with engine.connect() as c:
    r = c.execute(text("SELECT issue_type, confirmations, context, ai_result FROM reports "
                       "WHERE id::text LIKE '96249e3f%'")).fetchone()
vis = r.ai_result.get("vision", {})
full = score_report(r.issue_type, vis, r.context, r.confirmations)
ctx = copy.deepcopy(r.context)
ctx["road"] = {"ok": False}
ctx["places"] = {"ok": False}
part = score_report(r.issue_type, vis, ctx, r.confirmations)
for name, x in (("full data", full), ("road+places missing (in memory only)", part)):
    print(f"{name:38} score={x['score']} level={x['level']} uncapped={x['uncapped_level']} "
          f"provisional={x['provisional']} deadline_h={x['deadline_hours']}")
