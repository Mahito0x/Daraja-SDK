export interface IMSIRequest {
  /** Customer MSISDN whose IMSI / network age is being determined. */
  customerNumber: string;
}

/** Raw wire-format body Daraja actually expects (matches the public shape 1:1). */
export interface IMSIWireRequest {
  customerNumber: string;
}

export interface IMSIResponseV1 {
  requestRefID: string;
  responseCode: string;
  responseDesc: string;

  /** Hashed IMSI (International Mobile Subscriber Identity). */
  imsi: string;

  /**
   * Last date the SIM was swapped. If the SIM was swapped more than 3
   * months ago, Daraja returns the sentinel value `01-01-1900 00:00`
   * instead of the real date.
   */
  lastSwapDate: string;

  /**
   * MSISDN registration date on the network (e.g. "2019-01-12"), or a
   * message indicating the registration is more than one year old.
   */
  msisdnRegistrationDate: string;

  customerNumber: string;
}

export interface IMSIResponseV2 {
  requestRefID: string;
  responseCode: string;
  responseDesc: string;

  /** Hashed IMSI (International Mobile Subscriber Identity). */
  imsi: string;

  customerNumber: string;
}
