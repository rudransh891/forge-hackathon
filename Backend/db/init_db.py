import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

with open("db/schema.sql", encoding="utf-8") as f:
    sql = f.read()

with engine.begin() as conn:
    conn.exec_driver_sql(sql)
    tables = conn.execute(text(
        "select table_name from information_schema.tables "
        "where table_schema='public' and table_name in ('reports','status_events') "
        "order by table_name"
    )).scalars().all()

print("Tables ready:", tables)
