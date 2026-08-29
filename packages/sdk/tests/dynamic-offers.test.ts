import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { DarajaError } from "../src/types/errors";
import type {
  DynamicOffersFetchRequest,
  DynamicOffersPurchaseRequest,
} from "../src/types/dynamic-offers";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

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

describe("DynamicOffersClient — fetchOffers", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends a GET request with msisdn as a query param", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          id: "mock-response-id",
          desc: "Mock offers retrieved successfully",
          status: "200",
          lineItem: {
            characteristicsValue: [
              {
                offerName: "Weekly 2GB",
                uniqueOfferingId: "50512026",
                offerValidity: 7,
                resourceAccId: 1001,
                resourceValue: 2048,
                offerPrice: 99,
                offerUssdName: "Weekly 2GB",
                offeringId: 20001,
                offerSource: "MOCK",
                locationId: 1,
                subscribed: 0,
              },
            ],
          },
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.dynamicOffers.fetchOffers({
      msisdn: "254708374149",
    });

    expect(result.lineItem.characteristicsValue[0].offerName).toBe(
      "Weekly 2GB",
    );

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://sandbox.safaricom.co.ke/v1/dynamic-offers/fetch?msisdn=254708374149",
    );
    expect(options.method).toBe("GET");
  });

  it("rejects an invalid msisdn", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicOffers.fetchOffers({
          msisdn: "0708374149",
        } as DynamicOffersFetchRequest),
      "INVALID_DYNAMIC_OFFERS_REQUEST",
      "msisdn",
    );
  });
});

const VALID_PURCHASE_REQUEST: DynamicOffersPurchaseRequest = {
  msisdn: "254708374149",
  offeringId: "28042021",
  paymentMode: "airtime",
  accountId: "2572",
  price: 5,
  resourceAmount: 50,
  validity: 1,
  transactionId: "1",
};

describe("DynamicOffersClient — purchase", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends the correct wire body (all values stringified)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          header: {
            requestRefId: "ac5633a7-ad08-4b61-8e77-30d83903fb58",
            responseCode: 200,
            responseMessage: "operation successful",
            customerMessage: "Bundle purchase was successful",
            timestamp: "2023-06-08T16:38:01.838453",
          },
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.dynamicOffers.purchase(VALID_PURCHASE_REQUEST);

    expect(result.header.customerMessage).toBe(
      "Bundle purchase was successful",
    );

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://sandbox.safaricom.co.ke/v1/dynamic-offers/facebook-bundle/purchase",
    );
    const sentBody = JSON.parse(options.body);
    expect(sentBody).toEqual({
      offeringId: "28042021",
      accountId: "2572",
      price: "5",
      resourceAmount: "50",
      validity: "1",
      msisdn: "254708374149",
      transactionId: "1",
      paymentMode: "airtime",
    });
  });

  it('accepts "m-pesa" as a payment mode', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          header: {
            requestRefId: "x",
            responseCode: 200,
            responseMessage: "operation successful",
            customerMessage: "ok",
            timestamp: "x",
          },
        }),
      );
    const daraja = makeClient(fetchMock);

    await expect(
      daraja.dynamicOffers.purchase({
        ...VALID_PURCHASE_REQUEST,
        paymentMode: "m-pesa",
      }),
    ).resolves.toBeDefined();
  });

  it("rejects an unrecognized paymentMode", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicOffers.purchase({
          ...VALID_PURCHASE_REQUEST,
          paymentMode: "credit-card" as never,
        }),
      "INVALID_DYNAMIC_OFFERS_REQUEST",
      "paymentMode",
    );
  });

  it.each([0, -5])("rejects an invalid price: %s", async (badPrice) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicOffers.purchase({
          ...VALID_PURCHASE_REQUEST,
          price: badPrice,
        }),
      "INVALID_DYNAMIC_OFFERS_REQUEST",
      "price",
    );
  });

  it("rejects a missing offeringId", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.dynamicOffers.purchase({
          ...VALID_PURCHASE_REQUEST,
          offeringId: "",
        }),
      "INVALID_DYNAMIC_OFFERS_REQUEST",
      "offeringId",
    );
  });
});

describe("DynamicOffersClient — checkStatus", () => {
  afterEach(() => vi.restoreAllMocks());

  it('defaults serviceAccountId to "0" per Safaricom\'s docs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          responseId: "788797897889",
          responseDesc: "Successful bundle purchase",
          responseStatus: "1000",
          responseCreated: "20230609143000543",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.dynamicOffers.checkStatus({
      transactionId: "3698520171121111347306",
    });

    expect(result.responseDesc).toBe("Successful bundle purchase");

    const [url] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://sandbox.safaricom.co.ke/v2/bundles/get/status?id=3698520171121111347306&serviceAccountId=0",
    );
  });

  it("respects an explicit serviceAccountId", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          responseId: "x",
          responseDesc: "x",
          responseStatus: "x",
          responseCreated: "x",
        }),
      );
    const daraja = makeClient(fetchMock);

    await daraja.dynamicOffers.checkStatus({
      transactionId: "abc",
      serviceAccountId: "1",
    });

    const [url] = fetchMock.mock.calls[1];
    expect(url).toContain("serviceAccountId=1");
  });

  it("rejects a missing transactionId", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.dynamicOffers.checkStatus({ transactionId: "" }),
      "INVALID_DYNAMIC_OFFERS_REQUEST",
      "transactionId",
    );
  });
});
