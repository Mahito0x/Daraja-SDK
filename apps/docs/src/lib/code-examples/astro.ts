export const astroExample = {
  id: "astro",
  label: "src/pages/api/checkout.ts",
  filename: "src/pages/api/checkout.ts",
  language: "typescript",
  code: `import type { APIRoute } from "astro"
import { Daraja, DarajaError } from "@lumierelabs/daraja"

const daraja = Daraja({
  consumerKey: import.meta.env.DARAJA_CONSUMER_KEY,
  consumerSecret: import.meta.env.DARAJA_CONSUMER_SECRET,
  shortcode: "174379",
  passkey: import.meta.env.MPESA_PASSKEY,
  callbackUrl: \`\${import.meta.env.APP_URL}/api/callbacks/stk\`,
  environment: "sandbox",
})

export const POST: APIRoute = async ({ request }) => {
  const { phoneNumber, amount, orderRef } = await request.json()

  try {
    const push = await daraja.stkPush({
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      phoneNumber,
      accountReference: orderRef,
    })

    return new Response(
      JSON.stringify({ checkoutRequestId: push.CheckoutRequestID }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    const message =
      error instanceof DarajaError ? error.message : "Payment failed to initiate"
    return new Response(JSON.stringify({ error: message }), { status: 400 })
  }
}

export const prerender = false`,
} as const;
