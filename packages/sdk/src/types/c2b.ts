/**
 * Determines what M-PESA does if your Validation URL is unreachable.
 * Must be exact sentence case — Safaricom's docs explicitly call this out.
 */
export type C2BResponseType = "Completed" | "Cancelled";

export interface C2BRegisterUrlRequest {
  /** Paybill/Till shortcode (5–6 digit organization number). */
  shortCode: string | number;

  /** Default action if the Validation URL can't be reached. */
  responseType: C2BResponseType;

  /** Publicly reachable URL that receives payment confirmations. */
  confirmationUrl: string;

  /** Publicly reachable URL that receives pre-payment validation requests. */
  validationUrl: string;
}

export interface C2BRegisterUrlResponse {
  /** Note: matches Safaricom's actual (misspelled) field name on the wire. */
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

/**
 * CustomerPayBillOnline: payment to a Paybill number (requires billRefNumber).
 * CustomerBuyGoodsOnline: payment to a Till number (no billRefNumber).
 */
export type C2BCommandId = "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";

export interface C2BSimulateRequest {
  /** Paybill/Till shortcode (5–6 digit organization number). */
  shortCode: string | number;

  /** Type of transaction being simulated. */
  commandId: C2BCommandId;

  /** Amount to be transacted (whole numbers only). */
  amount: number;

  /** Customer phone number the funds are debited from, e.g. "254708374149". */
  msisdn: string;

  /**
   * Account reference. Required when `commandId` is 'CustomerPayBillOnline',
   * and must be omitted for 'CustomerBuyGoodsOnline'.
   */
  billRefNumber?: string;
}

export interface C2BSimulateResponse {
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}
