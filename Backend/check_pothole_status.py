from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine

with engine.connect() as c:
    r = c.execute(text(
        "SELECT status, ai_result->'routing'->'delivery'->>'ok', ai_result->'escalation'->'actions' "
        "FROM reports WHERE id::text LIKE '96249e3f%'")).one()
print("status:", r[0], "| delivery ok:", r[1], "| escalation actions:", r[2])
