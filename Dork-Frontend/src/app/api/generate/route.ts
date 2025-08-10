import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

type GenerateRequestBody = {
  prompt: string;
  current?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const userPrompt = (body?.prompt || "").toString();

    if (!userPrompt) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Server missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const system = [
      "You generate a single Google Dork query based on the user's intent.",
      "Output only the final query with no explanation, no markdown, no quotes, and no newlines.",
      "Prefer safe and legitimate operators (site:, filetype:, inurl:, intitle:, cache:, etc.).",
      "Keep it concise and high-signal."
    ].join(" ");

    const user = [
      `Intent: ${userPrompt}`,
      body?.current ? `Context: ${JSON.stringify(body.current)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 128,
      temperature: 0.2,
      system,
      messages: [
        { role: "user", content: user },
      ],
    });

    const raw = (completion.content || [])
      .map((part: { type: string; text?: string }) => (part.type === "text" ? part.text || "" : ""))
      .join(" ")
      .trim();
    const query = sanitizeQuery(raw);

    if (!query) {
      return Response.json({ error: "No query generated" }, { status: 422 });
    }

    return Response.json({ query });
  } catch (err) {
    console.error("/api/generate error", err);
    return Response.json({ error: "Failed to generate query" }, { status: 500 });
  }
}

function sanitizeQuery(text: string): string {
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`+/g, " ")
    .replace(/^\s*Query\s*:\s*/i, "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return stripped;
}

