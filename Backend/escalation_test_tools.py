import json
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine

BACKUP = Path("escalation_test_backup.json")


def find_id(prefix):
    with engine.connect() as c:
        rows = c.execute(
            text("SELECT id::text FROM reports WHERE id::text LIKE :p"),
            {"p": prefix + "%"},
        ).fetchall()
    assert len(rows) == 1, f"expected 1 report for prefix {prefix}, found {len(rows)}"
    return rows[0][0]


def backup(prefix):
    assert not BACKUP.exists(), "backup file already exists; refusing to overwrite the original snapshot"
    rid = find_id(prefix)
    with engine.connect() as c:
        r = c.execute(
            text("SELECT status, deadline_at, ai_result, now() FROM reports WHERE id = CAST(:r AS uuid)"),
            {"r": rid},
        ).one()
    snap = {
        "id": rid,
        "status": r[0],
        "deadline_at": r[1].isoformat() if r[1] else None,
        "ai_result": r[2],
        "taken_at": r[3].isoformat(),
    }
    BACKUP.write_text(json.dumps(snap, indent=2), encoding="utf-8")
    print("backup saved for", rid[:8], "| status:", r[0], "| deadline:", snap["deadline_at"])


def show(prefix):
    rid = find_id(prefix)
    with engine.connect() as c:
        r = c.execute(
            text("SELECT status, deadline_at, ai_result->'escalation'->'actions' FROM reports WHERE id = CAST(:r AS uuid)"),
            {"r": rid},
        ).one()
    acts = r[2] or []
    print("report", rid[:8], "| status:", r[0], "| deadline:", r[1])
    print("escalation actions recorded:", [(a.get("level"), a.get("ok")) for a in acts])


def restore(delete_events):
    assert BACKUP.exists(), "no backup file found"
    s = json.loads(BACKUP.read_text(encoding="utf-8"))
    d = datetime.fromisoformat(s["deadline_at"]) if s["deadline_at"] else None
    with engine.begin() as c:
        c.execute(
            text("UPDATE reports SET status = :s, deadline_at = :d, ai_result = CAST(:a AS jsonb) WHERE id = CAST(:r AS uuid)"),
            {"s": s["status"], "d": d, "a": json.dumps(s["ai_result"]), "r": s["id"]},
        )
        n = c.execute(
            text("SELECT count(*) FROM status_events WHERE report_id = CAST(:r AS uuid) AND created_at > CAST(:t AS timestamptz)"),
            {"r": s["id"], "t": s["taken_at"]},
        ).scalar()
        if delete_events and n:
            c.execute(
                text("DELETE FROM status_events WHERE report_id = CAST(:r AS uuid) AND created_at > CAST(:t AS timestamptz)"),
                {"r": s["id"], "t": s["taken_at"]},
            )
    print("restored", s["id"][:8], "| status:", s["status"], "| deadline:", s["deadline_at"])
    print("timeline events created since the backup:", n, "(deleted)" if delete_events and n else "(kept)")


cmd = sys.argv[1] if len(sys.argv) > 1 else ""
if cmd == "backup":
    backup(sys.argv[2])
elif cmd == "show":
    show(sys.argv[2])
elif cmd == "restore":
    restore("--events" in sys.argv)
else:
    print("usage: backup <id-prefix> | show <id-prefix> | restore [--events]")
