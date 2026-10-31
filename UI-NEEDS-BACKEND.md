# Plan: backend support for what the UI already has

Everything below is a UI surface that exists today and has no backend behind it
after this merge. Each entry says where it lives, what is missing, the smallest
schema and API that would make it real, what it depends on, and a size.

Read with `BACKEND-NOT-INVOKED.md`: that file lists the reverse — backend
capability the UI still does not use.

Sizes are relative: **S** = under a day, **M** = a few days, **L** = a week plus
design work.

---

## 1. Accounts, sign-up, verification, password reset — **L**

**UI:** `src/components/auth/*` — `AuthModal`, `LoginForm`, `SignupForm`,
`VerifyForm`, `ForgotForm`, `AuthTabs`, `authService.js`, `feedConfig.labels.logInToComment`.
The header button, the closing CTA, the comment composer and the feed's empty
state all open this modal.

**State:** `authService.js` resolves `{ status: 'not_configured' }` after 600 ms.
`VerifyForm` and `LoginForm` hard-code a "not connected" banner, which becomes a
lie the moment auth exists, so those banners must become conditional in the same
change.

**Why it is the keystone:** support, duplicates, comments and "I fixed it" all
need a stable identity. Today support is a browser flag plus a server counter
(see `reportStore.js`), and one citizen can vote twice from two browsers.

**Minimum schema**

```sql
create table accounts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       citext unique,
  phone       text unique,
  name        text not null,
  password_hash text,                 -- null when sign-in is by code only
  verified_at timestamptz,
  ward_updates boolean not null default false
);

create table sessions (
  token       text primary key,        -- random, hashed at rest
  account_id  uuid not null references accounts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create table verification_codes (
  id          bigserial primary key,
  account_id  uuid not null references accounts(id) on delete cascade,
  code_hash   text not null,
  purpose     text not null,           -- 'signup' | 'reset'
  expires_at  timestamptz not null,
  consumed_at timestamptz
);
```

**Endpoints** (all under the existing `main.py`, same style, `BaseModel` in and out)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | creates account + code, sends mail. 409 on duplicate identifier |
| POST | `/auth/verify` | consumes the code, sets `verified_at`, returns a session cookie |
| POST | `/auth/verify/resend` | rate limited per account (the UI already has a 30 s cooldown) |
| POST | `/auth/login` | `HttpOnly` cookie, `SameSite=Lax` |
| POST | `/auth/logout` | clears it |
| POST | `/auth/password-reset` | always 202, never reveals whether the account exists |
| GET  | `/auth/me` | `{ id, name, verified }` or 401 |

**Dependencies:** `SMTP_*` already configured for routing (`routing/deliver.py`),
so verification mail can reuse `send_email` with a different body. The UI already
distinguishes email-or-phone (`authValidation.js`), so phone codes need an SMS
provider or must be deferred with an honest error.

**Also required in the UI:** an `AuthProvider` session store (nothing today
persists a logged-in state), a logout affordance, and conditional "not connected"
banners. `VerifyForm`'s banner is the one that will silently lie.

**Size justification:** the forms are done; storage, mail, and session handling
are not. Expect most of the effort in session/cookie handling and the
identifier-is-email-or-phone branching.

---

## 2. Comments: list, post, flag, helpful — **M**

**UI:** `CommentsSection.jsx`, `CommentItem.jsx`, `CommentComposer.jsx`,
`reportStore.toggleHelpful`, `feedService.fetchComments/postComment/flagComment/voteHelpful`,
`report.commentCount` / `report.comments` on cards.

**State:** `fetchComments` returns `{ items: [], total: 0 }`; posting returns
`{ status: 'not_configured' }`; the composer is `readOnly` and opens the login
modal on click. `CommentsSection` shows "No comments yet." and hides its
"Show N more" button because total is 0.

**Minimum schema**

```sql
create table comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references reports(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  body        text not null check (char_length(body) between 1 and 2000),
  hidden_at   timestamptz
);

create table comment_votes (          -- "helpful"
  comment_id  uuid not null references comments(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete cascade,
  primary key (comment_id, account_id)
);

create table comment_flags (
  id          bigserial primary key,
  comment_id  uuid not null references comments(id) on delete cascade,
  account_id  uuid references accounts(id),
  reason      text not null,
  created_at  timestamptz not null default now()
);
```

**Endpoints**

| Method | Path | Notes |
|---|---|---|
| GET  | `/reports/{id}/comments?sort=top\|newest&offset=&limit=` | returns `{ items, total }`; `top` = pinned, then helpful desc, then newest |
| POST | `/reports/{id}/comments` | 401 without a session; 422 on empty/oversize |
| POST | `/comments/{id}/helpful` | toggles the caller's row, returns the new count |
| POST | `/comments/{id}/flags` | 202, never echoes the flag to the commenter |

