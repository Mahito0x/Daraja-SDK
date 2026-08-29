import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { DynamicQRClient } from "../src/endpoints/dynamic-qr";
import { DarajaError } from "../src/types/errors";
import type { DynamicQRRequest } from "../src/types/dynamic-qr";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_QR_REQUEST: DynamicQRRequest = {
  merchantName: "TEST SUPERMARKET",
  refNo: "Invoice Test",
  amount: 1,
  trxCode: "BG",
  cpi: "373132",
  size: 300,
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

describe("DynamicQRClient — request validation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and returns the parsed response", async () => {
    const fetchMock = vi
      .fn()
      // token fetch
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      // QR generate call
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ResponseCode: "00",
          RequestID: "16738-27456357-1",
          ResponseDescription: "QR Code Successfully Generated.",
          QRCode: "aGVsbG8=",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.dynamicQR.generate(VALID_QR_REQUEST);

    expect(result.ResponseDescription).toBe("QR Code Successfully Generated.");
    expect(DynamicQRClient.toDataUri(result)).toBe(
      "data:image/png;base64,aGVsbG8=",
    );

    // Confirm the wire body was transformed to Daraja's PascalCase shape.
    const qrCall = fetchMock.mock.calls[1];
    const sentBody = JSON.parse(qrCall[1].body);
    expect(sentBody).toEqual({
      MerchantName: "TEST SUPERMARKET",
      RefNo: "Invoice Test",
      Amount: 1,
      TrxCode: "BG",
      CPI: "373132",
      Size: "300",
    });
  });

  it("trims whitespace from string fields before sending", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ResponseCode: "00",
          RequestID: "x",
          ResponseDescription: "ok",
          QRCode: "abc",
        }),
      );
    const daraja = makeClient(fetchMock);

    await daraja.dynamicQR.generate({
      ...VALID_QR_REQUEST,
      merchantName: "  TEST SUPERMARKET  ",
      refNo: "  Invoice Test  ",
      cpi: " 373132 ",
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.MerchantName).toBe("TEST SUPERMARKET");
    expect(sentBody.RefNo).toBe("Invoice Test");
    expect(sentBody.CPI).toBe("373132");
  });

  it.each([
    ["missing", undefined],
    ["empty string", ""],
    ["whitespace only", "   "],
    ["wrong type (number)", 123 as unknown as string],
  ])("rejects merchantName: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicQR.generate({
          ...VALID_QR_REQUEST,
          merchantName: badValue as string,
        }),
      "INVALID_QR_REQUEST",
      "merchantName",
    );
  });

  it.each([
    ["missing", undefined],
    ["empty string", ""],
  ])("rejects refNo: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicQR.generate({
          ...VALID_QR_REQUEST,
          refNo: badValue as string,
        }),
      "INVALID_QR_REQUEST",
      "refNo",
    );
  });

  it.each([
    ["a string", "2000" as unknown as number],
    ["zero", 0],
    ["negative", -500],
    ["a decimal", 99.5],
    ["NaN", NaN],
    ["Infinity", Infinity],
  ])("rejects amount: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicQR.generate({
          ...VALID_QR_REQUEST,
          amount: badValue as number,
        }),
      "INVALID_QR_REQUEST",
      "amount",
    );
  });

  it("rejects an unrecognized trxCode", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicQR.generate({
          ...VALID_QR_REQUEST,
          trxCode: "XX" as never,
        }),
      "INVALID_QR_REQUEST",
      "trxCode",
    );
  });

  it.each(["BG", "WA", "PB", "SM", "SB"] as const)(
    "accepts trxCode: %s",
    async (trxCode) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
        )
        .mockResolvedValueOnce(
          jsonResponse(200, {
            ResponseCode: "00",
            RequestID: "x",
            ResponseDescription: "ok",
            QRCode: "abc",
          }),
        );
      const daraja = makeClient(fetchMock);
      await expect(
        daraja.dynamicQR.generate({ ...VALID_QR_REQUEST, trxCode }),
      ).resolves.toBeDefined();
    },
  );

  it("rejects a cpi containing non-digit characters", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.dynamicQR.generate({ ...VALID_QR_REQUEST, cpi: "37-3132" }),
      "INVALID_QR_REQUEST",
      "cpi",
    );
  });

  it("rejects an empty cpi", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.dynamicQR.generate({ ...VALID_QR_REQUEST, cpi: "" }),
      "INVALID_QR_REQUEST",
      "cpi",
    );
  });

  it.each([
    ["zero", 0],
    ["negative", -300],
    ["a decimal", 300.5],
    ["a string", "300" as unknown as number],
  ])("rejects size: %s", async (_label, badValue) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicQR.generate({
          ...VALID_QR_REQUEST,
          size: badValue as number,
        }),
      "INVALID_QR_REQUEST",
      "size",
    );
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.dynamicQR.generate(null as unknown as DynamicQRRequest),
      "INVALID_QR_REQUEST",
    );
  });

  it("propagates an upstream API error with Daraja-specific fields (ResultCode/ResultDesc)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(400, {
          ResultCode: "2001",
          ResultDesc: "Invalid Amount",
        }),
      );
    const daraja = makeClient(fetchMock);

    await expectDarajaError(
      () => daraja.dynamicQR.generate(VALID_QR_REQUEST),
      "2001",
      "Invalid Amount",
    );
  });
});
