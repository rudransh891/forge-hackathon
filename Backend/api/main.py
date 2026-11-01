import io
import hashlib
import os
import re
import threading
import time
import uuid
from pathlib import Path

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import text

from db.duplicates import respond_to_suggestion
from jobs.process import process_report
from jobs.resolution import process_resolution
from api.database import engine
from contextlib import asynccontextmanager
from jobs.scheduler import start_scheduler
from api.identity import configured as identity_configured
from api.identity import verify_id_token
from api.geo import router as geo_router

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_BYTES = 10 * 1024 * 1024  # 10 MB

# The dev server runs on :5173 (vite dev) and :4173 (vite preview). Override with
# CORS_ORIGINS when the API is served from a different origin than the app.
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173"
)

# Reports that were merged into another report are not part of the feed: the
# survivor already represents them.
HIDDEN_FROM_FEED = ("merged",)

SEVERITY_ORDER = (
    "case severity_level when 'critical' then 4 when 'high' then 3 "
    "when 'medium' then 2 when 'low' then 1 else 0 end"
)

MAX_PHOTOS = 4

# Per-address report rate limit: generous enough for a demo where several judges
# file at once, tight enough that nobody can run up the model bill.
REPORT_RATE_LIMIT = int(os.getenv("REPORT_RATE_LIMIT", "20"))
REPORT_RATE_WINDOW_S = int(os.getenv("REPORT_RATE_WINDOW_S", "300"))
_recent_reports: dict[str, list[float]] = {}
_rate_lock = threading.Lock()


def _rate_limited(key: str) -> bool:
    now = time.monotonic()
    with _rate_lock:
        hits = [t for t in _recent_reports.get(key, []) if now - t < REPORT_RATE_WINDOW_S]
        if len(hits) >= REPORT_RATE_LIMIT:
            _recent_reports[key] = hits
            return True
        hits.append(now)
        _recent_reports[key] = hits
    return False


_CACHE: dict[str, tuple[float, object]] = {}
_CACHE_LOCK = threading.Lock()


def _cache_get(key: str, ttl: float):
    with _CACHE_LOCK:
        hit = _CACHE.get(key)
    if hit and time.monotonic() - hit[0] < ttl:
        return hit[1]
    return None


def _cache_set(key: str, value) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.monotonic(), value)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _store_image(data: bytes) -> str:
    """Validate, downscale and save one upload. Returns the stored filename."""
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Photo is larger than 10 MB.")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="That file is not a readable image.")
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((1280, 1280))
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(UPLOAD_DIR / filename, "JPEG", quality=85)
    return filename


def _image_hash(data: bytes) -> str | None:
    """A 16x16 greyscale fingerprint: same photo, same hash, whatever the size."""
    try:
        img = Image.open(io.BytesIO(data)).convert("L").resize((16, 16))
    except (UnidentifiedImageError, OSError):
        return None
    return hashlib.sha256(img.tobytes()).hexdigest()


LINK_RE = re.compile(r"https?://|www\.|t\.me/|bit\.ly", re.IGNORECASE)


def _spam_reason(description: str, image_hash: str | None) -> str | None:
    """Heuristics that flag a report for a human, never block it.

    Deliberately conservative: a false flag is a note next to a real report, a
    false pass is a report nobody reads. Nothing here decides the report is fake.
    """
    body = (description or "").strip()

    if LINK_RE.search(body):
        return "the description contains a link"

    if len(body) >= 40 and len(set(body.lower())) < 8:
        return "the description looks like filler"

    if image_hash:
        with engine.connect() as conn:
            repeats = conn.execute(
                text(
                    "select count(*) from reports "
                    "where image_hash = :h and created_at > now() - interval '10 minutes'"
                ),
                {"h": image_hash},
            ).scalar()
        if repeats:
            return f"the same photo was filed {repeats + 1} times in ten minutes"

    return None


def _flag(conn, report_id, reason: str) -> None:
    conn.execute(
        text(
            "update reports set flagged_at = now(), flag_reason = :r where id = :i"
        ),
        {"r": reason, "i": report_id},
    )
    conn.execute(
        text(
            "insert into status_events (report_id, status, note) "
            "values (:i, 'received', :n)"
        ),
        {"i": report_id, "n": f"Flagged for review: {reason}."},
    )

@asynccontextmanager
async def lifespan(app):
    sched = start_scheduler()
    try:
        yield
    finally:
        sched.shutdown(wait=False)


