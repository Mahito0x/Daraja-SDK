export type StkTransactionType =
  "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";

export interface StkPushRequest {
  /** The M-PESA Shortcode assigned to the Business (5–7 digits). */
  businessShortCode: string | number;

  /**
   * Your app's Passkey for this shortcode (from Daraja test data on
   * sandbox, or emailed to you after Go Live in production). The SDK
   * combines this with businessShortCode and a generated timestamp to
   * produce the `Password` field automatically — you never construct it
   * by hand.
   */
  passkey: string;

  /** "CustomerPayBillOnline" for Paybill, "CustomerBuyGoodsOnline" for Till. */
  transactionType: StkTransactionType;

  /** Transaction amount in KES. Safaricom limits: 1 – 250,000 per transaction. */
  amount: number;

  /** Phone number the funds are debited from, format "2547XXXXXXXX". */
  partyA: string;

  /** Organization shortcode/Till receiving the funds. */
  partyB: string | number;

  /** Mobile number to receive the USSD/STK prompt. Usually same as partyA. */
  phoneNumber: string;

  /** Publicly reachable URL that receives the async payment result. */
  callBackURL: string;

  /** Shown to the customer in the USSD prompt. Max 12 characters. */
  accountReference: string;

  /** Additional comment for the request. Max 13 characters. Optional. */
  transactionDesc?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryRequest {
  /** Must be the same shortcode used in the original push() call. */
  businessShortCode: string | number;

  /** Must be the same passkey used in the original push() call. */
  passkey: string;

  /** The CheckoutRequestID returned by the original push() call. */
  checkoutRequestId: string;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}
