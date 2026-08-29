export interface SwapRequest {
  /** Customer MSISDN whose SIM swap history is being checked. */
  customerNumber: string;
}

/** Raw wire-format body Daraja actually expects (matches the public shape 1:1). */
export interface SwapWireRequest {
  customerNumber: string;
}

export interface SwapResponse {
  /** The unique request ID returned by the API for each request made. */
  requestRefID: string;

  /** Numeric status code (as a string). "200" means successful submission. */
  responseCode: string;

  /** Status message from the API, usually maps to responseCode. */
  responseDesc: string;

  /**
   * Last date the SIM was swapped, formatted `DD-MM-YYYY HH:mm`.
   * If the SIM was swapped more than 3 months ago, Daraja returns the
   * sentinel value `01-01-1900 00:00` instead of the real date.
   */
  lastSwapDate: string;
}
