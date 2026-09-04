// @ts-nocheck
/**
 * Example: Looking up an M-PESA organization's name and tariff before
 * paying it (B2B Hakikisha).
 *
 * Run: npx tsx examples/07-b2b-hakikisha.ts
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
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.b2bHakikisha.query({
      identifierType: "4", // '4' = PayBill/B2C/other, '2' = Till number
      identifier: "666677",
    });

    console.log("Organization:", result.OrganizationName);
    console.log("Shortcode:", result.OrganizationShortCode);
    console.log("Charge profile:", result.ChargeProfileID);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
