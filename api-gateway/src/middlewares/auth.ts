import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import type { Env } from "../index";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token não fornecido" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const userId = payload.userId as string;
    const email = payload.email as string;

    if (!userId || !email) {
      return c.json({ error: "Token inválido" }, 401);
    }

    // Inject user info into headers for downstream services
    c.set("userId", userId);
    c.set("userEmail", email);

    await next();
  } catch {
    return c.json({ error: "Token inválido ou expirado" }, 401);
  }
}
