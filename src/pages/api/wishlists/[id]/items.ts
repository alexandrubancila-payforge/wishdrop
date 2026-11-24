import type { APIRoute } from "astro";
import { db, getWishlist, newId, now } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { cleanItemFields } from "@/lib/items";

/** Add a gift: a photo (uploaded or scraped) and/or a product link, plus an optional price. */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const list = ctx.params.id ? await getWishlist(ctx.params.id) : null;
  if (!list || list.user_id !== user.id) return fail(t("notFound"), 404);

  const body = await readJson(ctx.request);
  const fields = cleanItemFields(body);
  if ("error" in fields) return fail(t(fields.error));
  if (!fields.image_key && !fields.product_url) return fail(t("needImage"));

  const id = newId();
  await db()
    .prepare("INSERT INTO items (id, wishlist_id, image_key, product_url, price, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, list.id, fields.image_key ?? "", fields.product_url ?? null, fields.price ?? null, now())
    .run();
  return json({ id }, 201);
};
