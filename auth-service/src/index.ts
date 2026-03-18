import express from "express";
import cors from "cors";
import { env } from "./config";
import { authRoutes } from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Auth Service rodando na porta ${env.PORT}`);
});
