/**
 * ID type used to validate the mobile number against.
 * - '01': National ID
 * - '02': Military ID
 * - '05': Passport
 */
export type MobileNumberValidationIdType = "01" | "02" | "05";

export interface MobileNumberValidationRequest {
  /**
   * Unique string identifying this request. If omitted, the SDK generates
   * one for you.
   */
  requestRefID?: string;

  /** Organization's shortcode associated with the Paybill/Till number. */
  shortCode: string;

  /** Customer phone number to validate, format 254XXXXXXXXX. */
  msisdn: string;

  /** ID type — see {@link MobileNumberValidationIdType}. */
  idType: MobileNumberValidationIdType;

  /** The customer's ID number. */
  idNumber: string;
}

/** Raw wire-format body Daraja actually expects (matches the public shape 1:1). */
export interface MobileNumberValidationWireRequest {
  requestRefID: string;
  shortCode: string;
  msisdn: string;
  idType: MobileNumberValidationIdType;
  idNumber: string;
}

export interface MobileNumberValidationResponse {
  /** Unique identifier for the request. */
  responseRefID: string;

  /** Status code — "4000" on a successful lookup (match or no match). */
  responseCode: string;

  /** Description of the response, maps to responseCode. */
  responseMessage: string;

  /**
   * Whether msisdn/idType/idNumber matched. Note: Daraja returns this as
   * the *string* `"true"` or `"false"`, not a JSON boolean — use
   * {@link MobileNumberValidationClient.isMatch} to get an actual boolean.
   */
  status: "true" | "false";
}
