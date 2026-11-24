import type { APIRoute } from "astro";
import { db, getItemWithList } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { apiT, fail, json, readJson } from "@/lib/http";

/**
 * Reserve a gift — guests too. The response carries a token the browser keeps
 * (localStorage "wd_resv") so the same person can cancel later; a signed-in
 * reserver is also remembered by account.
 */
export const PATCH: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  const user = ctx.locals.user;
  if (user && user.id === item.owner_id) return fail(t("ownList"), 403);

  const { reserved_by } = await readJson<{ reserved_by?: string | null }>(ctx.request);
  const name = typeof reserved_by === "string" ? reserved_by.trim().slice(0, 60) : "";
  const token = randomToken(16);
  const res = await db()
    .prepare(
      `UPDATE items SET reserved_by = ?, reserved_at = ?, reserve_token = ?, reserver_user_id = ?
        WHERE id = ? AND reserved_at IS NULL`,
    )
    .bind(name || null, Date.now(), token, user?.id ?? null, item.id)
    .run();
  if (!res.meta.changes) return fail(t("alreadyReserved"), 409);
  return json({ ok: true, token });
};

/** Cancel: only whoever reserved it (by token from this device, or by account). */
export const DELETE: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  const { token } = await readJson<{ token?: string }>(ctx.request);
  const user = ctx.locals.user;
  const byToken = !!token && token === item.reserve_token;
  const byUser = !!user && !!item.reserver_user_id && item.reserver_user_id === user.id;
  if (!byToken && !byUser) return fail(t("forbidden"), 403);
  await db()
    .prepare("UPDATE items SET reserved_by = NULL, reserved_at = NULL, reserve_token = NULL, reserver_user_id = NULL WHERE id = ?")
    .bind(item.id)
    .run();
  return json({ ok: true });
};
