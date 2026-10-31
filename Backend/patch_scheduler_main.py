from pathlib import Path

p = Path("api/main.py")
src = p.read_text(encoding="utf-8")
Path("api/main.py.bak").write_text(src, encoding="utf-8")

old_import = "from api.database import engine"
new_import = old_import + "\nfrom contextlib import asynccontextmanager\nfrom jobs.scheduler import start_scheduler"

old_app = 'app = FastAPI(title="FixIt Bharat")'
new_app = (
    "@asynccontextmanager\n"
    "async def lifespan(app):\n"
    "    sched = start_scheduler()\n"
    "    try:\n"
    "        yield\n"
    "    finally:\n"
    "        sched.shutdown(wait=False)\n"
    "\n\n"
    'app = FastAPI(title="FixIt Bharat", lifespan=lifespan)'
)

for old in (old_import, old_app):
    assert src.count(old) == 1, f"expected 1 match for {old!r}, found {src.count(old)}"

src = src.replace(old_import, new_import).replace(old_app, new_app)
p.write_text(src, encoding="utf-8")
print("patched OK")
