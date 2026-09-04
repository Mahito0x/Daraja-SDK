// @ts-nocheck
/**
 * Example: Sending an M-Pesa Express (STK Push) payment prompt.
 *
 * Run: npx tsx examples/11-mpesa-express-push.ts
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
  callbackUrl: "https://your-domain.com/callbacks/stk",
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.stkPush({
      transactionType: "CustomerPayBillOnline",
      amount: 1,
      partyA: "254708374149",
      phoneNumber: "254708374149",
      accountReference: "Test Ref",
      transactionDesc: "Test Payment",
    });

    console.log("STK Push sent:", result.CustomerMessage);
    console.log("Save this for status checks:", result.CheckoutRequestID);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
