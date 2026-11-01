"""Photo bytes live in Postgres.

A host with no persistent disk would otherwise lose every upload on restart, and
the pipeline would then fail with "photo file missing on server". Storing the
bytes beside the rows removes that dependency.

Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_009_photo_bytes
"""
from api.database import engine

SQL = """
create table if not exists report_images (
    name         text primary key,
    content_type text not null default 'image/jpeg',
    bytes        bytea not null,
    created_at   timestamptz not null default now()
);
"""

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)
    print("report_images ready")
