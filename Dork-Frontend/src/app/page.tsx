"use client";

import { useMemo, useState } from "react";

type PresetKey =
  | "none"
  | "login"
  | "indexOf"
  | "env"
  | "pdf"
  | "admin"
  | "git"
  | "db";

const PRESET_TO_QUERY: Record<PresetKey, string> = {
  none: "",
  login: "intitle:login OR inurl:login",
  indexOf: 'intitle:"index of"',
  env: 'filename:.env OR ext:env "DB_PASSWORD"',
  pdf: "filetype:pdf",
  admin: "inurl:admin OR intitle:admin",
  git: ".git/HEAD OR inurl:.git",
  db: 'filetype:sql OR filetype:db OR "dump"',
};

export default function Home() {
  const [domain, setDomain] = useState("");
  const [contains, setContains] = useState("");
  const [exactPhrase, setExactPhrase] = useState("");
  const [exclude, setExclude] = useState("");
  const [inUrl, setInUrl] = useState("");
  const [inTitle, setInTitle] = useState("");
  const [fileType, setFileType] = useState("");
  const [preset, setPreset] = useState<PresetKey>("none");
  const [aiPrompt, setAiPrompt] = useState("");
  const [overrideQuery, setOverrideQuery] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateWithAI = useAIGenerator({
    getPrompt: () => aiPrompt,
    setOverrideQuery: (q) => setOverrideQuery(q),
    setIsGenerating: (b) => setIsGenerating(b),
    setErrorMessage: (m) => setErrorMessage(m),
    getContext: () => ({
      domain,
      fileType,
      inUrl,
      inTitle,
      contains,
      exactPhrase,
      exclude,
      preset,
    }),
  });

  function clearAll() {
    setDomain("");
    setFileType("");
    setInUrl("");
    setInTitle("");
    setContains("");
    setExactPhrase("");
    setExclude("");
    setPreset("none");
    setAiPrompt("");
    setOverrideQuery(null);
    setErrorMessage(null);
  }

  const query = useMemo(() => {
    if (overrideQuery) return overrideQuery;
    const parts: string[] = [];
    if (domain.trim()) parts.push(`site:${domain.trim()}`);
    if (fileType.trim()) parts.push(`filetype:${fileType.trim()}`);
    if (inUrl.trim()) parts.push(`inurl:${wrapIfSpaces(inUrl.trim())}`);
    if (inTitle.trim()) parts.push(`intitle:${wrapIfSpaces(inTitle.trim())}`);
    if (contains.trim()) parts.push(splitTerms(contains).join(" "));
    if (exactPhrase.trim()) parts.push(`"${exactPhrase.trim()}"`);
    if (exclude.trim()) parts.push(splitTerms(exclude).map((t) => `-${t}`).join(" "));
    if (preset && preset !== "none") parts.push(PRESET_TO_QUERY[preset]);
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }, [overrideQuery, domain, contains, exactPhrase, exclude, inUrl, inTitle, fileType, preset]);

  const googleHref = useMemo(() => {
    const url = new URL("https://www.google.com/search");
    url.searchParams.set("q", query || "");
    return url.toString();
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Google Dork Generator</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-white/60">
          Build precise search queries with operators like <span className="font-mono">site:</span>, <span className="font-mono">filetype:</span>, <span className="font-mono">inurl:</span>, and more.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left: controls */}
          <div className="flex flex-col gap-6">
            <section>
          <h2 className="text-base font-medium">AI assistant</h2>
          <div className="mt-2 grid gap-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Find PDF reports about quarterly revenue on example.com excluding staging"
              className="min-h-24 rounded-md border border-black/10 dark:border-white/15 bg-white/90 dark:bg-white/5 p-3 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/40 dark:placeholder:text-white/40"
            />
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={generateWithAI}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`h-10 inline-flex items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${
                  !aiPrompt.trim() || isGenerating
                    ? "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
                }`}
              >
                    <span className="inline-flex items-center gap-2">
                      {isGenerating && <Spinner />}
                      {isGenerating ? "Generating…" : "Generate with AI"}
                    </span>
              </button>
              {overrideQuery && (
                <button
                  type="button"
                  onClick={() => setOverrideQuery(null)}
                  className="h-10 inline-flex items-center justify-center rounded-md px-3 text-sm font-medium border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Clear AI
                </button>
              )}
              {errorMessage && (
                <span className="text-sm text-red-600 dark:text-red-400">{errorMessage}</span>
              )}
            </div>
          </div>
            </section>

            <section className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabeledInput
              id="domain"
              label="Domain (site:)"
              placeholder="example.com"
              value={domain}
              onChange={setDomain}
            />
            <LabeledInput
              id="filetype"
              label="File type (filetype:)"
              placeholder="pdf, xls, env, sql..."
              value={fileType}
              onChange={setFileType}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabeledInput
              id="inurl"
              label="URL contains (inurl:)"
              placeholder="admin, login, api/v1"
              value={inUrl}
              onChange={setInUrl}
            />
            <LabeledInput
              id="intitle"
              label="Title contains (intitle:)"
              placeholder="dashboard, index of"
              value={inTitle}
              onChange={setInTitle}
            />
          </div>

          <LabeledInput
            id="contains"
            label="Must include words"
            placeholder="space-separated terms"
            value={contains}
            onChange={setContains}
          />

          <LabeledInput
            id="exact"
            label="Exact phrase"
            placeholder={'"confidential"'}
            value={exactPhrase}
            onChange={setExactPhrase}
          />

          <LabeledInput
            id="exclude"
            label="Exclude words"
            placeholder="-staging -test"
            value={exclude}
            onChange={setExclude}
          />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <label htmlFor="preset" className="text-sm font-medium">Preset</label>
                  <select
                    id="preset"
                    className="h-11 rounded-md border border-black/10 dark:border-white/15 bg-white/90 dark:bg-white/5 px-3 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value as PresetKey)}
                  >
                    <option value="none">None</option>
                    <option value="login">Login pages</option>
                    <option value="indexOf">Index of directories</option>
                    <option value="env">Exposed .env</option>
                    <option value="pdf">PDF documents</option>
                    <option value="admin">Admin portals</option>
                    <option value="git">.git directories</option>
                    <option value="db">Database dumps</option>
                  </select>
                </div>
              </div>

            </section>
          </div>

          {/* Right: preview (sticky) */}
          <aside className="lg:sticky lg:top-6">
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] shadow-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Query preview</span>
                  {overrideQuery && (
                    <span className="text-[11px] rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">AI</span>
                  )}
                  {isGenerating && <Spinner />}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="h-9 inline-flex items-center justify-center rounded-md px-3 text-xs font-medium border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Clear
                  </button>
                  <CopyButton text={query} disabled={!query} />
                  <a
                    href={googleHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-9 inline-flex items-center justify-center rounded-md px-3 text-xs font-medium transition-colors ${
                      query
                        ? "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        : "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed"
                    }`}
                    aria-disabled={!query}
                  >
                    Search Google
                  </a>
                </div>
              </div>
              <div className="px-4 py-4 font-mono text-[13px] leading-relaxed break-words">
                {query ? (
                  <HighlightedQuery query={query} />
                ) : (
                  <span className="opacity-50">Your query will appear here…</span>
                )}
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-10 text-xs text-black/60 dark:text-white/50">
          Use responsibly. This tool only builds search queries; it does not scan or exploit systems.
        </footer>
      </main>
    </div>
  );
}

function wrapIfSpaces(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function splitTerms(value: string): string[] {
  return value
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function LabeledInput(props: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { id, label, placeholder, value, onChange } = props;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-md border border-black/10 dark:border-white/15 bg-white/90 dark:bg-white/5 px-3 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/40 dark:placeholder:text-white/40"
      />
    </div>
  );
}

function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={`h-9 inline-flex items-center justify-center rounded-md px-3 text-xs font-medium transition-colors ${
        !disabled
          ? "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-100"
          : "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60 dark:border-white/20 dark:border-t-white/70"
      aria-hidden
    />
  );
}

