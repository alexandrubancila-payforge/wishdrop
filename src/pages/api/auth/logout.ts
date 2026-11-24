import type { APIRoute } from "astro";
import { endSession } from "@/lib/auth";
import { json } from "@/lib/http";

export const POST: APIRoute = async (ctx) => {
  endSession(ctx.cookies);
  return json({ ok: true });
};
