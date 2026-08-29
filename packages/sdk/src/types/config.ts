/**
 * Supported Daraja API environments.
 */
export type DarajaEnvironment = "sandbox" | "production";

/**
 * Configuration options required to initialize the Daraja SDK client.
 */
export interface DarajaConfig {
  /**
   * Your Daraja App Consumer Key retrieved from the Safaricom Developer Portal.
   */
  consumerKey: string;

  /**
   * Your Daraja App Consumer Secret retrieved from the Safaricom Developer Portal.
   */
  consumerSecret: string;

  /**
   * Target environment for API requests.
   * @default 'sandbox'
   */
  environment?: DarajaEnvironment;

  /**
   * Request timeout in milliseconds.
   * @default 10000 (10 seconds)
   */
  timeout?: number;
}

/**
 * Fully resolved configuration with all optional fields filled with defaults.
 */
export type ResolvedDarajaConfig = Required<DarajaConfig>;
