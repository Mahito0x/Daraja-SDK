import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { DarajaError } from "../src/types/errors";
import type {
  C2BRegisterUrlRequest,
  C2BSimulateRequest,
} from "../src/types/c2b";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_REGISTER_REQUEST: C2BRegisterUrlRequest = {
  shortCode: "600984",
  responseType: "Completed",
  confirmationUrl: "https://example.com/callbacks/confirmation",
  validationUrl: "https://example.com/callbacks/validation",
};

const VALID_SIMULATE_REQUEST: C2BSimulateRequest = {
  shortCode: "600984",
  commandId: "CustomerPayBillOnline",
  amount: 1,
  msisdn: "254708374149",
  billRefNumber: "Test Ref",
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
  return new Daraja({
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

describe("C2BClient — registerUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and sends the correct wire body", async () => {
    const fetchMock = withTokenThen({
      OriginatorCoversationID: "6e86-45dd-91ac-fd5d4178ab523408729",
      ResponseCode: "0",
      ResponseDescription: "Success",
    });
    const daraja = makeClient(fetchMock);

    const result = await daraja.c2b.registerUrl(VALID_REGISTER_REQUEST);
    expect(result.ResponseDescription).toBe("Success");

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody).toEqual({
      ShortCode: 600984,
      ResponseType: "Completed",
      ConfirmationURL: "https://example.com/callbacks/confirmation",
      ValidationURL: "https://example.com/callbacks/validation",
    });
  });

  it("allows HTTP callback URLs in sandbox", async () => {
    const fetchMock = withTokenThen({
      OriginatorCoversationID: "x",
      ResponseCode: "0",
      ResponseDescription: "Success",
    });
    const daraja = makeClient(fetchMock, "sandbox");

    await expect(
      daraja.c2b.registerUrl({
        ...VALID_REGISTER_REQUEST,
        confirmationUrl: "http://example.com/confirmation",
        validationUrl: "http://example.com/validation",
      }),
    ).resolves.toBeDefined();
  });

  it("rejects HTTP callback URLs in production", async () => {
    const daraja = makeClient(vi.fn(), "production");
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          confirmationUrl: "http://example.com/confirmation",
        }),
      "INVALID_CALLBACK_URL",
      "must use HTTPS in production",
    );
  });

  it("rejects a malformed confirmationUrl", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          confirmationUrl: "not-a-url",
        }),
      "INVALID_CALLBACK_URL",
      "confirmationUrl must be a valid, publicly reachable URL",
    );
  });

  it.each([
    ["mpesa", "https://example.com/mpesa-callback"],
    ["safaricom", "https://safaricom-test.example.com/cb"],
    ["exec", "https://example.com/exec-handler"],
  ])(
    'rejects a callback URL containing the banned keyword "%s"',
    async (_label, badUrl) => {
      const daraja = makeClient(vi.fn());
      await expectDarajaError(
        () =>
          daraja.c2b.registerUrl({
            ...VALID_REGISTER_REQUEST,
            confirmationUrl: badUrl,
          }),
        "INVALID_CALLBACK_URL",
        "disallowed keyword",
      );
    },
  );

  it("rejects a callback URL pointing at ngrok", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          confirmationUrl: "https://abcd1234.ngrok.io/cb",
        }),
      "INVALID_CALLBACK_URL",
      "public URL tunneling service",
    );
  });

  it("rejects a lowercase responseType with a casing hint", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          responseType: "completed" as never,
        }),
      "INVALID_C2B_REQUEST",
      'Did you mean "Completed"?',
    );
  });

  it("rejects an unrecognized responseType", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          responseType: "Retry" as never,
        }),
      "INVALID_C2B_REQUEST",
    );
  });

  it.each([
    ["too short (4 digits)", "1234"],
    ["too long (7 digits)", "1234567"],
    ["non-numeric", "ABCDEF"],
  ])("rejects an invalid shortCode: %s", async (_label, badShortCode) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.registerUrl({
          ...VALID_REGISTER_REQUEST,
          shortCode: badShortCode,
        }),
      "INVALID_C2B_REQUEST",
      "shortCode",
    );
  });

  it("accepts a numeric shortCode", async () => {
    const fetchMock = withTokenThen({
      OriginatorCoversationID: "x",
      ResponseCode: "0",
      ResponseDescription: "Success",
    });
    const daraja = makeClient(fetchMock);
    await expect(
      daraja.c2b.registerUrl({ ...VALID_REGISTER_REQUEST, shortCode: 600984 }),
    ).resolves.toBeDefined();
  });
});

