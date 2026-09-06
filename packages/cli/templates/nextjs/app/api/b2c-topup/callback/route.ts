import { NextResponse } from "next/server";

/**
 * Safaricom posts the final B2C Account Top Up result here.
 * Persist payload.Result and return a successful acknowledgement.
 */
export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: persist payload.Result and update the top-up status in your DB.
  console.info("B2C Account Top Up result received", payload.Result);

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Result received" });
}
