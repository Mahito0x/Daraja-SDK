import type { HttpClient } from "../client";
import { DarajaError } from "../types/errors";
import type {
  B2BHakikishaIdentifierType,
  B2BHakikishaRequest,
  B2BHakikishaResponse,
  B2BHakikishaWireRequest,
} from "../types/b2b-hakikisha";

const VALID_IDENTIFIER_TYPES: readonly B2BHakikishaIdentifierType[] = [
  "2",
  "4",
];

/**
 * Client for the Daraja B2B Hakikisha endpoint
 * (`POST /sfcverify/v1/query/info`).
 *
 * Looks up the registered name and applicable tariff of an M-PESA
 * organization account before you pay it — useful for catching wrong
 * till/paybill numbers before a B2B transaction goes out.
 */
export class B2BHakikishaClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validates a B2B Hakikisha request field-by-field and returns the
   * Daraja-shaped (PascalCase) wire body, or throws a descriptive
   * DarajaError describing exactly what's wrong.
   */
  private static validateAndTransform(
    request: B2BHakikishaRequest,
  ): B2BHakikishaWireRequest {
    if (request === null || typeof request !== "object") {
      throw new DarajaError({
        message: "B2B Hakikisha request must be an object.",
        errorCode: "INVALID_B2B_HAKIKISHA_REQUEST",
      });
    }

    const { identifierType, identifier } = request;

    if (
      typeof identifierType !== "string" ||
      !VALID_IDENTIFIER_TYPES.includes(
        identifierType as B2BHakikishaIdentifierType,
      )
    ) {
      throw new DarajaError({
        message: `identifierType must be one of "2" (Till number) or "4" (PayBill/other), but received ${JSON.stringify(identifierType)}.`,
        errorCode: "INVALID_B2B_HAKIKISHA_REQUEST",
      });
    }

    if (typeof identifier !== "string") {
      throw new DarajaError({
        message: `identifier must be a string, but received type "${typeof identifier}".`,
        errorCode: "INVALID_B2B_HAKIKISHA_REQUEST",
      });
    }
    const trimmed = identifier.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new DarajaError({
        message: `identifier must contain only digits (the organization's shortcode), but received "${identifier}".`,
        errorCode: "INVALID_B2B_HAKIKISHA_REQUEST",
      });
    }

    return {
      IdentifierType: identifierType,
      Identifier: trimmed,
    };
  }

  /**
   * Looks up the name and tariff of an M-PESA organization account, so you
   * can confirm the recipient (and expected fees) before a B2B payment.
   *
   * @example
   * ```ts
   * const result = await daraja.b2bHakikisha.query({
   *   identifierType: '4',
   *   identifier: '666677',
   * });
   * console.log(result.OrganizationName, result.ChargeProfileID);
   * ```
   */
  public async query(
    request: B2BHakikishaRequest,
  ): Promise<B2BHakikishaResponse> {
    const body = B2BHakikishaClient.validateAndTransform(request);

    return this.http.request<B2BHakikishaResponse>("/sfcverify/v1/query/info", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}
