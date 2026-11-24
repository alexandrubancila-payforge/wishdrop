import type { APIRoute } from "astro";
import { getUserByEmail } from "@/lib/db";
import { startSession, verifyPassword } from "@/lib/auth";
import { apiT, fail, isHttps, json, readJson } from "@/lib/http";

export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const { email = "", password = "" } = await readJson<{ email?: string; password?: string }>(ctx.request);
  const user = await getUserByEmail(String(email));
  if (user && !user.password_hash && user.google_id) return fail(t("googleOnly"), 401);
  if (!user || !(await verifyPassword(String(password), user.password_hash))) return fail(t("badCredentials"), 401);
  if (user.suspended_at) return fail(t("suspended"), 403);
  await startSession(ctx.cookies, user.id, isHttps(ctx));
  return json({ ok: true });
};
