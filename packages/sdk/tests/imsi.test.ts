import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { IMSIClient } from "../src/endpoints/imsi";
import { DarajaError } from "../src/types/errors";
import type { IMSIRequest, IMSIResponseV1 } from "../src/types/imsi";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_IMSI_REQUEST: IMSIRequest = {
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

describe("IMSIClient — checkV1", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and returns the parsed V1 response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          requestRefID: "971f-4359-b611-6845a1be45ef280786",
          responseCode: "200",
          responseDesc: "Success",
          imsi: "9233817055099406",
          lastSwapDate: "01-05-2022",
          msisdnRegistrationDate: "01-03-2022",
          customerNumber: "254722000000",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.imsi.checkV1(VALID_IMSI_REQUEST);

    expect(result.imsi).toBe("9233817055099406");
    expect(IMSIClient.wasRecentlySwapped(result)).toBe(true);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody).toEqual({ customerNumber: "254722000000" });
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.imsi.checkV1(null as unknown as IMSIRequest),
      "INVALID_IMSI_REQUEST",
    );
  });

  it.each([
    ["missing", undefined],
    ["empty string", ""],
    ["too short", "25470837"],
    ["non-numeric", "25470abcdef"],
    ["missing country code", "0722000000"],
  ])("rejects customerNumber: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.imsi.checkV1({ customerNumber: badValue as string }),
      "INVALID_IMSI_REQUEST",
      "customerNumber",
    );
  });

  it("IMSIClient.wasRecentlySwapped identifies a real swap date vs the sentinel", () => {
    const noSwap: IMSIResponseV1 = {
      requestRefID: "1",
      responseCode: "200",
      responseDesc: "Success",
      imsi: "x",
      lastSwapDate: "01-01-1900 00:00",
      msisdnRegistrationDate: "01-03-2022",
      customerNumber: "254722000000",
    };
    const recentSwap: IMSIResponseV1 = {
      ...noSwap,
      lastSwapDate: "02-07-2026",
    };

    expect(IMSIClient.wasRecentlySwapped(noSwap)).toBe(false);
    expect(IMSIClient.wasRecentlySwapped(recentSwap)).toBe(true);
  });
});

describe("IMSIClient — checkV2", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and returns the parsed V2 response (no swap date)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          requestRefID: "93b1-4738-94b2-52a821a080656018",
          responseCode: "200",
          responseDesc: "Success!",
          imsi: "5814906447239506",
          customerNumber: "254707727976",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.imsi.checkV2({
      customerNumber: "254707727976",
    });

    expect(result.imsi).toBe("5814906447239506");
    expect(
      (result as unknown as Record<string, unknown>).lastSwapDate,
    ).toBeUndefined();
  });

  it("rejects an invalid customerNumber the same way as checkV1", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.imsi.checkV2({ customerNumber: "not-a-number" }),
      "INVALID_IMSI_REQUEST",
      "customerNumber",
    );
  });
});
