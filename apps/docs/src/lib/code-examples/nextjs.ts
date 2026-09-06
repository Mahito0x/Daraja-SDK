// lib/code-examples/nextjs.ts
export const nextjsExample = {
  id: "nextjs",
  label: "app/api/checkout/route.ts",
  filename: "app/api/checkout/route.ts",
  language: "typescript",
  code: `import { NextResponse } from "next/server"
import { Daraja, DarajaError } from "@lumierelabs/daraja"

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: \`\${process.env.APP_URL}/api/callbacks/stk\`,
  environment: "sandbox",
})

export async function POST(request: Request) {
  const { phoneNumber, amount, orderRef } = await request.json()

  try {
    const push = await daraja.stkPush({
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      phoneNumber,
      accountReference: orderRef,
      transactionDesc: "Order payment",
    })

    return NextResponse.json({ checkoutRequestId: push.CheckoutRequestID })
  } catch (error) {
    if (error instanceof DarajaError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 },
      )
    }
    throw error
  }
}`,
} as const;
