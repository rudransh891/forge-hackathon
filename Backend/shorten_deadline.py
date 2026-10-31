import json
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine

backup = Path("escalation_test_backup.json")
assert backup.exists(), "no backup file; run: python escalation_test_tools.py backup 96249e3f"
rid = json.loads(backup.read_text(encoding="utf-8"))["id"]

with engine.begin() as c:
    acts = c.execute(
        text("SELECT ai_result->'escalation'->'actions' FROM reports WHERE id = CAST(:r AS uuid)"),
        {"r": rid},
    ).scalar()
    assert not acts, "escalation actions already recorded; restore first"
    c.execute(
        text("UPDATE reports SET deadline_at = now() - interval '2 hours' WHERE id = CAST(:r AS uuid)"),
        {"r": rid},
    )
print("deadline for", rid[:8], "shortened to 2 hours ago. Run restore when finished.")
