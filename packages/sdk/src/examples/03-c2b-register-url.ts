// @ts-nocheck
/**
 * Example: Registering C2B Validation/Confirmation callback URLs.
 *
 * Run: npx tsx examples/03-c2b-register-url.ts
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
    const result = await daraja.c2b.registerUrl({
      shortCode: "600984",
      responseType: "Completed",
      confirmationUrl: "https://your-domain.com/callbacks/confirmation",
      validationUrl: "https://your-domain.com/callbacks/validation",
    });

    console.log("Registered:", result.ResponseDescription);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
