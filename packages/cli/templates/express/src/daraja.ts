import { Daraja } from "@lumierelabs/daraja";

export const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.DARAJA_SHORTCODE!,
  passkey: process.env.DARAJA_PASSKEY!,
  callbackUrl: process.env.DARAJA_CALLBACK_URL!,
  environment:
    process.env.DARAJA_ENVIRONMENT === "production" ? "production" : "sandbox",
});
