import type { APIRoute } from "astro";
import { createWishlist } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { notifyFollowers } from "@/lib/notifications";

const NAME_MAX = 60;

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
