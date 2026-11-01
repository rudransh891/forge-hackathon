"""Workflow completion: citizen category, resolution time, extra photos.

Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_004_workflow
"""
from sqlalchemy import text

from api.database import engine

SQL = """
alter table reports add column if not exists citizen_category text;
alter table reports add column if not exists resolved_at timestamptz;

create table if not exists report_photos (
    id         uuid primary key default gen_random_uuid(),
    report_id  uuid not null references reports(id) on delete cascade,
    path       text not null,
    ordinal    int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_report_photos_report on report_photos(report_id);
create index if not exists idx_reports_resolved_at on reports(resolved_at);
"""

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)
        columns = conn.execute(
            text(
                "select column_name from information_schema.columns "
                "where table_name = 'reports' "
                "  and column_name in ('citizen_category', 'resolved_at') "
                "order by column_name"
            )
        ).scalars().all()
        tables = conn.execute(
            text(
                "select table_name from information_schema.tables "
                "where table_schema = 'public' and table_name = 'report_photos'"
            )
        ).scalars().all()
    print("Columns ready:", columns)
    print("Tables ready:", tables)
