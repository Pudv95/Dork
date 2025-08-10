import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import dotenv_values, find_dotenv
from collections import deque
import threading
import time
import sqlite3
from pathlib import Path
from typing import Tuple


class GenerateRequest(BaseModel):
    prompt: str
    current: dict | None = None


def sanitize_query(text: str) -> str:
    cleaned = (
        text.replace("```", " ")
        .replace("`", " ")
        .replace("\r", " ")
        .replace("\n", " ")
        .strip()
    )
    if cleaned.lower().startswith("query:"):
        cleaned = cleaned.split(":", 1)[1].strip()
    return cleaned


app = FastAPI(title="Dork Generator Backend")

_ENV_PATH = find_dotenv(usecwd=True)
CONFIG = dotenv_values(_ENV_PATH) if _ENV_PATH else {}

origins_env = (CONFIG.get("CORS_ALLOW_ORIGINS") or "*")
allow_origins = ["*"] if origins_env.strip() == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_buckets: dict[str, deque[float]] = {}
_rate_lock = threading.Lock()

GEN_WINDOW = int((CONFIG.get("RATE_LIMIT_WINDOW_SECONDS") or "60"))
GEN_MAX = int((CONFIG.get("RATE_LIMIT_MAX_REQUESTS") or "30"))
VISIT_WINDOW = int((CONFIG.get("RATE_LIMIT_VISIT_WINDOW_SECONDS") or str(GEN_WINDOW)))
VISIT_MAX = int((CONFIG.get("RATE_LIMIT_VISIT_MAX_REQUESTS") or "120"))


def _check_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    now = time.monotonic()
    cutoff = now - window_seconds
    with _rate_lock:
        dq = _rate_buckets.setdefault(key, deque())
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= max_requests:
            retry_after = int(max(0, window_seconds - (now - dq[0])))
            return False, retry_after
        dq.append(now)
        return True, 0


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")
    return ip or "unknown"


# --- Persistence (SQLite) ---------------------------------------------------
DB_PATH = Path(CONFIG.get("DB_PATH", "./stats.db"))


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS metrics (
                key TEXT PRIMARY KEY,
                value INTEGER NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS visitors (
                id TEXT PRIMARY KEY,
                first_seen TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.execute("INSERT OR IGNORE INTO metrics(key,value) VALUES('queries', 0);")
        conn.commit()


def _increment_queries() -> None:
    with _get_conn() as conn:
        conn.execute("UPDATE metrics SET value = value + 1 WHERE key = 'queries';")
        conn.commit()


def _upsert_visitor(visitor_id: str) -> None:
    if not visitor_id:
        return
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO visitors(id) VALUES(?);",
            (visitor_id,),
        )
        conn.commit()


def _read_stats() -> Tuple[int, int]:
    with _get_conn() as conn:
        cur = conn.execute("SELECT value FROM metrics WHERE key='queries';")
        row = cur.fetchone()
        queries = int(row[0]) if row else 0
        cur = conn.execute("SELECT COUNT(1) FROM visitors;")
        visitors = int(cur.fetchone()[0])
        return queries, visitors


_init_db()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
def generate(request: Request, body: GenerateRequest):
    # Rate limit by client IP
    ok, retry_after = _check_rate_limit(f"gen:{_client_key(request)}", GEN_MAX, GEN_WINDOW)
    if not ok:
        raise HTTPException(status_code=429, detail="Rate limit exceeded", headers={"Retry-After": str(retry_after)})
    api_key = CONFIG.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server missing ANTHROPIC_API_KEY")

    client = Anthropic(api_key=api_key)
    model = CONFIG.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    system = (
        "You generate a single Google Dork query based on the user's intent. "
        "Output only the final query with no explanation, no markdown, no quotes, and no newlines. "
        "Prefer safe and legitimate operators (site:, filetype:, inurl:, intitle:, cache:, etc.). "
        "Keep it concise and high-signal."
    )

    pieces = [f"Intent: {body.prompt}"]
    if body.current:
        pieces.append(f"Context: {body.current}")
    user = "\n".join(pieces)

    try:
        completion = client.messages.create(
            model=model,
            max_tokens=128,
            temperature=0.2,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to generate query") from exc

    parts = []
    for part in completion.content or []:
        if getattr(part, "type", None) == "text":
            parts.append(getattr(part, "text", ""))
    raw = " ".join(parts).strip()
    query = sanitize_query(raw)
    if not query:
        raise HTTPException(status_code=422, detail="No query generated")

    _increment_queries()
    return {"query": query}


class VisitRequest(BaseModel):
    visitorId: str


@app.post("/visit")
def visit(request: Request, body: VisitRequest):
    ok, retry_after = _check_rate_limit(f"visit:{_client_key(request)}", VISIT_MAX, VISIT_WINDOW)
    if not ok:
        raise HTTPException(status_code=429, detail="Rate limit exceeded", headers={"Retry-After": str(retry_after)})
    _upsert_visitor(body.visitorId.strip())
    q, v = _read_stats()
    return {"queries": q, "visitors": v}


@app.get("/stats")
def stats():
    q, v = _read_stats()
    return {"queries": q, "visitors": v}

