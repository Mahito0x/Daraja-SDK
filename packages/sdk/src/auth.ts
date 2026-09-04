import type { ResolvedDarajaConfig } from "./types/config";
import type { OAuthTokenResponse, CachedToken } from "./types/auth";
import { DarajaError } from "./types/errors";

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
const WHITESPACE_REGEX = /\s/;

const PLACEHOLDER_VALUES = new Set([
  "YOUR_SANDBOX_CONSUMER_KEY",
  "YOUR_SANDBOX_CONSUMER_SECRET",
  "YOUR_CONSUMER_KEY",
  "YOUR_CONSUMER_SECRET",
  "CONSUMER_KEY",
  "CONSUMER_SECRET",
  "undefined",
  "null",
]);

// Catches variants like "your-consumer-key", "YOURCONSUMERKEY", "xxxx..." fillers.
const PLACEHOLDER_PATTERN = /^(your|xxxx|changeme|replace)/i;

const VALID_ENVIRONMENTS = ["sandbox", "production"] as const;

type CredentialField = "Consumer Key" | "Consumer Secret";

interface CredentialSpec {
  field: CredentialField;
  expectedLength: number;
  /** Length of the *other* credential, used to detect a key/secret swap. */
  counterpartLength: number;
}

/**
 * Manages OAuth 2.0 authentication, credential encoding,
 * and automatic token caching for Safaricom Daraja API.
 */
export class AuthManager {
  private cachedToken: CachedToken | null = null;

  constructor(private readonly config: ResolvedDarajaConfig) {
    this.validateConfig();
  }

  // ---------------------------------------------------------------------
  // Config validation (runs once, at construction time)
  // ---------------------------------------------------------------------

