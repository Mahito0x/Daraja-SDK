/**
 * Example: Fetching a customer's hashed IMSI, last swap date, and network
 * registration date (V1), plus the lighter IMSI-only V2 response.
 *
 * Run: npx tsx examples/06-imsi.ts
 */
import { Daraja, IMSIClient, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    // V1 — hashed IMSI + swap date + network registration date.
    const v1 = await daraja.imsi.checkV1({ customerNumber: "254722000000" });
    console.log("IMSI (V1):", v1.imsi);
    console.log("Network registration date:", v1.msisdnRegistrationDate);

    if (IMSIClient.wasRecentlySwapped(v1)) {
      console.log("⚠️  Recently swapped — flag for extra verification.");
    }

    // V2 — hashed IMSI only, cheaper per-call.
    const v2 = await daraja.imsi.checkV2({ customerNumber: "254722000000" });
    console.log("IMSI (V2):", v2.imsi);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
