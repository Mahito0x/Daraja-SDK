import { NextResponse } from "next/server";

/**
 * Safaricom posts the asynchronous STK Push result here.
 * Persist the payload before acknowledging it.
 */
export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: persist payload.Body.stkCallback and update the payment in your DB.
  console.info("STK Push callback received", payload.Body?.stkCallback);

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