describe("C2BClient — simulate", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a valid CustomerPayBillOnline request and sends the correct wire body", async () => {
    const fetchMock = withTokenThen({
      OriginatorCoversationID: "53e3-4aa8-9fe0-8fb5e4092cdd3405976",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    });
    const daraja = makeClient(fetchMock, "sandbox");

    const result = await daraja.c2b.simulate(VALID_SIMULATE_REQUEST);
    expect(result.ResponseCode).toBe("0");

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody).toEqual({
      ShortCode: 600984,
      CommandID: "CustomerPayBillOnline",
      Amount: 1,
      Msisdn: 254708374149,
      BillRefNumber: "Test Ref",
    });
  });

  it("accepts a valid CustomerBuyGoodsOnline request with no billRefNumber, sending null", async () => {
    const fetchMock = withTokenThen({
      OriginatorCoversationID: "x",
      ResponseCode: "0",
      ResponseDescription: "ok",
    });
    const daraja = makeClient(fetchMock, "sandbox");

    await daraja.c2b.simulate({
      shortCode: "600984",
      commandId: "CustomerBuyGoodsOnline",
      amount: 1,
      msisdn: "254708374149",
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.BillRefNumber).toBeNull();
  });

  it("rejects simulate() entirely when environment is production", async () => {
    const daraja = makeClient(vi.fn(), "production");
    await expectDarajaError(
      () => daraja.c2b.simulate(VALID_SIMULATE_REQUEST),
      "SIMULATE_NOT_AVAILABLE_IN_PRODUCTION",
    );
  });

  it("rejects billRefNumber missing for CustomerPayBillOnline", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.simulate({
          ...VALID_SIMULATE_REQUEST,
          billRefNumber: undefined,
        }),
      "INVALID_C2B_REQUEST",
      "billRefNumber is required",
    );
  });

  it("rejects billRefNumber provided for CustomerBuyGoodsOnline", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.simulate({
          shortCode: "600984",
          commandId: "CustomerBuyGoodsOnline",
          amount: 1,
          msisdn: "254708374149",
          billRefNumber: "Should not be here",
        }),
      "INVALID_C2B_REQUEST",
      'must be omitted when commandId is "CustomerBuyGoodsOnline"',
    );
  });

  it("rejects an unrecognized commandId", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.simulate({
          ...VALID_SIMULATE_REQUEST,
          commandId: "Nope" as never,
        }),
      "INVALID_C2B_REQUEST",
      "commandId must be one of",
    );
  });

  it.each([
    ["missing country code", "0708374149"],
    ["too short", "25470837"],
    ["too long", "2547083741499"],
    ["non-numeric", "25470abcdef"],
  ])("rejects an invalid msisdn: %s", async (_label, badMsisdn) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.simulate({ ...VALID_SIMULATE_REQUEST, msisdn: badMsisdn }),
      "INVALID_C2B_REQUEST",
      "msisdn must be a Kenyan number",
    );
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["a decimal", 1.5],
  ])("rejects an invalid amount: %s", async (_label, badAmount) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.c2b.simulate({
          ...VALID_SIMULATE_REQUEST,
          amount: badAmount as number,
        }),
      "INVALID_C2B_REQUEST",
      "amount",
    );
  });

  it("propagates an upstream API error (e.g. duplicate URL registration style error)", async () => {
    const fetchMock = withTokenThen(
      {
        errorCode: "500.003.1001",
        errorMessage: "Urls are already registered.",
      },
      500,
    );
    const daraja = makeClient(fetchMock, "sandbox");

    await expectDarajaError(
      () => daraja.c2b.registerUrl(VALID_REGISTER_REQUEST),
      "500.003.1001",
      "already registered",
    );
  });
});
