import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

# `pool_pre_ping` costs an extra round trip on every checkout — about 1.5 s
# against this database, on every request. `pool_recycle` keeps connections
# fresh without paying that on the hot path.
engine = create_engine(
    os.getenv("DATABASE_URL"),
    pool_pre_ping=False,
    pool_recycle=280,
    connect_args={"connect_timeout": 10},
)
