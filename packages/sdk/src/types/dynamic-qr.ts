/**
 * Transaction type for a Dynamic QR code.
 * - BG: Pay Merchant (Buy Goods)
 * - WA: Withdraw Cash at Agent Till
 * - PB: Paybill or Business number
 * - SM: Send Money (Mobile number)
 * - SB: Sent to Business. Business number CPI in MSISDN format.
 */
export type DynamicQRTrxCode = "BG" | "WA" | "PB" | "SM" | "SB";

export interface DynamicQRRequest {
  /** Name of the Company/M-Pesa Merchant Name. */
  merchantName: string;

  /** Transaction reference. */
  refNo: string;

  /** The total amount for the sale/transaction. */
  amount: number;

  /** Transaction type — see {@link DynamicQRTrxCode}. */
  trxCode: DynamicQRTrxCode;

  /**
   * Credit Party Identifier. Can be a Mobile Number, Business Number, Agent
   * Till, Paybill or Business number, or Merchant Buy Goods — depending on
   * `trxCode`.
   */
  cpi: string;

  /** Size of the QR code image in pixels (always square). */
  size: number;
}

/** Raw wire-format body Daraja actually expects (PascalCase). */
export interface DynamicQRWireRequest {
  MerchantName: string;
  RefNo: string;
  Amount: number;
  TrxCode: DynamicQRTrxCode;
  CPI: string;
  Size: string;
}

export interface DynamicQRResponse {
  /** Used to return the Transaction Type. */
  ResponseCode: string;

  RequestID: string;

  /** Description of the status of the transaction. */
  ResponseDescription: string;

  /** Base64-encoded QR code image data. */
  QRCode: string;
}
