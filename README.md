# FixItBharat

Civic grievance and infrastructure triage for Prayagraj.

A citizen reports a civic problem with a photo, a location and an optional note. A
vision model reads the photo, the location is enriched with real geodata, a severity
score and a response deadline are computed from five weighted factors, nearby reports
of the same defect are checked for duplicates, a complaint is drafted and delivered
through a real channel, and every step is visible on a public board.

Built for the FORGE hackathon, civic pulse track.

---

## How it works

```
Intake (photo, location, note, voice)
  → Understanding (vision model, strict JSON, confidence gate)
  → Enrichment (Nominatim, Overpass, Open-Meteo)
  → Dedup (PostGIS radius + similarity)
  → Severity (five weighted factors, LLM writes one verified sentence)
  → Routing (issue type → responsible body, complaint emailed, recorded)
  → Tracking (status timeline, deadlines, escalation agent)
  → Public board (feed, map, report pages, statistics)
```

The honesty rules the project was built around:

- Every report is a genuine submission. Nothing is seeded.
- Every number on the site is computed from a database row.
- Context data is fetched live, and a failed lookup is shown as missing rather than
  guessed.
- Complaints go to the project's own test inbox, never to a government department,
  and the record on each report says so.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript 7, Vite 8, Tailwind CSS v4, GSAP |
| Backend | FastAPI, SQLAlchemy, psycopg 3, APScheduler |
| Database | PostgreSQL with PostGIS (Neon) |
| Auth | Firebase Authentication (Google, email + password) |
| Maps | Leaflet + OpenStreetMap tiles |
| Vision | OpenRouter vision models, with a fallback chain |
| Geodata | Nominatim, Overpass, Open-Meteo (weather and air quality) |
| Mail | SMTP |

---

## Layout

```
Backend/
  api/            FastAPI app, routes, database engine, token + geocode helpers
  ai/             vision, severity formula, explanation, similarity, resolution
  enrichment/     reverse geocode, Overpass places and road class, weather, air
  routing/        department table, complaint text, SMTP delivery, pilot boundary
  jobs/           background pipeline, resolution check, escalation scheduler
  agents/         escalation agent (dry-run by default)
  db/             schema and the migrations
  eval/           evaluation harness and the labels template
src/
  components/site/         landing page sections, including the featured poll
  components/feed/         report feed, filters, cards, poll card
  components/report/       report page, comments, tracker, severity and evidence
  components/report-form/  the report writing flow
  components/map/          Leaflet maps: single report, picker, public map
  components/auth/         modal, providers, Firebase service
  lib/                     API client, i18n dictionary
```

---

## Running it

### Prerequisites

- Node 20+ and npm
- Python 3.13
- A PostgreSQL database with PostGIS, and a Firebase project

### Environment

