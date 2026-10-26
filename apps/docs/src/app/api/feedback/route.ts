import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ----------------------------- Configuration ----------------------------- */

const MAX_BODY_BYTES = 4_096;
const MIN_WORDS = 3;
const MAX_COMMENT_CHARS = 1_000;
const RATE_LIMIT = { max: 2, windowMs: 10 * 60_000 }; // 2 per 10 min per visitor
const WEBHOOK_TIMEOUT_MS = 5_000;

const MOODS: Record<number, { label: string; emoji: string; color: number }> = {
  4: { label: "Loving it", emoji: "😄", color: 0x10b981 },
  3: { label: "Liking it", emoji: "🙂", color: 0x34d399 },
  2: { label: "Not great", emoji: "🙁", color: 0xfbbf24 },
  1: { label: "Frustrated", emoji: "😠", color: 0xf43f5e },
};

/* -------------------------------- Helpers -------------------------------- */

function respond(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

const fail = (status: number, error: string, message: string, h = {}) =>
  respond({ ok: false, error, message }, status, h);

/** Same-origin guard: blocks other websites from posting to this endpoint. */
function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients are still rate limited
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Visitor key = salted hash of the IP, so raw IPs are never stored or forwarded. */
function visitorKey(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const salt = process.env.FEEDBACK_SALT ?? "daraja-feedback";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/* In-memory sliding window. Fine for one server; on serverless each instance
   has its own memory, so use Upstash/Redis if you need a strict global limit. */
const hits = new Map<string, number[]>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT.windowMs,
  );

  if (recent.length >= RATE_LIMIT.max) {
    hits.set(key, recent);
    const retryAfter = Math.ceil(
      (recent[0] + RATE_LIMIT.windowMs - now) / 1000,
    );
    return { ok: false as const, retryAfter };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(k);
    }
  }
  return { ok: true as const };
}

function cleanText(input: string) {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // control chars
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Feedback = { rating: number; comment: string; page: string | null };

function validate(
  input: unknown,
): { ok: true; data: Feedback } | { ok: false; message: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "Invalid request body." };
  }
  const { rating, comment, page } = input as Record<string, unknown>;

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    !MOODS[rating]
  ) {
    return { ok: false, message: "Rating must be a whole number from 1 to 4." };
  }
  if (typeof comment !== "string") {
    return { ok: false, message: "Comment is required." };
  }

  const text = cleanText(comment);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) {
    return { ok: false, message: `Please write at least ${MIN_WORDS} words.` };
  }
  if (text.length > MAX_COMMENT_CHARS) {
    return {
      ok: false,
      message: `Comment must be ${MAX_COMMENT_CHARS} characters or fewer.`,
    };
  }

  const safePage =
    typeof page === "string" && page.startsWith("/") && page.length <= 200
      ? cleanText(page)
      : null;

  return { ok: true, data: { rating, comment: text, page: safePage } };
}

/** Sends to a Discord webhook if configured; otherwise logs (handy in dev). */
async function deliver({ rating, comment, page }: Feedback) {
  const mood = MOODS[rating];
  const url = process.env.DISCORD_WEBHOOK_URL;

  if (!url) {
    console.info("[feedback]", { rating, page, comment });
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    body: JSON.stringify({
      username: "Daraja Feedback",
      allowed_mentions: { parse: [] }, // user text can never ping anyone
      embeds: [
        {
          title: `${mood.emoji} ${mood.label} (${rating}/4)`,
          description: comment,
          color: mood.color,
          fields: [{ name: "Page", value: page ?? "unknown", inline: true }],
          footer: { text: "Daraja SDK" },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
}

/* --------------------------------- Handler -------------------------------- */

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return fail(403, "forbidden_origin", "Request origin not allowed.");
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return fail(415, "unsupported_media_type", "Send JSON.");
  }

  const limit = checkRateLimit(visitorKey(req));
  if (!limit.ok) {
    return fail(
      429,
      "rate_limited",
      "Too many submissions. Please try again later.",
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return fail(400, "bad_request", "Could not read the request.");
  }
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return fail(413, "payload_too_large", "Feedback is too long.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_json", "Request body is not valid JSON.");
  }

  const result = validate(json);
  if (!result.ok) return fail(422, "validation_failed", result.message);

  try {
    await deliver(result.data);
  } catch (err) {
    console.error("[feedback] delivery failed:", err);
    return fail(
      502,
      "delivery_failed",
      "Couldn't send your feedback. Try again.",
    );
  }

  return respond({ ok: true });
}
