"""Photo storage in Postgres, with the local directory as a cache.

Photos used to live only on disk, which means a host without a persistent disk
loses every one of them on restart. They are now stored beside the rows: written
to the database on upload, served from there, and mirrored into `uploads/` so the
pipeline, the resolution check and the mail attachment keep reading plain files.
"""
import logging
from pathlib import Path

from sqlalchemy import text

from api.database import engine

log = logging.getLogger("fixit.images")

UPLOAD_DIR = Path("uploads")


def save_image(name: str, data: bytes, content_type: str = "image/jpeg") -> None:
    """Store the bytes. Raises on failure, so the caller can report it."""
    with engine.begin() as conn:
        conn.execute(
            text(
                "insert into report_images (name, content_type, bytes) "
                "values (:n, :c, :b) "
                "on conflict (name) do update set bytes = excluded.bytes"
            ),
            {"n": name, "c": content_type, "b": data},
        )


def load_image(name: str) -> tuple[bytes, str] | None:
    """Bytes and content type, or None when the name is unknown."""
    with engine.connect() as conn:
        row = conn.execute(
            text("select bytes, content_type from report_images where name = :n"),
            {"n": name},
        ).first()
    if row is None:
        return None
    return bytes(row[0]), row[1]


def mirror_to_disk(name: str, data: bytes | None = None) -> bool:
    """Make sure the file exists locally. Returns False when the name is unknown.

    The three readers in this backend open files by path; keeping the cache filled
    means they did not have to change.
    """
    target = UPLOAD_DIR / name
    if target.exists():
        return True

    if data is None:
        stored = load_image(name)
        if stored is None:
            return False
        data = stored[0]

    try:
        UPLOAD_DIR.mkdir(exist_ok=True)
        target.write_bytes(data)
        return True
    except OSError as error:  # read-only filesystem: serve from the database
        log.warning("could not write %s locally: %s", name, error)
        return False


def restore_to_disk(limit: int = 500) -> int:
    """Copy recent photos back into uploads/ after a restart on an ephemeral host."""
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "select name, bytes from report_images "
                    "order by created_at desc limit :n"
                ),
                {"n": limit},
            ).all()
    except Exception as error:  # the table may not exist yet on a fresh database
        log.warning("photo restore skipped: %s", error)
        return 0

    restored = 0
    for name, data in rows:
        if mirror_to_disk(name, bytes(data)):
            restored += 1
    log.info("restored %s photos locally", restored)
    return restored
