import type { APIRoute } from "astro";
import { createWishlist, db, getItemWithList, getWishlist, newId, now } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { blockedEitherWay } from "@/lib/blocks";
import { notifyFollowers } from "@/lib/notifications";
import { copyImage } from "@/lib/storage";

/**
 * "I want it too" → put the same gift in one of my lists: `{ wishlist_id }`,
 * or `{ new_list: "name" }` to make a new list for it. The photo is copied,
 * so each gift owns its own. → { list: { id, name, slug }, item_id }
 */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  if (item.owner_id === user.id) return fail(t("ownGift"), 403);
  if (await blockedEitherWay(item.owner_id, user.id)) return fail(t("blocked"), 403);

  const body = await readJson<{ wishlist_id?: string; new_list?: string }>(ctx.request);
  let list;
  if (typeof body.new_list === "string") {
    const name = body.new_list.trim().slice(0, 60);
    if (!name) return fail(t("nameRequired"));
    list = await createWishlist(user.id, name);
    await notifyFollowers(user.id, "new_list", list.id);
  } else {
    list = body.wishlist_id ? await getWishlist(body.wishlist_id) : null;
    if (!list || list.user_id !== user.id) return fail(t("notFound"), 404);
  }

  const id = newId();
  const image = await copyImage(item.image_key);
  await db()
    .prepare("INSERT INTO items (id, wishlist_id, image_key, product_url, price, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, list.id, image, item.product_url, item.price, now())
    .run();
  await notifyFollowers(user.id, "new_item", list.id, id);
  return json({ list: { id: list.id, name: list.name, slug: list.slug }, item_id: id }, 201);
};
