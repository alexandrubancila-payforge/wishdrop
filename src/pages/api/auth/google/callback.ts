/** Google redirects here: find or create the user, start the session, go to the dashboard. */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createUser, getUserByEmail, getUserByGoogleId, updateUser } from "@/lib/db";
import { OAUTH_COOKIE, startSession } from "@/lib/auth";
import { isLang, localePath, type Lang } from "@/lib/i18n";

interface GoogleUser {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export const GET: APIRoute = async (ctx) => {
  let saved: { state?: string; next?: string; lang?: string } = {};
  try {
    saved = JSON.parse(ctx.cookies.get(OAUTH_COOKIE)?.value || "{}");
  } catch {}
  ctx.cookies.delete(OAUTH_COOKIE, { path: "/api/auth/google" });
  const lang: Lang = isLang(saved.lang) ? saved.lang : "ro";
  const loginUrl = localePath(lang, "/login");

  const code = ctx.url.searchParams.get("code");
  if (!code || !saved.state || saved.state !== ctx.url.searchParams.get("state")) return ctx.redirect(loginUrl);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${ctx.url.origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return ctx.redirect(loginUrl);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) return ctx.redirect(loginUrl);
  const g = (await infoRes.json()) as GoogleUser;
  if (!g.sub || !g.email) return ctx.redirect(loginUrl);

  let user = await getUserByGoogleId(g.sub);
  if (!user) {
    const existing = await getUserByEmail(g.email);
    if (existing) {
      // Same email registered with a password: link Google to that account.
      await updateUser(existing.id, {
        google_id: g.sub,
        name: existing.name || g.name || null,
        avatar_url: existing.avatar_url || g.picture || null,
        email_verified: 1,
      });
      user = existing;
    } else {
      user = await createUser({
        email: g.email,
        google_id: g.sub,
        name: g.name ?? null,
        avatar_url: g.picture ?? null,
        email_verified: true,
      });
    }
  }

  await startSession(ctx.cookies, user.id, ctx.url.protocol === "https:");
  return ctx.redirect(saved.next ? localePath(lang, saved.next) : localePath(lang, "/dashboard"));
};
