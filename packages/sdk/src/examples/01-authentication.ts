// @ts-nocheck
/**
 * Example: Setting up the Daraja client and fetching an access token.
 *
 * Run: npx tsx examples/01-authentication.ts
 * Requires: CONSUMER_KEY and CONSUMER_SECRET in your environment (see .env).
 */
import { Daraja, DarajaError } from "..";

function assertEnvVar(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

const daraja = Daraja({
  consumerKey: assertEnvVar("CONSUMER_KEY", process.env.CONSUMER_KEY),
  consumerSecret: assertEnvVar("CONSUMER_SECRET", process.env.CONSUMER_SECRET),
  environment: "sandbox", // or 'production'
});

async function main() {
  try {
    const token = await daraja.getAccessToken();
    console.log(`Access token acquired: ${token.slice(0, 12)}...`);

    await daraja.getAccessToken();
    daraja.clearAuthCache();
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
