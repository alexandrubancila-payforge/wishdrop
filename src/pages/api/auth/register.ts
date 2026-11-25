import type { APIRoute } from "astro";
import { createUser, getUserByEmail } from "@/lib/db";
import { EMAIL_RE, hashPassword, randomToken, startSession } from "@/lib/auth";
import { apiT, fail, isHttps, json, readJson, requestLang } from "@/lib/http";
import { sendVerifyEmail } from "@/lib/email";
import { localePath } from "@/lib/i18n";
import { suggestUsername } from "@/lib/social";
import { markSignup } from "@/lib/tracking";

export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const { email = "", password = "" } = await readJson<{ email?: string; password?: string }>(ctx.request);
  const clean = String(email).trim().toLowerCase();
  if (clean.length > 254 || !EMAIL_RE.test(clean)) return fail(t("invalidEmail"));
  if (String(password).length < 8) return fail(t("passwordShort"));
  if (await getUserByEmail(clean)) return fail(t("emailTaken"), 409);

  const verifyToken = randomToken();
  const user = await createUser({
    email: clean,
    password_hash: await hashPassword(String(password)),
    verify_token: verifyToken,
    verify_expires: Date.now() + 24 * 60 * 60 * 1000,
    username: await suggestUsername(null, clean), // changeable in Settings; profile stays private
  });
  await startSession(ctx.cookies, user.id, isHttps(ctx));
  markSignup(ctx.cookies, "email", isHttps(ctx));

  const lang = requestLang(ctx);
  const link = `${ctx.url.origin}${localePath(lang, "/verify-email")}?token=${verifyToken}`;
  await sendVerifyEmail(clean, link, lang).catch(() => false);
  return json({ ok: true });
};
