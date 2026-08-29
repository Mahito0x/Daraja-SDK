/**
 * Zero-dependency ANSI color utility for terminal output.
 * Respects NO_COLOR environment variable standard.
 */

import symbols from "log-symbols";

const isColorSupported =
  typeof process !== "undefined" &&
  !process.env?.NO_COLOR &&
  (process.env?.FORCE_COLOR !== undefined || process.stdout?.isTTY !== false);

const c = {
  bold: (str: string) => (isColorSupported ? `\x1b[1m${str}\x1b[22m` : str),
  dim: (str: string) => (isColorSupported ? `\x1b[2m${str}\x1b[22m` : str),
  red: (str: string) => (isColorSupported ? `\x1b[31m${str}\x1b[39m` : str),
  green: (str: string) => (isColorSupported ? `\x1b[32m${str}\x1b[39m` : str),
  cyan: (str: string) => (isColorSupported ? `\x1b[36m${str}\x1b[39m` : str),
  blue: (str: string) => (isColorSupported ? `\x1b[34m${str}\x1b[39m` : str),
  gray: (str: string) => (isColorSupported ? `\x1b[90m${str}\x1b[39m` : str),
  underline: (str: string) =>
    isColorSupported ? `\x1b[4m${str}\x1b[24m` : str,
};

/**
 * Standard HTTP Status Text map for clean terminal formatting.
 */
const HTTP_STATUS_MAP: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

/**
 * Known Daraja auto-suggestions for common errors.
 */
const SUGGESTIONS_MAP: Record<string, string> = {
  INVALID_CREDENTIALS:
    "Double-check your Consumer Key (48 chars) and Consumer Secret (64 chars) from the Daraja Developer Portal. Ensure they are not swapped.",
  INVALID_QR_REQUEST:
    "Check the field named in the message against the Dynamic QR request schema (merchantName, refNo, amount, trxCode, cpi, size).",
  INVALID_C2B_REQUEST:
    "Check the field named in the message against the C2B request schema, and see Safaricom's callback URL rules (HTTPS in production, no banned keywords, no public URL tunnels).",
  INVALID_CALLBACK_URL:
    "Callback URLs must be HTTPS in production (HTTP is fine in sandbox), must not contain banned words (mpesa, safaricom, exec, sql...), and must not point at ngrok/mockbin/requestbin.",
  INVALID_STK_REQUEST:
    "Check the field named in the message against the M-Pesa Express (STK Push) request schema.",
  SIMULATE_NOT_AVAILABLE_IN_PRODUCTION:
    "C2B simulate() only works in sandbox. Use a real payment or the Daraja portal simulator to test in production.",
  INVALID_ENVIRONMENT:
    'Set `environment` to either "sandbox" or "production" in your Daraja config.',
  INVALID_TIMEOUT:
    "Set `timeout` to a positive number of milliseconds (e.g. 10000 for 10s), or omit it to use the default.",
  OAUTH_AUTHENTICATION_FAILED:
    "Verify your app credentials and ensure your Sandbox App status is ACTIVE on Daraja.",
  MALFORMED_OAUTH_RESPONSE:
    "Daraja responded with 200 OK but an unexpected payload. This usually indicates an upstream Safaricom issue — check their status page or retry.",
  "400.008.01":
    "Incorrect authorization type passed. Select Basic authentication header.",
  "400.008.02":
    "Incorrect grant type passed. Ensure grant_type parameter is set to client_credentials.",
  REQUEST_TIMEOUT:
    "The request timed out. Check your network connectivity or increase the configured SDK timeout.",
  INVALID_SWAP_REQUEST:
    "Check customerNumber against the Swap request schema — it must be a Kenyan MSISDN in the format 254XXXXXXXXX (12 digits).",
  INVALID_B2B_HAKIKISHA_REQUEST:
    'Check identifierType ("2" for Till, "4" for PayBill/other) and identifier (digits only) against the B2B Hakikisha request schema.',
  INVALID_MOBILE_NUMBER_VALIDATION_REQUEST:
    'Check shortCode, msisdn, idType ("01"/"02"/"05"), and idNumber against the Mobile Number Validation request schema.',
  INVALID_B2C_TOPUP_REQUEST:
    "Check initiator, securityCredential, senderShortCode/receiverShortCode, amount, accountReference, remarks (≤100 chars), and the callback URLs against the B2C Top Up request schema.",
  INVALID_DYNAMIC_OFFERS_REQUEST:
    "Check msisdn (254XXXXXXXXX), and for purchase()/checkStatus() the offeringId/accountId/paymentMode/price/resourceAmount/validity/transactionId fields, against the Dynamic Offers request schema.",
};

