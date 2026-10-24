import { NextResponse } from "next/server";

// In-memory rate limit store (persists across requests on the same instance)
const rateLimitMap = new Map<string, number>();

// Cooldown window per IP (e.g., 60 seconds)
const COOLDOWN_MS = 60 * 1000;

function getClientIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);

    // Drop request if within cooldown window
    if (lastRequest && now - lastRequest < COOLDOWN_MS) {
      return NextResponse.json(
        {
          error:
            "Too many requests. Please wait a bit before submitting again.",
        },
        { status: 429 },
      );
    }

    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Record submission timestamp for this IP
    rateLimitMap.set(ip, now);

    // Prevent map from growing infinitely
    if (rateLimitMap.size > 5000) {
      for (const [key, time] of rateLimitMap.entries()) {
        if (now - time > COOLDOWN_MS) rateLimitMap.delete(key);
      }
    }

    const rawWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (rawWebhookUrl) {
      const webhookUrl = new URL(rawWebhookUrl);
      webhookUrl.searchParams.set("with_components", "true");

      const response = await fetch(webhookUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flags: 32768,
          components: [
            {
              type: 17,
              accent_color: null,
              spoiler: false,
              components: [
                {
                  type: 10,
                  content: "### 📬 New Feedback Received",
                },
                {
                  type: 14,
                  divider: true,
                  spacing: 2,
                },
                {
                  type: 10,
                  content: `> "${message.trim()}"`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Discord Webhook Error]", errorText);
        return NextResponse.json(
          { error: "Failed to send feedback to Discord" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback route error:", error);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 },
    );
  }
}
