import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from api.database import engine
from db.geo import find_nearby_candidates

with engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT id, issue_type, status, lat, lng, confirmations "
        "FROM reports ORDER BY created_at"
    )).fetchall()

print(f"{len(rows)} reports in database\n")
for r in rows:
    print(f"{str(r.id)[:8]}  type={r.issue_type}  status={r.status}  "
          f"conf={r.confirmations}  at=({r.lat}, {r.lng})")
    try:
        cands = find_nearby_candidates(str(r.id))
        print(f"    candidates: {cands}")
    except Exception as e:
        print(f"    ERROR: {type(e).__name__}: {e}")
