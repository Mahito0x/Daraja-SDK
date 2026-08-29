import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { DarajaError } from "../src/types/errors";
import type { StkPushRequest } from "../src/types/mpesa-express";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_PUSH_REQUEST: StkPushRequest = {
  businessShortCode: "174379",
  passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254722000000",
  partyB: "174379",
  phoneNumber: "254722111111",
  callBackURL: "https://example.com/callbacks/stk",
  accountReference: "accountref",
  transactionDesc: "txndesc",
};

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

function makeClient(
  fetchImpl: typeof fetch,
  environment: "sandbox" | "production" = "sandbox",
) {
  global.fetch = fetchImpl as typeof fetch;
  // Uses the no-`new` call style — this is how the SDK is meant to be used.
  return Daraja({
    consumerKey: VALID_KEY,
    consumerSecret: VALID_SECRET,
    environment,
  });
}

function withTokenThen(responseBody: unknown, status = 200) {
  return vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
    )
    .mockResolvedValueOnce(jsonResponse(status, responseBody));
}

describe("Daraja.stkPush (M-Pesa Express push)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is available directly on the Daraja instance (no sub-client needed)", () => {
    const daraja = makeClient(vi.fn());
    expect(typeof daraja.stkPush).toBe("function");
    expect(typeof daraja.stkPushQuery).toBe("function");
    // Still available via the namespaced client too, for symmetry.
    expect(typeof daraja.mpesaExpress.push).toBe("function");
  });

  it("accepts a fully valid request and sends the correct wire body", async () => {
    const fetchMock = withTokenThen({
      MerchantRequestID: "2654-4b64-97ff-b827b542881d3130",
      CheckoutRequestID: "ws_CO_1007202409152617172396192",
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing",
    });
    const daraja = makeClient(fetchMock);

    const result = await daraja.stkPush(VALID_PUSH_REQUEST);
    expect(result.CustomerMessage).toBe(
      "Success. Request accepted for processing",
    );

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.BusinessShortCode).toBe(174379);
    expect(sentBody.TransactionType).toBe("CustomerPayBillOnline");
    expect(sentBody.Amount).toBe(1);
    expect(sentBody.PartyA).toBe(254722000000);
    expect(sentBody.PartyB).toBe(174379);
    expect(sentBody.PhoneNumber).toBe(254722111111);
    expect(sentBody.CallBackURL).toBe("https://example.com/callbacks/stk");
    expect(sentBody.AccountReference).toBe("accountref");
    expect(sentBody.TransactionDesc).toBe("txndesc");
    // Password/Timestamp are generated — just confirm they're present and shaped right.
    expect(sentBody.Timestamp).toMatch(/^\d{14}$/);
    expect(typeof sentBody.Password).toBe("string");
    expect(sentBody.Password.length).toBeGreaterThan(0);
  });

  it("generates Password as Base64(ShortCode + Passkey + Timestamp)", async () => {
    const fetchMock = withTokenThen({
      MerchantRequestID: "x",
      CheckoutRequestID: "x",
      ResponseCode: "0",
      ResponseDescription: "ok",
      CustomerMessage: "ok",
    });
    const daraja = makeClient(fetchMock);
    await daraja.stkPush(VALID_PUSH_REQUEST);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const decoded = Buffer.from(sentBody.Password, "base64").toString("utf-8");
    expect(decoded).toBe(
      `174379${VALID_PUSH_REQUEST.passkey}${sentBody.Timestamp}`,
    );
  });

  it('defaults transactionDesc to "Payment" when omitted', async () => {
    const fetchMock = withTokenThen({
      MerchantRequestID: "x",
      CheckoutRequestID: "x",
      ResponseCode: "0",
      ResponseDescription: "ok",
      CustomerMessage: "ok",
    });
    const daraja = makeClient(fetchMock);
    const { transactionDesc: _transactionDesc, ...withoutDesc } =
      VALID_PUSH_REQUEST;
    await daraja.stkPush(withoutDesc);

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.TransactionDesc).toBe("Payment");
  });

  it("rejects a missing passkey", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.stkPush({ ...VALID_PUSH_REQUEST, passkey: "" }),
      "INVALID_STK_REQUEST",
      "passkey is required",
    );
  });

  it.each([
    ["too short", "1234"],
    ["too long", "12345678"],
    ["non-numeric", "ABCDEF"],
  ])("rejects an invalid businessShortCode: %s", async (_label, badCode) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({ ...VALID_PUSH_REQUEST, businessShortCode: badCode }),
      "INVALID_STK_REQUEST",
      "businessShortCode",
    );
  });

  it("rejects an unrecognized transactionType", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({
          ...VALID_PUSH_REQUEST,
          transactionType: "Nope" as never,
        }),
      "INVALID_STK_REQUEST",
      "transactionType must be one of",
    );
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["a decimal", 1.5],
    ["above the 250,000 limit", 250_001],
  ])("rejects an invalid amount: %s", async (_label, badAmount) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({ ...VALID_PUSH_REQUEST, amount: badAmount as number }),
      "INVALID_STK_REQUEST",
    );
  });

  it("accepts the minimum amount (1 KES)", async () => {
    const fetchMock = withTokenThen({
      MerchantRequestID: "x",
      CheckoutRequestID: "x",
      ResponseCode: "0",
      ResponseDescription: "ok",
      CustomerMessage: "ok",
    });
    const daraja = makeClient(fetchMock);
    await expect(
      daraja.stkPush({ ...VALID_PUSH_REQUEST, amount: 1 }),
    ).resolves.toBeDefined();
  });

  it("accepts the maximum amount (250,000 KES)", async () => {
    const fetchMock = withTokenThen({
      MerchantRequestID: "x",
      CheckoutRequestID: "x",
      ResponseCode: "0",
      ResponseDescription: "ok",
      CustomerMessage: "ok",
    });
    const daraja = makeClient(fetchMock);
    await expect(
      daraja.stkPush({ ...VALID_PUSH_REQUEST, amount: 250_000 }),
    ).resolves.toBeDefined();
  });

  it.each([
    ["missing country code", "0722000000"],
    ["too short", "25470837"],
    ["non-numeric", "25470abcdef"],
  ])("rejects an invalid partyA: %s", async (_label, badPartyA) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.stkPush({ ...VALID_PUSH_REQUEST, partyA: badPartyA }),
      "INVALID_STK_REQUEST",
      "partyA must be a Kenyan number",
    );
  });

  it("rejects an HTTP callBackURL in production", async () => {
    const daraja = makeClient(vi.fn(), "production");
    await expectDarajaError(
      () =>
        daraja.stkPush({
          ...VALID_PUSH_REQUEST,
          callBackURL: "http://example.com/cb",
        }),
      "INVALID_CALLBACK_URL",
      "must use HTTPS in production",
    );
  });

  it("rejects a callBackURL containing a banned keyword", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({
          ...VALID_PUSH_REQUEST,
          callBackURL: "https://example.com/mpesa-cb",
        }),
      "INVALID_CALLBACK_URL",
      "disallowed keyword",
    );
  });

  it("rejects an accountReference longer than 12 characters", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({
          ...VALID_PUSH_REQUEST,
          accountReference: "this-is-way-too-long",
        }),
      "INVALID_STK_REQUEST",
      "accountReference must be at most 12",
    );
  });

  it("rejects a transactionDesc longer than 13 characters", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPush({
          ...VALID_PUSH_REQUEST,
          transactionDesc: "this description is way too long",
        }),
      "INVALID_STK_REQUEST",
      "transactionDesc must be at most 13",
    );
  });

  it("propagates an upstream error (e.g. invalid access token)", async () => {
    const fetchMock = withTokenThen(
      {
        requestId: "1c5b-4ba8-815c-ac45c57a3db01495926",
        errorCode: "404.001.03",
        errorMessage: "Invalid Access Token",
      },
      404,
    );
    const daraja = makeClient(fetchMock);

    await expectDarajaError(
      () => daraja.stkPush(VALID_PUSH_REQUEST),
      "404.001.03",
      "Invalid Access Token",
    );
  });
});

