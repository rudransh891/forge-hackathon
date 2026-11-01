# Gap report: implementation vs. the Civic Grievance & Infrastructure Triage workflow

Compared against `Civic Grievance & Infrastructure Triage Step-by-Step Workflow.pdf`
(10 pages: phases 0–9, the honesty rules, evaluation metrics, demo script).

> **Status: partly superseded.** This report describes the tree at commit `1d0898e`.
> A follow-up pass implemented most of §7's "do first" list. Now done: rename to
> FixItBharat; the four false sentences in §2; account fields removed from the report
> detail response (§5.1); `department` populated on routing; multi-photo intake with
> `report_photos`; the citizen's category stored and shown; complaint text, delivery
> record and escalation history rendered; resolution via an after photo (PDF §7.4);
> `/stats` extended with overdue, average resolution hours and issues by type; a
> per-address rate limit on `POST /reports` (PDF §2.5); public map with
> severity-coloured markers (PDF §8.1).
>
> Still missing: voice input (PDF §2.3), Hindi (§8.5), spam flagging beyond the rate
> limit, department accountability (§8.3), per-step submit progress (§1.6), evaluation
> metrics (§8) and deployment (§9.2).

Audited at commit `1d0898e` plus the uncommitted working tree (Leaflet maps, geocode
endpoints, Firebase auth).

**How this was produced.** The PDF text was extracted and read in full. The backend
surface was read from the live OpenAPI schema rather than by eye:

```
GET /            GET /feed              GET /geocode/reverse   GET /geocode/search
GET /health      GET,POST /reports      GET /stats
GET /reports/{id}   POST /reports/{id}/analyse   POST /reports/{id}/confirm
POST /reports/{id}/duplicate-response
```

Every UI claim below was checked against that list and against the component that
renders it. Anything marked *verified* was exercised against the live database or the
live geocoder during this audit; the rest is read from code.

Status legend: **DONE** · **PARTIAL** · **MISSING** · **DEVIATION** (built, but not
the way the spec describes).

**Numbering.** `PDF §n.m` is a numbered step in the workflow document. A bare `§N` is
a section of this report, and `§4 row N` is a row of the table in §4.

---

## 1. Executive summary

The backend is close to the spec. The frontend is ahead of the backend in places and
behind it in others, and there are **four places where the UI states something that is
not true** — which is the one thing PDF §6 says disqualifies the entry.

| Area | State |
|---|---|
| Phases 0–1 (setup, intake) | **Mostly done.** No audio, no object storage, no per-step progress. |
| Phase 2 (understanding) | **Half done.** Vision is solid; audio, multilingual and spam are absent. |
| Phase 3 (enrichment) | **Done.** All four lookups real, all cited in the score. |
| Phase 4 (dedup) | **Done, one weak link:** confirmations only count before the first score. |
| Phase 5 (severity) | **Done.** Formula matches the spec's weights exactly. No evaluation run. |
| Phase 6 (routing) | **Done honestly**, but to a test inbox, and the department table is unconfirmed. |
| Phase 7 (tracking, escalation) | **Half done.** Scheduler and agent exist; resolution and reopen do not. |
| Phase 8 (dashboard) | **Weakest phase.** No public map, no department accountability, no Hindi. |
| Phase 9 (robustness) | **Good except spam**, deployment and evaluation metrics. |

Roughly **backend ≈ 80% of the spec, frontend ≈ 55%**, and the shortfall is
concentrated in Phase 8 — the thing judges look at — and in three headline features
the PDF treats as differentiators: voice input, the public dashboard, and before/after
resolution.

---

## 2. The honesty rules (PDF §6) — four live violations

PDF §6 is explicit: "The hackathon disqualifies fake, static or hardcoded data." These
are sentences the app shows today that the system cannot back up.