Root `.env` (browser, Firebase web config — copy `.env.example`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

`Backend/.env` (copy `Backend/.env.example`). At minimum:

```
DATABASE_URL=postgresql://...        # must have PostGIS
FIREBASE_API_KEY=                    # same web API key, used to verify ID tokens
OPENROUTER_API_KEY=
OPENROUTER_VISION_MODEL=
NOMINATIM_CONTACT=                   # Nominatim requires a contact address
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASSWORD=
ROUTING_TEST_RECIPIENT=
```

Both `.env` files are gitignored. Never commit them.

Firebase: enable **Email/Password** and **Google** under Authentication → Sign-in
method, and keep `localhost` in Authorized domains.

### Install and migrate

```bash
npm install

cd Backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt

# first run only, in this order
.venv/Scripts/python.exe -m db.init_db                 # base schema
.venv/Scripts/python.exe -m db.migrate_002_context     # enrichment context
.venv/Scripts/python.exe -m db.migrate_003_report_account
.venv/Scripts/python.exe -m db.migrate_004_workflow    # category, resolution, photos
.venv/Scripts/python.exe -m db.migrate_005_flags       # spam flags
.venv/Scripts/python.exe -m db.migrate_006_comments
.venv/Scripts/python.exe -m db.migrate_007_polls
```

All migrations are idempotent.

### Run

```bash
# terminal 1
cd Backend
.venv/Scripts/python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000

# terminal 2
npm run dev -- --port 5174 --strictPort
```

Open <http://localhost:5174>. Vite proxies `/api` and `/uploads` to the backend, so
there is no CORS in development and relative photo URLs work.

**Note:** the database is in `us-east-2`. The first request after idle takes a few
seconds while it resumes; read endpoints are cached briefly after that.

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | status and report count |
| GET | `/feed` | paged feed: `issue_type`, `sort=top\|newest`, `offset`, `limit` |
| GET | `/stats` | totals, open, resolved, routed, overdue, average resolution, by type |
| GET | `/departments` | resolution speed and backlog per responsible body |
| GET | `/reports/{id}` | one report: record, severity breakdown, timeline, photos |
| POST | `/reports` | submit: photos, `lat`, `lng`, `description`, `category`, `audio_text` |
| GET | `/reports/flagged` | the review queue |
| POST | `/reports/{id}/analyse` | re-run the pipeline |
| POST | `/reports/{id}/confirm` | support / withdraw support |
| POST | `/reports/{id}/duplicate-response` | answer "is this the same problem?" |
| POST | `/reports/{id}/resolution` | send an after photo, recorded on the timeline |
| GET, POST | `/reports/{id}/comments` | comment list and posting |
| GET | `/polls/active` | the open poll with live tallies |
| POST | `/polls/{id}/votes` | one vote per browser key |
| GET | `/geocode/reverse` | block-level label for a point |
| GET | `/geocode/search` | forward geocode, biased to the pilot city |

Every endpoint that accepts a request may carry `Authorization: Bearer <Firebase ID
token>`; the backend verifies it and attributes the row. Everything works
anonymously too.

---

## Severity

Score 0–100 from five factors, weights in `Backend/ai/severity_config.py`:

| Factor | Max | Source |
|---|---|---|
| Damage | 40 | vision model: size plus hazard indicators |
| Road importance | 20 | OpenStreetMap road class |
| Nearby sensitive places | 15 | schools and hospitals within 200 m, bus stops |
| Weather or air | 10 | rain in the last 24 h, or US AQI |
| Confirmations | 15 | how many citizens reported or confirmed it |

Levels map to proposed response times: critical 24 h, high 72 h, medium 7 days, low
14 days. A score missing any factor is marked **provisional** and capped at medium.
The score is computed in code; the model writes one sentence, and that sentence is
rejected if it contains a number that is not in the evidence.

---

## Evaluation

```bash
cd Backend
.venv/Scripts/python.exe -m eval.run_eval            # latency and pipeline coverage
.venv/Scripts/python.exe -m eval.run_eval --labels   # plus classification accuracy
```

`--labels` reads `eval/labels.csv` (see `eval/labels.example.csv`) and runs the vision
model on each file in `eval/photos/`. Output goes to `eval/report.md`. Accuracy is
reported as "not measured" until labels exist; nothing is estimated.

---

## Language

The interface is English and Hindi, switched from the header. The dictionary is in
`src/lib/i18n.jsx`.

Not translated: text generated by the pipeline (severity reasons, status notes),
which is written in English at generation time.

---

## Known limits

- **Photos are on local disk** (`Backend/uploads`). An ephemeral-filesystem deploy
  loses them, and the pipeline then reports "Photo file missing on server".
- **Rate limiting and caches are in-process.** Two workers mean two counters.
- **Complaints go to a test inbox.** No municipal body offers an open submission API;
  the generated complaint says so in its first line.
- **The department table is unconfirmed.** Each entry is labelled unverified, and only
  the UP Jansunwai / CM Helpline 1076 channel has citations.
- **Escalation is dry-run** unless `ESCALATION_LIVE=true`.
- **Notices, verification badges, the ward-updates checkbox and the area filter** are
  interface only — no table behind them yet.
- **OpenStreetMap tiles** are used under their usage policy: fine for a pilot, not for
  production traffic.

---

## Further reading

- `SPEC-GAP-REPORT.md` — implementation against the workflow document, phase by phase.
- `UI-NEEDS-BACKEND.md` — what each unfinished surface would need.
- `BACKEND-NOT-INVOKED.md` — backend capability the interface does not use yet.
- `AGENTS.md` — working conventions for this repository.
- `design-guidelines.md` — the visual system (tokens, rectangles only, no radii).
