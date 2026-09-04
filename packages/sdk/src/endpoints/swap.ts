import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type { SwapRequest, SwapResponse, SwapWireRequest } from "../types/swap";

/** Sentinel Daraja returns when the SIM has not been swapped in the last 3 months. */
const NO_RECENT_SWAP_SENTINEL = "01-01-1900 00:00";

/**
 * Client for the Daraja SWAP endpoint
 * (`POST /imsi/v2/checkATI`).
 */
export class SwapClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validates a Swap request field-by-field and returns the wire body,
   * or throws a descriptive DarajaError describing exactly what's wrong.
   */
  private static validateAndTransform(request: SwapRequest): SwapWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "Swap request must be an object.",
        errorCode: "INVALID_SWAP_REQUEST",
      });
    }

    const { customerNumber } = request;

    if (typeof customerNumber !== "string") {
      throw new DarajaError({
        message: `customerNumber must be a string, but received type "${typeof customerNumber}".`,
        errorCode: "INVALID_SWAP_REQUEST",
      });
    }

    const trimmed = customerNumber.trim();
    if (!/^254\d{9}$/.test(trimmed)) {
      throw new DarajaError({
        message: `customerNumber must be a Kenyan MSISDN in the format 254XXXXXXXXX (12 digits), but received "${customerNumber}".`,
        errorCode: "INVALID_SWAP_REQUEST",
      });
    }

    return {
      customerNumber: trimmed,
    };
  }

  /**
   * Checks the last date a customer's SIM card was swapped. Useful as a
   * fraud check before high-risk actions (password resets, loan
   * disbursements, high-value B2C payouts, cheque clearing, etc.).
   *
   * @example
   * ```ts
   * const result = await daraja.swap.check({ customerNumber: '254722000000' });
   * if (SwapClient.wasRecentlySwapped(result)) {
   *   // flag or block the transaction
   * }
   * ```
   */
  public async check(request: SwapRequest): Promise<SwapResponse> {
    const body = SwapClient.validateAndTransform(request);

    return this.http.request<SwapResponse>("/imsi/v2/checkATI", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Convenience helper: `true` if the SIM was swapped within the last 3
   * months. Daraja masks any older swap date behind the sentinel value
   * `01-01-1900 00:00`, so the absence of that sentinel is itself the signal.
   */
  public static wasRecentlySwapped(response: SwapResponse): boolean {
    return response.lastSwapDate !== NO_RECENT_SWAP_SENTINEL;
  }
}
