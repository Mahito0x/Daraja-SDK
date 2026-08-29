/**
 * Example: Checking whether a phone number is registered under a given
 * National ID / Military ID / Passport (KYC check).
 *
 * Run: npx tsx examples/08-mobile-number-validation.ts
 */
import { Daraja, MobileNumberValidationClient, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.mobileNumberValidation.validate({
      shortCode: "12345",
      msisdn: "254710860780",
      idType: "01", // '01' National ID, '02' Military ID, '05' Passport
      idNumber: "454353453",
    });

    console.log("Response:", result.responseMessage);

    if (MobileNumberValidationClient.isMatch(result)) {
      console.log("✅ Number matches the provided ID.");
    } else {
      console.log("❌ Number does not match — flag for manual review.");
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
