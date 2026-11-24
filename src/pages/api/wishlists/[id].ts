import type { APIRoute } from "astro";
import { db, getItems, getWishlist } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { deleteImage } from "@/lib/storage";

async function ownList(id: string | undefined, userId: string) {
  const list = id ? await getWishlist(id) : null;
  return list && list.user_id === userId ? list : null;
}

/** Rename, or switch surprise mode (hide who reserved what from the owner). */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const list = await ownList(ctx.params.id, user.id);
  if (!list) return fail(t("notFound"), 404);
  const body = await readJson<{ name?: string; hide_reservations?: boolean }>(ctx.request);

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return fail(t("nameRequired"));
    if (name.length > 60) return fail(t("nameTooLong"));
    await db().prepare("UPDATE wishlists SET name = ? WHERE id = ?").bind(name, list.id).run();
  }
  if (typeof body.hide_reservations === "boolean") {
    await db().prepare("UPDATE wishlists SET hide_reservations = ? WHERE id = ?").bind(body.hide_reservations ? 1 : 0, list.id).run();
  }
  return json({ ok: true });
};

/** Delete the list, its gifts and their photos. */
export const DELETE: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const list = await ownList(ctx.params.id, user.id);
  if (!list) return fail(apiT(ctx)("notFound"), 404);
  const items = await getItems(list.id);
  await db().batch([
    db().prepare("DELETE FROM items WHERE wishlist_id = ?").bind(list.id),
    db().prepare("DELETE FROM wishlists WHERE id = ?").bind(list.id),
  ]);
  await Promise.all(items.map((i) => deleteImage(i.image_key)));
  return json({ ok: true });
};
