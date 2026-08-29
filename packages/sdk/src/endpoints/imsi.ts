import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type {
  IMSIRequest,
  IMSIResponseV1,
  IMSIResponseV2,
  IMSIWireRequest,
} from "../types/imsi";

// Safaricom's docs give the base URL as
// "https://sandbox.safaricom.co.ke/{imsi_path_suffix}" and never fill in the
// suffix. These paths follow the same shape as the SWAP endpoint
// ("/imsi/v2/checkATI") but are NOT confirmed from the docs —
const IMSI_V1_PATH = "/imsi/v1/getIMSI";
const IMSI_V2_PATH = "/imsi/v2/getIMSI";

/** Sentinel Daraja returns when the SIM has not been swapped in the last 3 months. */
const NO_RECENT_SWAP_SENTINEL = "01-01-1900 00:00";

/**
 * Client for the Daraja IMSI endpoint. V1 returns hashed IMSI + last swap
 * date + network registration date; V2 returns hashed IMSI only.
 */
export class IMSIClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validates an IMSI request field-by-field and returns the wire body,
   * or throws a descriptive DarajaError describing exactly what's wrong.
   */
  private validateAndTransform(request: IMSIRequest): IMSIWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "IMSI request must be an object.",
        errorCode: "INVALID_IMSI_REQUEST",
      });
    }

    const { customerNumber } = request;

    if (typeof customerNumber !== "string") {
      throw new DarajaError({
        message: `customerNumber must be a string, but received type "${typeof customerNumber}".`,
        errorCode: "INVALID_IMSI_REQUEST",
      });
    }

    const trimmed = customerNumber.trim();
    if (!/^254\d{9}$/.test(trimmed)) {
      throw new DarajaError({
        message: `customerNumber must be a Kenyan MSISDN in the format 254XXXXXXXXX (12 digits), but received "${customerNumber}".`,
        errorCode: "INVALID_IMSI_REQUEST",
      });
    }

    return { customerNumber: trimmed };
  }

  /**
   * IMSI V1 — hashed IMSI, last SIM swap date, and network registration date.
   *
   * @example
   * ```ts
   * const result = await daraja.imsi.checkV1({ customerNumber: '254722000000' });
   * console.log(result.imsi, result.lastSwapDate);
   * ```
   */
  public async checkV1(request: IMSIRequest): Promise<IMSIResponseV1> {
    const body = this.validateAndTransform(request);

    return this.http.request<IMSIResponseV1>(IMSI_V1_PATH, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * IMSI V2 — hashed IMSI only (lighter response, cheaper per Safaricom's
   * pricing table than V1).
   *
   * @example
   * ```ts
   * const result = await daraja.imsi.checkV2({ customerNumber: '254722000000' });
   * console.log(result.imsi);
   * ```
   */
  public async checkV2(request: IMSIRequest): Promise<IMSIResponseV2> {
    const body = this.validateAndTransform(request);

    return this.http.request<IMSIResponseV2>(IMSI_V2_PATH, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Convenience helper: `true` if the SIM was swapped within the last 3
   * months, based on a V1 response's `lastSwapDate`.
   */
  public static wasRecentlySwapped(response: IMSIResponseV1): boolean {
    return response.lastSwapDate !== NO_RECENT_SWAP_SENTINEL;
  }
}
