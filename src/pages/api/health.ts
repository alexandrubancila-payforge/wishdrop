import type { APIRoute } from "astro";
import { db } from "@/lib/db";

/** For uptime monitors: 200 when the site and its database answer, 503 otherwise. */
export const GET: APIRoute = async () => {
  try {
    await db().prepare("SELECT 1").first();
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
};
