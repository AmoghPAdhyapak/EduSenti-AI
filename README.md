# EduSentiAI — Vercel Deployment

A self-contained, Vercel-deployable copy of EduSentiAI: an AI-powered educational
form & response platform. Admins generate forms with Gemini, students submit
responses, and the platform provides sentiment analysis plus CSV/PDF export.

This package is **independent** of the Replit version. It runs as:

- **Frontend** — static Vite + React build (served by Vercel's CDN)
- **Backend** — Flask, deployed as a single Vercel Python serverless function
- **Database** — Postgres via `DATABASE_URL` (falls back to local SQLite in dev)
- **Auth** — stateless **JWT** bearer tokens (serverless functions can't keep
  server-side sessions), signed with `SESSION_SECRET`

## Project layout

```
edusentiai-vercel/
├── api/
│   ├── index.py          # Vercel Python entry — exposes the Flask `app`
│   └── _lib/             # App code (underscore = not treated as functions)
│       ├── app_factory.py  # create_app(): CORS, blueprints, health, seed route
│       ├── auth_utils.py    # JWT issue/verify (admin / student / otp tokens)
│       ├── config.py        # DATABASE_URL → Postgres, SQLite fallback
│       ├── models.py        # Admin, Form, Response
│       ├── ai_engine.py     # Gemini form generation + sentiment report
│       ├── seed.py          # Demo data seeding
│       └── routes/          # auth, forms, portal, analytics, export, etc.
├── frontend/             # Vite + React + Tailwind v4 SPA (builds to dist/)
├── requirements.txt      # Python deps for the serverless function
└── vercel.json           # Build command, function config, rewrites
```

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable         | Required | Purpose                                                        |
| ---------------- | -------- | ------------------------------------------------------------- |
| `DATABASE_URL`   | yes      | Postgres connection string (e.g. from Neon). `postgres://` and `postgresql://` are both accepted. |
| `SESSION_SECRET` | yes      | Secret used to sign JWTs. Use a long random string.          |
| `GEMINI_API_KEY` | yes      | Google Gemini key for AI form generation & sentiment reports. |
| `SEED_TOKEN`     | optional | If set, enables the one-time seed endpoint (see below).        |

## Database (Neon Postgres)

1. Create a free Postgres database at <https://neon.tech>.
2. Copy the connection string and set it as `DATABASE_URL` in Vercel.
3. Tables are created automatically on first boot (`db.create_all()`); no manual
   migrations are required.

## Deploy

1. Push this folder to a Git repo (or use `vercel` CLI from inside it).
2. Import the project in Vercel. The included `vercel.json` already configures:
   - **Build:** `cd frontend && npm install && npm run build`
   - **Output:** `frontend/dist`
   - **Function:** `api/index.py` (Python) with `api/_lib/**` bundled
   - **Rewrites:** `/edusentiai/api/*` → the Flask function; everything else →
     the SPA's `index.html` (static assets are served directly).
3. Add the environment variables above.
4. Deploy.

## Seeding demo data (optional)

The app works with an empty database, but you can load the demo admin + sample
forms/responses:

1. Set `SEED_TOKEN` (any random string) in Vercel and redeploy.
2. Call the guarded endpoint once:

   ```bash
   curl -X POST https://<your-app>.vercel.app/edusentiai/api/admin/seed \
     -H "Authorization: Bearer <SEED_TOKEN>"
   ```

   It is idempotent (skips if the demo admin already exists) and refuses to run
   when `SEED_TOKEN` is unset.

Demo admin credentials after seeding:

- **Username:** `Amaan J Sha`
- **Password:** `amaan@123`

## How auth works (JWT, no cookies)

- `POST /edusentiai/api/auth/admin/login` returns `{ token, admin }`.
- The frontend stores the token in `localStorage` and sends it as
  `Authorization: Bearer <token>` on every request (see `frontend/src/api/client.ts`).
- Protected routes read the bearer token and resolve the admin id — no
  server-side session is needed, so it works on stateless serverless functions.
- A `401` clears the stored token client-side.

## Local development

Backend (SQLite + JWT, no Postgres needed):

```bash
pip install -r requirements.txt
cd api/_lib
PYTHONPATH=. python -c "from seed import seed; seed()"      # optional demo data
PYTHONPATH=. python -c "from app_factory import create_app; create_app().run(port=5100)"
```

Frontend:

```bash
cd frontend
npm install
npm run dev        # dev server
npm run build      # production build → dist/
```

> In local dev the frontend calls `/edusentiai/api/...` directly. Point it at the
> backend with a dev proxy or run both behind the same host as in production.