app = FastAPI(title="FixIt Bharat", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(geo_router)


@app.get("/")
def root():
    return {"app": "FixIt Bharat", "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    with engine.connect() as conn:
        count = conn.execute(text("select count(*) from reports")).scalar()
    return {"status": "ok", "database": "connected", "reports": count}


@app.post("/reports")
async def create_report(
    request: Request,
    background_tasks: BackgroundTasks,
    lat: float = Form(...),
    lng: float = Form(...),
    description: str = Form(""),
    category: str = Form(""),
    audio_text: str = Form(""),
    photo: UploadFile | None = File(default=None),
    photos: list[UploadFile] | None = File(default=None),
    authorization: str | None = Header(default=None),
):
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="Location is outside valid range.")

    if _rate_limited(_client_key(request)):
        raise HTTPException(
            status_code=429,
            detail="Too many reports from this address just now. Try again in a few minutes.",
        )

    # The form may send one `photo` or a `photos` list; both are accepted.
    files = [f for f in ([photo] if photo else []) + list(photos or []) if f and f.filename]
    if not files:
        raise HTTPException(status_code=422, detail="A photo is required.")
    if len(files) > MAX_PHOTOS:
        raise HTTPException(
            status_code=422, detail=f"At most {MAX_PHOTOS} photos per report."
        )

    # Reports are open to anyone. If the request carries a Firebase ID token and
    # this backend knows how to check one, the report is attributed to that
    # account; a bad token is refused rather than silently ignored.
    reporter = None
    if authorization and identity_configured():
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            reporter = verify_id_token(token.strip())
            if reporter is None:
                raise HTTPException(
                    status_code=401,
                    detail="That sign-in token is not valid or has expired.",
                )

    stored: list[str] = []
    raw: list[bytes] = []
    for upload in files:
        data = await upload.read()
        raw.append(data)
        stored.append(_store_image(data))
    filename = stored[0]

    image_hash = _image_hash(raw[0])
    flag_reason = _spam_reason(description, image_hash)

    with engine.begin() as conn:
        report_id = conn.execute(
            text(
                "insert into reports (photo_path, description, lat, lng, "
                "account_uid, account_email, citizen_category, audio_text, image_hash) "
                "values (:p, :d, :lat, :lng, :uid, :email, :cat, :audio, :hash) "
                "returning id"
            ),
            {
                "p": filename,
                "d": description.strip(),
                "lat": lat,
                "lng": lng,
                "uid": reporter["uid"] if reporter else None,
                "email": reporter["email"] if reporter else None,
                "cat": (category or "").strip() or None,
                "audio": (audio_text or "").strip()[:2000] or None,
                "hash": image_hash,
            },
        ).scalar()
        for ordinal, path in enumerate(stored):
            conn.execute(
                text(
                    "insert into report_photos (report_id, path, ordinal) "
                    "values (:r, :p, :o)"
                ),
                {"r": report_id, "p": path, "o": ordinal},
            )
        conn.execute(
            text(
                "insert into status_events (report_id, status, note) "
                "values (:id, 'received', 'Report received')"
            ),
            {"id": report_id},
        )
        if flag_reason:
            _flag(conn, report_id, flag_reason)

    background_tasks.add_task(process_report, str(report_id))

    return {
        "id": str(report_id),
        "status": "received",
        "photo_url": f"/uploads/{filename}",
        "photos": len(stored),
        "flagged": bool(flag_reason),
    }


@app.get("/reports")
def list_reports(limit: int = 50):
    limit = max(1, min(limit, 200))
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "select id, created_at, lat, lng, issue_type, severity_score, "
                "severity_level, severity_reason, deadline_at, confirmations, "
                "status, photo_path from reports order by created_at desc limit :n"
            ),
            {"n": limit},
        ).mappings().all()
    return [dict(r, id=str(r["id"])) for r in rows]


@app.get("/reports/flagged")
def flagged_reports(limit: int = 50):
    """The review queue: reports a heuristic flagged, newest first."""
    limit = max(1, min(limit, 200))
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "select id, created_at, flag_reason, issue_type, status, photo_path "
                "from reports where flagged_at is not null "
                "order by flagged_at desc limit :n"
            ),
            {"n": limit},
        ).mappings().all()
    return [dict(row, id=str(row["id"])) for row in rows]


