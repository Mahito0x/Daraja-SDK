import { HttpClient } from "./client";
import { DynamicQRClient } from "./endpoints/dynamic-qr";
import { C2BClient } from "./endpoints/c2b";
import { SwapClient } from "./endpoints/swap";
import { IMSIClient } from "./endpoints/imsi";
import { B2BHakikishaClient } from "./endpoints/b2b-hakikisha";
import { MobileNumberValidationClient } from "./endpoints/mobile-number-validation";
import { B2CTopUpClient } from "./endpoints/b2c-topup";
import { DynamicOffersClient } from "./endpoints/dynamic-offers";
import { MpesaExpressClient } from "./endpoints/mpesa-express";
import type { DarajaConfig, ResolvedDarajaConfig } from "./types/config";
import type {
  StkPushRequest,
  StkPushResponse,
  StkQueryRequest,
  StkQueryResponse,
} from "./types/mpesa-express";

/**
 * Public shape of the Daraja client, returned by both `Daraja(config)` and
 * `new Daraja(config)` — see the `Daraja` export below for why both work.
 */
export interface DarajaClient {
  /** Dynamic QR endpoint — generate scannable M-Pesa payment QR codes. */
  readonly dynamicQR: DynamicQRClient;

  /** Customer To Business endpoints — register callback URLs, simulate payments. */
  readonly c2b: C2BClient;

  /** SIM Swap endpoint — check the last date a customer's SIM was swapped. */
  readonly swap: SwapClient;

  /**
   * Client for the Daraja IMSI endpoint. V1 returns hashed IMSI + last swap
   * date + network registration date; V2 returns hashed IMSI only.
   */
  readonly imsi: IMSIClient;

  /** B2B Hakikisha endpoint — look up an M-PESA organization's name and tariff before paying it. */
  readonly b2bHakikisha: B2BHakikishaClient;

  /** Mobile Number Validation endpoint — check if an msisdn matches a given ID. */
  readonly mobileNumberValidation: MobileNumberValidationClient;

  /** B2C Account Top Up endpoint — load funds into a B2C shortcode's utility account. */
  readonly b2cTopUp: B2CTopUpClient;

  /** Mobile Data Bundles endpoint — browse, purchase, and check status of data bundle offers. */
  readonly dynamicOffers: DynamicOffersClient;

  /**
   * M-Pesa Express (STK Push) client — exposed here for `.query()`.
   * `.push()` is also available as the top-level `stkPush()` shortcut below.
   */
  readonly mpesaExpress: MpesaExpressClient;

  /**
   * Sends an M-PESA payment prompt (STK Push) to a customer's phone.
   * Shortcut for `mpesaExpress.push(...)`.
   */
  stkPush(request: StkPushRequest): Promise<StkPushResponse>;

  /**
   * Checks the status of a previously initiated STK Push.
   * Shortcut for `mpesaExpress.query(...)`.
   */
  stkPushQuery(request: StkQueryRequest): Promise<StkQueryResponse>;

  /**
   * Returns a valid OAuth 2.0 access token from Safaricom Daraja.
   * Automatically returns the cached token if valid, or fetches a fresh token if expired.
   */
  getAccessToken(): Promise<string>;

  /**
   * Clears the in-memory cached access token, forcing the next call to request a fresh token.
   */
  clearAuthCache(): void;
}

/**
 * `Daraja` is callable both as `Daraja(config)` and `new Daraja(config)`.
 *
 * This interface gives it a construct signature (for `new Daraja(...)`,
 * used throughout this SDK's own tests/examples) *and* a call signature
 * (for `Daraja(...)`, the style shown in the README). Both produce an
 * identical `DarajaClient` — there's no behavioral difference, just two
 * accepted call styles.
 */
interface DarajaConstructor {
  (config: DarajaConfig): DarajaClient;
  new (config: DarajaConfig): DarajaClient;
}

function createDarajaClient(config: DarajaConfig): DarajaClient {
  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error(
      "Both consumerKey and consumerSecret are required to initialize the client.",
    );
  }

  const resolvedConfig: ResolvedDarajaConfig = {
    environment: "sandbox",
    timeout: 10000,
    ...config,
  };

  const http = new HttpClient(resolvedConfig);
  const dynamicQR = new DynamicQRClient(http);
  const c2b = new C2BClient(http);
  const swap = new SwapClient(http);
  const imsi = new IMSIClient(http);
  const b2bHakikisha = new B2BHakikishaClient(http);
  const mobileNumberValidation = new MobileNumberValidationClient(http);
  const b2cTopUp = new B2CTopUpClient(http);
  const dynamicOffers = new DynamicOffersClient(http);
  const mpesaExpress = new MpesaExpressClient(http);

  return {
    dynamicQR,
    c2b,
    swap,
    imsi,
    b2bHakikisha,
    mobileNumberValidation,
    b2cTopUp,
    dynamicOffers,
    mpesaExpress,
    stkPush: (request: StkPushRequest) => mpesaExpress.push(request),
    stkPushQuery: (request: StkQueryRequest) => mpesaExpress.query(request),
    getAccessToken: () => http.auth.getAccessToken(),
    clearAuthCache: () => http.auth.clearCache(),
  };
}

// `function` (not `class`) is what makes calling this without `new` work at
// runtime: a plain function invoked with `new` still uses its explicit
// object return value instead of `this`, so both call styles produce the
// same result. The cast to DarajaConstructor is what makes both call styles
// type-check.
export const Daraja = function (config: DarajaConfig): DarajaClient {
  return createDarajaClient(config);
} as unknown as DarajaConstructor;

// Re-export all public types and custom error classes
export * from "./types/config";
export * from "./types/auth";
export * from "./types/errors";
export * from "./types/dynamic-qr";
export * from "./types/c2b";
export * from "./types/swap";
export * from "./types/imsi";
export * from "./types/b2b-hakikisha";
export * from "./types/mobile-number-validation";
export * from "./types/b2c-topup";
export * from "./types/dynamic-offers";
export * from "./types/mpesa-express";
export { AuthManager } from "./auth";
export { HttpClient } from "./client";
export { DynamicQRClient } from "./endpoints/dynamic-qr";
export { C2BClient } from "./endpoints/c2b";
export { SwapClient } from "./endpoints/swap";
export { IMSIClient } from "./endpoints/imsi";
export { B2BHakikishaClient } from "./endpoints/b2b-hakikisha";
export { MobileNumberValidationClient } from "./endpoints/mobile-number-validation";
export { B2CTopUpClient } from "./endpoints/b2c-topup";
export { DynamicOffersClient } from "./endpoints/dynamic-offers";
export { MpesaExpressClient } from "./endpoints/mpesa-express";
