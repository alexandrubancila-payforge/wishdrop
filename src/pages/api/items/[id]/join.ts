import type { APIRoute } from "astro";
import { db, getItemWithList, newId, now } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { apiT, fail, json, readJson } from "@/lib/http";
import { contributorCount, syncGroupReserved } from "@/lib/gifts";

/**
 * Join a group gift — signed-in people only, like a reservation; kept by
 * account. (Older guest joins still carry a token in localStorage "wd_join",
 * which can leave them.)
 */
export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  if (!item.group_size) return fail(t("notGroupGift"), 409);
  const user = ctx.locals.user;
  if (!user) return fail(t("loginToReserve"), 401);
  if (user.id === item.owner_id) return fail(t("ownList"), 403);
  const already = await db()
    .prepare("SELECT 1 FROM item_contributors WHERE item_id = ? AND user_id = ?")
    .bind(item.id, user.id)
    .first();
  if (already) return fail(t("alreadyJoined"), 409);

  const { name: raw } = await readJson<{ name?: string | null }>(ctx.request);
  const name = typeof raw === "string" ? raw.trim().slice(0, 60) : "";
  const token = randomToken(16);
  // Only while a spot is free (checked in the same statement, so two people can't take the last one).
  const res = await db()
    .prepare(
      `INSERT INTO item_contributors (id, item_id, name, user_id, token, created_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6
        WHERE (SELECT COUNT(*) FROM item_contributors WHERE item_id = ?2) < (SELECT group_size FROM items WHERE id = ?2)`,
    )
    .bind(newId(), item.id, name || null, user.id, token, now())
    .run();
  if (!res.meta.changes) return fail(t("groupFull"), 409);
  await syncGroupReserved(item.id);
  return json({ ok: true, token, count: await contributorCount(item.id), size: item.group_size });
};

/** Leave: only whoever joined (by token from this device, or by account). */
export const DELETE: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  const { token } = await readJson<{ token?: string }>(ctx.request);
  const user = ctx.locals.user;
  const mine = await db()
    .prepare(
      `SELECT id FROM item_contributors
        WHERE item_id = ? AND ((? <> '' AND token = ?) OR (user_id IS NOT NULL AND user_id = ?))
        LIMIT 1`,
    )
    .bind(item.id, token ?? "", token ?? "", user?.id ?? "")
    .first<{ id: string }>();
  if (!mine) return fail(t("forbidden"), 403);
  await db().prepare("DELETE FROM item_contributors WHERE id = ?").bind(mine.id).run();
  await syncGroupReserved(item.id);
  return json({ ok: true, count: await contributorCount(item.id), size: item.group_size });
};
