/**
 * Example: Setting up the Daraja client and fetching an access token.
 *
 * Run: npx tsx examples/01-authentication.ts
 * Requires: CONSUMER_KEY and CONSUMER_SECRET in your environment (see .env).
 */
import { Daraja, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox", // or 'production'
});

async function main() {
  try {
    // You never need to call this manually — every endpoint method fetches
    // and caches a token automatically. This is here to show it exists,
    // e.g. if you want to warm the cache at app startup.
    const token = await daraja.getAccessToken();
    console.log("Access token acquired:", token.slice(0, 12) + "...");

    // Calling getAccessToken() again immediately returns the cached token
    // (no network call) until it's within 60s of expiring.
    await daraja.getAccessToken();

    // Force a fresh token on the next call (e.g. after a security rotation).
    daraja.clearAuthCache();
  } catch (error) {
    if (error instanceof DarajaError) {
      // DarajaError.format() gives you the boxed, colorized CLI output.
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
