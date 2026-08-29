import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { MobileNumberValidationClient } from "../src/endpoints/mobile-number-validation";
import { DarajaError } from "../src/types/errors";
import type { MobileNumberValidationRequest } from "../src/types/mobile-number-validation";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_REQUEST: MobileNumberValidationRequest = {
  requestRefID: "test-ref-1",
  shortCode: "12345",
  msisdn: "254710860780",
  idType: "01",
  idNumber: "454353453",
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

describe("MobileNumberValidationClient — validate", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and sends the correct wire body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          responseRefID: "1771929697",
          responseCode: "4000",
          responseMessage: "Details match successfully",
          status: "true",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.mobileNumberValidation.validate(VALID_REQUEST);

    expect(MobileNumberValidationClient.isMatch(result)).toBe(true);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody).toEqual({
      requestRefID: "test-ref-1",
      shortCode: "12345",
      msisdn: "254710860780",
      idType: "01",
      idNumber: "454353453",
    });
  });

  it("auto-generates requestRefID when omitted", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          responseRefID: "x",
          responseCode: "4001",
          responseMessage: "Details do not match",
          status: "false",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.mobileNumberValidation.validate({
      shortCode: "12345",
      msisdn: "254710860780",
      idType: "01",
      idNumber: "454353453",
    });

    expect(MobileNumberValidationClient.isMatch(result)).toBe(false);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(typeof sentBody.requestRefID).toBe("string");
    expect(sentBody.requestRefID.length).toBeGreaterThan(0);
  });

  it.each([
    ["missing country code", "0710860780"],
    ["too short", "25470837"],
    ["non-numeric", "25470abcdef"],
  ])("rejects an invalid msisdn: %s", async (_label, badMsisdn) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.mobileNumberValidation.validate({
          ...VALID_REQUEST,
          msisdn: badMsisdn,
        }),
      "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      "msisdn",
    );
  });

  it.each([
    ["too short (4 digits)", "1234"],
    ["non-numeric", "ABCDE"],
  ])("rejects an invalid shortCode: %s", async (_label, badShortCode) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.mobileNumberValidation.validate({
          ...VALID_REQUEST,
          shortCode: badShortCode,
        }),
      "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      "shortCode",
    );
  });

  it("rejects an unrecognized idType", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.mobileNumberValidation.validate({
          ...VALID_REQUEST,
          idType: "99" as never,
        }),
      "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      "idType",
    );
  });

  it("rejects a non-numeric idNumber", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.mobileNumberValidation.validate({
          ...VALID_REQUEST,
          idNumber: "not-a-number",
        }),
      "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      "idNumber",
    );
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.mobileNumberValidation.validate(
          null as unknown as MobileNumberValidationRequest,
        ),
      "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
    );
  });

  it("propagates an upstream API error (e.g. subscription not available)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(403, {
          errorCode: "403.001",
          errorMessage: "subscription_not_available",
        }),
      );
    const daraja = makeClient(fetchMock);

    await expectDarajaError(
      () => daraja.mobileNumberValidation.validate(VALID_REQUEST),
      "403.001",
      "subscription_not_available",
    );
  });
});
