export const typescriptExample = {
  id: "typescript",
  label: "checkout.ts",
  filename: "checkout.ts",
  language: "typescript",
  code: `import { Daraja } from "@lumierelabs/daraja"

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: "https://example.com/api/callbacks/stk",
  environment: "sandbox",
})

const push = await daraja.stkPush({
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254708374149",
  phoneNumber: "254708374149",
  accountReference: "INV-1042",
  transactionDesc: "Order #1042",
})

console.log(push.CheckoutRequestID)`,
} as const;
