# Backend capability the UI does not use

Companion to `UI-NEEDS-BACKEND.md`. That file is what the UI wants and the
backend lacks; this one is what the backend already computes and nothing renders.

Written after this merge, so it reflects what is now wired. Everything listed
here is either already stored in `reports.ai_result` / `reports.context` (free to
read) or computed by a module with no caller.

Sizes: **S** = a component and a prop, **M** = a new endpoint or a job change,
**L** = real orchestration work.

---

## 1. The resolution checker — the biggest unused asset — **M**

**What:** `Backend/ai/resolution.py`. `check_resolution(before_bytes, after_bytes)`
asks a vision model whether two photos show the same place and whether the issue
is still there, then `decide(check, distance_m)` makes the call in code: it
rejects anything more than 50 m away, anything at low confidence, and anything
where `same_place` is false, and returns `resolved` / `not_fixed` / `needs_review`
with a one-line reason.

**Why it is unused:** nothing imports it. Its only caller in the repo is the
manual script `Backend/check_resolution.py`. `jobs/process.py` never calls it and
`api/main.py` has no route.

**Why you want it:** the tracker's fourth step is "Fixed", and today no code path
can ever produce `status = 'resolved'`. `StatusTracker` renders a `fixed` state
that is unreachable except by hand-writing SQL. This module closes that loop, and
it does so with a code-decided outcome rather than a model opinion.

**What it takes:** one endpoint (`POST /reports/{id}/resolution`, after-photo +
coordinates), a `BackgroundTask`, and an "I fixed it" control on the report page.
Details are in `UI-NEEDS-BACKEND.md` §11.

---

## 2. The complaint text — **S**, high demo value

**What:** `routing/complaint.py:build_complaint()` produces a complete formal
complaint: reference id, IST timestamp, address, coordinates, an OpenStreetMap
link, the AI's one-sentence description, the severity with its full reason, the
confirmation count, the proposed response time, and the UP Jansunwai helpline.
It is stored on every routed report at `ai_result.routing.complaint_text` and
`ai_result.routing.complaint_subject`.

