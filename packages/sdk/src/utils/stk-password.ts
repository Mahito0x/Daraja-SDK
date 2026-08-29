/**
 * Generates a Daraja-format timestamp (`YYYYMMDDHHmmss`) in East Africa
 * Time (Africa/Nairobi, UTC+3, no DST) — regardless of the server's own
 * timezone. This matters: a server running in UTC (the vast majority of
 * cloud hosts) would otherwise produce a timestamp up to 3 hours off from
 * what Safaricom expects, which silently breaks Password validation since
 * the Timestamp is baked into the encoded Password itself.
 */
export function generateStkTimestamp(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23", // avoids the ICU "24:00" midnight bug some environments hit with hour12: false
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return `${map.year}${map.month}${map.day}${map.hour}${map.minute}${map.second}`;
}

/**
 * Encodes the STK Push `Password` field: Base64(ShortCode + Passkey + Timestamp).
 */
export function generateStkPassword(
  shortCode: string,
  passkey: string,
  timestamp: string,
): string {
  const raw = `${shortCode}${passkey}${timestamp}`;

  if (typeof btoa === "function") {
    return btoa(raw);
  }

  const nodeBuffer = (
    globalThis as unknown as {
      Buffer?: { from(str: string): { toString(enc: string): string } };
    }
  ).Buffer;

  if (nodeBuffer) {
    return nodeBuffer.from(raw).toString("base64");
  }

  throw new Error(
    "Unable to encode STK Push password. No suitable Base64 encoder found.",
  );
}
