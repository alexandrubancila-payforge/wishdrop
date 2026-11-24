import type { APIRoute } from "astro";
import { db, updateUser, type User } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";
import { apiT, fail, isHttps, json, readJson } from "@/lib/http";

export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const { token = "", password = "" } = await readJson<{ token?: string; password?: string }>(ctx.request);
  if (String(password).length < 8) return fail(t("passwordShort"));
  const user = token
    ? await db().prepare("SELECT * FROM users WHERE reset_token = ?").bind(String(token)).first<User>()
    : null;
  if (!user || !user.reset_expires || user.reset_expires < Date.now()) return fail(t("invalidToken"));
  await updateUser(user.id, {
    password_hash: await hashPassword(String(password)),
    reset_token: null,
    reset_expires: null,
    email_verified: 1, // they proved they own the inbox
  });
  await startSession(ctx.cookies, user.id, isHttps(ctx));
  return json({ ok: true });
};
