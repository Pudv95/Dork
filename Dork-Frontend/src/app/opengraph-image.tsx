import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          color: "#fff",
          padding: 64,
          fontSize: 56,
          lineHeight: 1.1,
        }}
      >
        <div style={{ opacity: 0.7, fontSize: 24, marginBottom: 8 }}>
          dork.example.com
        </div>
        <div style={{ fontWeight: 700 }}>Google Dork Generator</div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 8 }}>
          Build precise search operators instantly
        </div>
      </div>
    ),
    { ...size }
  );
}