@app.get("/reports/{report_id}")
def get_report(report_id: str):
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    with engine.connect() as conn:
        row = conn.execute(
            text("select * from reports where id = :id"), {"id": rid}
        ).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found.")
        events = conn.execute(
            text(
                "select created_at, status, note from status_events "
                "where report_id = :id order by created_at"
            ),
            {"id": rid},
        ).mappings().all()
        photos = conn.execute(
            text(
                "select path from report_photos where report_id = :id "
                "order by ordinal, created_at"
            ),
            {"id": rid},
        ).scalars().all()

    report = {k: (str(v) if k in ("id", "duplicate_of") and v else v) for k, v in row.items()}
    # The reporter's account is never part of the public payload.
    report.pop("account_uid", None)
    report.pop("account_email", None)

    photo_paths = list(photos) or ([report["photo_path"]] if report.get("photo_path") else [])
    photo_urls = [f"/uploads/{Path(p).name}" for p in photo_paths]

    sev = (report.get("ai_result") or {}).get("severity")
    severity = None
    if sev:
        severity = {
            "score": report.get("severity_score"),
            "level": report.get("severity_level"),
            "reason": report.get("severity_reason"),
            "reason_source": sev.get("reason_source"),
            "coverage": sev.get("coverage"),
            "missing": sev.get("missing"),
            "not_applicable": sev.get("not_applicable"),
            "factors": sev.get("factors"),
            "provisional": bool(sev.get("provisional")),
            "uncapped_level": sev.get("uncapped_level"),
            "deadline_at": report.get("deadline_at"),
            "deadline_note": sev.get("deadline_note"),
        }
    return {
        "report": report,
        "severity": severity,
        "timeline": [dict(e) for e in events],
        "photos": photo_urls,
    }


@app.post("/reports/{report_id}/analyse", status_code=202)
def reanalyse_report(report_id: str, background_tasks: BackgroundTasks):
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    with engine.connect() as conn:
        exists = conn.execute(
            text("select 1 from reports where id = :id"), {"id": rid}
        ).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="Report not found.")

    background_tasks.add_task(process_report, str(rid))
    return {"id": str(rid), "status": "analysis_queued"}


class DuplicateResponse(BaseModel):
    same_problem: bool


@app.post("/reports/{report_id}/duplicate-response")
def duplicate_response(report_id: str, body: DuplicateResponse):
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")
    out = respond_to_suggestion(str(rid), body.same_problem)
    if not out["ok"]:
        raise HTTPException(status_code=out.get("code", 500), detail=out["error"])
    return out