| # | What the UI says | Where | Why it is false |
|---|---|---|---|
| 1 | "The photo is being analysed now… **the ward office sees it at the same time.**" | `report-form/formConfig.js:63` | There is no ward office. Nothing is sent to any office — complaints go to the team's own test inbox, and only after analysis, enrichment, scoring and routing all succeed, which can take minutes. |
| 2 | "Flags it for faster review. **The ward office decides** whether it is marked urgent." | `formConfig.js:57` | No human reviews anything. The checkbox only appends the words "Safety hazard." to the description text. |
| 3 | "You **can edit for 10 minutes**." | `ReportFormPage.jsx:357` | No edit endpoint and no edit UI. `editWindowMinutes` is used only in that sentence. |
| 4 | "Posts show as 'Resident, {locality}'" and "Your name is never shown" | `ReportFormPage.jsx:357`, `formConfig.js:17` | The name is not shown, but a signed-in reporter's email is stored on the row and returned by the detail endpoint — see §5.1. |

Verified on live data (3 reports): 0 rows carry an `account_email`, so #4 is latent
rather than live. #1–#3 are wrong today.

Also hardcoded, though not "reports": the poll and the notices ticker (`feedData.js`),
and the verification badge, which is always the string "Unverified". None of these are
dashboard numbers, so they do not breach PDF §11 literally — but the poll is presented
as a live poll.

---

## 3. Phase-by-phase

### Phase 0 — Setup and decisions

| Step | Status | Evidence |
|---|---|---|
| 0.1 pilot area | **DONE** | Prayagraj polygon in `routing/pilot_boundary.json`; `in_pilot_area()` tested against in/out coordinates. |
| 0.2 five issue types | **DONE** | `ai/schemas.py` has all five plus `other`/`none`. |
| 0.3 venv + packages | **DONE** | `Backend/.venv`, frozen `requirements.txt`. |
| 0.4 API key with a spend limit | **DEVIATION** | Spec says Claude/Anthropic; the code calls **OpenRouter** with free-tier vision models. `anthropic` is installed but never imported. Decide which claim you make. |
| 0.5 Postgres + PostGIS | **DONE** | Neon, GIST index on the point, `ST_DWithin` used by dedup. |
| 0.6 shared report contract | **DONE** | `db/schema.sql` matches the listed fields, plus `context`, `account_uid`, `account_email`. |
| 0.7 `/health` + one model call | **DONE** | `/health` returns the report count; the vision path has run on real rows. |

### Phase 1 — Report intake

| Step | Status | Notes |
|---|---|---|
| 1.1 submit endpoint | **DONE** | `POST /reports`: multipart photo + lat/lng + description. |
| 1.2 validation | **DONE** | 10 MB cap (413), decode check (400), coordinate range (422), EXIF transpose, re-encode to 1280 px JPEG. |
| 1.3 object storage | **DEVIATION** | Local `Backend/uploads/` on disk. An ephemeral-filesystem deploy loses every photo, and the pipeline then answers `needs_review` "Photo file missing on server". |
| 1.4 mobile-first form | **DONE** | `report-form/`: photo, category, title, map, details. Three taps to photo + location. |
| 1.5 location fallbacks | **DONE** | Device fix → reverse geocode → map tap/drag → typed street with real Nominatim search (added this session). |
| 1.6 processing status | **PARTIAL** | Saves as `received` immediately, analysis is a `BackgroundTask`. But there is **no live "analysing → locating → checking duplicates" progress**: the form shows a static success screen and only the report page polls, stopping after 60 s. |

### Phase 2 — AI understanding

| Step | Status | Notes |
|---|---|---|
| 2.1 vision prompt + strict JSON | **DONE** | `ai/vision.py` prompt, `VisionResult` schema, fenced/loose JSON tolerated. |
| 2.2 Pydantic + retry + confidence gate | **DONE** | Two attempts per model, three models, `MIN_CONFIDENCE = 0.5`, `needs_better_photo` with a reason. |
| 2.3 audio transcription | **MISSING** | No audio input, no transcription code, `reports.audio_text` is a dead column (0 of 3 rows). The PDF calls voice-first reporting a differentiator. |
| 2.4 combine inputs | **PARTIAL** | Photo + typed description only. No transcript, and no category — the category selector is dropped before the request (§4 row 3). |
| 2.5 abuse / spam | **MISSING** | No rate limit, no per-device throttle, no repeated-submission check. `is_civic_issue` filters non-civic photos, which is not the same thing. The API is anonymous and unthrottled: unlimited `POST /reports` means unlimited model calls and emails. |
| 2.6 retries + fallback | **PARTIAL** | Failures land on `needs_review` and the row survives. There is **no background retry**; the only requeue is the manual "Analyse again", and calling `POST /analyse` twice runs two pipelines concurrently. |

