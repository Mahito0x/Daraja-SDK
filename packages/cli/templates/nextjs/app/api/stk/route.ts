import { NextResponse } from "next/server";
import { daraja } from "@/lib/daraja";
import { DarajaError } from "@lumierelabs/daraja";

export async function POST(request: Request) {
  const { phoneNumber, amount, orderRef } = await request.json();

  try {
    const push = await daraja.stkPush({
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      phoneNumber,
      accountReference: orderRef,
      transactionDesc: "Order payment",
    });

    return NextResponse.json({ checkoutRequestId: push.CheckoutRequestID });
  } catch (error) {
    if (error instanceof DarajaError) {
      return NextResponse.json(
        { error: error.message, code: error.errorCode },
        { status: error.statusCode || 400 },
      );
    }
    throw error;
  }
}
