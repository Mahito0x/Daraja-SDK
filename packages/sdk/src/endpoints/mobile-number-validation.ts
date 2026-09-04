import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type {
  MobileNumberValidationIdType,
  MobileNumberValidationRequest,
  MobileNumberValidationResponse,
  MobileNumberValidationWireRequest,
} from "../types/mobile-number-validation";

const VALID_ID_TYPES: readonly MobileNumberValidationIdType[] = [
  "01",
  "02",
  "05",
];

/**
 * Generates a requestRefID when the caller doesn't supply one. Not
 * cryptographically significant — Daraja just needs a string that's unique
 * per request for tracing.
 */
function generateRequestRefID(): string {
  return `mnv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Client for the Daraja Mobile Number Validation endpoint
 * (`POST /v1/KYC-validation/validateID`).
 *
 * Checks whether a phone number is registered under a given ID
 * (National ID, Military ID, or Passport) — useful for KYC, onboarding,
 * and fraud checks.
 */
export class MobileNumberValidationClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validates a request field-by-field and returns the wire body, or
   * throws a descriptive DarajaError describing exactly what's wrong.
   */
  private static validateAndTransform(
    request: MobileNumberValidationRequest,
  ): MobileNumberValidationWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "Mobile Number Validation request must be an object.",
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }

    const { requestRefID, shortCode, msisdn, idType, idNumber } = request;

    if (
      requestRefID !== undefined &&
      (typeof requestRefID !== "string" || !requestRefID.trim())
    ) {
      throw new DarajaError({
        message:
          "requestRefID must be a non-empty string when provided (or omit it to auto-generate one).",
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }
    const resolvedRequestRefID = requestRefID?.trim() || generateRequestRefID();

    if (typeof shortCode !== "string" || !/^\d{5,6}$/.test(shortCode.trim())) {
      throw new DarajaError({
        message: `shortCode must be a 5-6 digit Paybill/Till number, but received ${JSON.stringify(shortCode)}.`,
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }

    if (typeof msisdn !== "string" || !/^254\d{9}$/.test(msisdn.trim())) {
      throw new DarajaError({
        message: `msisdn must be a Kenyan number in the format 254XXXXXXXXX (12 digits), but received ${JSON.stringify(msisdn)}.`,
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }

    if (
      typeof idType !== "string" ||
      !VALID_ID_TYPES.includes(idType as MobileNumberValidationIdType)
    ) {
      throw new DarajaError({
        message: `idType must be one of "01" (National ID), "02" (Military ID), or "05" (Passport), but received ${JSON.stringify(idType)}.`,
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }

    if (typeof idNumber !== "string" || !/^\d+$/.test(idNumber.trim())) {
      throw new DarajaError({
        message: `idNumber must contain only digits, but received ${JSON.stringify(idNumber)}.`,
        errorCode: "INVALID_MOBILE_NUMBER_VALIDATION_REQUEST",
      });
    }

    return {
      requestRefID: resolvedRequestRefID,
      shortCode: shortCode.trim(),
      msisdn: msisdn.trim(),
      idType,
      idNumber: idNumber.trim(),
    };
  }

  /**
   * Checks whether `msisdn` is registered under the given `idType` +
   * `idNumber`.
   *
   * @example
   * ```ts
   * const result = await daraja.mobileNumberValidation.validate({
   *   shortCode: '12345',
   *   msisdn: '254710860780',
   *   idType: '01',
   *   idNumber: '454353453',
   * });
   * console.log(MobileNumberValidationClient.isMatch(result)); // true | false
   * ```
   */
  public async validate(
    request: MobileNumberValidationRequest,
  ): Promise<MobileNumberValidationResponse> {
    const body = MobileNumberValidationClient.validateAndTransform(request);

    return this.http.request<MobileNumberValidationResponse>(
      "/v1/KYC-validation/validateID",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  /**
   * Convenience helper: converts the API's string `"true"`/`"false"`
   * `status` field into an actual boolean.
   */
  public static isMatch(response: MobileNumberValidationResponse): boolean {
    return response.status === "true";
  }
}
