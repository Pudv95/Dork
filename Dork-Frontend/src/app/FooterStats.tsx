"use client";
import { useEffect, useState } from "react";

export default function FooterStats() {
  const [queries, setQueries] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_PY_BACKEND_URL;
    if (!base) return;
    const id = getOrCreateVisitorId();
    fetch(`${base.replace(/\/$/, "")}/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: id }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || r.statusText);
        setQueries(data.queries ?? 0);
        setVisitors(data.visitors ?? 0);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <footer className="mt-16 border-t border-black/10 dark:border-white/10 bg-gradient-to-b from-white/40 to-white/70 dark:from-white/[0.04] dark:to-white/[0.08]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Dork Generator</span>
          <span className="text-black/50 dark:text-white/50">Use responsibly.</span>
        </div>

        <div className="flex items-center gap-6 md:justify-center">
          {error ? (
            <span className="text-red-500 text-xs">Stats unavailable</span>
          ) : (
            <>
              <Stat label="Queries" value={queries} />
              <Stat label="Visitors" value={visitors} />
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:justify-end">
          <SocialLink href="https://github.com/pudv95/dork" label="GitHub">
            <GitHubIcon />
          </SocialLink>
          <SocialLink href="https://www.linkedin.com/in/pudv95" label="LinkedIn">
            <LinkedInIcon />
          </SocialLink>
          <SocialLink href="https://x.com/pudv5" label="X">
            <XIcon />
          </SocialLink>
        </div>
      </div>
    </footer>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-black/60 dark:text-white/60 text-xs">{label}</span>
      <span className="font-mono text-base">{value ?? "—"}</span>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
    >
      {children}
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.19c-3.22.7-3.9-1.39-3.9-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.72.08-.72 1.18.08 1.8 1.21 1.8 1.21 1.05 1.8 2.76 1.28 3.43.98.11-.77.41-1.28.74-1.58-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.46-2.31 1.21-3.13-.12-.3-.52-1.52.12-3.17 0 0 .97-.31 3.19 1.2a11.03 11.03 0 0 1 5.81 0c2.22-1.51 3.19-1.2 3.19-1.2.64 1.65.24 2.87.12 3.17.76.82 1.21 1.86 1.21 3.13 0 4.45-2.7 5.44-5.28 5.72.42.36.79 1.08.79 2.18v3.23c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.943v5.663H9.352V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.266 2.371 4.266 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.56V9h3.554v11.452z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.244 3H21l-6.54 7.47L22.5 21h-5.78l-4.52-5.49L6.02 21H3.26l7.02-8.02L1.5 3h5.86l4.08 5.02L18.24 3Zm-2.02 16.2h1.6L7.86 4.74H6.18l10.04 14.46Z" />
    </svg>
  );
}

function getOrCreateVisitorId(): string {
  const key = "dorkgen_visitor_id";
  let value = "";
  try {
    value = localStorage.getItem(key) || "";
  } catch {}
  if (!value) {
    value = crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
  return value;
}

