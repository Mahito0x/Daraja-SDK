/**
 * Supported OAuth grant types for Daraja API.
 */
export type OAuthGrantType = "client_credentials";

/**
 * Successful OAuth response payload from Safaricom Daraja API.
 */
export interface OAuthTokenResponse {
  /**
   * The Bearer access token used to authenticate subsequent API requests.
   */
  access_token: string;

  /**
   * Lifetime of the access token in seconds (typically 3599 or 3600 seconds).
   */
  expires_in: string | number; // It expires afte every 3599 seconds (Approx 1m)
}

/**
 * Internal state for tracking active cached token status.
 */
export interface CachedToken {
  /**
   * Raw access token string.
   */
  token: string;

  /**
   * UNIX timestamp (in milliseconds) when the token will expire.
   */
  expiresAt: number;
}
