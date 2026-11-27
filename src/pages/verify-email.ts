/** The link from the confirmation email. Marks the address verified, then goes to the home page (the feed). */
import type { APIRoute } from "astro";
import { db, updateUser, type User } from "@/lib/db";
import { localePath } from "@/lib/i18n";

export const GET: APIRoute = async (ctx) => {
  const token = ctx.url.searchParams.get("token");
  if (token) {
    const user = await db().prepare("SELECT * FROM users WHERE verify_token = ?").bind(token).first<User>();
    if (user && user.verify_expires && user.verify_expires > Date.now()) {
      await updateUser(user.id, { email_verified: 1, verify_token: null, verify_expires: null });
    }
  }
  const { lang, user } = ctx.locals;
  return ctx.redirect(localePath(lang, user ? "/" : "/login"));
};
