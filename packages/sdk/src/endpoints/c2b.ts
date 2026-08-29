import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import { validateCallbackUrl } from "../utils/callback-url";
import type {
  C2BCommandId,
  C2BRegisterUrlRequest,
  C2BRegisterUrlResponse,
  C2BSimulateRequest,
  C2BSimulateResponse,
  C2BResponseType,
} from "../types/c2b";

const VALID_RESPONSE_TYPES: readonly C2BResponseType[] = [
  "Completed",
  "Cancelled",
];
const VALID_COMMAND_IDS: readonly C2BCommandId[] = [
  "CustomerPayBillOnline",
  "CustomerBuyGoodsOnline",
];

/**
 * Client for the Daraja Customer To Business (C2B) endpoints:
 * - `POST /mpesa/c2b/v1/registerurl` — via {@link registerUrl}
 * - `POST /mpesa/c2b/v1/simulate` — via {@link simulate} (sandbox only)
 */
export class C2BClient {
  constructor(private readonly http: HttpClient) {}

  // ---------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------

  private validateShortCode(shortCode: unknown): number {
    if (typeof shortCode !== "string" && typeof shortCode !== "number") {
      throw new DarajaError({
        message: `shortCode must be a string or number, but received type "${typeof shortCode}".`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    const asString = String(shortCode).trim();
    if (!/^\d{5,6}$/.test(asString)) {
      throw new DarajaError({
        message: `shortCode must be a 5-6 digit Paybill/Till number, but received "${shortCode}".`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    return Number(asString);
  }

  // ---------------------------------------------------------------------
  // registerUrl
  // ---------------------------------------------------------------------

  private validateRegisterUrlRequest(request: C2BRegisterUrlRequest): {
    ShortCode: number;
    ResponseType: C2BResponseType;
    ConfirmationURL: string;
    ValidationURL: string;
  } {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "C2B registerUrl request must be an object.",
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    const shortCode = this.validateShortCode(request.shortCode);

    const { responseType } = request;
    if (
      typeof responseType === "string" &&
      !VALID_RESPONSE_TYPES.includes(responseType as C2BResponseType)
    ) {
      const casingMatch = VALID_RESPONSE_TYPES.find(
        (valid) => valid.toLowerCase() === responseType.toLowerCase(),
      );
      throw new DarajaError({
        message: casingMatch
          ? `responseType must be exact sentence case, but received "${responseType}". Did you mean "${casingMatch}"?`
          : `responseType must be one of ${VALID_RESPONSE_TYPES.map((t) => `"${t}"`).join(", ")}, but received "${responseType}".`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }
    if (
      typeof responseType !== "string" ||
      !VALID_RESPONSE_TYPES.includes(responseType as C2BResponseType)
    ) {
      throw new DarajaError({
        message: `responseType must be one of ${VALID_RESPONSE_TYPES.map((t) => `"${t}"`).join(", ")}, but received ${JSON.stringify(responseType)}.`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    const environment = this.http.getEnvironment();
    const confirmationUrl = validateCallbackUrl(
      request.confirmationUrl,
      "confirmationUrl",
      environment,
    );
    const validationUrl = validateCallbackUrl(
      request.validationUrl,
      "validationUrl",
      environment,
    );

    return {
      ShortCode: shortCode,
      ResponseType: responseType,
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    };
  }

  /**
   * Registers the Validation and Confirmation URLs that M-PESA calls when a
   * customer pays into your Paybill/Till.
   *
   * @example
   * ```ts
   * const result = await daraja.c2b.registerUrl({
   *   shortCode: '600984',
   *   responseType: 'Completed',
   *   confirmationUrl: 'https://example.com/callbacks/confirmation',
   *   validationUrl: 'https://example.com/callbacks/validation',
   * });
   * console.log(result.ResponseDescription); // "Success"
   * ```
   */
  public async registerUrl(
    request: C2BRegisterUrlRequest,
  ): Promise<C2BRegisterUrlResponse> {
    const body = this.validateRegisterUrlRequest(request);

    return this.http.request<C2BRegisterUrlResponse>(
      "/mpesa/c2b/v2/registerurl",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  // ---------------------------------------------------------------------
  // simulate
  // ---------------------------------------------------------------------

  private validateSimulateRequest(request: C2BSimulateRequest): {
    ShortCode: number;
    CommandID: C2BCommandId;
    Amount: number;
    Msisdn: number;
    BillRefNumber: string | null;
  } {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "C2B simulate request must be an object.",
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    const shortCode = this.validateShortCode(request.shortCode);

    const { commandId, amount, msisdn, billRefNumber } = request;
    if (
      typeof commandId !== "string" ||
      !VALID_COMMAND_IDS.includes(commandId as C2BCommandId)
    ) {
      throw new DarajaError({
        message: `commandId must be one of ${VALID_COMMAND_IDS.map((c) => `"${c}"`).join(", ")}, but received ${JSON.stringify(commandId)}.`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      throw new DarajaError({
        message: `amount must be a whole number greater than 0, but received ${JSON.stringify(amount)}.`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    if (typeof msisdn !== "string" || !/^254\d{9}$/.test(msisdn.trim())) {
      throw new DarajaError({
        message: `msisdn must be a Kenyan number in the format 254XXXXXXXXX (12 digits), but received "${msisdn}".`,
        errorCode: "INVALID_C2B_REQUEST",
      });
    }

    let resolvedBillRefNumber: string | null;
    if (commandId === "CustomerPayBillOnline") {
      if (typeof billRefNumber !== "string" || !billRefNumber.trim()) {
        throw new DarajaError({
          message:
            'billRefNumber is required and must be a non-empty string when commandId is "CustomerPayBillOnline".',
          errorCode: "INVALID_C2B_REQUEST",
        });
      }
      resolvedBillRefNumber = billRefNumber.trim();
    } else {
      if (billRefNumber !== undefined) {
        throw new DarajaError({
          message:
            'billRefNumber must be omitted when commandId is "CustomerBuyGoodsOnline".',
          errorCode: "INVALID_C2B_REQUEST",
        });
      }
      resolvedBillRefNumber = null;
    }

    return {
      ShortCode: shortCode,
      CommandID: commandId,
      Amount: amount,
      Msisdn: Number(msisdn.trim()),
      BillRefNumber: resolvedBillRefNumber,
    };
  }

  /**
   * Simulates a customer paying into your Paybill/Till — **sandbox only**.
   * Triggers a real call to your registered Confirmation URL, same as a
   * live payment would.
   *
   * @example
   * ```ts
   * const result = await daraja.c2b.simulate({
   *   shortCode: '600984',
   *   commandId: 'CustomerPayBillOnline',
   *   amount: 1,
   *   msisdn: '254708374149',
   *   billRefNumber: 'Test Ref',
   * });
   * console.log(result.ResponseDescription);
   * ```
   */
  public async simulate(
    request: C2BSimulateRequest,
  ): Promise<C2BSimulateResponse> {
    if (this.http.getEnvironment() === "production") {
      throw new DarajaError({
        message:
          "C2B simulate() only works in sandbox — Safaricom does not support simulating payments in production.",
        errorCode: "SIMULATE_NOT_AVAILABLE_IN_PRODUCTION",
      });
    }

    const body = this.validateSimulateRequest(request);

    return this.http.request<C2BSimulateResponse>("/mpesa/c2b/v1/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}