**Why it is unused:** the UI shows only the status-history note ("Complaint
prepared and emailed to the FixIt Bharat team test inbox"). The letter itself —
the single most substantive artifact the system produces — is never displayed.

**What it takes:** in `SeveritySection` or a sibling block, render
`report.ai_result.routing.complaint_text` inside a `<pre>` (or a bordered
`whitespace-pre-wrap` div) with the subject as a heading, plus the delivery
record. Reading `ai_result` is already done in `src/lib/api.ts`; add
`routing: payload.report.ai_result?.routing` to the normalised `Report` and a
`<ComplaintPreview>` component. No backend change at all.

**Caveat to render with it:** `BODY_CONFIRMED = False`, so the letter itself says
the responsible body is not confirmed. Keep that line visible; it is the honest
part.

---

## 3. Delivery status and the pilot-area branch — **S**

**What:** `ai_result.routing` also holds `delivery` (`ok`, `error`, `target`,
`attempted_at`, `photo_attached`), `inside_pilot_area`, `body`, `body_confirmed`
and `citizen_option` (`{ name, portal, helpline }`).

**Why it is unused:** all of it is buried in JSON the UI never reads.

**Why it matters:** there are three materially different outcomes and the UI
currently shows one of them:

| `inside_pilot_area` | `delivery.ok` | What actually happened | What the UI says |
|---|---|---|---|
| true | true | email sent to the team test inbox | "routed" |
| true | false | SMTP failed; retried on the next escalation tick | "routed" (wrong) |
| false | n/a | outside Prayagraj; **nothing was sent** | "routed" (wrong) |

So a report from Lucknow looks identical to a successfully routed one.

**What it takes:** a small status line under the tracker:
"Sent to the project inbox at 14:02 on 1 Nov" / "Email delivery failed (SMTPAuthenticationError)" /
"Outside the Prayagraj pilot area — nothing was sent. You can file this with
UP Jansunwai (jansunwai.up.nic.in, 1076)." The `citizen_option` object already
contains the name, portal and helpline to link.

**Backend gap, not a UI gap:** `route_report` returns early for out-of-area
reports *before* building a complaint, so there is no `complaint_text` to show
for them. That is correct behaviour; the UI just has to say so.

---

## 4. The vision model's full read — **S**

**What:** `ai_result.vision` holds `is_civic_issue`, `issue_type`,
`visible_damage[]`, `hazard_indicators[]`, `estimated_size`, `confidence`,
`summary`, plus `model_used` and `analysed_at` alongside it.

**Why it is unused:** `api.ts` reads only `vision.summary` (as a fallback title).
The lists that actually drive the damage factor — "hazard_indicators: water
pooling, near road edge" — are never shown.

**Why you want it:** it is the evidence behind 40 of the 100 severity points.
`ai/severity.py:_damage` scores `estimated_size` plus 2 points per hazard
indicator; without showing those lists, the score looks arbitrary.

**What it takes:** a "What the photo showed" block next to the severity factors:
size, confidence as a percentage, and the two lists as chips or bullets. Also
show `model_used` — free provenance, and `ai/schemas.py` keeps it for exactly
this reason.

---

## 5. Location context: road class, schools, hospitals, weather, air quality — **M**

**What:** `reports.context` (written by `enrichment/service.py`) contains:

- `geocode`: `address`, `road`, `locality`, `city`, `district`, `state`, `postcode`
- `places`: `schools[]`, `hospitals[]` each `{ name, type, distance_m }`, `bus_stops`
  (a count), `radius_m`, and a deliberate note that an empty list means "not
  mapped in OpenStreetMap", not "not present"
- `road`: `highway` class, `name`, `ref`, `distance_m`
- `weather`: `temperature_c`, `precipitation_mm_now`, `rain_last_24h_mm`, `weather_code`
- `air_quality`: `pm2_5`, `pm10`, `us_aqi`, `band`
- `missing[]`: which of the five lookups failed

**Why it is mostly unused:** only the derived factor notes ("nearest
hospital-tagged feature 'X' at 84 m") reach the screen. The structured data does
not. Neither does `missing`, beyond the word "provisional".

**Why you want it:** it is the answer to "why is this one critical?". A pothole
40 m from a school, on a `secondary` road, after 62 mm of rain, scores high for
reasons a citizen can check. That is the product's whole claim.

**What it takes:** `GET /reports/{id}` already returns `report.context` inside
the raw row (it is `select *`), so the frontend can read it today. Add a
`context` block to the report page: road name and class, the two schools and two
hospitals with distances, rain in the last 24 h, AQI band, and — if `missing` is
non-empty — a line naming exactly what could not be checked. All of it is
already in the payload; this is purely a rendering job in `api.ts` +
`ReportPage`.

**Honesty note that must survive the port:** the `places` note ("empty lists
mean none are mapped in OSM") and the air-quality source string ("modelled, not
a CPCB station reading") exist precisely so this block cannot overclaim. Keep
both.

---

## 6. Escalation — a whole agent with no surface — **L**

**What:** `agents/escalation.py` + `jobs/scheduler.py`. Every 5 minutes
(`ESCALATION_INTERVAL_MINUTES`) the scheduler calls `escalation.run(dry_run=not ESCALATION_LIVE)`.
For every open report past `deadline_at` it computes the hours late, picks a level
(`1` reminder under 24 h, `2` senior officer at 24 h, `3` public flag at 72 h),
refuses to escalate anything provisional or never routed, and records each action
in `ai_result.escalation.actions` (`level`, `name`, `at`, `ok`, `error`, `late_hours`).

**Why it is unused:** nothing in the UI reads `escalation`. There is no badge for
"overdue", no escalation history, no dry-run preview. It is running right now
against the live database in dry-run mode.

**Why you want at least part of it:** `deadline_at` is shown as a proposed
response time, and the obvious next question is "and then what?". The backend
already has the answer.

**What it takes, cheapest first:**

1. **S:** an "overdue by N days" badge on the report page, computed client-side
   from `deadline_at` versus now. No backend.
2. **M:** an "Escalations" section on the report page reading
   `ai_result.escalation.actions` as a timeline.
3. **L:** a public flag somewhere (the level-3 message claims "publicly flagged as
   delayed on the FixIt Bharat dashboard" — there is no such dashboard today, so
   that sentence is currently untrue).

**Watch:** the message text is built by `build_message` from stored facts and is
worth reading before you put its wording in front of a citizen — it was written
for an email, not a page.

---

## 7. The status machine is half-reachable — **M**

**What:** `reports.status` is read as `analysed | routed | acknowledged |
in_progress | escalated | resolved`. But nothing in `Backend/` ever *writes*
`acknowledged` or `in_progress` — they appear only in `agents/escalation.py:OPEN`
and in `ai/pipeline.py:_save_outcome`'s guard list.

**Consequence in the UI:** `trackerStep()` in `src/lib/api.ts` maps
`acknowledged`/`in_progress`/`escalated` to the "Scheduled" step, so that step is
only reachable via `escalated`, and "Fixed" only via a manual `resolved`. Two of
the four tracker dots are effectively decorative.

**What it takes:** decide whether the pilot has a scheduled/in-progress phase at
all. If not, either collapse the tracker to three steps (a UI decision, and it
changes a designed element) or drive them from an admin action that already
exists in spirit — `route_report(force=True)` skips its guards and could be
exposed as "mark as acknowledged".

---

## 8. Provenance fields nobody reads — **S**

| Field | Location | What it would tell a reader |
|---|---|---|
| `severity.reason_source` | `ai_result.severity.reason_source` | `'llm'` vs `'template'` — explains why two similar reports read differently, and whether a model wrote the sentence |
| `ai_result.model_used` | per report | which vision model actually answered (the chain has three) |
| `ai_result.analysed_at` | per report | when the analysis ran |
| `context.fetched_at` | per report | how stale the location data is |
| `severity.deadline_note` | already shown | "Proposed service level, not an official commitment" |
| `severity.uncapped_level` | already shown | what the evidence would have reached without the provisional cap |

Only the last two are on screen. `reason_source` in particular is a one-line
addition that makes the severity block honest about who wrote the sentence.

---

## 9. Columns that exist and are never used — **S**

| Column | Created in | Written by | Read by |
|---|---|---|---|
| `reports.audio_text` | `db/schema.sql` | nothing | nothing |
| `reports.department` | `db/schema.sql` | nothing — `routing/service.py` puts the body label in `ai_result.routing.body` instead | nothing |

Two dead columns. `department` is the more interesting one: it is the obvious
column for a routing result, and the routing code stores that value in JSON
instead. Either populate it (one line in `routing/service.py:_save`) or drop it;
leaving a column that looks authoritative and is always null is the kind of thing
that gets trusted by the next person.

`audio_text` implies a voice-note feature that does not exist in either codebase.

---

## 10. Endpoints with no consumer

| Endpoint | State |
|---|---|
| `GET /` | returns app name and status; nothing calls it |
| `GET /health` | returns the database connection plus a report count; nothing calls it — a header badge would turn it into a real readiness signal |
| `GET /reports` | the legacy flat list (`limit` only). Superseded by `GET /feed`; only `check_*.py` scripts use it |
| `POST /reports/{id}/analyse` | now wired, but only as an "Analyse again" button shown for `needs_review` / `needs_better_photo`. There is no admin re-run, and calling it on a healthy report re-runs the whole pipeline |
| `POST /reports/{id}/duplicate-response` | wired (the prompt on the report page) |

---

## 11. Behaviours computed but never stated

These are not data leaks, they are *consequences* the backend knows and the UI
never says:

1. **Provisional ⇒ not routed.** `routing/service.py` refuses to route a
   provisional severity. The report page shows "Provisional" and a capped level,
   but never says "and for that reason no complaint was sent". Add one sentence.
2. **Waiting on the duplicate answer ⇒ not routed.** Same cause, different
   reason: `route_report` returns "waiting for the citizen to answer the duplicate
   question". The prompt now exists on the page, so this mostly resolves itself —
   but a week-old report with an unanswered prompt is stuck, and nothing says so.
3. **Photo missing on disk ⇒ needs_review.** `analyse_report` returns
   `needs_review` with "Photo file missing on server" when the file is gone. On an
   ephemeral filesystem that is every report after a deploy. The UI shows
   "Analysis could not be completed" and offers a re-run that will fail the same
   way.
4. **Confirmation count feeds the score, but only at scoring time.** A support
   added after scoring never re-scores (see `UI-NEEDS-BACKEND.md` §3). Worth one
   line in the severity block: "Scored at the time this report was filed."

---

## Summary: what to do next

In order of value per unit of work:

1. **§2 complaint text** — no backend change, largest visible payoff, and it is
   the thing that makes "routed" mean something.
2. **§3 delivery + pilot-area status** — stops three different outcomes reading
   identically, which is currently the app's worst lie.
3. **§4 vision detail + §5 context** — both are already in the response; this is
   pure rendering, and it is what makes the severity score checkable.
4. **§1 resolution** — closes the tracker, needs a new endpoint.
5. **§11 one-line consequences** — cheapest honesty wins in the whole list.
6. **§6 escalation** — real work, and only worth it once §3 is truthful.
7. **§9 dead columns** — populate or drop, but do not leave them.
