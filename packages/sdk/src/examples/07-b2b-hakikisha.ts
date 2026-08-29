/**
 * Example: Looking up an M-PESA organization's name and tariff before
 * paying it (B2B Hakikisha).
 *
 * Run: npx tsx examples/07-b2b-hakikisha.ts
 */
import { Daraja, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
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

    // Confirm the recipient before actually sending the B2B payment.
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
