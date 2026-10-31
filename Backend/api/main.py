import io
import os
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import text

from db.duplicates import respond_to_suggestion
from jobs.process import process_report
from api.database import engine
from contextlib import asynccontextmanager
from jobs.scheduler import start_scheduler

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
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    description: str = Form(""),
):
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="Location is outside valid range.")

    data = await photo.read()
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

    with engine.begin() as conn:
        report_id = conn.execute(
            text(
                "insert into reports (photo_path, description, lat, lng) "
                "values (:p, :d, :lat, :lng) returning id"
            ),
            {"p": filename, "d": description.strip(), "lat": lat, "lng": lng},
        ).scalar()
        conn.execute(
            text(
                "insert into status_events (report_id, status, note) "
                "values (:id, 'received', 'Report received')"
            ),
            {"id": report_id},
        )

    background_tasks.add_task(process_report, str(report_id))

    return {
        "id": str(report_id),
        "status": "received",
        "photo_url": f"/uploads/{filename}",
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

    report = {k: (str(v) if k in ("id", "duplicate_of") and v else v) for k, v in row.items()}
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
    return {"report": report, "severity": severity, "timeline": [dict(e) for e in events]}


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
    return {
        "items": items,
        "total": total,
        "next_offset": next_offset if next_offset < total else None,
    }


@app.get("/stats")
def stats():
    """Counts for the landing page strip. Nothing here is estimated."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                select count(*) as total,
                       count(*) filter (where status not in ('resolved', 'merged')) as open,
                       count(*) filter (where status = 'resolved') as resolved,
                       count(*) filter (where status in ('routed', 'escalated')) as routed,
                       count(*) filter (where status in ('received', 'analysed',
                                                        'needs_review', 'needs_better_photo')) as in_progress
                from reports
                """
            )
        ).mappings().first()
    return dict(row)


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

