import type { APIRoute } from "astro";
import { db, getWishlist } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { getGroup, membership } from "@/lib/santa";

/**
 * PATCH: my settings in the group — `{ wishlist_id }` (the list my Santa sees,
 * or null). DELETE: the organizer deletes the group, or a member leaves
 * (`{ user_id }` lets the organizer remove someone) — only before the draw.
 */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const group = await getGroup(ctx.params.id ?? "");
  if (!group || !(await membership(group.id, user.id))) return fail(t("notFound"), 404);
  const { wishlist_id } = await readJson<{ wishlist_id?: string | null }>(ctx.request);
  if (wishlist_id) {
    const list = await getWishlist(wishlist_id);
    if (!list || list.user_id !== user.id) return fail(t("notFound"), 404);
  }
  await db().prepare("UPDATE santa_members SET wishlist_id = ? WHERE group_id = ? AND user_id = ?").bind(wishlist_id || null, group.id, user.id).run();
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const group = await getGroup(ctx.params.id ?? "");
  if (!group || !(await membership(group.id, user.id))) return fail(t("notFound"), 404);
  const { user_id } = await readJson<{ user_id?: string }>(ctx.request);
  const isOwner = group.owner_id === user.id;
  // The organizer deleting the whole group works any time; leaving or removing only before the draw.
  if (!user_id && isOwner) {
    await db().prepare("DELETE FROM santa_groups WHERE id = ?").bind(group.id).run();
    return json({ deleted: true });
  }
  const target = user_id ?? user.id;
  if (target !== user.id && !isOwner) return fail(t("forbidden"), 403);
  if (target === group.owner_id) return fail(t("forbidden"), 403);
  if (group.drawn_at) return fail(t("santaDrawn"), 409);
  await db().prepare("DELETE FROM santa_members WHERE group_id = ? AND user_id = ?").bind(group.id, target).run();
  return json({ ok: true });
};
