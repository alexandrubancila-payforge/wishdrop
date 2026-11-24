import type { APIRoute } from "astro";
import { updateUser } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { deleteImage, keyFromUrl } from "@/lib/storage";

/** Settings form: name, birthday, and (when changed) the avatar URL. */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const body = await readJson<{ name?: string; birthday?: string; avatar_url?: string | null }>(ctx.request);

  const fields: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length > 60) return fail(t("nameTooLong"));
    fields.name = name || null;
  }
  if (typeof body.birthday === "string") {
    fields.birthday = /^\d{4}-\d{2}-\d{2}$/.test(body.birthday) ? body.birthday : null;
  }
  if ("avatar_url" in body) {
    const url = body.avatar_url;
    if (url && !keyFromUrl(url)) return fail(t("error"));
    if (keyFromUrl(user.avatar_url) && user.avatar_url !== url) await deleteImage(keyFromUrl(user.avatar_url));
    fields.avatar_url = url || null;
  }
  await updateUser(user.id, fields);
  return json({ ok: true });
};
