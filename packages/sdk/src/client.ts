import { AuthManager } from "./auth";
import type { ResolvedDarajaConfig } from "./types/config";
import { DarajaError } from "./types/errors";

/**
 * Low-level HTTP Client that handles automatic Bearer authentication,
 * base URL resolution, and standardized error parsing for Daraja API endpoints.
 */
export class HttpClient {
  public readonly auth: AuthManager;

  constructor(private readonly config: ResolvedDarajaConfig) {
    this.auth = new AuthManager(config);
  }

  /**
   * Resolves the base URL based on configured environment.
   */
  private getBaseUrl(): string {
    return this.config.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  /**
   * Exposes the configured environment to endpoint classes that need to
   * change validation behavior between sandbox and production (e.g.
   * enforcing HTTPS callback URLs, or blocking sandbox-only operations).
   */
  public getEnvironment(): ResolvedDarajaConfig["environment"] {
    return this.config.environment;
  }

  /**
   * Makes an authenticated HTTP request to the Daraja API.
   * Automatically injects the Bearer token via AuthManager.
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = `${this.getBaseUrl()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        signal: options.signal ?? controller.signal,
      });

      // Read as text first — Daraja (or an intermediary proxy/WAF) can return
      // a non-JSON body (e.g. an HTML error page) on failures, and blindly
      // calling response.json() would throw a raw SyntaxError that masks the
      // real HTTP status and gets misreported as a generic NETWORK_ERROR.
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
            (data.ResultDesc as string) ||
            (data.message as string) ||
            (data.rawText
              ? `Daraja API request failed with status ${response.status}. Response was not JSON (received "${
                  typeof data.rawText === "string"
                    ? data.rawText.slice(0, 120)
                    : ""
                }...").`
              : `Daraja API request failed with status ${response.status}.`),
          statusCode: response.status,
          errorCode:
            (data.errorCode as string) ||
            (data.ResultCode as string) ||
            "API_REQUEST_FAILED",
          endpoint,
          rawResponse: data,
        });
      }

      return data as T;
    } catch (error) {
      if (error instanceof DarajaError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new DarajaError({
          message: `Request to ${endpoint} timed out after ${this.config.timeout}ms.`,
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
}
