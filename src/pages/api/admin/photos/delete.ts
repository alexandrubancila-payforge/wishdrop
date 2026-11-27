import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/admin";
import { deleteImage } from "@/lib/storage";

/**
 * Remove a photo everywhere (`{ key, report }`), from a "photo" report in
 * /admin: gifts using it lose it (gifts with no link left are deleted), an
 * avatar using it is cleared, the file goes from R2 and the report is closed.
 * Admin only.
 */
export const POST: APIRoute = async (ctx) => {
  if (!isAdmin(ctx.locals.user)) return fail("Not found", 404);
  const { key, report } = await readJson<{ key?: string; report?: string }>(ctx.request);
  if (!key || !/^items\/[\w.-]+$/.test(key)) return fail("Bad request");
  await db().batch([
    db().prepare("DELETE FROM items WHERE image_key = ? AND COALESCE(product_url, '') = '' AND COALESCE(title, '') = ''").bind(key),
    db().prepare("UPDATE items SET image_key = '' WHERE image_key = ?").bind(key),
    db().prepare("UPDATE users SET avatar_url = NULL WHERE avatar_url LIKE ?").bind(`%${key}`),
    db().prepare("UPDATE reports SET status = 'done' WHERE id = ?").bind(report ?? ""),
  ]);
  await deleteImage(key);
  return json({ ok: true });
};
