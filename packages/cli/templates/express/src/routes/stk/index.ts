import { Router } from "express";
import { DarajaError } from "@lumierelabs/daraja";
import { daraja } from "../../daraja.js";

const router = Router();

router.post("/api/stk", async (request, response) => {
  try {
    const { phoneNumber, amount, orderRef, transactionDesc } = request.body;
    const result = await daraja.stkPush({
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      phoneNumber,
      accountReference: orderRef,
      transactionDesc,
    });
    response.json({ checkoutRequestId: result.CheckoutRequestID });
  } catch (error) {
    if (error instanceof DarajaError) {
      response
        .status(error.statusCode || 400)
        .json({ error: error.message, code: error.errorCode });
      return;
    }
    response.status(500).json({ error: "Unexpected server error" });
  }
});

router.post("/callbacks/stk", (request, response) => {
  console.info("STK callback received", request.body?.Body?.stkCallback);
  response.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

export default router;
