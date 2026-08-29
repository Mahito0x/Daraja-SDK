import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { SwapClient } from "../src/endpoints/swap";
import { DarajaError } from "../src/types/errors";
import type { SwapRequest, SwapResponse } from "../src/types/swap";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_SWAP_REQUEST: SwapRequest = {
  customerNumber: "254722000000",
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
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

function makeClient(fetchImpl: typeof fetch) {
  global.fetch = fetchImpl as typeof fetch;
  return new Daraja({ consumerKey: VALID_KEY, consumerSecret: VALID_SECRET });
}

describe("SwapClient — request validation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and returns the parsed response", async () => {
    const fetchMock = vi
      .fn()
      // token fetch
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      // swap check call
      .mockResolvedValueOnce(
        jsonResponse(200, {
          requestRefID: "4277-415525-1",
          responseCode: "200",
          responseDesc: "Success",
          lastSwapDate: "01-01-1900 00:00",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.swap.check(VALID_SWAP_REQUEST);

    expect(result.responseDesc).toBe("Success");
    expect(SwapClient.wasRecentlySwapped(result)).toBe(false);

    const swapCall = fetchMock.mock.calls[1];
    expect(swapCall[0]).toBe(
      "https://sandbox.safaricom.co.ke/imsi/v2/checkATI",
    );
    const sentBody = JSON.parse(swapCall[1].body);
    expect(sentBody).toEqual({ customerNumber: "254722000000" });
  });

  it("trims whitespace from customerNumber before sending", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          requestRefID: "x",
          responseCode: "200",
          responseDesc: "Success",
          lastSwapDate: "15-06-2026 10:30",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.swap.check({
      customerNumber: "  254722000000  ",
    });

    expect(SwapClient.wasRecentlySwapped(result)).toBe(true);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.customerNumber).toBe("254722000000");
  });

  it.each([
    ["missing", undefined],
    ["empty string", ""],
    ["whitespace only", "   "],
    ["wrong type (number)", 254722000000 as unknown as string],
    ["too short", "25470837"],
    ["too long", "2547083741499"],
    ["non-numeric", "25470abcdef"],
    ["missing country code", "0722000000"],
  ])("rejects customerNumber: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.swap.check({ customerNumber: badValue as string }),
      "INVALID_SWAP_REQUEST",
      "customerNumber",
    );
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.swap.check(null as unknown as SwapRequest),
      "INVALID_SWAP_REQUEST",
    );
  });

  it("propagates an upstream API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(400, {
          message: "Bad Request",
        }),
      );
    const daraja = makeClient(fetchMock);

    await expectDarajaError(
      () => daraja.swap.check(VALID_SWAP_REQUEST),
      "API_REQUEST_FAILED",
      "Bad Request",
    );
  });

  it("SwapClient.wasRecentlySwapped identifies a real swap date vs the sentinel", () => {
    const noSwap: SwapResponse = {
      requestRefID: "1",
      responseCode: "200",
      responseDesc: "Success",
      lastSwapDate: "01-01-1900 00:00",
    };
    const recentSwap: SwapResponse = {
      ...noSwap,
      lastSwapDate: "02-07-2026 09:15",
    };

    expect(SwapClient.wasRecentlySwapped(noSwap)).toBe(false);
    expect(SwapClient.wasRecentlySwapped(recentSwap)).toBe(true);
  });
});
