"""Attribute reports to a Firebase account. Idempotent.

Run from Backend/ as a module, so `api` is importable:
    .venv\\Scripts\\python.exe -m db.migrate_003_report_account
"""
from sqlalchemy import text

from api.database import engine

SQL = """
alter table reports add column if not exists account_uid text;
alter table reports add column if not exists account_email text;
"""

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)
        columns = conn.execute(
            text(
                "select column_name from information_schema.columns "
                "where table_name = 'reports' "
                "  and column_name in ('account_uid', 'account_email') "
                "order by column_name"
            )
        ).scalars().all()
    print("Report attribution columns ready:", columns)
