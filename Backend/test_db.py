import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.begin() as conn:
    print(conn.execute(text("select version()")).scalar())
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    print("PostGIS:", conn.execute(text("select postgis_version()")).scalar())
