# Deploying the API on Render

Vercel serves the interface. This puts the FastAPI process somewhere that can run
for longer than a request, behind a disk that survives a deploy.

Region matters: **Ohio (us-east-2)**, the same as the Neon database. That is the
difference between the two-second queries you have been seeing and single-digit
milliseconds.

---

## 1. Create the service

Dashboard → **New → Blueprint** → connect the `forge-hackathon` repository. Render
reads `render.yaml` and asks for the values marked `sync: false`.

If you prefer not to use the blueprint: **New → Web Service**, root directory
`Backend`, runtime Python 3.13, build `pip install -r requirements.txt`, start
`uvicorn api.main:app --host 0.0.0.0 --port $PORT`, health check `/health`, then add
a disk of 1 GB mounted at `/opt/render/project/src/Backend/uploads`.

## 2. Fill the environment

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string, unchanged |
| `OPENROUTER_API_KEY` | as in `Backend/.env` |
| `FIREBASE_API_KEY` | the same web API key the browser uses |
| `NOMINATIM_CONTACT` | your email; Nominatim requires a contact |
| `SMTP_*`, `ROUTING_TEST_RECIPIENT` | the test inbox settings |
| `DEPARTMENT_KEY` | any long random string; this is the department desk passphrase |
| `CORS_ORIGINS` | `https://your-app.vercel.app,http://localhost:5174` |

Never paste the `.env` file itself; the values go in individually.

## 3. Run the migrations once

Render → your service → **Shell**, then:

```bash
python -m db.init_db
python -m db.migrate_002_context
python -m db.migrate_003_report_account
python -m db.migrate_004_workflow
python -m db.migrate_005_flags
python -m db.migrate_006_comments
python -m db.migrate_007_polls
python -m db.migrate_008_poll_hindi
```

They are idempotent, so running them twice is harmless. If your Neon database is
the one you have been developing against, most are already applied.

## 4. Check it

```bash
curl https://fixitbharat-api.onrender.com/health
# {"status":"ok","database":"connected","reports":...}
```

Then in Vercel → Settings → Environment Variables:

```
VITE_API_BASE = https://fixitbharat-api.onrender.com
```

No `/api` suffix and no trailing slash — the FastAPI routes sit at the root. Vite
bakes this in at build time, so **redeploy the frontend** after setting it.

## 5. Finish the two dashboards

- **Firebase → Authentication → Settings → Authorized domains** → add
  `your-app.vercel.app`, or Google sign-in fails with `auth/unauthorized-domain`.
- **Vercel → Settings → Environment Variables** → the four `VITE_FIREBASE_*` values
  if they are not already there.

---

## Things that will bite

- **Free instance spins down** after 15 minutes idle. The first request then waits
  ~50 seconds while it wakes, and the escalation scheduler stops in the meantime.
  `starter` avoids this.
- **One instance only.** APScheduler runs inside the web process; two instances
  would run two schedulers and two rate-limit counters.
- **Photos live on the disk**, not object storage. They survive redeploys because of
  the mount, but not a service deletion. Fine for a demo, not for production.
- **`ESCALATION_LIVE`** stays unset, so the agent records escalations without
  emailing anyone. Set it to `true` only when you mean it.
