import type { APIRoute } from "astro";
import { db, getItemWithList } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { cleanItemFields } from "@/lib/items";
import { deleteImage } from "@/lib/storage";

async function ownItem(id: string | undefined, userId: string) {
  const item = id ? await getItemWithList(id) : null;
  return item && item.owner_id === userId ? item : null;
}

/** Edit photo/price/link, or toggle "most wanted" (priority). */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const item = await ownItem(ctx.params.id, user.id);
  if (!item) return fail(t("notFound"), 404);

  const body = await readJson(ctx.request);
  const fields = cleanItemFields(body);
  if ("error" in fields) return fail(t(fields.error));

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`);
    values.push(v ?? (k === "image_key" ? "" : null));
  }
  if (typeof body.priority === "boolean") {
    sets.push("priority = ?");
    values.push(body.priority ? 1 : 0);
  }
  if (sets.length) await db().prepare(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`).bind(...values, item.id).run();
  if ("image_key" in fields && fields.image_key !== item.image_key) await deleteImage(item.image_key);
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const item = await ownItem(ctx.params.id, user.id);
  if (!item) return fail(apiT(ctx)("notFound"), 404);
  await db().prepare("DELETE FROM items WHERE id = ?").bind(item.id).run();
  await deleteImage(item.image_key);
  return json({ ok: true });
};
