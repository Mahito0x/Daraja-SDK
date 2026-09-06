import { Daraja } from "@lumierelabs/daraja";

/**
 * Single shared Daraja client, configured from the env vars written to
 * .env by `create-daraja`. Import `daraja` wherever you need to call the
 * M-Pesa API — never instantiate a new client per request.
 */
export const daraja = new Daraja({
  environment:
    (process.env.DARAJA_ENVIRONMENT as "sandbox" | "production") ?? "sandbox",
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  passkey: process.env.DARAJA_PASSKEY!,
  shortcode: process.env.DARAJA_SHORTCODE!,
  callbackUrl: process.env.DARAJA_CALLBACK_URL!,
});
