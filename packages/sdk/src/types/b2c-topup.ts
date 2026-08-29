export interface B2CTopUpRequest {
  /** M-Pesa API operator username (must have the "Org Business Pay to Bulk API initiator" role). */
  initiator: string;

  /**
   * The Initiator's password, RSA-encrypted with Safaricom's public
   * certificate. The SDK does NOT perform this encryption for you — use
   * Safaricom's online encryption tool (linked from the Daraja docs' Test
   * Credentials section) or their published public cert to generate this
   * ahead of time, then pass the resulting Base64 string here.
   */
  securityCredential: string;

  /** Your shortcode — money is deducted from this account (`PartyA`). */
  senderShortCode: string;

  /** The shortcode money is moved to (`PartyB`), e.g. "600000". */
  receiverShortCode: string;

  /** Amount to top up. */
  amount: number;

  /** Reference for the account being topped up. */
  accountReference: string;

  /** Optional MSISDN of the consumer on whose behalf you're paying. */
  requester?: string;

  /** Additional info associated with the transaction (max 100 characters). */
  remarks: string;

  /** Called by Daraja if the request times out before processing. */
  queueTimeOutURL: string;

  /** Called by Daraja with the final transaction result. */
  resultURL: string;
}

/** Raw wire-format body Daraja actually expects (PascalCase, all-string values). */
export interface B2CTopUpWireRequest {
  Initiator: string;
  SecurityCredential: string;
  CommandID: "BusinessPayToBulk";
  SenderIdentifierType: "4";
  RecieverIdentifierType: "4"; // sic — matches Safaricom's misspelling on the wire
  Amount: string;
  PartyA: string;
  PartyB: string;
  AccountReference: string;
  Requester?: string;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
}

/** Synchronous "request accepted" response — the actual result arrives later via `resultURL`. */
export interface B2CTopUpResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface B2CTopUpResultParameterItem {
  Key: string;
  Value: string | number;
}

export interface B2CTopUpReferenceItem {
  Key: string;
  Value?: string | number;
}

/** Shape of the `Result` object Daraja POSTs to your `resultURL`. */
export interface B2CTopUpResult {
  ResultType: number;
  ResultCode: number;
  ResultDesc: string;
  OriginatorConversationID: string;
  ConversationID: string;
  TransactionID: string;
  ResultParameters?: {
    ResultParameter: B2CTopUpResultParameterItem[];
  };
  ReferenceData?: {
    ReferenceItem: B2CTopUpReferenceItem[];
  };
}

/** Full body Daraja POSTs to your `resultURL` webhook. */
export interface B2CTopUpResultCallback {
  Result: B2CTopUpResult;
}
