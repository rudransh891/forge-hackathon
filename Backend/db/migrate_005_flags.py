"""Spam flagging: image fingerprint, review flag, and the audio transcript.

Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_005_flags
"""
from sqlalchemy import text

from api.database import engine

SQL = """
alter table reports add column if not exists image_hash text;
alter table reports add column if not exists flagged_at timestamptz;
alter table reports add column if not exists flag_reason text;

create index if not exists idx_reports_flagged
    on reports(flagged_at) where flagged_at is not null;
create index if not exists idx_reports_image_hash on reports(image_hash);
"""

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)
        columns = conn.execute(
            text(
                "select column_name from information_schema.columns "
                "where table_name = 'reports' "
                "  and column_name in ('image_hash', 'flagged_at', 'flag_reason') "
                "order by column_name"
            )
        ).scalars().all()
    print("Flag columns ready:", columns)
