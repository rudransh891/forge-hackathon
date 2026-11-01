"""Comments. Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_006_comments
"""
from sqlalchemy import text

from api.database import engine

SQL = """
create table if not exists comments (
    id            uuid primary key default gen_random_uuid(),
    report_id     uuid not null references reports(id) on delete cascade,
    created_at    timestamptz not null default now(),
    author_name   text not null default 'Resident',
    body          text not null,
    account_uid   text,
    account_email text,
    hidden_at     timestamptz
);

create index if not exists idx_comments_report on comments(report_id, created_at);
"""

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)
        rows = conn.execute(
            text(
                "select table_name from information_schema.tables "
                "where table_schema = 'public' and table_name = 'comments'"
            )
        ).scalars().all()
    print("Comments table ready:", rows)
