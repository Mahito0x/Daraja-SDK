import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type {
  DynamicQRRequest,
  DynamicQRResponse,
  DynamicQRTrxCode,
  DynamicQRWireRequest,
} from "../types/dynamic-qr";

const VALID_TRX_CODES: readonly DynamicQRTrxCode[] = [
  "BG",
  "WA",
  "PB",
  "SM",
  "SB",
];

const TRX_CODE_HINTS: Record<DynamicQRTrxCode, string> = {
  BG: "Pay Merchant (Buy Goods)",
  WA: "Withdraw Cash at Agent Till",
  PB: "Paybill or Business number",
  SM: "Send Money (Mobile number)",
  SB: "Sent to Business (Business number CPI in MSISDN format)",
};

/**
 * Client for the Daraja Dynamic QR endpoint
 * (`POST /mpesa/qrcode/v1/generate`).
 */
export class DynamicQRClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validates a Dynamic QR request field-by-field and returns the
   * Daraja-shaped (PascalCase) wire body, or throws a descriptive
   * DarajaError describing exactly what's wrong.
   */
  private static validateAndTransform(
    request: DynamicQRRequest,
  ): DynamicQRWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "Dynamic QR request must be an object.",
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    const { merchantName, refNo, amount, trxCode, cpi, size } = request;

    // --- merchantName ---------------------------------------------------
    if (typeof merchantName !== "string") {
      throw new DarajaError({
        message: `merchantName must be a string, but received type "${typeof merchantName}".`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    const trimmedMerchantName = merchantName.trim();
    if (!trimmedMerchantName) {
      throw new DarajaError({
        message: "merchantName is required and cannot be empty.",
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    // --- refNo ------------------------------------------------------------
    if (typeof refNo !== "string") {
      throw new DarajaError({
        message: `refNo must be a string, but received type "${typeof refNo}".`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    const trimmedRefNo = refNo.trim();
    if (!trimmedRefNo) {
      throw new DarajaError({
        message: "refNo is required and cannot be empty.",
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    // --- amount -----------------------------------------------------------
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      throw new DarajaError({
        message: `amount must be a finite number, but received ${JSON.stringify(amount)} (type "${typeof amount}").`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    if (!Number.isInteger(amount)) {
      throw new DarajaError({
        message: `amount must be a whole number of KES (no decimals), but received ${amount}.`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    if (amount <= 0) {
      throw new DarajaError({
        message: `amount must be greater than 0, but received ${amount}.`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    // --- trxCode ------------------------------------------------------------
    if (
      typeof trxCode !== "string" ||
      !VALID_TRX_CODES.includes(trxCode as DynamicQRTrxCode)
    ) {
      const optionsList = VALID_TRX_CODES.map(
        (code) => `"${code}" (${TRX_CODE_HINTS[code]})`,
      ).join(", ");
      throw new DarajaError({
        message: `trxCode must be one of ${VALID_TRX_CODES.map((c) => `"${c}"`).join(", ")}, but received ${JSON.stringify(trxCode)}. Valid options: ${optionsList}.`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    // --- cpi ----------------------------------------------------------------
    if (typeof cpi !== "string") {
      throw new DarajaError({
        message: `cpi must be a string, but received type "${typeof cpi}".`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    const trimmedCpi = cpi.trim();
    if (!trimmedCpi) {
      throw new DarajaError({
        message: "cpi is required and cannot be empty.",
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    if (!/^\d+$/.test(trimmedCpi)) {
      throw new DarajaError({
        message: `cpi must contain only digits (a Till, Paybill, or MSISDN number), but received "${cpi}".`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    // --- size -----------------------------------------------------------
    if (
      typeof size !== "number" ||
      !Number.isFinite(size) ||
      !Number.isInteger(size)
    ) {
      throw new DarajaError({
        message: `size must be a whole number of pixels, but received ${JSON.stringify(size)} (type "${typeof size}").`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }
    if (size <= 0) {
      throw new DarajaError({
        message: `size must be greater than 0, but received ${size}.`,
        errorCode: "INVALID_QR_REQUEST",
      });
    }

    return {
      MerchantName: trimmedMerchantName,
      RefNo: trimmedRefNo,
      Amount: amount,
      TrxCode: trxCode,
      CPI: trimmedCpi,
      Size: String(size),
    };
  }

  /**
   * Generates a Dynamic M-Pesa QR code that customers can scan to initiate
   * a specific payment (Buy Goods, Paybill, Send Money, etc.) without
   * manually entering details.
   *
   * @example
   * ```ts
   * const qr = await daraja.dynamicQR.generate({
   *   merchantName: 'TEST SUPERMARKET',
   *   refNo: 'Invoice Test',
   *   amount: 1,
   *   trxCode: 'BG',
   *   cpi: '373132',
   *   size: 300,
   * });
   * console.log(qr.ResponseDescription); // "QR Code Successfully Generated."
   * ```
   */
  public async generate(request: DynamicQRRequest): Promise<DynamicQRResponse> {
    const body = DynamicQRClient.validateAndTransform(request);

    return this.http.request<DynamicQRResponse>("/mpesa/qrcode/v1/generate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Convenience helper: converts a Dynamic QR response's Base64 image data
   * into a ready-to-use `data:` URI for direct use in an `<img src>`.
   */
  public static toDataUri(response: DynamicQRResponse): string {
    return `data:image/png;base64,${response.QRCode}`;
  }
}