### Phase 3 — Location enrichment

All **DONE**. Reverse geocode (Nominatim, 1.1 s serialised, cached), Overpass for
schools/hospitals/bus stops within 200 m, road class from way geometry, Open-Meteo
weather and air quality, all stored in `reports.context` with a `missing[]` list, and
every failure degrades instead of raising.

Two notes rather than gaps:

- Air quality is **modelled** (Open-Meteo), not a CPCB station reading. The code says
  so in `context.air_quality.source`. PDF §3.4 asks you to confirm the source works
  for your city; this one does, but do not call it CPCB data.
- The enrichment is computed and stored, but the report page shows only the factor
  *notes*. The structured data — nearest school at 84 m, `secondary` road, 1.2 mm of
  rain — is in the API response and unrendered (§4 row 16).

### Phase 4 — Duplicate detection

| Step | Status | Notes |
|---|---|---|
| 4.1 geo search | **DONE** | `ST_DWithin` over the GIST index, radius from `DUPLICATE_RADIUS_M`. |
| 4.2 similarity | **DONE** | `ai/similarity.py`: distance 0.4 + text Jaccard 0.4 + size 0.2, with an explainable breakdown shown to the citizen. |
| 4.3 ask the citizen | **DONE** | The report page renders candidate, photo, distance and shared words, with two buttons wired to `POST /duplicate-response`. |
| 4.4 confirmations raise priority | **PARTIAL** | `confirmations` is a 15-point factor, but scoring runs **once**, inside the pipeline. A support added an hour later never re-scores. |

Worth a line in the demo: a report whose duplicate question is never answered is
**never routed** — `route_report` refuses while `duplicate_suggestion.response` is null.

### Phase 5 — Severity scoring

**DONE**, and the arithmetic matches the PDF line for line: damage ≤ 40, road ≤ 20,
places ≤ 15, conditions ≤ 10, confirmations ≤ 15 (`ai/severity_config.py`). Levels and
deadlines are the proposed ones (critical 24 h, high 72 h, medium 168 h, low 336 h).
Code computes; the LLM writes one sentence; `ai/severity_reason.py` **rejects** a
sentence containing a number absent from the evidence, the wrong level word, or another
level's word. That is stronger than the spec asks.

Two additions the PDF does not mention and you should keep: a `provisional` cap at
`medium` when any factor is missing, and `missing[]` naming what could not be checked.

**MISSING:** PDF §5.4, "validate on 10 real reports and adjust weights". No evaluation
harness exists (`/eval` from the team-roles table is empty). The weights are untested
guesses.

### Phase 6 — Routing and complaint drafting

| Step | Status | Notes |
|---|---|---|
| 6.1 routing table with sources | **PARTIAL** | Table exists per issue type, but `BODY_CONFIRMED = False` and every label says "(responsible body to be confirmed)". PDF §6.1 asks for researched official names and channels with sources. Only the UP Jansunwai / 1076 channel has citations. |
| 6.2 complaint generated | **DEVIATION** | `routing/complaint.py` builds it in **code from stored facts**, not with the LLM. Better than the spec, since nothing can be invented — just do not claim "the LLM drafts the complaint". |
| 6.3 deliver honestly | **DONE** | SMTP to `ROUTING_TEST_RECIPIENT`, prefixed `[TEST ROUTING] … NOT sent to any government department`, delivery record stored. |
| 6.4 unknown jurisdiction | **PARTIAL** | Backend records `inside_pilot_area: false` and never sends. **The UI never shows it**, so an out-of-area report looks identical to a routed one, and the citizen is not pointed at the national portal. |

### Phase 7 — Tracking and escalation

