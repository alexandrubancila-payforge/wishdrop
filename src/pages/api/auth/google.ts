/** Start "Continue with Google": remember state, return path and language, then go to Google. */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { OAUTH_COOKIE, randomToken } from "@/lib/auth";
import { requestLang } from "@/lib/http";


export const GET: APIRoute = async (ctx) => {
  const state = randomToken(16);
  const next = ctx.url.searchParams.get("next") || "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  ctx.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, next: safeNext, lang: requestLang(ctx) }), {
    path: "/api/auth/google",
    httpOnly: true,
    secure: ctx.url.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${ctx.url.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return ctx.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
