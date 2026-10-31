import json
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine
from routing.service import route_report

backup = Path("escalation_test_backup.json")
assert backup.exists(), "no backup file; run: python escalation_test_tools.py backup e73a7619"
rid = json.loads(backup.read_text(encoding="utf-8"))["id"]

with engine.connect() as c:
    ai = c.execute(text("SELECT ai_result FROM reports WHERE id = CAST(:r AS uuid)"), {"r": rid}).scalar() or {}
assert "routing" not in ai, "routing record already exists; restore first"

print("routing", rid[:8], "...")
print("result:", route_report(rid))

with engine.connect() as c:
    st = c.execute(text("SELECT status FROM reports WHERE id = CAST(:r AS uuid)"), {"r": rid}).scalar()
    ev = c.execute(text(
        "SELECT created_at, status, note FROM status_events WHERE report_id = CAST(:r AS uuid) "
        "ORDER BY created_at DESC LIMIT 2"), {"r": rid}).fetchall()
print("status now:", st)
for e in ev:
    print(e[0], "|", e[1], "|", e[2])
