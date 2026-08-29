/**
 * Example: Checking a customer's last SIM swap date (fraud check).
 *
 * Run: npx tsx examples/05-swap.ts
 */
import { Daraja, SwapClient, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.swap.check({ customerNumber: "254722000000" });

    console.log("Swap check:", result.responseDesc);
    console.log("Last swap date:", result.lastSwapDate);

    if (SwapClient.wasRecentlySwapped(result)) {
      // SIM was swapped within the last 3 months — treat as higher risk,
      // e.g. require step-up auth before a password reset or payout.
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
