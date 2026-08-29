import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import { validateCallbackUrl } from "../utils/callback-url";
import type {
  B2CTopUpRequest,
  B2CTopUpResponse,
  B2CTopUpResult,
  B2CTopUpResultCallback,
  B2CTopUpWireRequest,
} from "../types/b2c-topup";

function validateShortCode(shortCode: unknown, fieldName: string): string {
  if (typeof shortCode !== "string" && typeof shortCode !== "number") {
    throw new DarajaError({
      message: `${fieldName} must be a string or number, but received type "${typeof shortCode}".`,
      errorCode: "INVALID_B2C_TOPUP_REQUEST",
    });
  }
  const trimmed = String(shortCode).trim();
  if (!/^\d{5,6}$/.test(trimmed)) {
    throw new DarajaError({
      message: `${fieldName} must be a 5-6 digit shortcode, but received "${shortCode}".`,
      errorCode: "INVALID_B2C_TOPUP_REQUEST",
    });
  }
  return trimmed;
}

/**
 * Client for the Daraja B2C Account Top Up endpoint
 * (`POST /mpesa/b2b/v1/paymentrequest`, `CommandID: "BusinessPayToBulk"`).
 *
 * Loads funds into a B2C shortcode's utility account, moving money from
 * your MMF/Working account. This is an **asynchronous** API — {@link topUp}
 * only confirms Daraja accepted the request; the actual outcome arrives
 * later as a POST to your `resultURL`. See {@link parseResultParameters}
 * and {@link isSuccessfulResult} for handling that callback.
 */
export class B2CTopUpClient {
  constructor(private readonly http: HttpClient) {}

  private validateAndTransform(request: B2CTopUpRequest): B2CTopUpWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "B2C top up request must be an object.",
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    const {
      initiator,
      securityCredential,
      senderShortCode,
      receiverShortCode,
      amount,
      accountReference,
      requester,
      remarks,
      queueTimeOutURL,
      resultURL,
    } = request;

    if (typeof initiator !== "string" || !initiator.trim()) {
      throw new DarajaError({
        message: "initiator is required and must be a non-empty string.",
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    if (typeof securityCredential !== "string" || !securityCredential.trim()) {
      throw new DarajaError({
        message:
          "securityCredential is required and must be a non-empty string. It must be pre-encrypted with " +
          "Safaricom's public certificate — the SDK does not perform this encryption for you.",
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    const partyA = validateShortCode(senderShortCode, "senderShortCode");
    const partyB = validateShortCode(receiverShortCode, "receiverShortCode");

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new DarajaError({
        message: `amount must be a number greater than 0, but received ${JSON.stringify(amount)}.`,
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    if (typeof accountReference !== "string" || !accountReference.trim()) {
      throw new DarajaError({
        message: "accountReference is required and must be a non-empty string.",
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    let resolvedRequester: string | undefined;
    if (requester !== undefined) {
      if (
        typeof requester !== "string" ||
        !/^254\d{9}$/.test(requester.trim())
      ) {
        throw new DarajaError({
          message: `requester must be a Kenyan MSISDN in the format 254XXXXXXXXX (12 digits) when provided, but received "${requester}".`,
          errorCode: "INVALID_B2C_TOPUP_REQUEST",
        });
      }
      resolvedRequester = requester.trim();
    }

    if (typeof remarks !== "string" || !remarks.trim()) {
      throw new DarajaError({
        message: "remarks is required and must be a non-empty string.",
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }
    if (remarks.length > 100) {
      throw new DarajaError({
        message: `remarks must be at most 100 characters, but received ${remarks.length}.`,
        errorCode: "INVALID_B2C_TOPUP_REQUEST",
      });
    }

    const environment = this.http.getEnvironment();
    const resolvedQueueTimeOutURL = validateCallbackUrl(
      queueTimeOutURL,
      "queueTimeOutURL",
      environment,
    );
    const resolvedResultURL = validateCallbackUrl(
      resultURL,
      "resultURL",
      environment,
    );

    return {
      Initiator: initiator.trim(),
      SecurityCredential: securityCredential.trim(),
      CommandID: "BusinessPayToBulk",
      SenderIdentifierType: "4",
      RecieverIdentifierType: "4",
      Amount: String(amount),
      PartyA: partyA,
      PartyB: partyB,
      AccountReference: accountReference.trim(),
      ...(resolvedRequester ? { Requester: resolvedRequester } : {}),
      Remarks: remarks.trim(),
      QueueTimeOutURL: resolvedQueueTimeOutURL,
      ResultURL: resolvedResultURL,
    };
  }

  /**
   * Submits a B2C account top-up request. Resolves once Daraja *accepts*
   * the request — the real outcome (success/failure) arrives later at
   * `resultURL`.
   *
   * @example
   * ```ts
   * const accepted = await daraja.b2cTopUp.topUp({
   *   initiator: 'testapi',
   *   securityCredential: encryptedCredential,
   *   senderShortCode: '600979',
   *   receiverShortCode: '600000',
   *   amount: 239,
   *   accountReference: '353353',
   *   remarks: 'OK',
   *   queueTimeOutURL: 'https://example.com/callbacks/timeout',
   *   resultURL: 'https://example.com/callbacks/result',
   * });
   * console.log(accepted.ResponseDescription);
   * ```
   */
  public async topUp(request: B2CTopUpRequest): Promise<B2CTopUpResponse> {
    const body = this.validateAndTransform(request);

    return this.http.request<B2CTopUpResponse>("/mpesa/b2b/v1/paymentrequest", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * `true` if a Result callback (received at your `resultURL`) represents
   * a successful transaction (`ResultCode === 0`).
   */
  public static isSuccessfulResult(result: B2CTopUpResult): boolean {
    return result.ResultCode === 0;
  }

  /**
   * Flattens the awkward `ResultParameters.ResultParameter` key/value array
   * from a Result callback into a plain object, e.g.
   * `{ Amount: '190.00', TransCompletedTime: '20221110110717', ... }`.
   */
  public static parseResultParameters(
    result: B2CTopUpResult,
  ): Record<string, string | number> {
    const params = result.ResultParameters?.ResultParameter ?? [];
    return Object.fromEntries(params.map(({ Key, Value }) => [Key, Value]));
  }

  /**
   * Type guard / cast helper for the JSON body your `resultURL` endpoint
   * receives from Daraja. Does not perform any validation — Daraja
   * controls this payload — it just gives you a typed handle on it.
   */
  public static asResultCallback(rawBody: unknown): B2CTopUpResultCallback {
    return rawBody as B2CTopUpResultCallback;
  }
}
