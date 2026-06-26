# EduSentiAI API — run anywhere

Self-contained Flask API. The WSGI app is exposed as `app` (and `application`) in
`index.py`. All blueprints are served under the `/edusentiai/api/...` prefix.

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Set environment variables

| Variable         | Required | Purpose                                                        |
| ---------------- | -------- | -------------------------------------------------------------- |
| `SESSION_SECRET` | yes      | Signs the auth JWTs. Any long random string.                   |
| `GEMINI_API_KEY` | yes*     | Google Gemini key (AI form generation + reports). Get one at https://aistudio.google.com/apikey |
| `DATABASE_URL`   | no       | Postgres URL. If unset, falls back to SQLite at `/tmp`.        |
| `SEED_TOKEN`     | no       | If set, the `/edusentiai/api/admin/seed` route requires it.    |

```bash
export SESSION_SECRET="$(python -c 'import secrets;print(secrets.token_hex(32))')"
export GEMINI_API_KEY="your-gemini-key"
# export DATABASE_URL="postgresql://user:pass@host/dbname"   # optional
```

\*The app boots without `GEMINI_API_KEY`, but AI features will return an error
until it is set.

## 3. Create the admin + tables (one-time)

```bash
cd _lib
PYTHONPATH=. python -c "from seed import seed; seed()"
cd ..
```

Default admin login: **Amaan J Sha** / **amaan@123**

## 4. Run

Development:

```bash
python index.py            # serves on PORT (default 5100)
```

Production (any host — Render, Railway, Fly, a VM, etc.):

```bash
pip install gunicorn
gunicorn index:app --bind 0.0.0.0:5100
```

On Vercel, no run command is needed — `index.py` is auto-detected as a Python
serverless function (see the full package's `vercel.json`).

## Health check

```bash
curl localhost:5100/edusentiai/api/health
```