**Dependencies:** accounts (§1). Moderation is a policy question, not a code one:
the UI's flag reason strings live in `CommentItem.jsx` and need to match the
`reason` enum you store.

**Card counts:** `GET /feed` needs a `comments` count per row. Cheapest is a
`left join (select report_id, count(*) from comments where hidden_at is null group by 1)`
in `api/main.py:feed`, aliased to `comments`, which `src/lib/api.ts` already
reads as `report.comments` and `report.commentCount`.

---

## 3. Support as a real per-citizen action — **S** (with §1), **M** (without)

**UI:** `SupportButton`, `SupportBox`, `SupportBar`, `LeadReport`, `ReportCard`,
`BriefRow`, `reportStore.js`.

**State:** wired. `POST /reports/{id}/confirm` moves `reports.confirmations`, the
browser remembers its own flag in `localStorage` so it does not double count, and
`supportCount()` renders the server value.

**What is still wrong:** the "one visitor, one support" rule is client-side only.
Clearing storage or using a second browser adds another confirmation.

**Minimum fix with accounts**

```sql
create table report_support (
  report_id  uuid not null references reports(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, account_id)
);
```

Then `POST /reports/{id}/confirm` inserts/deletes a row and recomputes
`confirmations` as `1 + count(*)` (the reporter counts as the first). Keep the
`greatest(1, ...)` floor: `ai/severity.py:_confirmations` assumes a report starts
at 1.

**Anonymous option, if accounts are not happening:** rate-limit by IP plus a
server-set cookie token, and store `(report_id, token)`. Less honest, but it
stops the trivial double count.

**Second-order effect to decide:** `confirmations` feeds the severity score
(`ai/severity.py`, 15 of the 100 points) but scoring only runs inside
`jobs/process.py`. A support added afterwards never re-scores the report. If you
want support to move the score, add a re-score to the confirm path — and be aware
it makes "top" ordering change retroactively.

---

## 4. Polls: featured poll and the feed's poll card — **M**

**UI:** `src/components/site/featured-poll.tsx`, `src/components/feed/PollCard.jsx`,
`feedData.js` (`poll`), `feedService.fetchPoll/votePoll`.

**State:** both are local React state. `featured-poll.tsx` counts the vote in the
browser and says so; `PollCard` shows percentages over zero seeded votes. The
two components duplicate the same three options — that duplication is why
`feedData.js` and `featured-poll.tsx` must be edited together today.

**Minimum schema**

```sql
create table polls (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question   text not null,
  closes_at  timestamptz,
  ward       text
);

create table poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references polls(id) on delete cascade,
  label    text not null,
  ordinal  int not null
);

create table poll_votes (
  poll_id    uuid not null references polls(id) on delete cascade,
  option_id  uuid not null references poll_options(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, account_id)     -- one vote per poll
);
```

**Endpoints:** `GET /polls/active` → `{ id, question, closes_at, options: [{id, label, votes}] }`,
`POST /polls/{id}/votes { option_id }` → `{ status: 'recorded' }`, 409 if closed
or already voted.

**Dependencies:** accounts, for the one-vote rule. `featured-poll.tsx` currently
renders `0 votes` because it seeds nothing; with a real table the numbers become
real and the "not connected" copy must be removed from both components.

**Design note:** `feedData.js`'s `closes: null` already handles the missing
closing date in `PollCard`. Keep that fallback for polls created without one.

---

## 5. Notices ticker — **S**

**UI:** `NoticesTicker.jsx`, `feedService.fetchNotices`, `feedData.js` (`notices`).

**State:** three static strings about the pilot, pointing at anchors.

**Minimum schema**

```sql
create table notices (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  label      text not null,
  href       text,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  priority   int not null default 0
);
```

**Endpoint:** `GET /notices` → `{ items: [{ id, label, href }] }`, filtered to the
active window, ordered by priority. The component already handles an empty list
by rendering nothing, so a wrong query degrades quietly — worth an empty-state
test.

**Who writes them:** nobody, yet. Either a tiny admin route behind the account
system, or keep them in `feedData.js` and accept that they are copy, not data.

---

## 6. Verification ("Verified") — **S**, but it is a policy call

**UI:** `VerificationMark` in `StatusTag.jsx`, `ReportHeader.jsx`,
`ReportCard.jsx`, `LeadReport.jsx`, `labels.verified`.

