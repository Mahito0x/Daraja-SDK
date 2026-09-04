// @ts-nocheck
/**
 * Example: Checking the status of a previously initiated STK Push.
 *
 * Run: npx tsx examples/12-mpesa-express-query.ts
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
  shortcode: "174379",
  passkey: assertEnvVar("MPESA_PASSKEY", process.env.MPESA_PASSKEY),
  environment: "sandbox",
});

async function main() {
  try {
    const checkoutRequestId = assertEnvVar(
      "CHECKOUT_REQUEST_ID",
      process.env.CHECKOUT_REQUEST_ID,
    );

    const status = await daraja.stkPushQuery({ checkoutRequestId });

    console.log("Result code:", status.ResultCode);
    console.log("Result desc:", status.ResultDesc);

    if (status.ResultCode === "0") {
      console.log("Payment completed successfully.");
    } else {
      console.log("Payment was not completed:", status.ResultDesc);
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
