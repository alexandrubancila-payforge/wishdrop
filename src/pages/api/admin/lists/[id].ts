import type { APIRoute } from "astro";
import { db, now } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/admin";

/** Hide (`{ hidden: true }`) or show a list: hidden lists answer 404 to everyone but their owner. Admin only. */
export const POST: APIRoute = async (ctx) => {
  if (!isAdmin(ctx.locals.user)) return fail("Not found", 404);
  const { hidden } = await readJson<{ hidden?: boolean }>(ctx.request);
  if (typeof hidden !== "boolean") return fail("Bad request");
  await db().prepare("UPDATE wishlists SET hidden_at = ? WHERE id = ?").bind(hidden ? now() : null, ctx.params.id ?? "").run();
  return json({ ok: true });
};
