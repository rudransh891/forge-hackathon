"""Polls: one open poll, its options, and one vote per voter.

Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_007_polls
"""
from sqlalchemy import text

from api.database import engine

SQL = """
create table if not exists polls (
    id         uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    question   text not null,
    closes_at  timestamptz
);

create table if not exists poll_options (
    id       uuid primary key default gen_random_uuid(),
    poll_id  uuid not null references polls(id) on delete cascade,
    label    text not null,
    ordinal  int not null default 0
);

create table if not exists poll_votes (
    id         bigserial primary key,
    poll_id    uuid not null references polls(id) on delete cascade,
    option_id  uuid not null references poll_options(id) on delete cascade,
    voter_key  text not null,
    created_at timestamptz not null default now(),
    unique (poll_id, voter_key)
);

create index if not exists idx_poll_votes_poll on poll_votes(poll_id);
"""

SEED_QUESTION = "Which fix should the pilot chase first this week?"
SEED_OPTIONS = [
    "Potholes and road damage",
    "Garbage collection",
    "Streetlights not working",
]

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)

        existing = conn.execute(text("select count(*) from polls")).scalar()
        if not existing:
            poll_id = conn.execute(
                text(
                    "insert into polls (question) values (:q) returning id"
                ),
                {"q": SEED_QUESTION},
            ).scalar()
            for ordinal, label in enumerate(SEED_OPTIONS):
                conn.execute(
                    text(
                        "insert into poll_options (poll_id, label, ordinal) "
                        "values (:p, :l, :o)"
                    ),
                    {"p": poll_id, "l": label, "o": ordinal},
                )
            print("seeded poll", poll_id)
        else:
            print("poll already present")
