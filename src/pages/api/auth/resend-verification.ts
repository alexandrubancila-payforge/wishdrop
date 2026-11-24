import type { APIRoute } from "astro";
import { updateUser } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { json, requestLang, requireUser } from "@/lib/http";
import { sendVerifyEmail } from "@/lib/email";
import { localePath } from "@/lib/i18n";

export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  if (user.email_verified) return json({ ok: true });
  const token = randomToken();
  await updateUser(user.id, { verify_token: token, verify_expires: Date.now() + 24 * 60 * 60 * 1000 });
  const lang = requestLang(ctx);
  const ok = await sendVerifyEmail(user.email, `${ctx.url.origin}${localePath(lang, "/verify-email")}?token=${token}`, lang);
  return json({ ok }, ok ? 200 : 502);
};
