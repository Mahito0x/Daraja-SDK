// Written and maintained by Claude

// Assumes Vitest (common for pnpm TS monorepos). If this project uses Jest
// instead, replace `import { vi } from 'vitest'` with the Jest globals and
// swap `vi.fn()` / `vi.spyOn()` for `jest.fn()` / `jest.spyOn()` — the rest
// of the suite is framework-agnostic.

import { describe, it, expect, afterEach, vi } from "vitest";
import { AuthManager } from "../src/auth";
import { DarajaError } from "../src/types/errors";
import type { ResolvedDarajaConfig } from "../src/types/config";

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

// Deterministic, exact-length, alphanumeric-only fixtures (48 / 64 chars).
// Do NOT reuse the values from your .env in tests — keep test fixtures
// separate from real credentials.
const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

function buildConfig(
  overrides: Partial<ResolvedDarajaConfig> = {},
): ResolvedDarajaConfig {
  return {
    consumerKey: VALID_KEY,
    consumerSecret: VALID_SECRET,
    environment: "sandbox",
    timeout: 10_000,
    ...overrides,
  } as ResolvedDarajaConfig;
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

async function expectDarajaError(
  fn: () => unknown,
  errorCode: string,
  messageContains?: string,
) {
  try {
    await fn();
    throw new Error("Expected function to throw, but it did not.");
  } catch (err) {
    expect(err).toBeInstanceOf(DarajaError);
    expect((err as DarajaError).errorCode).toBe(errorCode);
    if (messageContains) {
      expect((err as DarajaError).message).toContain(messageContains);
    }
  }
}

// ---------------------------------------------------------------------
// Config validation (constructor)
// ---------------------------------------------------------------------

describe("AuthManager — config validation", () => {
  it("constructs successfully with a valid config", () => {
    expect(() => new AuthManager(buildConfig())).not.toThrow();
  });

  it('accepts "production" as a valid environment', () => {
    expect(
      () => new AuthManager(buildConfig({ environment: "production" })),
    ).not.toThrow();
  });

  it("rejects an unrecognized environment", async () => {
    await expectDarajaError(
      () => new AuthManager(buildConfig({ environment: "staging" as never })),
      "INVALID_ENVIRONMENT",
      "staging",
    );
  });

  it("rejects a missing/undefined environment", async () => {
    await expectDarajaError(
      () => new AuthManager(buildConfig({ environment: undefined as never })),
      "INVALID_ENVIRONMENT",
    );
  });

  it.each([
    ["zero", 0],
    ["negative", -1000],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["a string", "5000" as unknown as number],
  ])("rejects an invalid timeout: %s", async (_label, badTimeout) => {
    await expectDarajaError(
      () => new AuthManager(buildConfig({ timeout: badTimeout as number })),
      "INVALID_TIMEOUT",
    );
  });

  it("allows omitting timeout entirely", () => {
    const config = buildConfig();
    delete (config as Partial<ResolvedDarajaConfig>).timeout;
    expect(() => new AuthManager(config)).not.toThrow();
  });
});

// ---------------------------------------------------------------------
// Credential validation (triggered lazily via getAccessToken)
// ---------------------------------------------------------------------

describe("AuthManager — credential validation", () => {
  // Credential checks only run when a token is actually requested, so we
  // drive them through getAccessToken() rather than the constructor.
  const attempt = (overrides: Partial<ResolvedDarajaConfig>) =>
    new AuthManager(buildConfig(overrides)).getAccessToken();

  it("rejects a missing consumer key", async () => {
    await expectDarajaError(
      () => attempt({ consumerKey: undefined as unknown as string }),
      "INVALID_CREDENTIALS",
      "Consumer Key is missing",
    );
  });

  it("rejects a missing consumer secret", async () => {
    await expectDarajaError(
      () => attempt({ consumerSecret: null as unknown as string }),
      "INVALID_CREDENTIALS",
      "Consumer Secret is missing",
    );
  });

  it("rejects a non-string consumer key (e.g. accidentally passed a number)", async () => {
    await expectDarajaError(
      () => attempt({ consumerKey: 123456 as unknown as string }),
      "INVALID_CREDENTIALS",
      'must be a string, but received type "number"',
    );
  });

  it("rejects a non-string consumer secret (e.g. accidentally passed an object)", async () => {
    await expectDarajaError(
      () => attempt({ consumerSecret: {} as unknown as string }),
      "INVALID_CREDENTIALS",
      'must be a string, but received type "object"',
    );
  });

  it("rejects a whitespace-only key", async () => {
    await expectDarajaError(
      () => attempt({ consumerKey: "     " }),
      "INVALID_CREDENTIALS",
      "is empty or contains only quotes/whitespace",
    );
  });

  it('rejects a quotes-only key (e.g. `""` pasted literally from .env)', async () => {
    await expectDarajaError(
      () => attempt({ consumerKey: '""' }),
      "INVALID_CREDENTIALS",
      "is empty or contains only quotes/whitespace",
    );
  });

  it("strips accidental surrounding quotes and still validates a good key", async () => {
    // Sanity check: `"${VALID_KEY}"` should sanitize down to VALID_KEY and pass,
    // proving quote-stripping doesn't accidentally corrupt valid input.
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      );
    const manager = new AuthManager(
      buildConfig({ consumerKey: `"${VALID_KEY}"` }),
    );
    await expect(manager.getAccessToken()).resolves.toBe("tok");
  });

  it.each([
    "YOUR_SANDBOX_CONSUMER_KEY",
    "YOUR_CONSUMER_KEY",
    "your_consumer_key_here",
    "CHANGEME",
  ])("rejects placeholder value: %s", async (placeholder) => {
    await expectDarajaError(
      () => attempt({ consumerKey: placeholder }),
      "INVALID_CREDENTIALS",
      "placeholder value",
    );
  });

  it("rejects a key containing internal whitespace (line-wrap / copy-paste artifact)", async () => {
    const brokenKey = `${VALID_KEY.slice(0, 24)} ${VALID_KEY.slice(24)}`;
    await expectDarajaError(
      () => attempt({ consumerKey: brokenKey }),
      "INVALID_CREDENTIALS",
      "internal whitespace",
    );
  });

  it("rejects a key with invalid characters and names the offending characters", async () => {
    const badKey = `${VALID_KEY.slice(0, -2)}-_`;
    await expectDarajaError(
      () => attempt({ consumerKey: badKey }),
      "INVALID_CREDENTIALS",
      'invalid character(s): "-_"',
    );
  });

  it("rejects a consumer key that is too short, with an exact character count", async () => {
    const shortKey = VALID_KEY.slice(0, 47); // 47 instead of 48
    await expectDarajaError(
      () => attempt({ consumerKey: shortKey }),
      "INVALID_CREDENTIALS",
      "received 47, 1 character too short",
    );
  });

  it("rejects a consumer secret that is too long, with an exact character count", async () => {
    const longSecret = `${VALID_SECRET}AB`; // 66 instead of 64
    await expectDarajaError(
      () => attempt({ consumerSecret: longSecret }),
      "INVALID_CREDENTIALS",
      "received 66, 2 characters too long",
    );
  });

  it("hints at a possible key/secret swap when lengths match the other field", async () => {
    // A 64-char value in the Key slot is exactly the Secret's expected length.
    await expectDarajaError(
      () => attempt({ consumerKey: VALID_SECRET }),
      "INVALID_CREDENTIALS",
      "Did you swap Consumer Key and Consumer Secret",
    );
  });

  it("does not throw for a fully valid key/secret pair (sanity check)", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      );
    const manager = new AuthManager(buildConfig());
    await expect(manager.getAccessToken()).resolves.toBe("tok");
  });
});

