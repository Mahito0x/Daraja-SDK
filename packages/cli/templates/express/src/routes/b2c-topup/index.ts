import { Router } from "express";
import { DarajaError } from "@lumierelabs/daraja";
import { daraja } from "../../daraja.js";

const router = Router();

router.post("/api/b2c-topup", async (request, response) => {
  try {
    const result = await daraja.b2cTopUp.topUp(request.body);
    response.json(result);
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

router.post("/callbacks/b2c-topup", (request, response) => {
  console.info("B2C Account Top Up result received", request.body?.Result);
  response.json({ ResultCode: 0, ResultDesc: "Result received" });
});

export default router;
