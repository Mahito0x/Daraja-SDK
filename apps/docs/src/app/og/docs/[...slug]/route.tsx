import { getPageImageUrl, source } from "@/lib/source";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const revalidate = false;
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));

  if (!page) notFound();

  const publicDir = path.join(process.cwd(), "public");
  const background = await readFile(path.join(publicDir, "og.jpg"));
  const backgroundSrc = `data:image/jpeg;base64,${background.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        backgroundImage: `url("${backgroundSrc}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark gradient overlay for crystal clear contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.75))",
        }}
      />

      {/* Top Catchy Section Tracker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#a1a1aa",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          position: "relative",
        }}
      >
        <span
          style={{
            width: "16px",
            height: "2px",
            backgroundColor: "#00a651",
            display: "flex",
          }}
        />
        Safaricom Daraja API & TypeScript SDK
      </div>

      {/* Main Content (Centered) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "16px",
          maxWidth: "960px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: 0,
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          {page.data.title}
        </h1>

        {page.data.description && (
          <p
            style={{
              fontSize: 22,
              lineHeight: 1.5,
              color: "#e4e4e7",
              margin: 0,
              maxWidth: "850px",
            }}
          >
            {page.data.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.25)",
          paddingTop: "24px",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600 }}>Lumière Labs</span>
        <span style={{ fontSize: 15, color: "#d4d4d8" }}>
          daraja.lumierelabs.xyz
        </span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImageUrl(page).segments,
  }));
}
