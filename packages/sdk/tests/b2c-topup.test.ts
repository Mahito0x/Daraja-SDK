import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { B2CTopUpClient } from "../src/endpoints/b2c-topup";
import { DarajaError } from "../src/types/errors";
import type { B2CTopUpRequest, B2CTopUpResult } from "../src/types/b2c-topup";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_REQUEST: B2CTopUpRequest = {
  initiator: "testapi",
  securityCredential: "IAJVUHDGj0yDU3aop/WI9oSPhkW3DVlh7EAt3iRyymTZhljpzCNnI==",
  senderShortCode: "600979",
  receiverShortCode: "600000",
  amount: 239,
  accountReference: "353353",
  remarks: "OK",
  queueTimeOutURL: "https://example.com/callbacks/timeout",
  resultURL: "https://example.com/callbacks/result",
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

describe("B2CTopUpClient — topUp", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and sends the correct wire body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          OriginatorConversationID: "5118-111210482-1",
          ConversationID: "AG_20230420_2010759fd5662ef6d054",
          ResponseCode: "0",
          ResponseDescription: "Accept the service request successfully.",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.b2cTopUp.topUp(VALID_REQUEST);

    expect(result.ResponseDescription).toBe(
      "Accept the service request successfully.",
    );

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest",
    );
    const sentBody = JSON.parse(options.body);
    expect(sentBody).toEqual({
      Initiator: "testapi",
      SecurityCredential: VALID_REQUEST.securityCredential,
      CommandID: "BusinessPayToBulk",
      SenderIdentifierType: "4",
      RecieverIdentifierType: "4",
      Amount: "239",
      PartyA: "600979",
      PartyB: "600000",
      AccountReference: "353353",
      Remarks: "OK",
      QueueTimeOutURL: "https://example.com/callbacks/timeout",
      ResultURL: "https://example.com/callbacks/result",
    });
  });

  it("includes Requester on the wire when provided", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          OriginatorConversationID: "x",
          ConversationID: "y",
          ResponseCode: "0",
          ResponseDescription: "Accept the service request successfully.",
        }),
      );
    const daraja = makeClient(fetchMock);

    await daraja.b2cTopUp.topUp({
      ...VALID_REQUEST,
      requester: "254708374149",
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.Requester).toBe("254708374149");
  });

  it("rejects a missing initiator", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2cTopUp.topUp({ ...VALID_REQUEST, initiator: "" }),
      "INVALID_B2C_TOPUP_REQUEST",
      "initiator",
    );
  });

  it("rejects a missing securityCredential", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2cTopUp.topUp({ ...VALID_REQUEST, securityCredential: "" }),
      "INVALID_B2C_TOPUP_REQUEST",
      "securityCredential",
    );
  });

  it.each([
    ["too short", "1234"],
    ["non-numeric", "ABCDEF"],
  ])("rejects an invalid senderShortCode: %s", async (_label, bad) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2cTopUp.topUp({ ...VALID_REQUEST, senderShortCode: bad }),
      "INVALID_B2C_TOPUP_REQUEST",
      "senderShortCode",
    );
  });

  it.each([0, -50, NaN])("rejects an invalid amount: %s", async (badAmount) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2cTopUp.topUp({ ...VALID_REQUEST, amount: badAmount }),
      "INVALID_B2C_TOPUP_REQUEST",
      "amount",
    );
  });

  it("rejects remarks over 100 characters", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.b2cTopUp.topUp({ ...VALID_REQUEST, remarks: "x".repeat(101) }),
      "INVALID_B2C_TOPUP_REQUEST",
      "remarks",
    );
  });

  it("rejects an invalid requester when provided", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.b2cTopUp.topUp({ ...VALID_REQUEST, requester: "0708374149" }),
      "INVALID_B2C_TOPUP_REQUEST",
      "requester",
    );
  });

  it("rejects a malformed queueTimeOutURL", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.b2cTopUp.topUp({
          ...VALID_REQUEST,
          queueTimeOutURL: "not-a-url",
        }),
      "INVALID_CALLBACK_URL",
    );
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2cTopUp.topUp(null as unknown as B2CTopUpRequest),
      "INVALID_B2C_TOPUP_REQUEST",
    );
  });
});

describe("B2CTopUpClient — result callback helpers", () => {
  const successResult: B2CTopUpResult = {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully",
    OriginatorConversationID: "626f6ddf-ab37-4650-b882-b1de92ec9aa4",
    ConversationID: "12345677dfdf89099B3",
    TransactionID: "QKA81LK5CY",
    ResultParameters: {
      ResultParameter: [
        { Key: "Amount", Value: "190.00" },
        { Key: "TransCompletedTime", Value: "20221110110717" },
      ],
    },
  };

  const failureResult: B2CTopUpResult = {
    ...successResult,
    ResultCode: 2001,
    ResultDesc: "The initiator information is invalid.",
  };

  it("isSuccessfulResult distinguishes success from failure", () => {
    expect(B2CTopUpClient.isSuccessfulResult(successResult)).toBe(true);
    expect(B2CTopUpClient.isSuccessfulResult(failureResult)).toBe(false);
  });

  it("parseResultParameters flattens the key/value array", () => {
    expect(B2CTopUpClient.parseResultParameters(successResult)).toEqual({
      Amount: "190.00",
      TransCompletedTime: "20221110110717",
    });
  });

  it("parseResultParameters returns {} when ResultParameters is absent", () => {
    const noParams: B2CTopUpResult = {
      ...successResult,
      ResultParameters: undefined,
    };
    expect(B2CTopUpClient.parseResultParameters(noParams)).toEqual({});
  });
});