  /**
   * Validates environment and timeout eagerly so misconfiguration fails
   * immediately at `new Daraja(...)`, rather than surfacing later inside
   * an async call stack.
   */
  private validateConfig(): void {
    const env = this.config.environment;

    if (
      !VALID_ENVIRONMENTS.includes(env as (typeof VALID_ENVIRONMENTS)[number])
    ) {
      throw new DarajaError({
        message: `Invalid environment "${String(env)}". Must be either "sandbox" or "production".`,
        errorCode: "INVALID_ENVIRONMENT",
      });
    }

    const { timeout } = this.config;
    if (timeout !== undefined) {
      const isValidTimeout =
        typeof timeout === "number" && Number.isFinite(timeout) && timeout > 0;

      if (!isValidTimeout) {
        throw new DarajaError({
          message: `Invalid timeout "${String(timeout)}". Must be a positive finite number in milliseconds.`,
          errorCode: "INVALID_TIMEOUT",
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Credential sanitization & validation
  // ---------------------------------------------------------------------

  /**
   * Strips accidental outer quotes, hidden newlines/tabs, and surrounding
   * whitespace that commonly slip in from `.env` files or copy-paste.
   */
  private static sanitizeCredential(val: string): string {
    return val
      .trim()
      .replace(/^['"]|['"]$/g, "") // Strip surrounding single/double quotes
      .replace(/[\r\n\t]/g, "") // Strip hidden newline/tab characters
      .trim();
  }

  /**
   * Runs the full validation pipeline for a single credential and returns
   * the sanitized value, or throws a precise `DarajaError` describing
   * exactly what's wrong. Order matters: cheaper, more specific checks run
   * first so the error message points at the actual root cause.
   */
  private assertValidCredential(raw: unknown, spec: CredentialSpec): string {
    const { field, expectedLength, counterpartLength } = spec;

    // 1. Presence
    if (raw === undefined || raw === null || raw === "") {
      throw new DarajaError({
        message: `${field} is missing. Please provide a valid Daraja ${field}.`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    // 2. Type — catches numbers/objects/arrays passed by mistake
    if (typeof raw !== "string") {
      throw new DarajaError({
        message: `${field} must be a string, but received type "${typeof raw}".`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    const sanitized = AuthManager.sanitizeCredential(raw);

    // 3. Empty after sanitization (was whitespace/quotes only)
    if (!sanitized) {
      throw new DarajaError({
        message: `${field} is empty or contains only quotes/whitespace.`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    // 4. Placeholder detection (exact match or common "fill me in" pattern)
    if (
      PLACEHOLDER_VALUES.has(sanitized) ||
      PLACEHOLDER_PATTERN.test(sanitized)
    ) {
      throw new DarajaError({
        message: `${field} still contains a placeholder value ("${sanitized}"). Replace it with your real Daraja ${field}.`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    // 5. Internal whitespace — distinct from "invalid characters" because
    //    it almost always means a copy-paste/line-wrap error, not a typo.
    if (WHITESPACE_REGEX.test(sanitized)) {
      throw new DarajaError({
        message: `${field} contains internal whitespace. Check for line breaks or spaces introduced during copy-paste.`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    // 6. Character set
    if (!ALPHANUMERIC_REGEX.test(sanitized)) {
      const invalidChars = [
        ...new Set(sanitized.replace(/[a-zA-Z0-9]/g, "")),
      ].join("");
      throw new DarajaError({
        message: `${field} contains invalid character(s): "${invalidChars}". Only letters and numbers are allowed.`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    // 7. Length (with a swap hint if it matches the *other* field's length)
    if (sanitized.length !== expectedLength) {
      const diff = Math.abs(sanitized.length - expectedLength);
      const unit = diff === 1 ? "character" : "characters";
      const direction =
        sanitized.length > expectedLength ? "too long" : "too short";
      const sizeHint = `${diff} ${unit} ${direction}`;
      const swapHint =
        sanitized.length === counterpartLength
          ? ` This matches the expected length of the other credential. Did you swap Consumer Key and Consumer Secret?`
          : "";

      throw new DarajaError({
        message: `${field} must be exactly ${expectedLength} characters (received ${sanitized.length}, ${sizeHint}).${swapHint}`,
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    return sanitized;
  }

  /**
   * Sanitizes and validates Consumer Key & Secret against Daraja standards.
   * Throws a descriptive DarajaError instantly on the first format mismatch.
   */
  private getSanitizedCredentials(): { key: string; secret: string } {
    const key = this.assertValidCredential(this.config.consumerKey, {
      field: "Consumer Key",
      expectedLength: 48,
      counterpartLength: 64,
    });

    const secret = this.assertValidCredential(this.config.consumerSecret, {
      field: "Consumer Secret",
      expectedLength: 64,
      counterpartLength: 48,
    });

    // Cross-field check: same value pasted into both fields.
    if (key === secret) {
      throw new DarajaError({
        message:
          "Consumer Key and Consumer Secret are identical. Check that you have not pasted the same value into both fields.",
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    return { key, secret };
  }

  /**
   * Encodes Consumer Key and Consumer Secret to a Base64 string.
   */
  private getBasicAuthHeader(): string {
    const { key, secret } = this.getSanitizedCredentials();
    const credentials = `${key}:${secret}`;

    if (typeof btoa === "function") {
      return btoa(credentials);
    }

    const nodeBuffer = (
      globalThis as unknown as {
        Buffer?: { from(str: string): { toString(enc: string): string } };
      }
    ).Buffer;

    if (nodeBuffer) {
      return nodeBuffer.from(credentials).toString("base64");
    }

    throw new DarajaError({
      message:
        "Unable to encode credentials. No suitable Base64 encoder found.",
      errorCode: "BASE64_ENCODING_ERROR",
    });
  }

  /**
   * Resolves the base URL depending on the configured environment.
   */
  private getBaseUrl(): string {
    return this.config.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  /**
   * Returns a valid access token.
   */
  public async getAccessToken(): Promise<string> {
    const now = Date.now();
    const SAFETY_BUFFER_MS = 60 * 1000;

    if (
      this.cachedToken &&
      now < this.cachedToken.expiresAt - SAFETY_BUFFER_MS
    ) {
      return this.cachedToken.token;
    }

    return await this.fetchNewAccessToken();
  }

  /**
   * Calls the Daraja `/oauth/v1/generate` endpoint using Basic Authentication.
   */
  private async fetchNewAccessToken(): Promise<string> {
    const basicAuth = this.getBasicAuthHeader();
    const url = `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data: Record<string, unknown> = {};

      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { rawText };
        }
      }

      if (!response.ok) {
        throw new DarajaError({
          message:
            (data.errorMessage as string) ||
            (data.message as string) ||
            `Authentication failed with status ${response.status}.`,
          statusCode: response.status,
          errorCode:
            (data.errorCode as string) || "OAUTH_AUTHENTICATION_FAILED",
          endpoint: "/oauth/v1/generate",
          rawResponse: data,
        });
      }

      const tokenResponse = data as unknown as OAuthTokenResponse;
      const expiresInSeconds = Number(tokenResponse.expires_in);

      if (!tokenResponse.access_token || !Number.isFinite(expiresInSeconds)) {
        throw new DarajaError({
          message:
            "Daraja returned a 200 response with an unexpected body shape (missing access_token or expires_in).",
          errorCode: "MALFORMED_OAUTH_RESPONSE",
          endpoint: "/oauth/v1/generate",
          rawResponse: data,
        });
      }

      const expiresAt = Date.now() + expiresInSeconds * 1000;

      this.cachedToken = {
        token: tokenResponse.access_token,
        expiresAt,
      };

      return this.cachedToken.token;
    } catch (error) {
      if (error instanceof DarajaError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new DarajaError({
          message: `OAuth authentication request timed out after ${this.config.timeout}ms.`,
          errorCode: "REQUEST_TIMEOUT",
        });
      }

      throw new DarajaError({
        message:
          error instanceof Error
            ? error.message
            : "An unknown network error occurred.",
        errorCode: "NETWORK_ERROR",
        rawResponse: error,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Manually invalidates the cached token.
   */
  public clearCache(): void {
    this.cachedToken = null;
  }
}
