import sys
sys.path.insert(0, ".")
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from api.database import engine

OPEN = ("analysed", "routed", "acknowledged", "in_progress", "escalated")
hours_ahead = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
as_of = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
print(f"clock: now + {hours_ahead} h  ({as_of.isoformat(timespec='minutes')})")

with engine.connect() as c:
    rows = c.execute(text(
        "SELECT id, issue_type, status, severity_level, deadline_at, "
        "ai_result->'routing'->'delivery'->>'ok' AS delivered "
        "FROM reports WHERE status = ANY(:open) AND deadline_at IS NOT NULL "
        "AND deadline_at < :t ORDER BY deadline_at"), {"open": list(OPEN), "t": as_of}).fetchall()
print(f"overdue open reports: {len(rows)}")
for r in rows:
    late_h = (as_of - r.deadline_at).total_seconds() / 3600
    print(f"  {str(r.id)[:8]}  {r.issue_type:15} {r.severity_level:9} late by {late_h:.1f} h  delivered={r.delivered}")
