/**
 * Identifier type for the shortcode being queried.
 * - '2': Lipa na M-PESA Till number or M-PESA agent till number.
 * - '4': PayBill, B2C account, or any other shortcode not covered by '2'.
 */
export type B2BHakikishaIdentifierType = "2" | "4";

export interface B2BHakikishaRequest {
  /** Type of the shortcode being looked up — see {@link B2BHakikishaIdentifierType}. */
  identifierType: B2BHakikishaIdentifierType;

  /** The shortcode registered under the organization, e.g. "666677". */
  identifier: string;
}

/** Raw wire-format body Daraja actually expects (PascalCase). */
export interface B2BHakikishaWireRequest {
  IdentifierType: B2BHakikishaIdentifierType;
  Identifier: string;
}

export interface B2BHakikishaResponse {
  /** Globally unique identifier of the request. */
  ConversationID: string;

  /** Numeric status code as a string. Per Safaricom's docs, "0" means success. */
  ResponseCode: string;

  /** Status message — success or error description. */
  ResponseMessage: string;

  /** More detailed message about the validated organization. */
  DetailedMessage: string;

  /** The Paybill/Till shortcode that was queried. */
  OrganizationShortCode: string;

  /** Name of the store/organization registered under the shortcode. */
  OrganizationName: string;

  /** ID of the applied charge/tariff profile. */
  ChargeProfileID: string;
}
