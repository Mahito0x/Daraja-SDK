// @ts-nocheck
/**
 * Example: Checking a customer's last SIM swap date (fraud check).
 *
 * Run: npx tsx examples/05-swap.ts
 */
import { Daraja, SwapClient, DarajaError } from "..";

function assertEnvVar(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

const daraja = Daraja({
  consumerKey: assertEnvVar("CONSUMER_KEY", process.env.CONSUMER_KEY),
  consumerSecret: assertEnvVar("CONSUMER_SECRET", process.env.CONSUMER_SECRET),
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.swap.check({ customerNumber: "254722000000" });

    console.log("Swap check:", result.responseDesc);
    console.log("Last swap date:", result.lastSwapDate);

    if (SwapClient.wasRecentlySwapped(result)) {
      console.log("⚠️  Recently swapped — flag for extra verification.");
    } else {
      console.log("✅ No recent swap.");
    }
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