| Step | Status | Notes |
|---|---|---|
| 7.1 status model | **PARTIAL** | `received, analysed, routed, escalated, resolved` are written. **`acknowledged` and `in_progress` are never written by any code path** — they appear only in read-side guards, so the "Scheduled" tracker step is unreachable except by hand-written SQL. |
| 7.2 scheduler | **DONE** | APScheduler every 5 min. It starts inside the app lifespan, so `--workers 2` gives two schedulers. |
| 7.3 escalation agent | **DONE** | Levels 1/2/3 at 24/72 h, gathers history, drafts from facts, logs each action, dry-run unless `ESCALATION_LIVE=true`. |
| 7.4 resolution confirmation | **MISSING** | `ai/resolution.py` is a complete before/after comparator with a 50 m gate and a code-decided outcome. **Nothing imports it.** No endpoint, no after-photo UI, and no path for `status` to become `resolved` (0 of 3 rows resolved). |
| 7.5 reopen rules | **MISSING** | No reopen path at all. |

### Phase 8 — Public dashboard and citizen pages

The weakest phase, and the one the demo script spends most of its five minutes on.

| Step | Status | Notes |
|---|---|---|
| 8.1 map with severity markers + heatmap | **MISSING** | There is now a Leaflet map **per report**, and a picker in the form, but no public map of all reports, no severity colouring, no heatmap, no click-through. |
| 8.2 statistics | **PARTIAL** | `/stats` returns total, open, resolved, routed, in_progress. Missing **average time to resolution, overdue count, issues by type** — three of the four numbers PDF §8.2 names. |
| 8.3 department accountability | **MISSING** | No endpoint, no table, no UI. Nothing ranks departments or wards. |
| 8.4 tracking page | **PARTIAL** | Timeline, severity explanation with all five factors, deadline. Missing a **countdown** (it shows a date). Share copies the current URL, so the "shareable link" part works. |
| 8.5 accessibility + Hindi | **PARTIAL** | Large targets, AA contrast, reduced motion, `aria-live` regions, compression before upload: all present. **No Hindi interface and no i18n layer at all.** |
| 8.6 empty/error states | **DONE** | Feed error with retry, empty category state, `ReportNotFound`, skeleton, load-more failure handling. |

### Phase 9 — Robustness

| Situation (PDF table) | Status |
|---|---|
| Blurry or dark photo → ask for a clearer one | **DONE** — `needs_better_photo`, confidence in the note. |
| Photo is not a civic issue → polite rejection | **DONE** — `is_civic_issue false`. |
| No GPS → fall back to map tap | **DONE** — added this session. |
| Outside pilot area → say so + correct portal | **PARTIAL** — backend knows, UI is silent. |
| Unsupported voice language → offer text | **MISSING** — no voice path exists. |
| LLM timeout → pending, retry in background | **PARTIAL** — `needs_review` saved, nothing retries automatically. |
| OSM failure → continue, mark missing | **DONE** — `missing[]` plus the provisional cap. |
| Duplicate → offer to confirm | **DONE**. |
| Spam or abuse → rate limit and flag | **MISSING**. |
| Slow network → compress, show progress | **PARTIAL** — compression yes (`imageUtils.js`), **upload progress no**. |
| 9.2 deploy and test on mobile data | **MISSING** — localhost only. |
| 9.3 dry run with someone outside the team | **NOT DONE**. |

Also **MISSING**: PDF §8 evaluation metrics — classification accuracy on 40 photos,
severity agreement on 20, dedup precision/recall, routing correctness, latency. None of
these numbers exist, and PDF §11's "put the numbers on one slide" needs them.

---

## 4. UI elements with no backend behind them

Ordered by how visible the gap is to a judge.

