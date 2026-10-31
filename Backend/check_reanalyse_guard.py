import json
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine
from ai.pipeline import analyse_report

backup = Path("escalation_test_backup.json")
assert backup.exists(), "no backup file; run: python escalation_test_tools.py backup e73a7619"
rid = json.loads(backup.read_text(encoding="utf-8"))["id"]


def snap(label):
    with engine.connect() as c:
        st, ai = c.execute(
            text("SELECT status, ai_result FROM reports WHERE id = CAST(:r AS uuid)"), {"r": rid}
        ).one()
    ai = ai or {}
    print(f"{label}: status={st} | routing={'routing' in ai} | "
          f"delivery_ok={((ai.get('routing') or {}).get('delivery') or {}).get('ok')} | "
          f"severity={'severity' in ai} | vision={'vision' in ai} | model={ai.get('model_used')}")


snap("before")
print("analyse_report returned:", analyse_report(rid))
snap("after ")
