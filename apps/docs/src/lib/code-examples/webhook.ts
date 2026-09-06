export const webhookExample = {
  id: "webhook",
  label: "app/api/callbacks/stk/route.ts",
  filename: "app/api/callbacks/stk/route.ts",
  language: "typescript",
  code: `import { NextResponse } from "next/server"

interface StkCallbackItem {
  Name: string
  Value?: string | number
}

interface StkCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: { Item: StkCallbackItem[] }
    }
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as StkCallbackBody
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    payload.Body.stkCallback

  if (ResultCode === 0) {
    const items = CallbackMetadata?.Item ?? []
    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    console.log("Payment confirmed", {
      checkoutRequestId: CheckoutRequestID,
      amount: get("Amount"),
      receipt: get("MpesaReceiptNumber"),
      phoneNumber: get("PhoneNumber"),
    })
  } else {
    console.log(\`Payment failed for \${CheckoutRequestID}: \${ResultDesc}\`)
  }

  // Daraja only checks for a 200 — it does not parse this body.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
}`,
} as const;
