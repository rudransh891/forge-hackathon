# Backend → Frontend merge analysis

> **Status: partly superseded.** This was written before any code was written. The merge
> has since been implemented, so the blockers in §1 and most of §4/§5 no longer apply.
> Current state:
>
> - `UI-NEEDS-BACKEND.md` — what the UI still has no backend for (comments, polls, notices,
>   accounts, wards, verification, official updates, resolution UI, galleries).
> - `BACKEND-NOT-INVOKED.md` — what the backend computes and the UI still does not show.
> - Implemented: CORS + a vite `/api` and `/uploads` proxy, `GET /feed` (filter, sort, paging),
>   `GET /stats`, `POST /reports/{id}/confirm`, plus a real API client, a report submission
>   page, severity/duplicate/retry UI, and the US copy migrated to Prayagraj.
> - Still true, and still worth fixing before any public demo: the credential rotation in §8,
>   the `schema.sql` gap in §7.1 (now fixed), and the backend patch scripts in §7.7.

Scope: what breaks, what is missing, and what the frontend promises that the backend cannot keep.
Nothing here is implemented; this is the work list.

Sources read: all of `Backend/` (api, ai, enrichment, routing, jobs, agents, db) and all of `src/`.
Verified by reading, not by running: the backend is not currently running, and its Python
dependencies are not installed in the system interpreter (`ModuleNotFoundError: sqlalchemy`).
Neither side has a test suite.

---

## 0. The short version

1. **They are different products.** The frontend is a US-shaped civic forum ("Ward 7", "Elm Street",
   "Route 12", ZIP codes). The backend is a single-city Indian grievance router (Prayagraj pilot,
   UP Jansunwai, six fixed issue types). Only the report list/detail overlaps, and it overlaps badly.
2. **The frontend has nothing that can send a report.** Every "Report an issue" button opens the auth
   modal. The backend's entire entry point is a multipart photo + GPS upload. No form, no camera, no
   geolocation, no API client, no base URL, no proxy config exists.
3. **The backend has roughly 4 usable endpoints.** No auth, no users, no support/vote, no comments,
   no polls, no notices, no wards, no filters, no pagination, no categories, no resolution flow.
   The feed and report pages call a mock service for all of it.
4. **The core flow the frontend renders does not exist end to end.** Status advances to `routed`
   automatically in the background and almost nothing ever advances it further. There is no endpoint
   to mark a report resolved, so nothing ever reaches the tracker's "Fixed" step except by manual SQL.
5. **Worth fixing regardless of the merge:** `Backend/.env` holds a live OpenRouter key, a Neon
   Postgres password and a Gmail app password. It is gitignored, but only by
   `Backend/.gitignore` — a single untracked file — so the protection is one `git add` away from
   failing. Rotate, and add a `.env.example`.

The single largest risk is not technical: it is that the merged app will *look* like it works while
the "AI severity", "nearby duplicate" and "officially routed" claims in the UI are all optional,
silently-skipped steps.

---

## 1. Hard blockers (merge cannot work without these)

### 1.1 No CORS, so the browser cannot talk to the API at all

`api/main.py` builds `FastAPI(...)` and mounts `/uploads`. There is no `CORSMiddleware` anywhere in
`Backend/` (grep for `add_middleware` / `CORS` returns nothing). Vite serves `localhost:5173`; FastAPI
serves `localhost:8000`. Every `fetch` is a cross-origin request and is rejected before it leaves the
browser.

Two ways out, pick one deliberately:

- **Vite proxy** (`server.proxy['/api'] → http://127.0.0.1:8000`) plus a `/uploads` proxy entry. No
  Python change, keeps cookies same-origin later, but only works in dev/preview.
- **`CORSMiddleware`** in `main.py` with an explicit origin list and `allow_credentials=True`. Needed
  anyway if the app is ever served from a different origin than the API.

The uploads choice matters more than it looks: `photo_url` is returned as a **relative**
`/uploads/<file>.jpg`, so on a frontend-only dev server every one of those URLs 404s unless `/uploads`
is proxied too.

### 1.2 No API client, no base URL, no single place to switch from mocks

- `src/` contains zero `fetch(` calls (verified by grep).
- `feedService.js` and `authService.js` are the seam by design, and both are honest mocks:
  `authService` resolves `{ status: 'not_configured' }` after 600 ms; `feedService` returns
  `feedData.js` after a 400 ms `setTimeout`.
