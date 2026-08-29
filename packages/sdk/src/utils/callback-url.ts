import { DarajaError } from "../types/errors";
import type { ResolvedDarajaConfig } from "../types/config";

// See SUGGESTIONS_MAP['INVALID_CALLBACK_URL'] in types/errors.ts for the
// user-facing summary of these rules.
const BANNED_KEYWORDS = ["mpesa", "safaricom", "exec", "sql"];
const BANNED_TUNNEL_HOSTS = [
  "ngrok.io",
  "ngrok-free.app",
  "ngrok.app",
  "mockbin.org",
  "requestbin.com",
  "requestbin.net",
];

/**
 * Validates a Daraja callback URL (used by C2B registerUrl and M-Pesa
 * Express STK push) and returns it trimmed. Throws a DarajaError with
 * errorCode `INVALID_CALLBACK_URL` describing exactly what's wrong.
 */
export function validateCallbackUrl(
  url: unknown,
  fieldName: string,
  environment: ResolvedDarajaConfig["environment"],
): string {
  if (typeof url !== "string" || !url.trim()) {
    throw new DarajaError({
      message: `${fieldName} is required and must be a non-empty string.`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new DarajaError({
      message: `${fieldName} must be a valid, publicly reachable URL, but received "${trimmed}".`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new DarajaError({
      message: `${fieldName} must be a valid, publicly reachable URL, but received "${trimmed}".`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  if (environment === "production" && parsed.protocol !== "https:") {
    throw new DarajaError({
      message: `${fieldName} must use HTTPS in production, but received "${trimmed}".`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  const lowerUrl = trimmed.toLowerCase();
  const bannedKeyword = BANNED_KEYWORDS.find((word) => lowerUrl.includes(word));
  if (bannedKeyword) {
    throw new DarajaError({
      message: `${fieldName} contains a disallowed keyword ("${bannedKeyword}"). Safaricom rejects callback URLs containing: ${BANNED_KEYWORDS.join(", ")}.`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  const hostname = parsed.hostname.toLowerCase();
  const bannedHost = BANNED_TUNNEL_HOSTS.find(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
  if (bannedHost) {
    throw new DarajaError({
      message: `${fieldName} points at a public URL tunneling service ("${hostname}"), which Safaricom does not allow. Use a real domain instead.`,
      errorCode: "INVALID_CALLBACK_URL",
    });
  }

  return trimmed;
}
