## Dork Generator

SEO-optimized web app to compose and generate Google dork queries. Includes:

- Interactive builder (site:, filetype:, inurl:, intitle:, include/exclude, presets)
- AI generation via Anthropic (server-side)
- Optional Python backend with rate limiting and basic analytics (queries, visitors)

### Monorepo Layout

- `Dork-Frontend/` Next.js 15 app (TypeScript, Tailwind)
- `Dork-Backend/` FastAPI server (Anthropic, SQLite stats, rate limiting)

### Quick Start (Frontend only)

```bash
cd Dork-Frontend
npm i
npm run dev
# http://localhost:3000
```

### Use Python Backend (recommended)

```bash
# Backend
cd Dork-Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "CORS_ALLOW_ORIGINS=http://localhost:3000" >> .env
uvicorn app:app --host 0.0.0.0 --port 8787 --reload

# Frontend
cd ../Dork-Frontend
echo "NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8787" >> .env.local
npm run dev
```

### Deploy

- Frontend: Deploy `Dork-Frontend/` to Vercel/Netlify/any Node host
- Backend: Deploy `Dork-Backend/` to your preferred Python host (Docker, Fly.io, Render, etc.)
  - Provide `.env` on the server with `ANTHROPIC_API_KEY`
  - Optionally set rate limits: `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_MAX_REQUESTS`, etc.

### Security Notes

- Never expose model API keys in the browser. Keys are used only on the server.
- The frontend calls your backend API; the browser never talks to Anthropic directly.

### License

MIT