- The TODO comments in `feedService.js` describe an API that **does not exist**:
  `GET /api/wards/7/reports?category=&sort=&cursor=&pageSize=`, `GET /api/reports/:id/comments`,
  `POST /api/reports/:id/comments`, `POST /api/polls/:id/votes`, `GET /api/wards/7/notices`,
  `GET /api/wards/7/polls/active`, `POST /api/comments/:id/flags`, `POST /api/comments/:id/helpful`.
  The backend supports **none** of the `/wards/`, `/polls/`, `/comments/` routes.
- There is no `VITE_API_URL` and no `src/lib/api.js`. Every call would hard-code a host.

Do not just delete the mocks. `fetchReports` returns a shape (`items`, `nextCursor`, `total`) that the
backend does not produce, and the components above it depend on that shape.

### 1.3 The frontend cannot submit a report

The backend's only write path is `POST /reports` with `photo` (multipart), `lat`, `lng`, `description`.
The frontend has:

- no file input, no camera capture, no image preview/compression;
- no `navigator.geolocation` call anywhere (grep: none);
- `ReportButton`, `openReport`, the feed empty state and the closing CTA all call
  `openAuthModal('signup')` — reporting is gated behind an account that does not exist yet.

So "Report an issue" must become a real flow: pick/allow photo, get coordinates (with an
out-of-pilot-area path), optional description, submit, then a *pending* state — because the analysis
runs in a FastAPI `BackgroundTask` and the POST returns `{ id, status: "received", photo_url }`
immediately, not a finished report.

### 1.4 Nothing authenticates, and the frontend assumes it does

- No user table, no session, no token, no auth dependency on any route (grep for `@app.` in
  `Backend/` yields 7 routes, all anonymous).
- `AuthModalProvider` holds a `view` and an `identifier` only. No session state, no "current user",
  no logout.
- `CommentComposer` is deliberately `readOnly` and opens the login modal; `CommentsSection` requires
  auth to post; the header hard-codes "Login / Sign up".
- `VerifyForm` hard-codes the banner "Authentication isn't connected yet. No code was sent."
  That banner must become conditional or it will lie once auth is real.

Consequence: **any per-citizen action** — support/confirm, "same problem?" on a duplicate, comments,
helpful votes, "I fixed it" — cannot be attributed. The backend already has `confirmations` on a
report and increments it on a duplicate confirmation, but with no user identity a double-tap inflates
it. Whatever identity model you choose (anonymous device id, cookie session, magic link) has to be
decided before the support button can be wired.

---

## 2. Data model mismatches

### 2.1 Field-by-field: what the UI reads vs what the API returns

| UI field (`feedData.js`) | Backend source | Status |
|---|---|---|
| `id` | `reports.id` (UUID) | OK, but see 2.2 |
| `title` | none | missing: backend has no title, only `description` and the AI `summary` |
| `category` | `issue_type` | missing: value vocabularies do not overlap (see 2.3) |
| `locality` | `context.geocode.locality` / `city` | partial: exists, but not in the list response and only inside `report.context` on detail |
| `ageDays` | `created_at` | missing: must be computed |
| `verification: 'verified'\|'unverified'` | none | missing: no verification concept exists |
| `urgent` | `severity_level === 'critical'` | missing: must be derived; not in the list response as such |
| `status: 'open'\|'resolved'` | `reports.status` | missing: backend vocabulary is 10+ values (see 2.4) |
| `photo` (imported SVG module) | `photo_path` → `/uploads/...` | partial: URL, relative, cross-origin, single photo only |
| `photoAlt` | none | missing: no alt text can be generated |
| `supporters` | `confirmations` | partial: includes the original reporter, auto-increments on a duplicate merge |
| `comments` | none | missing: no comments table |
| `supportedByMe` | none | missing: no per-user state |
| `description` | `description`, `ai_result.vision.summary` | partial: user text untrusted and optional (may be `""`) |
| `addressBlock` | `address` | partial: often null when enrichment failed |
| `photos[]` (gallery) | single `photo_path` | missing: one photo per report, no gallery |
| `officialStatus: 'reported'\|'seen'\|'scheduled'\|'fixed'` | `status_events` | missing: no mapping exists |
| `statusDates {seen, scheduled, fixed}` | `status_events.created_at` | missing: no events of those kinds are ever written |
| `updates[]` (author, dateLabel, text, verified) | none | missing: "Official updates" has no backend source |

