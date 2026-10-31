from sqlalchemy import text

from api.database import engine

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS context JSONB"))
print("context column ready")
