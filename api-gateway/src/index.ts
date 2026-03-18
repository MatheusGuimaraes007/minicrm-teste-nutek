import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { contactsRoutes } from "./routes/contacts";

export interface Env {
  JWT_SECRET: string;
  AUTH_SERVICE_URL: string;
  N8N_WEBHOOK_URL: string;
  CORS_ORIGIN: string;
}

export interface Variables {
  userId: string;
  userEmail: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware
app.use("/*", async (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.CORS_ORIGIN, "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "api-gateway" }));

// Routes — auth proxy (no JWT required)
app.route("/auth", authRoutes);

// Routes — contacts proxy (JWT required via middleware)
app.route("/contacts", contactsRoutes);

export default app;
