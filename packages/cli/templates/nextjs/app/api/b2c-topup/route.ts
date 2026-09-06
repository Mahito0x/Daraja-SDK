import { NextResponse } from "next/server";
import { daraja } from "@/lib/daraja";
import { DarajaError } from "@lumierelabs/daraja";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await daraja.b2cTopUp.topUp(body);

    return NextResponse.json(result);
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
