# Dork Frontend (Next.js)

Next.js 15 + Tailwind UI for generating Google dork queries with optional AI.

## Features

- Builder: `site:`, `filetype:`, `inurl:`, `intitle:`, include/exclude, exact phrase, presets
- AI assistant: sends prompt to backend and sets the query
- SEO: canonical, OpenGraph/Twitter, robots, sitemap, OG image
- Footer: GitHub/LinkedIn/X links, live stats (when backend configured)

## Setup

```bash
npm i
npm run dev
# http://localhost:3000
```

Optional: connect to Python backend for AI and stats

```bash
# .env.local
NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8787
```

## Build

```bash
npm run build
npm run start
```

## Customize

- Update social links in `src/app/FooterStats.tsx`
- Update metadata in `src/app/layout.tsx`
