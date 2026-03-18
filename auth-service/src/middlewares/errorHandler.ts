import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError {
  status?: number;
  message: string;
}

export function errorHandler(
  err: AppError | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Erro de validação",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // App errors with status code
  if ("status" in err && typeof err.status === "number") {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Unknown errors
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
}
