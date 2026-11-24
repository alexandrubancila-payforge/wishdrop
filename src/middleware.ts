/**
 * Runs before every request:
 * 1. Language: "/en/…", "/de/…", "/ru/…" are rewritten to the single page in
 *    src/pages with `locals.lang` set. An unprefixed page URL redirects to the
 *    language saved by the switcher (cookie `wd_lang`).
 * 2. Session: `locals.user` is the signed-in user or null (a suspended
 *    account counts as signed out).
 * 3. Pages behind login redirect to /login?next=….
 * 4. API writes go through the request limits (lib/limits.ts) → 429.
 * 5. Every answer gets the security headers; failures email the owner
 *    (lib/alerts.ts).
 */
import { defineMiddleware } from "astro:middleware";
import { splitLang, localePath, isLang, LANG_COOKIE } from "./lib/i18n";
import { sessionUserId } from "./lib/auth";
import { getUserById } from "./lib/db";
import { withinLimits } from "./lib/limits";
import { alertOwner } from "./lib/alerts";
import { apiT, fail } from "./lib/http";

const PROTECTED = /^\/(dashboard|settings|requests|feed|notifications|admin)(\/|$)/;
const isPage = (path: string) => !path.startsWith("/api/") && !path.startsWith("/_") && !/\.[a-z0-9]+$/i.test(path);

/** Same list as public/_headers (static files don't pass through here). */
const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

function withHeaders(res: Response) {
  try {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  } catch {
    // Some responses (e.g. Response.redirect) have read-only headers.
    const copy = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) copy.headers.set(k, v);
    return copy;
  }
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname, search } = ctx.url;
  const { lang, path, prefixed } = splitLang(pathname);

  ctx.locals.lang = lang;
  ctx.locals.path = path;

  const userId = await sessionUserId(ctx.cookies);
  const user = userId ? await getUserById(userId) : null;
  ctx.locals.user = user && !user.suspended_at ? user : null;

  if (isPage(path) && ctx.request.method === "GET") {
    if (!prefixed) {
      const saved = ctx.cookies.get(LANG_COOKIE)?.value;
      if (isLang(saved) && saved !== lang) return withHeaders(ctx.redirect(localePath(saved, path) + search));
    }
    if (PROTECTED.test(path) && !ctx.locals.user) {
      return withHeaders(ctx.redirect(`${localePath(lang, "/login")}?next=${encodeURIComponent(path + search)}`));
    }
  }

  if (path.startsWith("/api/") && ctx.request.method !== "GET" && !(await withinLimits(ctx, path))) {
    return withHeaders(fail(apiT(ctx)("tooMany"), 429));
  }

  try {
    const res = prefixed ? await next(path + search) : await next();
    if (res.status >= 500) alertOwner(`${ctx.request.method} ${path}`, `HTTP ${res.status}`);
    return withHeaders(res);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    alertOwner(`${ctx.request.method} ${path}`, e.message, e.stack ?? "");
    throw err;
  }
});
