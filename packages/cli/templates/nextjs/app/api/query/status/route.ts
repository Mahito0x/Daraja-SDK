import { NextResponse } from "next/server";
import { daraja } from "@/lib/daraja";
import { DarajaError } from "@lumierelabs/daraja";

export async function POST(request: Request) {
  const { checkoutRequestId } = await request.json();

  try {
    const status = await daraja.stkQuery({ checkoutRequestId });
    return NextResponse.json(status);
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