@app.post("/reports/{report_id}/resolution", status_code=202)
async def request_resolution(
    report_id: str,
    background_tasks: BackgroundTasks,
    after: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
):
    """A citizen says the problem is fixed: send an after photo and its position.

    The comparison runs in the background and writes the outcome to the timeline.
    """
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="Location is outside valid range.")

    with engine.connect() as conn:
        row = conn.execute(
            text("select status from reports where id = :id"), {"id": rid}
        ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    if row.status in HIDDEN_FROM_FEED:
        raise HTTPException(
            status_code=409, detail="This report was merged into another report."
        )
    if row.status == "resolved":
        raise HTTPException(
            status_code=409, detail="This report is already marked as fixed."
        )

    filename = _store_image(await after.read())
    background_tasks.add_task(process_resolution, str(rid), filename, lat, lng)
    return {"id": str(rid), "status": "resolution_queued"}


class CommentBody(BaseModel):
    body: str


@app.get("/reports/{report_id}/comments")
def list_comments(report_id: str, sort: str = "top", offset: int = 0, limit: int = 10):
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    offset = max(0, offset)
    limit = max(1, min(limit, 50))
    order = "created_at" if sort == "newest" else "created_at desc"

    with engine.connect() as conn:
        total = conn.execute(
            text("select count(*) from comments where report_id = :id and hidden_at is null"),
            {"id": rid},
        ).scalar()
        rows = conn.execute(
            text(
                "select id, created_at, author_name, body from comments "
                "where report_id = :id and hidden_at is null "
                f"order by {order} limit :lim offset :off"
            ),
            {"id": rid, "lim": limit, "off": offset},
        ).mappings().all()

    return {
        "items": [dict(row, id=str(row["id"])) for row in rows],
        "total": total,
    }


@app.post("/reports/{report_id}/comments", status_code=201)
def add_comment(
    report_id: str,
    payload: CommentBody,
    authorization: str | None = Header(default=None),
):
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    body = (payload.body or "").strip()
    if not body:
        raise HTTPException(status_code=422, detail="Write something first.")
    if len(body) > 2000:
        raise HTTPException(status_code=422, detail="That is longer than 2000 characters.")

    # A signed-in comment is attributed; an anonymous one is still allowed and
    # labelled as such, which is what the report form already does.
    author, uid, email = "Resident", None, None
    if authorization and identity_configured():
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            person = verify_id_token(token.strip())
            if person:
                author = (person.get("name") or "Resident")[:80]
                uid = person.get("uid")
                email = person.get("email")

    with engine.begin() as conn:
        exists = conn.execute(
            text("select 1 from reports where id = :id"), {"id": rid}
        ).first()
        if exists is None:
            raise HTTPException(status_code=404, detail="Report not found.")
        row = conn.execute(
            text(
                "insert into comments (report_id, author_name, body, account_uid, account_email) "
                "values (:r, :a, :b, :u, :e) returning id, created_at, author_name, body"
            ),
            {"r": rid, "a": author, "b": body, "u": uid, "e": email},
        ).mappings().first()

    return dict(row, id=str(row["id"]))


class VoteBody(BaseModel):
    option_id: str
    voter: str = ""


def _poll_payload(conn, poll_id) -> dict | None:
    row = conn.execute(
        text("select id, question, closes_at from polls where id = :i"), {"i": poll_id}
    ).mappings().first()
    if row is None:
        return None
    options = conn.execute(
        text(
            "select o.id, o.label, "
            "       (select count(*) from poll_votes v where v.option_id = o.id) as votes "
            "from poll_options o where o.poll_id = :p order by o.ordinal, o.label"
        ),
        {"p": poll_id},
    ).mappings().all()
    return {
        "id": str(row["id"]),
        "question": row["question"],
        "closes_at": row["closes_at"].isoformat() if row["closes_at"] else None,
        "options": [
            {"id": str(option["id"]), "label": option["label"], "votes": option["votes"]}
            for option in options
        ],
        "total": sum(option["votes"] for option in options),
    }


@app.get("/polls/active")
def active_poll():
    """The open poll with live tallies. Real counts, real rows."""
    cached = _cache_get("poll", 5)
    if cached is not None:
        return cached

    with engine.connect() as conn:
        poll_id = conn.execute(
            text("select id from polls order by created_at desc limit 1")
        ).scalar()
        payload = _poll_payload(conn, poll_id) if poll_id else None

    if payload is None:
        raise HTTPException(status_code=404, detail="No poll is open.")
    _cache_set("poll", payload)
    return payload


@app.post("/polls/{poll_id}/votes", status_code=201)
def cast_vote(poll_id: str, body: VoteBody):
    """One vote per voter key; the key comes from the browser and is not an identity."""
    try:
        pid = uuid.UUID(poll_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid poll id.")

    voter = (body.voter or "").strip()[:64]
    if not voter:
        raise HTTPException(status_code=422, detail="A voter key is required.")

    with engine.begin() as conn:
        option = conn.execute(
            text("select id from poll_options where id = :o and poll_id = :p"),
            {"o": body.option_id, "p": pid},
        ).first()
        if option is None:
            raise HTTPException(status_code=404, detail="No such option in this poll.")

        duplicate = conn.execute(
            text("select 1 from poll_votes where poll_id = :p and voter_key = :v"),
            {"p": pid, "v": voter},
        ).first()
        if duplicate is not None:
            with engine.connect() as read:
                payload = _poll_payload(read, pid)
            raise HTTPException(status_code=409, detail="You have already voted.")

        conn.execute(
            text(
                "insert into poll_votes (poll_id, option_id, voter_key) "
                "values (:p, :o, :v)"
            ),
            {"p": pid, "o": body.option_id, "v": voter},
        )
        payload = _poll_payload(conn, pid)

    _cache_set("poll", payload)
    return payload


@app.get("/feed")
def feed(
    issue_type: str | None = None,
    sort: str = "newest",
    offset: int = 0,
    limit: int = 24,
):
    """The report list the feed reads: filters, sort and paging in one call.

    `issue_type` takes a comma-separated list so one UI category can cover
    several stored issue types. Merged duplicates are left out.
    """
    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    cache_key = f"feed:{issue_type or ''}:{sort}:{offset}:{limit}"
    cached = _cache_get(cache_key, 15)
    if cached is not None:
        return cached
    types = [t.strip() for t in (issue_type or "").split(",") if t.strip()]

    params: dict = {"lim": limit, "off": offset}
    clauses = ["status <> ALL(:hidden)"]
    params["hidden"] = list(HIDDEN_FROM_FEED)
    if types:
        clauses.append("issue_type = ANY(:types)")
        params["types"] = types
    where = "where " + " and ".join(clauses)

    if sort == "top":
        order = (
            f"order by {SEVERITY_ORDER} desc, severity_score desc nulls last, "
            "confirmations desc, created_at desc"
        )
    else:
        order = "order by created_at desc"

    with engine.connect() as conn:
        total = conn.execute(
            text(f"select count(*) from reports {where}"), params
        ).scalar()
        rows = conn.execute(
            text(
                f"""
                select id, created_at, lat, lng, address, description, issue_type,
                       severity_score, severity_level, severity_reason, deadline_at,
                       confirmations, status, photo_path,
                       ai_result->'vision'->>'summary' as summary
                from reports {where} {order} limit :lim offset :off
                """
            ),
            params,
        ).mappings().all()

    items = [{k: (str(v) if k == "id" else v) for k, v in row.items()} for row in rows]
    next_offset = offset + len(items)
    payload = {
        "items": items,
        "total": total,
        "next_offset": next_offset if next_offset < total else None,
    }
    _cache_set(cache_key, payload)
    return payload


@app.get("/stats")
def stats():
    """Public counts. Every number is computed from rows, none is estimated."""
    cached = _cache_get("stats", 15)
    if cached is not None:
        return cached

    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                select count(*) as total,
                       count(*) filter (where status not in ('resolved', 'merged')) as open,
                       count(*) filter (where status = 'resolved') as resolved,
                       count(*) filter (where status in ('routed', 'escalated')) as routed,
                       count(*) filter (where status in ('received', 'analysed',
                                                        'needs_review', 'needs_better_photo')) as in_progress,
                       count(*) filter (
                           where status not in ('resolved', 'merged')
                             and deadline_at is not null
                             and deadline_at < now()
                       ) as overdue,
                       round(avg(extract(epoch from (resolved_at - created_at)) / 3600.0)
                             filter (where resolved_at is not null)::numeric, 1) as avg_resolution_hours
                from reports
                """
            )
        ).mappings().first()
        by_type = conn.execute(
            text(
                "select issue_type, count(*) as count from reports "
                "where status <> 'merged' and issue_type is not null "
                "group by issue_type order by count desc"
            )
        ).mappings().all()

    payload = dict(row)
    payload["by_type"] = [dict(item) for item in by_type]
    _cache_set("stats", payload)
    return payload


@app.get("/departments")
def departments():
    """Per-body workload and speed, computed only from reports that were routed."""
    cached = _cache_get("departments", 20)
    if cached is not None:
        return cached

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                select department,
                       count(*) as total,
                       count(*) filter (where status = 'resolved') as resolved,
                       count(*) filter (
                           where status not in ('resolved', 'merged')
                             and deadline_at is not null
                             and deadline_at < now()
                       ) as overdue,
                       round(avg(extract(epoch from (resolved_at - created_at)) / 3600.0)
                             filter (where resolved_at is not null)::numeric, 1) as avg_hours
                from reports
                where department is not null
                group by department
                order by total desc, department
                """
            )
        ).mappings().all()

    result = {"items": [dict(row) for row in rows]}
    _cache_set("departments", result)
    return result


class ConfirmBody(BaseModel):
    supported: bool = True


@app.post("/reports/{report_id}/confirm")
def confirm_report(report_id: str, body: ConfirmBody):
    """Support / withdraw support. There are no accounts yet, so this is a count.

    The browser keeps a local flag so one visitor does not inflate it twice.
    """
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report id.")

    delta = 1 if body.supported else -1
    with engine.begin() as conn:
        row = conn.execute(
            text("select status from reports where id = :id for update"), {"id": rid}
        ).first()
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found.")
        if row.status in HIDDEN_FROM_FEED:
            raise HTTPException(
                status_code=409,
                detail="This report was merged into another report.",
            )
        confirmations = conn.execute(
            text(
                "update reports set confirmations = greatest(1, confirmations + :d) "
                "where id = :id returning confirmations"
            ),
            {"d": delta, "id": rid},
        ).scalar()

    return {"id": str(rid), "confirmations": confirmations}