**State:** `src/lib/api.ts` hard-codes `verification: 'unverified'` for every
report, so every card renders the word "Unverified". That is honest, and it is
also the most visible claim on the page.

**Minimum schema**

```sql
alter table reports
  add column verified_at timestamptz,
  add column verified_by text;        -- who is asserting it, and on what basis
```

**Endpoint:** `POST /reports/{id}/verify { basis }`, admin-only.

**The real question:** "verified by ward office" was never true for this pilot.
If nothing will verify reports, the honest options are to keep "Unverified" on
every card, or to change the label to something the pilot can actually assert
("Reported by a resident"). Do not add the column without deciding who verifies
and against what.

---

## 7. Official updates / department messages — **M**

**UI:** the block was `OfficialUpdates`; it now reads "Status history" and shows
`status_events` with the author "FixIt Bharat" and a note that nothing there is
from a department. `ReportHeader`'s tracker still has `Routed / Scheduled` steps.

**State:** honest but weaker than the designed feature. The brown cards were
meant for a message from a public body.

**Minimum schema**

```sql
create table official_updates (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  author     text not null,           -- the body, not a person
  source_url text,
  body       text not null,
  verified   boolean not null default false
);
```

**Endpoint:** `GET /reports/{id}` returns `updates: [...]` alongside `timeline`,
so the two can render as separate sections again: department messages vs machine
status.

**Dependency:** a real channel to a department. Until complaints stop going to
the team's inbox (`routing/deliver.py`), an "official update" would be fiction,
which is why the section was relabelled rather than faked.

---

## 8. Parks and Transit categories — **M** (touches the AI contract)

**UI:** `feedConfig.categories` has five chips plus "All". `src/lib/api.ts`
maps roads→`pothole`, water→`water_leak`+`drain_overflow`,
safety→`streetlight`+`garbage`, and deliberately maps **Parks** and **Transit** to
`[]`, so those two chips always show the empty state.

**Why they cannot just be added to a map:** the vocabulary is owned by
`Backend/ai/schemas.py:IssueType` (a `Literal`) and by the vision prompt in
`Backend/ai/vision.py`. Adding a value means updating both, then every consumer
that switches on issue type.

**Change list**

1. `ai/schemas.py`: add `park_maintenance`, `transit` to `IssueType`.
2. `ai/vision.py`: extend the prompt's permitted values (the prompt is generated
   from prose, not from the Literal, so this is a manual edit).
3. `routing/departments.py`: add `BODIES` entries, or routing silently refuses
   the type ("issue type has no routing").
4. `ai/severity_config.py`: `CONDITION_SIGNAL` needs an entry per new type, or
   `_conditions()` returns "not applicable" and the score loses 10 points.
5. `ai/severity_service.py:SCORABLE`: add them, or nothing is scored.
6. `src/lib/api.ts`: extend `CATEGORY_TYPES`.
7. `src/components/site/illustrations.tsx`: the trending cards need art per
   category; today everything but Parks/Transit falls back to `RoadArt`.

**Alternative worth considering:** collapse the five chips to the five real
types and relabel them. Less code, but it changes the designed navigation.

---

## 9. Locality and area browsing — **M**

**UI:** the hero's location box (`hero.tsx`), the `locality` shown on every card,
`LocationBlock`'s map, `how-it-works.tsx` copy.

**State:** the hero box now navigates to `#/issues` and says area filtering does
not exist. Locality is derived client-side in `src/lib/api.ts`
(`localityFrom`) by matching the Nominatim `address` against a hard-coded list of
Prayagraj localities, then falling back to the third comma-separated segment.
That is a display heuristic, not a filter.

**Two ways to make it real**

- **Cheap:** `GET /feed?near=lat,lng&radius_m=` using the PostGIS index that
  already exists (`idx_reports_location`), via `ST_DWithin` like
  `db/geo.py:find_nearby_candidates`. The hero can turn a locality name into
  coordinates with a one-off Nominatim forward search.
- **Structural:** a `wards` table plus `reports.ward_id`, which is what the
  original design assumed. That means a boundary dataset for Prayagraj and a
  point-in-polygon on insert — `routing/area.py` already does this for the city
  boundary, so the function exists to copy.

The list of localities in `api.ts` is a good short-term filter key too: add
`GET /feed?locality=Civil Lines` with a `reports.locality` column populated at
enrichment time from `context.geocode`, and the chips become a real filter without
PostGIS.

---

## 10. Photo gallery (more than one photo) — **M**

**UI:** `PhotoGallery.jsx` (a swipeable carousel with counter, arrows, keyboard
support) and its lightbox.