// ---------------------------------------------------------------------
// Token fetching & caching
// ---------------------------------------------------------------------

describe("AuthManager — token fetch & cache behavior", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches a token and sends correct Basic auth + sandbox URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "abc123", expires_in: 3600 }),
      );
    global.fetch = fetchMock;

    const manager = new AuthManager(buildConfig({ environment: "sandbox" }));
    const token = await manager.getAccessToken();

    expect(token).toBe("abc123");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    );

    const expectedAuth = Buffer.from(`${VALID_KEY}:${VALID_SECRET}`).toString(
      "base64",
    );
    expect(options.headers.Authorization).toBe(`Basic ${expectedAuth}`);
  });

  it('hits the production URL when environment is "production"', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "abc123", expires_in: 3600 }),
      );
    global.fetch = fetchMock;

    const manager = new AuthManager(buildConfig({ environment: "production" }));
    await manager.getAccessToken();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    );
  });

  it("caches the token and does not refetch before expiry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "cached-token", expires_in: 3600 }),
      );
    global.fetch = fetchMock;

    const manager = new AuthManager(buildConfig());
    const first = await manager.getAccessToken();
    const second = await manager.getAccessToken();

    expect(first).toBe("cached-token");
    expect(second).toBe("cached-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cached token is within the safety buffer of expiring", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "first-token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "second-token", expires_in: 3600 }),
      );
    global.fetch = fetchMock;

    const realNow = Date.now();
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(realNow);

    const manager = new AuthManager(buildConfig());
    const first = await manager.getAccessToken();
    expect(first).toBe("first-token");

    // Jump forward past expiry (3600s) minus the 60s safety buffer.
    nowSpy.mockReturnValue(realNow + 3600_000);

    const second = await manager.getAccessToken();
    expect(second).toBe("second-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refetches immediately after clearCache() is called", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "first-token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "second-token", expires_in: 3600 }),
      );
    global.fetch = fetchMock;

    const manager = new AuthManager(buildConfig());
    await manager.getAccessToken();
    manager.clearCache();
    const second = await manager.getAccessToken();

    expect(second).toBe("second-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a DarajaError with the upstream errorCode on a non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        errorCode: "400.008.01",
        errorMessage: "Invalid Authentication passed",
      }),
    );

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "400.008.01",
      "Invalid Authentication passed",
    );
  });

  it("falls back to a generic message when the error body has no errorMessage/message", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(500, {}));

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "OAUTH_AUTHENTICATION_FAILED",
      "Authentication failed with status 500",
    );
  });

  it("handles a non-JSON error body without throwing a parse error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => "<html>Bad Gateway</html>",
    } as Response);

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "OAUTH_AUTHENTICATION_FAILED",
    );
  });

  it("rejects a 200 response missing access_token as a malformed response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { expires_in: 3600 }));

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "MALFORMED_OAUTH_RESPONSE",
    );
  });

  it("rejects a 200 response with a non-numeric expires_in as a malformed response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: "tok", expires_in: "soon" }),
      );

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "MALFORMED_OAUTH_RESPONSE",
    );
  });

  it("throws REQUEST_TIMEOUT when the request exceeds the configured timeout", async () => {
    global.fetch = vi.fn().mockImplementation(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        }),
    );

    const manager = new AuthManager(buildConfig({ timeout: 20 }));
    await expectDarajaError(
      () => manager.getAccessToken(),
      "REQUEST_TIMEOUT",
      "20ms",
    );
  });

  it("wraps an unexpected network failure as NETWORK_ERROR", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    const manager = new AuthManager(buildConfig());
    await expectDarajaError(
      () => manager.getAccessToken(),
      "NETWORK_ERROR",
      "getaddrinfo ENOTFOUND",
    );
  });
});
