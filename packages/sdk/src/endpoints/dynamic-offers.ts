import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type {
  DynamicOffersCheckStatusRequest,
  DynamicOffersCheckStatusResponse,
  DynamicOffersFetchRequest,
  DynamicOffersFetchResponse,
  DynamicOffersPaymentMode,
  DynamicOffersPurchaseRequest,
  DynamicOffersPurchaseResponse,
  DynamicOffersPurchaseWireRequest,
} from "../types/dynamic-offers";

const VALID_PAYMENT_MODES: readonly DynamicOffersPaymentMode[] = [
  "airtime",
  "m-pesa",
];

function validateMsisdn(msisdn: unknown, fieldName = "msisdn"): string {
  if (typeof msisdn !== "string" || !/^254\d{9}$/.test(msisdn.trim())) {
    throw new DarajaError({
      message: `${fieldName} must be a Kenyan MSISDN in the format 254XXXXXXXXX (12 digits), but received ${JSON.stringify(msisdn)}.`,
      errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
    });
  }
  return msisdn.trim();
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new DarajaError({
      message: `${fieldName} is required and must be a non-empty string, but received ${JSON.stringify(value)}.`,
      errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
    });
  }
  return value.trim();
}

/**
 * Client for the Daraja Mobile Data Bundles (Dynamic Offers) endpoints:
 * - {@link fetchOffers} — `GET /v1/dynamic-offers/fetch`
 * - {@link purchase} — `POST /v1/dynamic-offers/facebook-bundle/purchase`
 * - {@link checkStatus} — `GET /v2/bundles/get/status`
 *
 * Lets customers browse and buy mobile data bundles inside your app.
 */
export class DynamicOffersClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the data bundle offers available to a customer.
   *
   * @example
   * ```ts
   * const offers = await daraja.dynamicOffers.fetchOffers({ msisdn: '254708374149' });
   * for (const offer of offers.lineItem.characteristicsValue) {
   *   console.log(offer.offerName, offer.offerPrice);
   * }
   * ```
   */
  public async fetchOffers(
    request: DynamicOffersFetchRequest,
  ): Promise<DynamicOffersFetchResponse> {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "fetchOffers request must be an object.",
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    const msisdn = validateMsisdn(request.msisdn);

    return this.http.request<DynamicOffersFetchResponse>(
      `/v1/dynamic-offers/fetch?msisdn=${encodeURIComponent(msisdn)}`,
      { method: "GET" },
    );
  }

  private static validatePurchaseRequest(
    request: DynamicOffersPurchaseRequest,
  ): DynamicOffersPurchaseWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "purchase request must be an object.",
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    const {
      msisdn,
      offeringId,
      paymentMode,
      accountId,
      price,
      resourceAmount,
      validity,
      transactionId,
    } = request;

    const resolvedMsisdn = validateMsisdn(msisdn);
    const resolvedOfferingId = requireNonEmptyString(offeringId, "offeringId");
    const resolvedAccountId = requireNonEmptyString(accountId, "accountId");
    const resolvedTransactionId = requireNonEmptyString(
      transactionId,
      "transactionId",
    );

    if (
      typeof paymentMode !== "string" ||
      !VALID_PAYMENT_MODES.includes(paymentMode as DynamicOffersPaymentMode)
    ) {
      throw new DarajaError({
        message: `paymentMode must be one of ${VALID_PAYMENT_MODES.map((m) => `"${m}"`).join(", ")}, but received ${JSON.stringify(paymentMode)}.`,
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      throw new DarajaError({
        message: `price must be a number greater than 0, but received ${JSON.stringify(price)}.`,
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    if (
      typeof resourceAmount !== "number" ||
      !Number.isFinite(resourceAmount) ||
      resourceAmount <= 0
    ) {
      throw new DarajaError({
        message: `resourceAmount must be a number greater than 0, but received ${JSON.stringify(resourceAmount)}.`,
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    if (
      typeof validity !== "number" ||
      !Number.isFinite(validity) ||
      validity <= 0
    ) {
      throw new DarajaError({
        message: `validity must be a number greater than 0, but received ${JSON.stringify(validity)}.`,
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    return {
      offeringId: resolvedOfferingId,
      accountId: resolvedAccountId,
      price: String(price),
      resourceAmount: String(resourceAmount),
      validity: String(validity),
      msisdn: resolvedMsisdn,
      transactionId: resolvedTransactionId,
      paymentMode,
    };
  }

  /**
   * Fulfills a data bundle purchase for the given offer.
   *
   * @example
   * ```ts
   * const result = await daraja.dynamicOffers.purchase({
   *   msisdn: '254708374149',
   *   offeringId: '20001',
   *   paymentMode: 'airtime',
   *   accountId: '1001',
   *   price: 99,
   *   resourceAmount: 2048,
   *   validity: 7,
   *   transactionId: 'my-order-42',
   * });
   * console.log(result.header.customerMessage);
   * ```
   */
  public async purchase(
    request: DynamicOffersPurchaseRequest,
  ): Promise<DynamicOffersPurchaseResponse> {
    const body = DynamicOffersClient.validatePurchaseRequest(request);

    return this.http.request<DynamicOffersPurchaseResponse>(
      "/v1/dynamic-offers/facebook-bundle/purchase",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  /**
   * Queries the status of a bundle purchase by the `transactionId` you
   * supplied when purchasing.
   *
   * @example
   * ```ts
   * const status = await daraja.dynamicOffers.checkStatus({ transactionId: 'my-order-42' });
   * console.log(status.responseDesc);
   * ```
   */
  public async checkStatus(
    request: DynamicOffersCheckStatusRequest,
  ): Promise<DynamicOffersCheckStatusResponse> {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "checkStatus request must be an object.",
        errorCode: "INVALID_DYNAMIC_OFFERS_REQUEST",
      });
    }

    const transactionId = requireNonEmptyString(
      request.transactionId,
      "transactionId",
    );
    const serviceAccountId =
      request.serviceAccountId !== undefined
        ? requireNonEmptyString(request.serviceAccountId, "serviceAccountId")
        : "0"; // Safaricom's docs: "Use 0 for dynamic offers"

    const query = new URLSearchParams({
      id: transactionId,
      serviceAccountId,
    }).toString();

    return this.http.request<DynamicOffersCheckStatusResponse>(
      `/v2/bundles/get/status?${query}`,
      {
        method: "GET",
      },
    );
  }
}
