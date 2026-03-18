import { Hono } from "hono";
import type { Env, Variables } from "../index";
import { authMiddleware } from "../middlewares/auth";

const contacts = new Hono<{ Bindings: Env; Variables: Variables }>();

// All contact routes require authentication
contacts.use("/*", authMiddleware);

// List contacts
contacts.get("/", async (c) => {
  const userId = c.get("userId");
  const targetUrl = `${c.env.N8N_WEBHOOK_URL}/webhook/contacts`;

  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "x-user-id": userId,
      "x-user-email": c.get("userEmail"),
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

// Create contact
contacts.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.text();
  const targetUrl = `${c.env.N8N_WEBHOOK_URL}/webhook/contacts`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-email": c.get("userEmail"),
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

// Delete contact
contacts.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const contactId = c.req.param("id");
  const targetUrl = `${c.env.N8N_WEBHOOK_URL}/webhook/contacts/${contactId}`;

  const response = await fetch(targetUrl, {
    method: "DELETE",
    headers: {
      "x-user-id": userId,
      "x-user-email": c.get("userEmail"),
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export { contacts as contactsRoutes };
