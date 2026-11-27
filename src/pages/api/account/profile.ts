import type { APIRoute } from "astro";
import { updateUser } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { deleteImage, keyFromUrl } from "@/lib/storage";
import { acceptAllPending, getUserByUsername, normalizeUsername, usernameProblem } from "@/lib/social";

/** Settings form: name, birthday, avatar, cover photo, and the public profile (username, bio, private). */
export const PATCH: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const body = await readJson<{
    name?: string;
    birthday?: string;
    avatar_url?: string | null;
    cover_url?: string | null;
    username?: string | null;
    bio?: string | null;
    is_private?: boolean;
    reminder_emails?: boolean;
    show_in_popular?: boolean;
  }>(ctx.request);

  const fields: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length > 100) return fail(t("nameTooLong"));
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
  if ("cover_url" in body) {
    const url = body.cover_url;
    if (url && !keyFromUrl(url)) return fail(t("error"));
    if (keyFromUrl(user.cover_url) && user.cover_url !== url) await deleteImage(keyFromUrl(user.cover_url));
    fields.cover_url = url || null;
  }
  if ("username" in body) {
    const username = normalizeUsername(body.username);
    if (username) {
      const problem = usernameProblem(username);
      if (problem) return fail(t(problem));
      const owner = await getUserByUsername(username);
      if (owner && owner.id !== user.id) return fail(t("usernameTaken"), 409);
    }
    fields.username = username || null;
  }
  if ("bio" in body) {
    const bio = String(body.bio ?? "").trim();
    if (bio.length > 160) return fail(t("bioTooLong"));
    fields.bio = bio || null;
  }
  if (typeof body.reminder_emails === "boolean") fields.reminder_emails = body.reminder_emails ? 1 : 0;
  if (typeof body.show_in_popular === "boolean") fields.show_in_popular = body.show_in_popular ? 1 : 0;
  if (typeof body.is_private === "boolean") {
    fields.is_private = body.is_private ? 1 : 0;
    if (!body.is_private && user.is_private) await acceptAllPending(user.id);
  }
  try {
    await updateUser(user.id, fields);
  } catch {
    return fail(t("usernameTaken"), 409); // unique index race
  }
  return json({ ok: true });
};
