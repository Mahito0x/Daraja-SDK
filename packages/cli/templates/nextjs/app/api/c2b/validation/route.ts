import { NextResponse } from "next/server";

/**
 * Safaricom calls this BEFORE completing a C2B payment, letting you accept
 * or reject it (e.g. check the account/bill reference number is real).
 * Register this URL as your ValidationURL when you set up C2B.
 */
export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: validate payload.BillRefNumber against your own records.
  // To reject, respond with a non-zero ResultCode instead, e.g.:
  // return NextResponse.json({ ResultCode: "C2B00012", ResultDesc: "Invalid Account Number" });

  return NextResponse.json({ ResultCode: "0", ResultDesc: "Accepted" });
}
