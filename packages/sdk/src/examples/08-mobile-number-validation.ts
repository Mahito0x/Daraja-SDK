// @ts-nocheck
/**
 * Example: Checking whether a phone number is registered under a given
 * National ID / Military ID / Passport (KYC check).
 *
 * Run: npx tsx examples/08-mobile-number-validation.ts
 */
import { Daraja, MobileNumberValidationClient, DarajaError } from "..";

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
    const result = await daraja.mobileNumberValidation.validate({
      shortCode: "12345",
      msisdn: "254710860780",
      idType: "01",
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
