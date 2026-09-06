import { NextResponse } from "next/server";

/**
 * Safaricom calls this AFTER a C2B payment has already completed — use it
 * to record the payment against an order/account in your own DB. The
 * payment has already gone through by the time this fires, so this
 * response isn't used to accept/reject anything.
 */
export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: persist the payment, e.g.:
  // await recordPayment({
  //   transactionId: payload.TransID,
  //   amount: payload.TransAmount,
  //   accountReference: payload.BillRefNumber,
  //   phoneNumber: payload.MSISDN,
  // });

  return NextResponse.json({
    ResultCode: "0",
    ResultDesc: "Confirmation Received Successfully",
  });
}
