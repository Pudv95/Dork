export const runtime = "edge";

export async function GET() {
  return new Response(
    JSON.stringify({ applinks: { apps: [], details: [] } }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

