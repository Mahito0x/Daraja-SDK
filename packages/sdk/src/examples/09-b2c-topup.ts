/**
 * Example: Loading funds into a B2C shortcode's utility account, then
 * handling the async result callback that arrives at your resultURL.
 *
 * Run: npx tsx examples/09-b2c-topup.ts
 */
import { Daraja, B2CTopUpClient, DarajaError } from "..";
import type { B2CTopUpResultCallback } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function submitTopUp() {
  try {
    // securityCredential must be pre-encrypted with Safaricom's public
    // certificate (see the note on B2CTopUpRequest.securityCredential) —
    // the SDK does not perform that encryption for you.
    const accepted = await daraja.b2cTopUp.topUp({
      initiator: "testapi",
      securityCredential: process.env.B2C_SECURITY_CREDENTIAL!,
      senderShortCode: "600979",
      receiverShortCode: "600000",
      amount: 239,
      accountReference: "353353",
      remarks: "OK",
      queueTimeOutURL: "https://example.com/callbacks/timeout",
      resultURL: "https://example.com/callbacks/result",
    });

    console.log("Request accepted:", accepted.ResponseDescription);
    console.log("The real outcome arrives later at resultURL.");
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

/**
 * Example of handling the webhook Daraja calls at your `resultURL`.
 * (Framework-agnostic — adapt `rawBody` to however your server parses it.)
 */
function handleResultCallback(rawBody: unknown) {
  const { Result } = B2CTopUpClient.asResultCallback(
    rawBody as B2CTopUpResultCallback,
  );

  if (B2CTopUpClient.isSuccessfulResult(Result)) {
    const params = B2CTopUpClient.parseResultParameters(Result);
    console.log("Top up succeeded:", params.Amount, params.TransCompletedTime);
  } else {
    console.log("Top up failed:", Result.ResultDesc);
  }
}

submitTopUp();
void handleResultCallback; // referenced here only to keep the example self-contained
