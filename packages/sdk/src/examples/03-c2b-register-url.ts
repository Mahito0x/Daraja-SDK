/**
 * Example: Registering C2B Validation/Confirmation callback URLs.
 *
 * Run: npx tsx examples/03-c2b-register-url.ts
 *
 * Note: in sandbox you can call this repeatedly. In production it's a
 * one-time call — to change the URLs later, delete the existing
 * registration first (via the Daraja self-service portal), then re-register.
 */
import { Daraja, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    const result = await daraja.c2b.registerUrl({
      shortCode: "600984",
      responseType: "Completed", // what M-PESA does if validationUrl is unreachable
      confirmationUrl: "https://your-domain.com/callbacks/confirmation",
      validationUrl: "https://your-domain.com/callbacks/validation",
    });

    console.log("Registered:", result.ResponseDescription);
  } catch (error) {
    if (error instanceof DarajaError) {
      // Common mistakes this SDK catches before hitting the network:
      // - confirmationUrl/validationUrl using HTTP in production
      // - URLs containing banned words like "mpesa" or "safaricom"
      // - URLs pointing at ngrok/mockbin/requestbin
      // - responseType not exactly "Completed" or "Cancelled"
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
