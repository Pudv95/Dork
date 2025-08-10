# Dork Backend (FastAPI)

Backend for AI-powered dork generation. Features:

- `/generate` using Anthropic
- SQLite stats (queries, unique visitors)
- IP-based rate limiting
- CORS config

## Setup

1. Create a virtual environment and install deps:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create `.env` (dotenv is required; values are read from this file only):

```bash
ANTHROPIC_API_KEY=sk-ant-...
# Optional
CORS_ALLOW_ORIGINS=http://localhost:3000
# Optional rate limits
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_VISIT_WINDOW_SECONDS=60
RATE_LIMIT_VISIT_MAX_REQUESTS=120
DB_PATH=./stats.db
```

3. Run the server:

```bash
uvicorn app:app --host 0.0.0.0 --port 8787 --reload
```

## Endpoints

- `GET /health` → `{ ok: true }`
- `POST /generate` → `{ query }` (increments `queries`)
- `POST /visit` { visitorId } → `{ queries, visitors }` (upserts visitor and returns totals)
- `GET /stats` → `{ queries, visitors }`

Body:

```json
{
  "prompt": "Find pdf reports about revenue on example.com excluding staging",
  "current": { "site": "example.com" }
}
```

## Frontend integration

Set `NEXT_PUBLIC_PY_BACKEND_URL` in your Next.js `.env.local` to point to this server, e.g.:

```
NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8787
```

The app will use the Python server when this variable is present; otherwise it calls the built-in Next.js API route.