export interface DarajaErrorOptions {
  message: string;
  statusCode?: number;
  errorCode?: string;
  endpoint?: string;
  suggestion?: string;
  docUrl?: string;
  cause?: unknown;
  rawResponse?: unknown;
}

/**
 * Custom error thrown when the Daraja API returns an error response
 * or when SDK validation fails. Formats terminal output like major SaaS SDKs.
 */
export class DarajaError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly endpoint?: string;
  public readonly suggestion?: string;
  public readonly docUrl?: string;
  public readonly cause?: unknown;
  public readonly rawResponse?: unknown;

  constructor(options: DarajaErrorOptions) {
    super(options.message);
    this.name = "DarajaError";
    this.statusCode = options.statusCode ?? 0;
    this.errorCode = options.errorCode ?? "UNKNOWN_ERROR";
    this.endpoint = options.endpoint;
    this.suggestion = options.suggestion || SUGGESTIONS_MAP[this.errorCode];
    this.docUrl = options.docUrl || `ComingSoon`;
    this.cause = options.cause;
    this.rawResponse = options.rawResponse;

    // Safely capture stack trace in V8 runtime environments (Node.js, Bun)
    const ErrorWithV8 = Error as unknown as {
      captureStackTrace?: (
        targetObject: object,
        constructorOpt?: Function,
      ) => void;
    };

    if (typeof ErrorWithV8.captureStackTrace === "function") {
      ErrorWithV8.captureStackTrace(this, DarajaError);
    }
  }

  /**
   * Generates the styled visual error box for CLI output.
   */
  public format(): string {
    const divider = c.gray(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    const header = `${c.red(symbols.warning)}  ${c.bold("Safaricom Daraja Error")}`;

    const statusText =
      this.statusCode > 0
        ? `${this.statusCode} ${HTTP_STATUS_MAP[this.statusCode] || ""}`.trim()
        : "N/A (Client Error)";

    const labelPad = (label: string) => c.bold(label.padEnd(12));

    const lines: string[] = [
      divider,
      header,
      "",
      `${labelPad("Code")}${c.cyan(this.errorCode)}`,
      `${labelPad("Status")}${statusText}`,
    ];

    if (this.endpoint) {
      lines.push(`${labelPad("Endpoint")}${this.endpoint}`);
    }

    // Message highlighted in RED
    lines.push(`${labelPad("Message")}${c.red(this.message)}`);

    // Suggestion highlighted in GREEN
    if (this.suggestion) {
      lines.push("");
      lines.push(c.bold("Suggestion"));
      lines.push(c.green(this.suggestion));
    }

    // Documentation Link
    if (this.docUrl) {
      lines.push("");
      lines.push(c.bold("Documentation"));
      lines.push(c.blue(c.underline(this.docUrl)));
    }

    // Exception details (Stack trace or raw cause)
    if (this.cause) {
      lines.push("");
      lines.push(c.bold("Exception"));
      const causeStr =
        this.cause instanceof Error
          ? `${this.cause.name}: ${this.cause.message}`
          : JSON.stringify(this.cause, null, 2);
      lines.push(c.dim(causeStr));
    }

    lines.push(divider);

    return lines.join("\n");
  }

  /**
   * Override default toString to return formatted output.
   */
  public override toString(): string {
    return this.format();
  }

  /**
   * Hook for Node.js `console.log(err)` / `console.error(err)` inspect formatting.
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.format();
  }
}
