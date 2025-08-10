export function GET() {
  const body = `/* TEAM */\nDeveloper: Your Name\nSite: dork.example.com\n\n/* THANKS */\nStack: Next.js 15, React 19, Tailwind 4\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}

