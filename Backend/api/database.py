import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()


def database_url() -> str:
    """Read DATABASE_URL, or fail with a message that names the problem.

    Passing None to `create_engine` raises "Could not parse SQLAlchemy URL", which
    tells you nothing about what is missing. Render and Heroku also hand out URLs
    starting `postgres://`, which SQLAlchemy rejects.
    """
    raw = (os.getenv("DATABASE_URL") or "").strip().strip('"').strip("'")
    if not raw:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to the service environment as the full "
            "postgresql:// URL, not just the host or the password."
        )
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    if not raw.startswith(("postgresql://", "postgresql+psycopg://")):
        raise RuntimeError(
            "DATABASE_URL does not start with postgresql:// — it looks like "
            f"{raw[:32]!r}. Copy the whole connection string."
        )
    return raw


# `pool_pre_ping` costs an extra round trip on every checkout — about 1.5 s
# against this database, on every request. `pool_recycle` keeps connections
# fresh without paying that on the hot path.
engine = create_engine(
    database_url(),
    pool_pre_ping=False,
    pool_recycle=280,
    connect_args={"connect_timeout": 10},
)
