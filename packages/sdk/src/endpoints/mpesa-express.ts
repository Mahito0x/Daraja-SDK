import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import { validateCallbackUrl } from "../utils/callback-url";
import {
  generateStkPassword,
  generateStkTimestamp,
} from "../utils/stk-password";
import type {
  StkPushRequest,
  StkPushResponse,
  StkQueryRequest,
  StkQueryResponse,
  StkTransactionType,
} from "../types/mpesa-express";

const VALID_TRANSACTION_TYPES: readonly StkTransactionType[] = [
  "CustomerPayBillOnline",
  "CustomerBuyGoodsOnline",
];

// Documented in Safaricom's M-Pesa Express FAQ.
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 250_000;

const ACCOUNT_REFERENCE_MAX_LENGTH = 12;
const TRANSACTION_DESC_MAX_LENGTH = 13;
const DEFAULT_TRANSACTION_DESC = "Payment";

/**
 * Client for the Daraja M-Pesa Express (Lipa Na M-Pesa Online / STK Push)
 * endpoints:
 * - `POST /mpesa/stkpush/v1/processrequest` — via {@link push}
 * - `POST /mpesa/stkpushquery/v1/query` — via {@link query}
 *
 * Note: Safaricom's own portal labels the push endpoint "M-Pesa Express
 * Simulate", but it is the real, production-capable payment-initiation
 * call — not a sandbox-only simulator like {@link C2BClient.simulate}.
 */
export class MpesaExpressClient {
  constructor(private readonly http: HttpClient) {}

  // ---------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------

