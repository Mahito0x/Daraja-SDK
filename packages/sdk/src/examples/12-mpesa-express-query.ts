/**
 * Example: Checking the status of a previously initiated STK Push.
 *
 * Run: npx tsx examples/12-mpesa-express-query.ts
 *
 * Useful when your callback URL didn't receive a result yet, or you'd
 * rather poll than wait — pass in the CheckoutRequestID from stkPush().
 */
import { Daraja, DarajaError } from "..";

const daraja = Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    // In a real app this comes from the stkPush() response you saved earlier.
    const checkoutRequestId = process.env.CHECKOUT_REQUEST_ID!;

    const status = await daraja.stkPushQuery({
      businessShortCode: "174379",
      passkey: process.env.MPESA_PASSKEY!,
      checkoutRequestId,
    });

    console.log("Result code:", status.ResultCode); // '0' = success, '1032' = cancelled by user, etc.
    console.log("Result desc:", status.ResultDesc);

    // Note: a cancelled/failed STK push is still a *successful* API call —
    // check ResultCode yourself rather than expecting this to throw.
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
