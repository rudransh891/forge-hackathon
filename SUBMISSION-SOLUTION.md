# 2. Solution Description

## High-Level Overview

Civic complaints in Indian cities are scattered across phone calls, WhatsApp groups
and newspaper columns. Nobody knows whether two neighbours are reporting the same
pothole, which issues actually matter, or whether anything happened after a complaint
was filed. FixItBharat turns a photograph into a tracked, prioritised record that stays
public from intake to resolution.

The citizen takes a photo and confirms a location on a map. Everything after that is
autonomous: a vision model identifies the defect and its visible hazards; the location
is enriched from live geodata; the report is compared against nearby open reports and,
if it looks like the same problem, the citizen is asked once whether to merge instead
of duplicating; a severity score and a response deadline are computed from five
weighted factors; a formal complaint is drafted and delivered, with the delivery
recorded; and an agent watches the deadline afterwards, escalating if it passes.

The design choice that matters is that **the model judges, the code decides**. The
vision model reports what it can see and how confident it is. The severity score is
arithmetic over stored facts — road class, distance to the nearest school or hospital,
rainfall, confirmations. A language model writes the one-sentence explanation, and that
sentence is discarded unless every number in it appears in the evidence. Citizens see
the reasoning, not just a number, which is what makes the score contestable.

The second choice is **honesty about what is real**. No report is seeded. Every figure
on the public board is computed from a database row. Complaints are emailed to the
project's own test inbox, and the message says so in its first line, because no
municipal body offers an open submission API. A failed lookup is shown as missing
rather than guessed.

## Technical Architecture

**Stack.** React 19 with TypeScript and Tailwind on the front end; FastAPI on Python
3.13 with SQLAlchemy and psycopg 3 behind it; PostgreSQL with PostGIS on Neon;
Leaflet with OpenStreetMap tiles for every map; Firebase Authentication for optional
Google and email sign-in.

**Models.** A hosted vision model reads each photo and must return strict JSON — issue
type, visible damage, hazard indicators, size, confidence. A fallback chain of three
models, each tried twice, keeps the system working when a provider rate-limits. A
separate language-model call writes the severity sentence, which is then validated in
code against the evidence.

**Data.** No training set: the system is built on open data queried live. Nominatim for
reverse geocoding, Overpass for road class and for schools, hospitals and bus stops
within 200 metres, Open-Meteo for rainfall and air quality. Duplicate detection uses
PostGIS radius queries combined with text and size similarity. The database holds
reports, their photo sets, status events, comments, polls, and the routing and
escalation records.

**Design.** Intake writes a row immediately and returns; a background pipeline then
runs analysis, enrichment, scoring and routing in sequence, each step recording its own
outcome so one failure never stops the next. A scheduler runs an escalation agent every
few minutes, dry-run by default. The front end is a hash-routed React app communicating
with a single typed API client; every read endpoint is cached briefly and every page
degrades to a readable error state.