**State:** `api.ts` builds `photos` from the single `photo_path`, so the array is
always length 0 or 1. The carousel controls and the "Photos submitted by a
resident" caption are dead weight for one photo.

**Minimum schema**

```sql
create table report_photos (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references reports(id) on delete cascade,
  path       text not null,
  ordinal    int not null default 0,
  created_at timestamptz not null default now()
);
```

Then `POST /reports` accepts `files: list[UploadFile]` (cap at, say, 4), the
detail endpoint returns `photos: [{ url, ordinal }]`, and `api.ts` stops
synthesising the array. `PhotoGallery` needs no change at all — it was written
for this.

**Watch:** the 10 MB per-file cap and the 1280 px re-encode in `api/main.py` are
per file; four files multiply the upload time. The submit page is barebones and
single-photo today.

---

## 11. Resolution and the tracker's "Fixed" step — **M**

**UI:** `StatusTracker.jsx` with `trackerSteps = reported → routed → scheduled →
fixed`; `ReportPage` maps `status` onto those steps and derives dates from
`status_events`.

**State:** there is no way for a report to reach `resolved`. `ai/resolution.py`
is complete — a before/after comparison with a code-decided outcome
(`resolved` / `not_fixed` / `needs_review`) and a 50 m distance gate — but
nothing imports it except the manual script `Backend/check_resolution.py`.

**Minimum work**

1. `POST /reports/{id}/resolution` accepting an after-photo plus coordinates.
2. Re-encode and store it (reuse the upload path in `api/main.py`).
3. Call `ai.resolution.check_resolution(before, after)` then `decide(check, distance_m)`.
4. On `resolved`: set `reports.status = 'resolved'` and append a `status_events`
   row. On anything else, append the reason and leave the status alone.
5. Run it as a `BackgroundTask`, like `process_report` — the call takes seconds.

**UI:** an "I fixed it" button on the report page with an after-photo upload.
That is the only missing control; the tracker already renders `fixed` and the
`statusDates.fixed` label.

**Dependency:** none beyond storage. This is the highest-value unexposed backend
feature (see `BACKEND-NOT-INVOKED.md`).

---

## 12. Search — **S/M**

**UI:** there is no search input. `FeedFilters` only switches category, and
`sortOptions` only switches order.

**Endpoint:** `GET /feed?q=` with a Postgres `ILIKE` over `description` and
`ai_result->'vision'->>'summary'`, or a `tsvector` column once volume justifies
it.

**Note:** this is listed for completeness. Adding it means adding UI, which is
outside "keep every element".

---

## 13. Small dead affordances (each **S**)

These are elements that render but do nothing, and would each need a tiny
backend or a copy change:

| Affordance | File | Today | Needs |
|---|---|---|---|
| "Terms" / "Privacy Policy" links | `SignupForm.jsx` | `href="#"`, `preventDefault` | static pages, no backend |
| "Learn more" in the closing CTA | `closing-cta.tsx` | no handler | a link target |
| Google sign-in | `authModalConfig.methods` | `enabled: false`, "Coming soon" | OAuth, §1 |
| "Send me ward updates" checkbox | `SignupForm.jsx` | collected, never sent | `accounts.ward_updates`, §1 |
| Share on mobile | `ShareButton.jsx` | works, but shares a hash URL | nothing — fine as is |

---

## Recommended order

1. **§11 resolution** — highest value per unit of work, no new dependency, and it
   finishes a tracker step the design already shows.
2. **§1 accounts** — unlocks §2, §3's real rule, §4 and half of §10.
3. **§2 comments** and **§3 support dedupe** — the two most-used social actions.
4. **§9 locality filtering** — makes the hero honest and needs no accounts.
5. **§4 polls**, **§5 notices** — small, independent, cosmetic.
6. **§8 categories** — only if Parks/Transit must be non-empty; touches the AI
   contract, so schedule it when the vision prompt can be re-tested.
7. **§6 verification**, **§7 official updates** — blocked on a policy answer
   (who verifies, who writes), not on code.
8. **§10 gallery** — only if multi-photo reporting is wanted.

## Cross-cutting prerequisites

- **Response models.** Every new endpoint should return a `BaseModel`. The
  existing endpoints mostly do not, which is how internal JSON (`context`,
  `ai_result`) leaks into responses today.
- **Rate limiting.** The API is anonymous; `POST /reports` costs three LLM calls
  and an SMTP send. Anything that ships to a public URL needs a per-IP limit
  before §1 lands, not after.
- **A real test suite.** The 26 `check_*.py` scripts hit live services and print.
  Every item above needs a contract test against a disposable database, or the
  merge stays unverifiable.