  private static validateShortCode(
    shortCode: unknown,
    fieldName: string,
  ): string {
    if (typeof shortCode !== "string" && typeof shortCode !== "number") {
      throw new DarajaError({
        message: `${fieldName} must be a string or number, but received type "${typeof shortCode}".`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const asString = String(shortCode).trim();

    if (!/^\d+$/.test(asString)) {
      throw new DarajaError({
        message: `${fieldName} must contain only digits, but received "${shortCode}".`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    // Safaricom's own docs disagree slightly across endpoints (5–6 digits on
    // push, 5–7 on query) — 5–7 covers both without being overly strict.
    if (asString.length < 5 || asString.length > 7) {
      throw new DarajaError({
        message: `${fieldName} must be 5–7 digits, but received "${asString}" (${asString.length} digits).`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    return asString;
  }

  private static validatePhoneNumber(
    value: unknown,
    fieldName: string,
  ): string {
    if (typeof value !== "string") {
      throw new DarajaError({
        message: `${fieldName} must be a string, but received type "${typeof value}".`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }
    const trimmed = value.trim();
    if (!/^254\d{9}$/.test(trimmed)) {
      throw new DarajaError({
        message: `${fieldName} must be a Kenyan number in the format "254XXXXXXXXX" (12 digits, e.g. "254722111111"), but received "${value}".`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }
    return trimmed;
  }

  private static buildAuthFields(businessShortCode: string, passkey: string) {
    if (typeof passkey !== "string" || !passkey.trim()) {
      throw new DarajaError({
        message: "passkey is required and must be a non-empty string.",
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const timestamp = generateStkTimestamp();
    const password = generateStkPassword(
      businessShortCode,
      passkey.trim(),
      timestamp,
    );
    return { timestamp, password };
  }

  // ---------------------------------------------------------------------
  // push (STK Push / "Simulate" in Safaricom's own portal naming)
  // ---------------------------------------------------------------------

  /**
   * Sends an M-PESA payment prompt (STK Push) to a customer's phone. The
   * customer enters their PIN to authorize; the result is delivered
   * asynchronously to `callBackURL`.
   *
   * `Password` and `Timestamp` are generated for you from `businessShortCode`
   * and `passkey` — you never construct the Base64 string by hand.
   *
   * @example
   * ```ts
   * const result = await daraja.mpesaExpress.push({
   *   businessShortCode: '174379',
   *   passkey: process.env.MPESA_PASSKEY!,
   *   transactionType: 'CustomerPayBillOnline',
   *   amount: 1,
   *   partyA: '254722000000',
   *   partyB: '174379',
   *   phoneNumber: '254722111111',
   *   callBackURL: 'https://your-domain.com/callbacks/stk',
   *   accountReference: 'accountref',
   * });
   * console.log(result.CheckoutRequestID); // save this — you'll need it for query()
   * ```
   */
  public async push(request: StkPushRequest): Promise<StkPushResponse> {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "M-Pesa Express push request must be an object.",
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const businessShortCode = MpesaExpressClient.validateShortCode(
      request.businessShortCode ?? this.http.getShortcode(),
      "businessShortCode",
    );
    const { timestamp, password } = MpesaExpressClient.buildAuthFields(
      businessShortCode,
      request.passkey ?? this.http.getPasskey(),
    );

    if (
      typeof request.transactionType !== "string" ||
      !VALID_TRANSACTION_TYPES.includes(
        request.transactionType as StkTransactionType,
      )
    ) {
      throw new DarajaError({
        message: `transactionType must be one of ${VALID_TRANSACTION_TYPES.map((t) => `"${t}"`).join(", ")}, but received ${JSON.stringify(request.transactionType)}.`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const { amount } = request;
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      !Number.isInteger(amount)
    ) {
      throw new DarajaError({
        message: `amount must be a whole number, but received ${JSON.stringify(amount)} (type "${typeof amount}").`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new DarajaError({
        message: `amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT} KES (Safaricom's per-transaction limit), but received ${amount}.`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const partyA = MpesaExpressClient.validatePhoneNumber(
      request.partyA,
      "partyA",
    );
    const partyB = MpesaExpressClient.validateShortCode(
      request.partyB ?? this.http.getShortcode(),
      "partyB",
    );
    const phoneNumber = MpesaExpressClient.validatePhoneNumber(
      request.phoneNumber,
      "phoneNumber",
    );
    const callBackURL = validateCallbackUrl(
      request.callBackURL ?? this.http.getCallbackUrl(),
      "callBackURL",
      this.http.getEnvironment(),
    );

    if (
      typeof request.accountReference !== "string" ||
      !request.accountReference.trim()
    ) {
      throw new DarajaError({
        message: "accountReference is required and must be a non-empty string.",
        errorCode: "INVALID_STK_REQUEST",
      });
    }
    const accountReference = request.accountReference.trim();
    if (accountReference.length > ACCOUNT_REFERENCE_MAX_LENGTH) {
      throw new DarajaError({
        message: `accountReference must be at most ${ACCOUNT_REFERENCE_MAX_LENGTH} characters (received ${accountReference.length}): "${accountReference}".`,
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    let transactionDesc = DEFAULT_TRANSACTION_DESC;
    if (request.transactionDesc !== undefined) {
      if (
        typeof request.transactionDesc !== "string" ||
        !request.transactionDesc.trim()
      ) {
        throw new DarajaError({
          message: "transactionDesc, if provided, must be a non-empty string.",
          errorCode: "INVALID_STK_REQUEST",
        });
      }
      transactionDesc = request.transactionDesc.trim();
      if (transactionDesc.length > TRANSACTION_DESC_MAX_LENGTH) {
        throw new DarajaError({
          message: `transactionDesc must be at most ${TRANSACTION_DESC_MAX_LENGTH} characters (received ${transactionDesc.length}): "${transactionDesc}".`,
          errorCode: "INVALID_STK_REQUEST",
        });
      }
    }

    return this.http.request<StkPushResponse>(
      "/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        body: JSON.stringify({
          BusinessShortCode: Number(businessShortCode),
          Password: password,
          Timestamp: timestamp,
          TransactionType: request.transactionType,
          Amount: amount,
          PartyA: Number(partyA),
          PartyB: Number(partyB),
          PhoneNumber: Number(phoneNumber),
          CallBackURL: callBackURL,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        }),
      },
    );
  }

  // ---------------------------------------------------------------------
  // query
  // ---------------------------------------------------------------------

  /**
   * Checks the status of a previously initiated STK Push, using the
   * `CheckoutRequestID` returned by {@link push}. Useful when your
   * callback URL didn't receive a result (or you want to poll instead of
   * waiting on the callback).
   *
   * @example
   * ```ts
   * const status = await daraja.mpesaExpress.query({
   *   businessShortCode: '174379',
   *   passkey: process.env.MPESA_PASSKEY!,
   *   checkoutRequestId: result.CheckoutRequestID,
   * });
   * console.log(status.ResultDesc);
   * ```
   */
  public async query(request: StkQueryRequest): Promise<StkQueryResponse> {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "M-Pesa Express query request must be an object.",
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    const businessShortCode = MpesaExpressClient.validateShortCode(
      request.businessShortCode ?? this.http.getShortcode(),
      "businessShortCode",
    );
    const { timestamp, password } = MpesaExpressClient.buildAuthFields(
      businessShortCode,
      request.passkey ?? this.http.getPasskey(),
    );

    if (
      typeof request.checkoutRequestId !== "string" ||
      !request.checkoutRequestId.trim()
    ) {
      throw new DarajaError({
        message:
          "checkoutRequestId is required and must be a non-empty string (the CheckoutRequestID returned by push()).",
        errorCode: "INVALID_STK_REQUEST",
      });
    }

    return this.http.request<StkQueryResponse>("/mpesa/stkpushquery/v1/query", {
      method: "POST",
      body: JSON.stringify({
        BusinessShortCode: Number(businessShortCode),
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: request.checkoutRequestId.trim(),
      }),
    });
  }
}