### 2.2 IDs

- Frontend mock ids are `r-01`, `r-02`, ... and go straight into the hash: `#/issues/${report.id}`,
  parsed by `/^#\/issues\/([^/]+)$/`. Backend ids are lowercase UUIDs, which match that regex, so that
  part is fine.
- But `ReportPage` calls `fetchReport(id)` and shows `ReportNotFound` on `null`. The backend returns
  **400** `"Invalid report id."` for a malformed UUID and **404** `"Report not found."` for a valid
  one. The page must distinguish 400 from 404 from a network error; right now there is a single
  `missing` state, and an `error` state that exists on the feed but not on the report page. A backend
  that is down currently looks identical to a deleted report.

### 2.3 Categories vs issue types

| Frontend (`feedConfig.categories`) | Backend (`ai/schemas.py` `IssueType`) |
|---|---|
| Roads, Parks, Transit, Safety, Water, All | pothole, garbage, water_leak, drain_overflow, streetlight, other, none |

There is no many-to-one mapping here that keeps the copy truthful:

- `Parks` and `Transit` have no backend counterpart at all. "Route 12 cut", "bus shelter glass",
  "street name sign" — the vision model is explicitly told to classify these as `other` at best, and
  its prompt scope is "civic infrastructure", not transit.
- `Safety` is not a category, it is a *severity*. Folding `streetlight` into Safety conflates the two.
- `Water` would have to absorb both `water_leak` and `drain_overflow`, which route to different
  `BODIES` (`routing/departments.py`).
- `none` (not a civic issue) has no category and should never reach the feed at all, but `GET /reports`
  does not filter it out.

`feedConfig.categories` is a single array imported by `FeedFilters`; whatever you choose, the mapping
must live in one module and the filter must translate a UI category into a set of `issue_type` values.

### 2.4 Status vocabularies

Backend statuses actually written anywhere in `Backend/`:

`received`, `analysed`, `needs_review`, `needs_better_photo`, `merged`, `routed`, `escalated`
(plus read-but-never-written `resolved`, `acknowledged`, `in_progress`).

Frontend statuses:

- feed/detail `status`: `open` | `resolved` (`StatusTag.jsx`) — anything else renders no tag at all;
- tracker `officialStatus`: `reported` | `seen` | `scheduled` | `fixed` (`feedConfig.trackerSteps`).

Nothing maps these. Worse, several backend states are user-visible *failures* with no UI:
`needs_better_photo` (send a clearer photo), `needs_review` (AI unavailable / photo missing /
after-photo rejected), `merged` (this is a duplicate of another report). Each needs its own message;
`StatusTag` currently collapses all three to "no tag", which is the worst outcome, because a failed
analysis looks like a normal report in the feed.

Also note `ai/pipeline.py:_save_outcome` refuses to overwrite `status` once it is `routed`,
`escalated`, `acknowledged` or `in_progress` — but `route_report` only sets `routed` when the email
actually sent (`routing/service.py`, `set_routed=delivery["ok"]`). So the pipeline is effectively
one-way and a re-analysis can never walk a report backwards. Decide whether that is intended before
building a "Re-analyse" button, because the endpoint exists (`POST /reports/{id}/analyse`, 202) and
the UI will happily call it and show nothing changing.

### 2.5 Serialization and timestamps

No endpoint except the duplicate-response has a `BaseModel`, and that one is a *request* body. So:

- `GET /reports` returns raw mapped columns; `created_at`/`deadline_at` are datetimes that FastAPI
  serializes, and any future `DATE`/`NUMERIC` column will arrive as another Python type.
- `GET /reports/{id}` does `{k: (str(v) if k in ("id", "duplicate_of") and v else v) for k, v in
  row.items()}`, so `id`/`duplicate_of` are strings while every other column keeps its DB type.
  `context` and `ai_result` ship as whole nested dicts.

The frontend formats numbers in `en-US` (`toLocaleString('en-US')` in `PollCard`, `FeaturedPoll`) and
renders hand-written `dateLabel`s like `'4 Nov'`. The backend sends UTC ISO; `routing/complaint.py` and
`agents/escalation.py` format everything in IST. The detail page must pick one timezone for citizen
display and the backend must not round-trip it away.

### 2.6 Truthiness traps that will render empty or "undefined"

Read from the code; each produces a visible bug on the report page:

