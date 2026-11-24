import type { APIRoute } from "astro";
import { getUserByEmail, updateUser } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { json, readJson, requestLang } from "@/lib/http";
import { sendResetEmail } from "@/lib/email";
import { localePath } from "@/lib/i18n";

/** Always answers ok, so the form never reveals which emails have an account. */
export const POST: APIRoute = async (ctx) => {
  const { email = "" } = await readJson<{ email?: string }>(ctx.request);
  const user = await getUserByEmail(String(email));
  // One email per account every 2 minutes (a reset link lives 60 minutes).
  const recent = !!user?.reset_expires && user.reset_expires - 60 * 60 * 1000 > Date.now() - 2 * 60 * 1000;
  if (user && !recent) {
    const token = randomToken();
    await updateUser(user.id, { reset_token: token, reset_expires: Date.now() + 60 * 60 * 1000 });
    const lang = requestLang(ctx);
    await sendResetEmail(user.email, `${ctx.url.origin}${localePath(lang, "/reset-password")}?token=${token}`, lang).catch(() => false);
  }
  return json({ ok: true });
};
