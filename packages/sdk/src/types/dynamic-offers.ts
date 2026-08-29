// ---------------------------------------------------------------------
// Fetch Offers — GET /v1/dynamic-offers/fetch
// ---------------------------------------------------------------------

export interface DynamicOffersFetchRequest {
  /** The mobile number in session. */
  msisdn: string;
}

export interface DynamicOffersChildOffer {
  offerName: string;
  offerValidity: number;
  resourceAccId: number;
  resourceValue: number;
  offerPrice: number;
  offerUssdName: string;
  parentOfferId: number;
}

export interface DynamicOffersOffer {
  offerName: string;
  uniqueOfferingId: string;
  offerValidity: number;
  resourceAccId: number;
  resourceValue: number;
  offerPrice: number;
  offerUssdName: string;
  offeringId: number;
  offerSource: string;
  locationId: number;
  subscribed: number;
  /** Bundles this offer contains (e.g. a weekly bundle containing daily boosters). */
  childOffers?: DynamicOffersChildOffer[];
}

export interface DynamicOffersFetchResponse {
  id: string;
  desc: string;
  status: string;
  /** Sic — matches Safaricom's misspelling on the wire. */
  relatedSusbscription?: Array<{ desc: string; name: string }>;
  lineItem: {
    characteristicsValue: DynamicOffersOffer[];
  };
}

// ---------------------------------------------------------------------
// Offer Purchase — POST /v1/dynamic-offers/facebook-bundle/purchase
// ---------------------------------------------------------------------

export type DynamicOffersPaymentMode = "airtime" | "m-pesa";

export interface DynamicOffersPurchaseRequest {
  msisdn: string;

  /** The offer's `offeringId`, from {@link DynamicOffersOffer.offeringId}. */
  offeringId: string;

  /** How the customer is paying. */
  paymentMode: DynamicOffersPaymentMode;

  /** The account that will receive the resources, from `resourceAccId`. */
  accountId: string;

  /** The offer's price, from `offerPrice`. */
  price: number;

  /** Resources to award in MBs, from `resourceValue`. */
  resourceAmount: number;

  /** Validity in days/hours, from `offerValidity`. */
  validity: number;

  /** Your own correlation ID for this purchase — used later to check status. */
  transactionId: string;
}

/** Raw wire-format body Daraja actually expects (all-string values). */
export interface DynamicOffersPurchaseWireRequest {
  offeringId: string;
  accountId: string;
  price: string;
  resourceAmount: string;
  validity: string;
  msisdn: string;
  transactionId: string;
  paymentMode: DynamicOffersPaymentMode;
}

export interface DynamicOffersPurchaseResponse {
  header: {
    requestRefId: string;
    responseCode: number;
    responseMessage: string;
    /** Message intended to be shown directly to the customer. */
    customerMessage: string;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------
// Check Status — GET /v2/bundles/get/status
// ---------------------------------------------------------------------

export interface DynamicOffersCheckStatusRequest {
  /** The `transactionId` you supplied on the original purchase request. */
  transactionId: string;

  /**
   * Identifies the service account tied to the request.
   * @default '0' — Safaricom's docs say to always use "0" for dynamic offers.
   */
  serviceAccountId?: string;
}

export interface DynamicOffersCheckStatusResponse {
  responseId: string;
  responseDesc: string;
  responseStatus: string;
  responseCreated: string;
}