- `report.address` is `COALESCE(geo.address, address)` in `enrichment/service.py`, so it is `null`
  whenever Nominatim failed. `LocationBlock` renders `{addressBlock}` directly, leaving a blank line,
  with the "Map" link still pointing at `href="#"` with `preventDefault()`.
- `report.description` may be `""` — `create_report` stores `description.strip()` and defaults to `""`.
  `ReportDescription` renders it as-is, leaving an empty paragraph under a real heading.
- `report.severity_reason` is `null` unless the report was scorable *and* scoring succeeded
  (`ai/severity_service.py` returns early for `other`/`none` and on any exception).
- `report.ai_result` is `null` until analysis finishes; and analysis may never finish at all if the
  process restarts mid-task (see 3.3).

---

## 3. Things the backend does that the frontend does not account for

### 3.1 Everything is asynchronous and the UI has no polling

`POST /reports` returns in milliseconds, but the report is genuinely unfinished for seconds to
minutes afterwards. `jobs/process.py` runs, in order: vision analysis (up to 3 models x 2 attempts at
a 60 s timeout each) -> duplicate check -> enrichment (4 parallel lookups, 12 s Overpass timeout x 3
mirrors) -> **`time.sleep(20)`** if any context part is missing -> severity scoring (another LLM call,
30 s timeout) -> routing (SMTP, 20 s timeout).

Worst case a report sits in `received` for several minutes. The frontend has no polling, no
`GET /reports/{id}/status`, no websocket, no SSE. Whatever you build (a submit screen polling detail
every 2-3 s until `analysed`/`needs_*`, or a feed-level refresh) has to exist, and it has to stop
polling on terminal states.

The `time.sleep(20)` runs inside the request's background task in a single-process server: it will
also delay every other queued task in that worker. On a one-worker uvicorn demo this is a
user-visible stall.

### 3.2 The pipeline is best-effort and every failure is silent

Every step in `jobs/process.py` is wrapped so that "one failing step never stops the next", and most
failures return `{"ok": False, "reason": ...}` into a **log line only**. No API surface tells the
citizen or the frontend *why* a report has no severity, no duplicate suggestion, or no routing.
Concretely:

- Overpass down (all three mirrors) -> `road` and `places` factors `missing` -> severity becomes
  `provisional` -> **routing is skipped entirely** (`routing/service.py` refuses provisional
  severities). The report silently never gets a complaint email and the UI cannot say so.
- Nominatim without `NOMINATIM_CONTACT`, or rate-limited -> no address, blank `LocationBlock`.
- SMTP creds wrong -> `delivery.ok = False`, status stays `analysed`, and only a `status_events` note
  records it. The feed shows nothing.
- Vision models all fail -> `needs_review` with a note like "AI unavailable: ..." containing raw model
  names and HTTP codes. That note is returned verbatim in the timeline and would render as UI copy.

If the frontend displays a severity, it must also display "provisional / not assessed: road, places".
The backend already computes `missing`, `not_applicable`, `coverage` and `provisional` in
`ai/severity.py`, and `GET /reports/{id}` echoes them under `severity.*`. **The UI has no component for
any of that.** Rendering only `severity_level` would be a lie by omission: a provisional score is
capped at `PROVISIONAL_MAX_LEVEL` (`"medium"`), so a genuinely critical pothole shows as "Medium".

### 3.3 No durable queue, and a scheduler that can duplicate work

- Background work is `BackgroundTasks`, i.e. in-process. A server restart (or uvicorn `--reload`, or
  any crash) drops every queued analysis with the report stuck at `received` forever. There is no
  retry and no stuck-report detector; the only requeue is `POST /reports/{id}/analyse`.
- That endpoint has no guard: call it twice and you run two full pipelines on the same report
  concurrently, both appending `status_events` and both calling the LLM. (`check_reanalyse_guard.py`
  exists in the repo, so this was known — the guard is not in `main.py`.)
- APScheduler starts **inside the app lifespan** with `BackgroundScheduler` on a 5-minute interval
  (`ESCALATION_INTERVAL_MINUTES`). Run it under `--workers 2` and you get two schedulers and two
  escalation passes. It is dry-run unless `ESCALATION_LIVE=true`, which is the only thing saving it
  today.

### 3.4 The duplicate flow needs a citizen answer that no UI collects

This is the most under-specified part of the merge, and it gates routing:

1. `db/duplicates.py:suggest_duplicate` stores `ai_result.duplicate_suggestion` with `response: null`.
2. `routing/service.py:route_report` **refuses to route** while that `response` is `null`
   ("waiting for the citizen to answer the duplicate question").
3. The only way to answer is `POST /reports/{id}/duplicate-response` with `{same_problem: bool}`.

The frontend has nothing for this: no prompt on the report page, no pending state, no component.
`GET /reports/{id}` does return `ai_result` inside `report.ai_result`, so the candidate's photo URL,
summary, distance, score, label and shared terms are all available — the data is sufficient, the UI
is not.

Worse, the suggestion is only produced at submit time, from the background pipeline. If the citizen
never returns to answer it, that report is permanently "waiting" and never routes. And
`respond_to_suggestion` with `same_problem: true` sets the new report to `status='merged'`, increments
the older report's `confirmations`, and appends a `status_events` row to *the older report* with status
`analysed` — so the older report gains a timeline entry the UI will render as if it were a state
change.

### 3.5 Generated content is legally marked, and the UI strips the marking

The backend is unusually careful about honesty; a naive wiring will undo it:

- `routing/departments.py`: `BODY_CONFIRMED = False`; every complaint says
  "(Responsible body not yet confirmed from an official source.)" and the email is prefixed
  `[TEST ROUTING] This email went to the FixIt Bharat team's test inbox. It was NOT sent to any
  government department.`
- `agents/escalation.py` does the same with `[TEST ESCALATION]`.
- `ai/severity_config.py`: "Deadlines are PROPOSED service levels ... not official municipal
  commitments", and `deadline_note` is stored alongside the score.
- `ai/severity_reason.py` verifies LLM sentences against the evidence numbers before storing them
  (rejects invented numbers, wrong level words, wrong "school" wording).

The UI's equivalents say the opposite: `labels.verified = 'Verified by ward office'`, a "Seen by city"
tracker step, and `Official updates` with `update.author = 'Public Works'`, `update.verified: true`.
**Rendering `status_events.note` as "official updates" claims a government actor that does not
exist.** `_save` in `routing/service.py` even writes a note saying it is not a government department —
that text would appear under an "Official updates" heading.

