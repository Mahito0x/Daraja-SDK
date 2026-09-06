import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./register-routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

registerRoutes(app);

app.listen(port, () => {
  console.log(`Daraja API listening on http://localhost:${port}`);
});
