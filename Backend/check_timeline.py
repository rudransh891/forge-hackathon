from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine

with engine.connect() as c:
    rows = c.execute(text(
        "SELECT created_at, status, note FROM status_events "
        "WHERE report_id::text LIKE '96249e3f%' ORDER BY created_at DESC LIMIT 3"
    )).fetchall()
for r in rows:
    print(r[0], "|", r[1], "|", r[2])