Decision needed before wiring: rename these surfaces (e.g. "Platform records" / "FixIt Bharat
workflow"), or surface the pilot disclaimer on every card that claims routing. The design system has a
coral urgent treatment and a teal info treatment that can carry it, but nothing in `feedConfig.labels`
exists for "not sent to a department".

### 3.6 Geographic scope

- `routing/area.py` has a hard-coded Prayagraj polygon (`pilot_boundary.json`).
- Outside it, `route_report` returns `inside_pilot_area: False` with `citizen_option:
  OFFICIAL_CHANNEL` and **never sends anything**. The report stays unrouted, which in the current UI
  reads as "open, waiting for the city".
- The frontend has no concept of pilot area, no map, no geolocation gating. `LocationBlock`'s map is a
  decorative SVG of streets that do not exist.
- `Hero`'s location box ("Your ZIP code or city", placeholder `60607 or Chicago`) and
  `how-it-works.tsx` ("Open the map, pick a neighborhood") promise a browse-by-area product. The
  backend has no area search, no wards, no bbox filter. `GET /reports` is a flat `ORDER BY created_at
  DESC LIMIT n`.

The whole app also says "Ward 7": `useFeed`'s announcement, `feedConfig.ward`, `FeedPage`'s
`<h1 className="sr-only">Reports in Ward 7</h1>`, `labels.endState`, `SiteHeader`, `hero.tsx`. The
backend has no ward concept at all. Either drop the word or add a column the backend does not have.

### 3.7 Photo handling

- One photo per report (`photo_path` is a single `TEXT`). `PhotoGallery` is built for an array;
  `photos` will always be length 0 or 1, which makes the carousel and its "Photos submitted by a
  resident." caption dead weight.
- Server rejects >10 MB (`413`), non-images (`400`), empty (`400`). The client has no size check and no
  compression; phone cameras routinely exceed 10 MB.
- The server re-encodes to JPEG q85 at max 1280 px and strips EXIF via `exif_transpose` — good, but it
  also strips GPS, so it depends entirely on the `lat`/`lng` form fields the client must send.
- `photo_url` is relative. See 1.1.
- Uploads live on local disk (`Backend/uploads`, gitignored). Any deploy with an ephemeral filesystem
  loses every image, and `analyse_report` then returns `needs_review` "Photo file missing on server".
  The two files in `Backend/uploads/` are the only evidence this ever ran.
- `Backend/.gitignore` ignores `*.jpg`/`*.jpeg`/`*.png`, so `test.jpg`, `wall.jpg` and
  `blocked drainage.jpg` are untracked and will not survive a fresh clone.

### 3.8 External dependencies baked into the citizen path

- Nominatim: 1.1 s serialized lock, contact required, per-process cache. Fine for a demo, a hard
  bottleneck for a launch, and it blocks a `ThreadPoolExecutor` worker for over a second per report.
- Three Overpass mirrors, all public, all frequently 429/504. Two of the four enrichment lookups depend
  on them, and both feed severity.
- OpenRouter free-tier vision models (`:free` suffixes in `.env`) — rate-limited, and they can be
  removed; `ai/vision.py` explicitly handles "model removed".
- SMTP via a Gmail app password, `smtplib.SMTP` + `starttls`, 20 s timeout, inline in the routing step.

None of these are mocked, stubbed or feature-flagged, so a demo on bad wifi shows reports with no
severity and no address and nothing says why.

---

## 4. Features the frontend shows that the backend has no concept of

Each is currently a static import from `feedData.js` and must be built or removed. There is no honest
third option.

| Feature | Where | Backend |
|---|---|---|
| Comments (list, post, flag, helpful, "Top" tag) | `CommentsSection`, `CommentItem`, `CommentComposer`, `feedService.fetchComments/postComment` | nothing: no table, no route |
| Support / "supporters" | `SupportButton`, `reportStore`, `useFeed.toggleSupport` | `confirmations` only, no per-user record, no vote route |
| Polls (card, featured poll, live results) | `PollCard`, `featured-poll.tsx`, `fetchPoll/votePoll` | nothing |
| Notices ticker | `NoticesTicker`, `fetchNotices` | nothing |
| Wards | everywhere in copy | nothing |
| Locality / area browsing | `Hero` location box, `ReportCard.locality` | only `context.geocode`, and only on detail |
| Verification ("Verified by ward office") | `VerificationMark`, `OfficialUpdates` | nothing |
| Official updates | `OfficialUpdates` | nothing; `status_events` are machine notes |
| Resolution / "Fixed" tracker step | `StatusTracker` | `ai/resolution.py` exists but is unreferenced |
| Photo gallery | `PhotoGallery` | single photo |
| Nearby reports ("same locality") | `NearbyReports`, `nearbyFor()` over the mock array | no endpoint; duplicate candidates exist but are private to `ai_result` |
| Search, filter by category, sort by top/newest | `FeedFilters`, `feedService.sortReports` | only `limit` |

`ai/resolution.py` deserves a note: it is a complete before/after photo comparison with a code-decided
outcome (`resolved` / `not_fixed` / `needs_review`) including a 50 m distance gate — and nothing in
`api/main.py`, `jobs/process.py` or the scheduler imports it. Its only caller in the repo is the
manual script `check_resolution.py`. If the merged product wants a "Fixed" step that is real, this is
the piece to expose: it needs an endpoint (`POST /reports/{id}/resolution` with after-photo +
coordinates) and a UI.

---

## 5. Pagination, filtering, sorting

`GET /reports?limit=50` clamps to 1-200 and orders by `created_at desc`. Nothing else.

- `useFeed` drives an infinite feed from `nextCursor` and an `IntersectionObserver` sentinel, and calls
  `fetchReports({ category, sort, cursor })` on every filter change.
- The cursor is an *offset string* over the mock array.
- `sort: 'top'` sorts by `urgent` then `supporters`; `'newest'` by `ageDays`. The backend has neither
  as a sort key (it has `severity_level`, `confirmations`, `created_at`).

Offset pagination over `created_at desc` with background inserts will duplicate and skip rows as new
reports land mid-scroll. If you keep the observer, switch to keyset (`created_at < :cursor`) or accept
the flicker. The endpoint needs `category` (a set of `issue_type`), `sort`, `cursor`, and a `total` if
the feed keeps its "N reports in ..." announcement — the count is a separate query.

Also: `GET /reports` does not exclude `merged` reports. Merged duplicates appear in the feed as fully
separate items, each with a photo, competing with the report they were merged into.

---

## 6. Types

AGENTS.md says TypeScript 7 targeting ES2023, but the feed and report layers are `.js/.jsx`
(`feedService.js`, `useFeed.js`, `reportStore.js`, `ReportPage.jsx`, `CommentsSection.jsx`, ...) and
are checked only via `allowJs: true` with no `checkJs`. There is no shared type for a report anywhere.

Merging against a detail response of `{"report": {...}, "severity": {...}, "timeline": [...]}` — a
shape no component has ever seen — is the moment to introduce one TypeScript module
(`src/lib/api.ts`) with `Report`, `SeverityBreakdown` and `StatusEvent` types and a single `fetch`
wrapper. Doing this in `.js` with JSDoc across `feedData.js`'s 24-mock shape and then replacing it is
more churn than doing it once, in TS, at the seam.

Two concrete traps if the response is passed around unconverted:

- `GET /reports` returns a **flat array**; `GET /reports/{id}` returns `{report, severity, timeline}`.
  The feed's `items` and the detail page's `report` are the same object in the mock world and different
  shapes in the real one. `ReportPage` uses `report.supporters`, `report.title`, `report.photos` —
  none of which exist on the list payload.
- `severity` is `null` entirely when no factor could be evaluated: `score_and_store` returns early
  without writing, so `ai_result.severity` never appears and `main.py` builds `severity = None`. The UI
  must handle "no severity object", not just "score 0".

---

## 7. Backend defects found while reading (fix before exposing them)

Real bugs, not merge friction, each one something the frontend would surface:

1. **`context` column missing from `schema.sql`.** `db/migrate_002_context.py` adds `context JSONB`,
   but `db/schema.sql` — which `init_db.py` runs — does not create it. A fresh `python db/init_db.py`
   produces a schema where every `context` read/write in `jobs/process.py`, `ai/severity_service.py`,
   `enrichment/service.py` and `ai/severity.py` fails. Severity then computes with no
   `road`/`places`/`conditions` context, is always `provisional`, and routing is always skipped.
   **A clean setup produces a system that never routes anything.** This is the most likely thing to
   bite during the merge integration test.
2. **Strict list fields make free-tier models look like bad photos.** `ai/schemas.py` types
   `visible_damage` and `hazard_indicators` as `list[str]`; the `_normalise_text` validator only covers
   `issue_type` and `estimated_size`, not list contents. A model returning
   `"hazard_indicators": "water pooling"` (a string, which vision models do) fails validation, is
   retried, then falls through to the next model, and after three models the report becomes
   `needs_review` — telling the citizen to "send a clearer photo" when the photo was fine.
3. **`GET /reports` would leak internal JSON** the moment `context` is added to its `select`: there is
   no response model, so the whole Nominatim/Overpass/Open-Meteo payload ships to the browser.
4. **`duplicate-response` mixes two error conventions** — `HTTPException` for some failures, `{ok:
   false}` with 200 for others depending on how `out["code"]` is set. Pick one.
5. **`_event(..., cand, "analysed", ...)` in `respond_to_suggestion`** writes a status transition on a
   *different* report than the one being answered, so the UI renders "analysed" on the older report as
   a new event.
6. **`routing/service.py:_save` uses `WHERE id = :i` with a raw string** while every other query casts
   (`CAST(:id AS uuid)`). It works only because psycopg infers the column type; the two styles should
   not coexist.
7. **The repo is full of in-place patchers:** 13 `patch_*.py` scripts and 10 code `*.bak` files
   (`ai/pipeline.py.bak`, `ai/severity.py.bak`, `ai/severity_config.py.bak`,
   `ai/severity_service.py.bak`, `agents/escalation.py.bak`, `api/main.py.bak`,
   `enrichment/overpass.py.bak`, `jobs/process.py.bak`, `routing/service.py.bak`,
   `check_escalation.py.bak`). This is evidence the source of truth was edited by script. **Confirm
   which file is canonical before building on it** — re-running `patch_main.py` or `patch_process.py`
   will silently disagree with the current `main.py`. None of these should ship.
8. **26 `check_*.py` scripts** at the backend root, each hitting the live Neon database and live public
   APIs, printing results. Useful as manual smoke tests; they are not a suite (no process-failing
   asserts, no isolation, no fixtures). The first trustworthy test should be an API contract test
   against a disposable database.
9. **`requirements.txt` is a 35-line pip freeze** with exact pins, including `anthropic==2.3.0` and
   `httpx2`. Neither is imported anywhere in `Backend/` (grep: no matches). Unused exact pins are an
   install-fragility and supply-chain tax.

---

## 8. Security, secrets, and the demo

`Backend/.env` holds live credentials:

- `OPENROUTER_API_KEY=sk-or-v1-...` — a real, billable key.
- `DATABASE_URL` — a Neon `neondb_owner` connection string **with the password inline**, plus the
  pooler hostname. Anyone with the file has write access to the production database.
- `SMTP_PASSWORD` — a Gmail app password for `bharatfixit@gmail.com`.
- `NOMINATIM_CONTACT=contractpaaji@gmail.com` — a personal address sent in a User-Agent to a public API
  on every request. Nominatim's usage policy treats that as the abuse contact.

On the git side the situation is *containable but fragile*: `Backend/.gitignore` lists `.env` and
`*.bak`, so both `.env` and `.env.bak` are ignored, and the whole `Backend/` tree is still untracked
(`git status --short` shows `?? Backend/`). The protection therefore rests entirely on one untracked
`.gitignore` file, and the **root `.gitignore` has no `.env` rule** — a future `.env` at the repo root
is unprotected. Before committing:

1. Rotate all three credentials anyway; they have been sitting in plaintext in a shared working tree.
2. Commit `Backend/.gitignore` in the same commit as the code.
3. Add a `.env.example` with empty values and the required keys.
4. Verify with `git add --dry-run Backend/` that neither `.env` nor `.env.bak` appears.

The API itself is anonymous and unthrottled: anyone who finds the host can `POST /reports` unlimited
times, each triggering LLM calls, public Overpass traffic under your contact, and an SMTP send.
`MAX_BYTES` limits size, not volume. That is fine for a localhost demo and not fine deployed; add a
per-IP rate limit before the URL leaves your machine.

Upload hardening that is already done and should be kept — it is the genuinely careful part of the
backend: server-side `PIL.Image.open().load()` decode, `exif_transpose`, re-encode to JPEG (so a
polyglot or HTML file cannot survive as an image), random UUID filenames, size cap. Note `/uploads` is
mounted as `StaticFiles` with no auth, so any photo is public to anyone who sees the UUID. Probably
acceptable here, but decide it consciously.

---

## 9. What I would do, in order

Sequenced so each step is verifiable on its own and the demo never shows a fake.

1. **Rotate secrets, add `.env.example`, confirm `git add --dry-run Backend/` lists no `.env`.**
2. **Fix `schema.sql`** to include `context JSONB`, and drop migration 002 from the setup path. Verify
   by running `init_db.py` against a scratch database and confirming `severity.provisional` is false
   for a real Prayagraj coordinate.
3. **Add a `/api` prefix and CORS (or a Vite proxy)**, plus an `/uploads` proxy. Verify with a
   `fetch('/api/health')` from the browser console.
4. **Add response models.** One `ReportOut`, one `ReportDetail` (`{report, severity, timeline,
   duplicate}`), one `ReportList` (`{items, next_cursor, total}`). This is the contract; freeze it
   before touching `feedService.js`. It also forces every `null` decision in 2.6 into explicit form.
5. **Write the mapping module first, in the frontend:** `issue_type -> category`, `status -> tag`,
   `status_events -> tracker step`, `confirmations -> supporters`, `created_at -> ageDays`,
   `severity -> urgent`. Everything else hangs off it.
6. **Build the report submission flow.** Photo + geolocation + outside-pilot-area path + a pending
   state with polling that terminates. This is the only feature the backend is actually ready for.
7. **Decide the auth model before wiring support or duplicates.** Both need a stable identity, and
   neither can be faked with a local boolean toggle the way `reportStore` does it.
8. **Then decide which frontend surfaces to delete.** My read: comments, polls, notices, verification
   and "Official updates" have no path to existing by the end of a hackathon; deleting them makes the
   app smaller and the remaining claims true. The tracker, support and duplicate prompt are buildable
   and are worth the time.
9. **Surface the pilot disclaimer wherever a claim appears:** "TEST — not sent to a government
   department", "proposed service level, not an official commitment", "severity is provisional: road
   and nearby places could not be checked". The backend already produces every string you need; the UI
   is the part that throws them away.

If only one thing gets done: steps 1-3, because without them nothing is demonstrable and the
credentials are exposed.
