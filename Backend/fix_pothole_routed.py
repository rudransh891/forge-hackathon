from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine

NOTE = ("Status corrected to routed: the complaint was emailed to the team test inbox earlier "
        "(not a government department); the status was not updated at that time.")

with engine.begin() as c:
    rid = c.execute(text("SELECT id::text FROM reports WHERE id::text LIKE '96249e3f%'")).scalar_one()
    res = c.execute(text(
        "UPDATE reports SET status = 'routed' "
        "WHERE id = CAST(:r AS uuid) AND status = 'analysed' "
        "AND ai_result->'routing'->'delivery'->>'ok' = 'true' "
        "AND (ai_result->'escalation'->'actions') IS NULL"), {"r": rid})
    assert res.rowcount == 1, "conditions not met; nothing changed"
    c.execute(text("INSERT INTO status_events (report_id, status, note) VALUES (CAST(:r AS uuid), 'routed', :n)"),
              {"r": rid, "n": NOTE})
print("pothole", rid[:8], "set to routed")
