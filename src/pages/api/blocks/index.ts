import type { APIRoute } from "astro";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { db, type User } from "@/lib/db";
import { normalizeUsername } from "@/lib/social";
import { block, unblock } from "@/lib/blocks";

async function target(ctx: Parameters<APIRoute>[0]) {
  const { username, user_id } = await readJson<{ username?: string; user_id?: string }>(ctx.request);
  if (user_id) return db().prepare("SELECT * FROM users WHERE id = ?").bind(user_id).first<User>();
  return username ? db().prepare("SELECT * FROM users WHERE username = ?").bind(normalizeUsername(username)).first<User>() : null;
}

/** Block someone: `{ username }`. Removes follows both ways. */
export const POST: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const t = apiT(ctx);
  const them = await target(ctx);
  if (!them) return fail(t("notFound"), 404);
  if (them.id === me.id) return fail(t("error"));
  await block(me, them);
  return json({ blocked: true });
};

/** Unblock: `{ username }` or `{ user_id }`. */
export const DELETE: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const them = await target(ctx);
  if (!them) return fail(apiT(ctx)("notFound"), 404);
  await unblock(me.id, them.id);
  return json({ blocked: false });
};
