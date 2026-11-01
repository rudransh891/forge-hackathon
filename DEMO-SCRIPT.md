# Demo script — 5 minutes

One projected browser, one phone. The point is that a judge can watch a photo become a
tracked, scored, routed record — not that the UI is pretty.

---

## Before you start (10 minutes ahead)

```bash
# backend
cd Backend
.venv/Scripts/python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000

# frontend
npm run dev -- --port 5174 --strictPort
```

1. **Warm the database.** Open <http://localhost:5174/api/health> and wait for a reply.
   The first request after idle takes a few seconds; do not let that be a judge's
   first impression.
2. **Submit one real report 10–15 minutes before you present.** The pipeline takes
   minutes, so this is the report you will show *finished*. Pick something with a
   photo and a nearby school or junction — a pothole works best.
3. Open two tabs: the landing page, and that prepared report's page.
4. Have a fresh photo on the phone, of something in the room or outside the window
   that is genuinely a civic issue if possible.
5. Check the pulse strip reads non-zero. If every number is zero, say so rather than
   pretending.

---

## The run sheet

| Time | On screen | Say |
|---|---|---|
| 0:00 | Landing page | "A citizen photographs a pothole. Today that photo goes into a WhatsApp group and disappears. We turn it into a record that is scored, sent, and followed up." |
| 0:30 | Tap **Report** | "No account needed. Photo, location, optional note. Three taps." |
| 0:50 | Submit from the phone | "It is saved immediately and the analysis runs behind it." |
| 1:05 | Posted screen, steps ticking | "Analysing the photo, checking the location, scoring the severity. It updates itself." |
| 1:25 | Switch to the prepared report | "This one went in fifteen minutes ago. Here is what the pipeline produced." |
| 1:30 | Severity panel | "Medium, 49 out of 100 — and here is why." Read the one-sentence reason. |
| 1:45 | **What the score looked at** | "Five factors: damage from the photo, road class, anything sensitive within 200 metres, rain in the last 24 hours, and how many people confirmed it. This one is on a residential road, 84 metres from a school." |
| 2:15 | **What was sent** → *Read the complaint* | "This is the actual complaint. It says what was seen, where, when, and what response time we proposed." |
| 2:40 | Scroll to the delivery line | "And this is the delivery record. It went to our own test inbox — not a department — and the message says that in its first line. We are not going to claim an integration we do not have." |
| 3:00 | Back to feed → map | "Every open report, coloured by severity. Green low, coral critical." |
| 3:20 | Feed rail → **Routed to** | "Which body each complaint went to, and how many cleared their deadline." |
| 3:40 | Landing → pulse strip | "Filed, open, resolved, past deadline. All four are counts from the database." |
| 3:55 | Language toggle → हिं | "The interface is bilingual. Hindi is a requirement for this audience, not a nice-to-have." |
| 4:10 | Submit a photo of something that is not a civic issue | "It refuses politely instead of inventing a category. That is the failure mode we cared about most." |
| 4:30 | Report page → **Is it fixed?** (if time) | "A citizen can send an after photo. A model compares it with the original and decides whether the problem is gone — the answer goes on the timeline." |
| 4:45 | Close | "Scored, sent, tracked, and public. Nothing on that page is invented." |

---

## If asked

**"How does the severity score work?"**
Five weighted factors summing to 100. The model reports damage and hazards; the rest is
code over stored facts. Weights are in a config file. If any factor is missing the
score is marked provisional and capped at medium — we would rather say "we could not
check the road" than guess.

**"Is this connected to the municipality?"**
No. No municipal body offers an open submission API. We draft the complaint, send it to
our own test inbox, and record that delivery honestly. The citizen is also given the
official channel — UP Jansunwai, helpline 1076 — which is the only part of the routing
we could verify from a public source.

**"What is the AI doing?"**
Two jobs. A vision model reads the photo and returns strict JSON. A language model
writes the one-sentence explanation of the score — and that sentence is thrown away
unless every number in it appears in the stored evidence.

**"How accurate is it?"**
We have a harness that measures classification accuracy against hand-labelled photos,
and we have not run it at scale yet. We will not quote a number we do not have.

---

## Fallbacks

- **Live submission is still analysing.** Do not wait on it. Say "it is running in the
  background" and move to the prepared report. That is what the prepared report is for.
- **Network drops.** The landing page and feed still render from the last cache; say so.
  If the backend is gone entirely, show the prepared report's data and explain the
  pipeline rather than clicking a broken button.
- **The vision model rate-limits.** The report lands in `needs_review` and the page says
  analysis could not be completed. Say "that is the honest failure state" — do not
  re-submit and hope.
- **A judge's photo is rejected.** Good. That is the robustness beat; run it as one.

---

## Do not claim

- That a department received anything.
- That escalations were sent, unless `ESCALATION_LIVE=true` and one actually fired.
- Any accuracy, precision or recall figure.
- That wards exist as data — the copy says ward in places, but there is no ward table.