function HighlightedQuery({ query }: { query: string }) {
  const nodes = useMemo(() => tokenizeForHighlight(query), [query]);
  return <span className="[&_span]:transition-colors">{nodes}</span>;
}

function tokenizeForHighlight(input: string): React.ReactNode[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '"') {
      current += ch;
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && /\s/.test(ch)) {
      if (current) tokens.push(current);
      tokens.push(ch);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);

  return tokens.map((tok, idx) => {
    if (/^\s+$/.test(tok)) {
      return <span key={idx}>{tok}</span>;
    }
    // quoted phrase
    if (/^"[\s\S]*"$/.test(tok)) {
      return (
        <span key={idx} className="text-emerald-700 dark:text-emerald-400">
          {tok}
        </span>
      );
    }
    // logical keyword
    if (/^(OR|AND)$/i.test(tok)) {
      return (
        <span key={idx} className="text-rose-600 dark:text-rose-400 font-semibold">
          {tok}
        </span>
      );
    }
    // negative term
    if (/^-/.test(tok)) {
      return (
        <span key={idx} className="text-red-600 dark:text-red-400">
          {tok}
        </span>
      );
    }
    // operator:value
    const opMatch = tok.match(/^([a-z]+):(.*)$/i);
    if (opMatch) {
      return (
        <span key={idx}>
          <span className="text-indigo-700 dark:text-indigo-400 font-semibold">{opMatch[1]}:</span>
          <span>{opMatch[2]}</span>
        </span>
      );
    }

    return <span key={idx}>{tok}</span>;
  });
}
// Inline handler bound to component state via closure
function useAIGenerator(setters: {
  getPrompt: () => string;
  setOverrideQuery: (q: string | null) => void;
  setIsGenerating: (b: boolean) => void;
  setErrorMessage: (m: string | null) => void;
  getContext: () => Record<string, unknown>;
}) {
  return async function handle(): Promise<void> {
    const { getPrompt, setOverrideQuery, setIsGenerating, setErrorMessage, getContext } = setters;
    const prompt = getPrompt().trim();
    if (!prompt) return;
    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const base = process.env.NEXT_PUBLIC_PY_BACKEND_URL || "";
      const endpoint = base ? `${base.replace(/\/$/, "")}/generate` : "/api/generate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, current: getContext() }),
      });
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data: { query?: string; error?: string } | null = null;
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(raw);
        } catch {}
      }
      if (!res.ok) {
        const message = data?.error || raw || res.statusText || "Generation failed";
        throw new Error(message);
      }
      const query = data?.query || (contentType.includes("application/json") ? data?.query : raw);
      if (!query) {
        throw new Error("No query generated");
      }
      setOverrideQuery(query);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };
}
