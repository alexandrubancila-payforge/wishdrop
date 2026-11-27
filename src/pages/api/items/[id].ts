import type { APIRoute } from "astro";
import { db, getItemWithList, now } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { cleanItemFields } from "@/lib/items";
import { groupChangeError, syncGroupReserved } from "@/lib/gifts";
import { deleteImage } from "@/lib/storage";

async function ownItem(id: string | undefined, userId: string) {
  const item = id ? await getItemWithList(id) : null;
  return item && item.owner_id === userId ? item : null;
}

/**
 * Edit photo/price/link, set the priority (1 / 0 / -1, or the old true/false
 * star), tick it as received, or make it a group gift (group_size).
 */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const item = await ownItem(ctx.params.id, user.id);
  if (!item) return fail(t("notFound"), 404);

  const body = await readJson(ctx.request);
  const fields = cleanItemFields(body);
  if ("error" in fields) return fail(t(fields.error));
  const { group_size, ...plain } = fields;
  // A gift keeps at least a name, a photo or a link.
  const after = { ...item, ...plain } as { image_key?: string | null; product_url?: string | null; title?: string | null };
  if (!after.image_key && !after.product_url && !after.title) return fail(t("needImage"));

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(plain)) {
    sets.push(`${k} = ?`);
    values.push(v ?? (k === "image_key" ? "" : null));
  }
  if (typeof body.received === "boolean") {
    sets.push("received_at = ?");
    values.push(body.received ? (item.received_at ?? now()) : null);
  }
  if (group_size !== undefined) {
    const err = await groupChangeError(item, group_size);
    if (err) return fail(t(err), 409);
    sets.push("group_size = ?");
    values.push(group_size);
  }
  if (sets.length) await db().prepare(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`).bind(...values, item.id).run();
  if (group_size !== undefined) await syncGroupReserved(item.id);
  if ("image_key" in plain && plain.image_key !== item.image_key) await deleteImage(item.image_key);
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