| # | Element | Where | What actually happens |
|---|---|---|---|
| 1 | **Comments** — list, post, flag, helpful, "Top" tag | `CommentsSection`, `CommentItem`, `CommentComposer` | No table, no route. A signed-in citizen can type and press Post; the composer then says "Comments are not connected to the backend yet. Nothing was saved." The list is always empty. |
| 2 | **Up to 4 photos** | `PhotoPicker` (`maxPhotos = 4`), `formConfig.js:6` | `POST /reports` takes exactly one file and `submitReport` sends `photos[0].blob`. Photos 2–4 are **silently discarded** after the citizen chose them. |
| 3 | **Category selector** | `CategoryChips` | The chosen category reaches `submitReport` and is then **dropped** — `reportFormService.js` never destructures `category`. `issue_type` comes from the vision model, so the citizen's own classification has zero effect. |
| 4 | **"Edit for 10 minutes"** | `ReportFormPage.jsx:357` | No edit endpoint, no edit screen. |
| 5 | **"The ward office sees it" / decides urgency** | `formConfig.js:57,63` | Nothing is sent to any office (§2). |
| 6 | **Polls** — feed card + landing poll | `PollCard`, `featured-poll.tsx`, `feedData.js` | Local React state over zero seeded votes, "kept in this browser only", no closing date. Honest, but not data. |
| 7 | **Notices ticker** | `NoticesTicker`, `feedData.js` | Three hardcoded strings pointing at anchors. |
| 8 | **Verification badge** | `VerificationMark`, `StatusTag` | `api.ts` hard-codes `verification: 'unverified'`, so every card says "Unverified". No verify endpoint, no column. |
| 9 | **"Send me ward updates"** | `SignupForm` | Collected, passed to `signup()`, never stored anywhere. |
| 10 | **Locality box in the hero** | `hero.tsx` | Navigates to the feed and says area filtering does not exist. It does not filter. |
| 11 | **Nearby reports on the report page** | `NearbyReports`, `api.ts:fetchNearby` | Works, but it is a client-side filter of the newest 60 feed rows by locality string — not a geo query, and it misses anything older than 60 reports. |
| 12 | **"Already reported nearby?" in the form** | `useNearbyReports`, `findNearbyReports` | Fetches the feed by category and matches one shared word of 4+ letters. Never calls the duplicate engine, so a real duplicate with a different title is missed. |
| 13 | **Resolution / "Fixed" tracker step** | `StatusTracker` | Unreachable. Nothing writes `resolved` (0 of 3 rows). |
| 14 | **Escalation history** | — | Stored at `ai_result.escalation.actions` (0 of 3 rows have any); nothing renders it. |
| 15 | **Complaint text + delivery record** | — | Stored at `ai_result.routing.complaint_text` / `.delivery` (1 of 3 rows already has a complaint); nothing renders it. The most substantive artefact the system produces is invisible. |
| 16 | **Weather, AQI, schools, hospitals, road class** | — | Computed and stored in `reports.context`; the UI shows only the derived factor notes. |
| 17 | **Draft save/restore** | `reportDraftStore` | localStorage only, by design; it loses the coordinates, keeping only the label. |
| 18 | **Google Analytics** | — | Neither the SDK nor `measurementId` is wired. Fine, but it is in your Firebase config. |

### 4.1 The reverse problem — backend work the UI never shows

| Backend capability | State |
|---|---|
| `GET /stats` (`routed`, `in_progress`, `resolved`) | Only partly surfaced: the pulse strip shows four numbers, the rail two. |
| `POST /reports/{id}/analyse` | Wired only as "Analyse again" on failed reports. |
| `GET /reports` (legacy flat list) | Superseded by `/feed`; used only by `check_*.py` scripts. |
| `GET /` | Unused. |
| `ai/resolution.py` | Entirely unused (Phase 7.4). |
| `agents/escalation.py` | Runs on a timer; no UI reads it. |
| `routing/area.py` result | Stored; never shown (Phase 6.4). |

---

## 5. Data model gaps

| Spec field | Reality |
|---|---|
| `department` | **Column exists, always null.** `routing/service.py` puts the routing label inside `ai_result.routing.body` instead. Verified on live data: 0 of 3 rows set. |
| `audio_text` | Column exists, never written, never read (0 of 3). No audio path. |
| `ward` / zone | No column. PDF §6.1 asks for "issue type **and ward or zone** → department"; the routing table keys on issue type alone. |
| `resolved_at` | No column, so "average time to resolution" cannot be computed even once a resolve endpoint exists. |
| `verified_at` / `verified_by` | No columns (§4, row 8). |

### 5.1 A privacy leak, not a missing feature

`GET /reports/{id}` is `select *`, so it returns `account_uid` and **`account_email`**
whenever a report was filed while signed in. Nothing in the UI displays it, but anyone
with a report id can read the reporter's email from the API. That contradicts "Your name
is never shown" in spirit, and it is visible to anyone who opens devtools during the
demo. Fix: drop those two columns from the detail projection, or expose a boolean
`from_account: true` instead.

Live data today: 0 of 3 rows carry an account, so this is a fix, not an incident.

