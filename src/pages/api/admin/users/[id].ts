import type { APIRoute } from "astro";
import { db, now } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/admin";

/**
 * Suspend (`{ suspended: true }`) or restore an account. A suspended account
 * can't sign in and disappears from search, profiles, feeds and its lists.
 * Admin only; the admin can't suspend themselves.
 */
export const POST: APIRoute = async (ctx) => {
  const me = ctx.locals.user;
  if (!isAdmin(me)) return fail("Not found", 404);
  const id = ctx.params.id ?? "";
  if (id === me!.id) return fail("Not yourself");
  const { suspended } = await readJson<{ suspended?: boolean }>(ctx.request);
  if (typeof suspended !== "boolean") return fail("Bad request");
  await db().prepare("UPDATE users SET suspended_at = ? WHERE id = ?").bind(suspended ? now() : null, id).run();
  return json({ ok: true });
};