describe("Daraja.stkPushQuery (M-Pesa Express query)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a valid request and sends the correct wire body", async () => {
    const fetchMock = withTokenThen({
      ResponseCode: "0",
      ResponseDescription: "The service request has been accepted successfully",
      MerchantRequestID: "22205-34066-1",
      CheckoutRequestID: "ws_CO_13012021093521236557",
      ResultCode: "0",
      ResultDesc: "The service request is processed successfully.",
    });
    const daraja = makeClient(fetchMock);

    const result = await daraja.stkPushQuery({
      businessShortCode: "174379",
      passkey: VALID_PUSH_REQUEST.passkey,
      checkoutRequestId: "ws_CO_13012021093521236557",
    });

    expect(result.ResultDesc).toBe(
      "The service request is processed successfully.",
    );

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.CheckoutRequestID).toBe("ws_CO_13012021093521236557");
    expect(sentBody.BusinessShortCode).toBe(174379);
    expect(typeof sentBody.Password).toBe("string");
    expect(sentBody.Timestamp).toMatch(/^\d{14}$/);
  });

  it("rejects a missing checkoutRequestId", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.stkPushQuery({
          businessShortCode: "174379",
          passkey: VALID_PUSH_REQUEST.passkey,
          checkoutRequestId: "",
        }),
      "INVALID_STK_REQUEST",
      "checkoutRequestId is required",
    );
  });

  it('propagates a "request cancelled by user" style result via ResultCode/ResultDesc', async () => {
    const fetchMock = withTokenThen({
      ResponseCode: "0",
      ResponseDescription: "The service request has been accepted successfully",
      MerchantRequestID: "x",
      CheckoutRequestID: "x",
      ResultCode: "1032",
      ResultDesc: "Request cancelled by user",
    });
    const daraja = makeClient(fetchMock);

    const result = await daraja.stkPushQuery({
      businessShortCode: "174379",
      passkey: VALID_PUSH_REQUEST.passkey,
      checkoutRequestId: "ws_CO_13012021093521236557",
    });

    // Note: a cancelled transaction is still a *successful* API call (HTTP 200) —
    // the cancellation lives in ResultCode/ResultDesc, not an HTTP error. The
    // SDK correctly resolves here rather than throwing; callers must check
    // ResultCode themselves.
    expect(result.ResultCode).toBe("1032");
    expect(result.ResultDesc).toBe("Request cancelled by user");
  });
});