---

## 6. What is genuinely strong (do not regress these)

1. **Severity is explainable and honest.** Five weighted factors, an evidence sentence
   the model cannot embellish, a `provisional` cap, and `missing[]`.
2. **Every external call degrades instead of raising.** The pipeline never crashes; a
   failed lookup becomes `missing`, not a broken report.
3. **The duplicate reasoning is shown to the citizen** — distance, score, label, shared
   words — and the outcome is code-decided.
4. **The routing email is honest about itself**, which is better than most hackathon
   projects: the message states it is not a government submission, and the record says
   so too.
5. **Location privacy is real**: block-level labels, rounded coordinates, and the exact
   address never leaving the server.
6. **Accessibility is not an afterthought** — focus traps, live regions, reduced motion,
   44 px targets, text alternatives for every status.

---

## 7. Build order if you have limited time

This follows PDF §12, adjusted for what is already built.

**Do first (demo-critical, small):**

1. **Fix the four false sentences (§2).** Free, and it protects the whole entry.
2. **Show the complaint text and the delivery record** (§4, row 15). No backend change —
   it is already in `ai_result.routing`, and one row already has one. This makes
   "routed" mean something on stage and is the highest-value rendering job left.
3. **Tell the citizen when routing was skipped** — outside the pilot area, provisional,
   or duplicate unanswered (PDF §6.4). One status line.
4. **Send the category** or delete the selector (§4, row 3).
5. **Either accept multiple photos or cap the picker at one** (§4, row 2). Silently
   dropping three is the worst of the three options.

**Do second (the differentiators the PDF asks for):**

6. **Public map with severity-coloured markers** (PDF §8.1). `/feed` already returns
   `lat`, `lng`, `severity_level`, and the Leaflet component exists. Biggest visible gap
   for the least new backend.
7. **Resolution via the existing comparator** (PDF §7.4). One endpoint, one
   `BackgroundTask`, one "I fixed it" button — and the tracker finally works.
8. **Two more `/stats` numbers**: overdue count and issues by type. Average resolution
   time needs `resolved_at` first.
9. **Rate limit `POST /reports`** (PDF §2.5). Judges submit live; one bored judge should
   not be able to run up your model bill.
10. **Per-step progress on submit** (PDF §1.6): analysing → locating → checking
    duplicates, driven by the status events that already exist.

**Do third (if there is a day left):**

11. **Voice input** with browser speech recognition, filling `audio_text` (PDF §2.3).
    The column and the "combine inputs" step are already waiting.
12. **Department table with sources**, and populate the `department` column (PDF §6.1,
    plus §5 here).
13. **`acknowledged` / `in_progress` transitions** so the tracker has four working steps
    (PDF §7.1).
14. **Hindi interface** (PDF §8.5) — needs an i18n layer; strings are already mostly
    centralised in `feedConfig`, `formConfig` and `authModalConfig`.
15. **Evaluation numbers** (PDF §8) — even 20 photos and 10 hand-ranked reports beats no
    slide.

---

## 8. Appendix — evidence

```bash
# Backend surface (authoritative, from the OpenAPI schema)
cd Backend && .venv/Scripts/python.exe -c \
  "import api.main as m; [print(p) for p in sorted(m.app.openapi()['paths'])]"

# Runtime checks
curl http://localhost:5174/api/health
curl "http://localhost:5174/api/geocode/reverse?lat=25.4358&lng=81.8463"

# Things the spec asks for that do not exist today
curl -i http://localhost:5174/api/reports/<id>/resolution   # no such route
curl -i http://localhost:5174/api/comments                  # no such route
curl -i "http://localhost:5174/api/feed?bbox=..."           # parameter ignored

# What is populated right now (3 reports)
#   department 0/3   audio_text 0/3   account_email 0/3
#   complaint_text 1/3   escalation 0/3   resolved 0/3
```

Files that decide most of the above: `Backend/api/main.py`,
`Backend/jobs/process.py`, `Backend/ai/severity.py`, `Backend/routing/service.py`,
`src/lib/api.ts`, `src/components/report-form/reportFormService.js`,
`src/components/feed/feedService.js`, `src/components/report/ReportPage.jsx`.
