import { Router } from "express";
import { DarajaError } from "@lumierelabs/daraja";
import { daraja } from "../../daraja.js";

const router = Router();

router.post("/api/c2b/register", async (request, response) => {
  try {
    const result = await daraja.c2b.registerUrl(request.body);
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

router.post("/callbacks/c2b/confirmation", (request, response) => {
  console.info("C2B confirmation received", request.body);
  response.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

router.post("/callbacks/c2b/validation", (_request, response) => {
  response.json({ ResultCode: "0", ResultDesc: "Accepted" });
});

export default router;
