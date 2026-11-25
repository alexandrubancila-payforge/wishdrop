import type { APIRoute } from "astro";
import { createWishlist, db } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { notifyFollowers } from "@/lib/notifications";

const NAME_MAX = 60;

/** My lists (newest first), for pickers like "Add to my list". */
export const GET: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { results } = await db()
    .prepare("SELECT id, name, slug FROM wishlists WHERE user_id = ? ORDER BY created_at DESC")
    .bind(user.id)
    .all<{ id: string; name: string; slug: string }>();
  return json({ lists: results });
};

export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const name = String((await readJson<{ name?: string }>(ctx.request)).name ?? "").trim();
  if (!name) return fail(t("nameRequired"));
  if (name.length > NAME_MAX) return fail(t("nameTooLong"));
  const list = await createWishlist(user.id, name);
  await notifyFollowers(user.id, "new_list", list.id);
  return json({ id: list.id, slug: list.slug }, 201);
};
