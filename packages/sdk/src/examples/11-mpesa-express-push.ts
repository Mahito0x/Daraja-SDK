/**
 * Example: Sending an M-Pesa Express (STK Push) payment prompt.
 *
 * Run: npx tsx examples/11-mpesa-express-push.ts
 *
 * Note: `Password` and `Timestamp` are generated for you from
 * businessShortCode + passkey — you never Base64-encode anything by hand.
 */
import { Daraja, DarajaError } from "..";

// This SDK can be called with or without `new` — both are equivalent.
const daraja = Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.stkPush({
      businessShortCode: "174379",
      passkey: process.env.MPESA_PASSKEY!, // from Daraja's sandbox test data page
      transactionType: "CustomerPayBillOnline",
      amount: 1,
      partyA: "254708374149", // customer's phone (funds debited from here)
      partyB: "174379", // shortcode/till receiving the funds
      phoneNumber: "254708374149", // phone that receives the USSD prompt
      callBackURL: "https://your-domain.com/callbacks/stk",
      accountReference: "Test Ref", // max 12 chars, shown in the USSD prompt
      transactionDesc: "Test Payment", // optional, max 13 chars, defaults to "Payment"
    });

    console.log("STK Push sent:", result.CustomerMessage);
    console.log("Save this for status checks:", result.CheckoutRequestID);
  } catch (error) {
    if (error instanceof DarajaError) {
      // Common mistakes this SDK catches before hitting the network:
      // - businessShortCode/partyB not 5–7 digits
      // - partyA/phoneNumber not in "254XXXXXXXXX" format
      // - amount outside Safaricom's 1–250,000 KES per-transaction limit
      // - accountReference over 12 chars, transactionDesc over 13 chars
      // - callBackURL using HTTP in production, or containing a banned keyword
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
