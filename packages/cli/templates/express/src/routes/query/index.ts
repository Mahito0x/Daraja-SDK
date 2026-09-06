import { Router } from "express";
import { DarajaError } from "@lumierelabs/daraja";
import { daraja } from "../../daraja.js";

const router = Router();

router.post("/api/stk/query", async (request, response) => {
  try {
    const result = await daraja.stkPushQuery(request.body);
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

export default router;
