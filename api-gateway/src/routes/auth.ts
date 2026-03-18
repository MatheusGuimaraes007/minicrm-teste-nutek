import { Hono } from "hono";
import type { Env } from "../index";

const auth = new Hono<{ Bindings: Env }>();

auth.all("/*", async (c) => {
  const url = new URL(c.req.url);
  const targetUrl = `${c.env.AUTH_SERVICE_URL}${url.pathname}`;

  const headers = new Headers(c.req.raw.headers);
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers,
    body: c.req.method !== "GET" && c.req.method !== "HEAD"
      ? c.req.raw.body
      : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export { auth as authRoutes };
