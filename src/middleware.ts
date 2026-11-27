/**
 * Runs before every request:
 * 1. Language: "/ro/…", "/de/…", "/ru/…" are rewritten to the single page in
 *    src/pages with `locals.lang` set; unprefixed URLs are English. An
 *    unprefixed page redirects to the visitor's language: the switcher's cookie
 *    (`wd_lang`), else the account's language, else the browser's (not for
 *    crawlers, so search engines index the English pages). Old "/en/…"
 *    addresses redirect (301) to the unprefixed ones.
 * 2. Session: `locals.user` is the signed-in user or null (a suspended
 *    account counts as signed out).
 * 3. Pages behind login redirect to /login?next=….
 * 4. API writes go through the request limits (lib/limits.ts) → 429.
 * 5. Every answer gets the security headers; failures email the owner
 *    (lib/alerts.ts).
 */
import { defineMiddleware } from "astro:middleware";
import { splitLang, localePath, isLang, browserLang, DEFAULT_LANG, LANG_COOKIE } from "./lib/i18n";
import { sessionUserId } from "./lib/auth";
import { getUserById, updateUser } from "./lib/db";
import { withinLimits } from "./lib/limits";
import { alertOwner } from "./lib/alerts";
import { apiT, fail } from "./lib/http";

// /santa/join/<code> stays open: it's the invite link. Profiles (/@username…) need an account too;
// a shared list link (/w/<slug>) stays open.
const PROTECTED = /^\/(?:(dashboard|settings|requests|feed|notifications|admin|santa(?!\/join\/))(\/|$)|@)/;
// "/@ana.pop" ends like a file name but is a profile page.
/** Search engines and link previews: they get the page the URL names, never a language redirect. */
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|preview|lighthouse|headless/i;

const isPage = (path: string) =>
  path.startsWith("/@") || (!path.startsWith("/api/") && !path.startsWith("/_") && !/\.[a-z0-9]+$/i.test(path));

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

  // English used to live under /en: keep old links and search results working.
  const oldEn = pathname.match(/^\/en(\/.*)?$/);
  if (oldEn) {
    ctx.cookies.set(LANG_COOKIE, "en", { path: "/", maxAge: 31_536_000, sameSite: "lax" });
    return withHeaders(ctx.redirect((oldEn[1] || "/") + search, 301));
  }

  const { path, prefixed } = splitLang(pathname);
  // A page that rewrites (Astro.rewrite("/404"), "/" → "/feed") runs this again with the new
  // path: keep the language of the address in the browser and don't redirect.
  const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const origin = trim(ctx.originPathname || pathname);
  const rewritten = origin !== trim(pathname);
  const lang = splitLang(origin).lang;

  ctx.locals.lang = lang;
  ctx.locals.path = path;

  const userId = await sessionUserId(ctx.cookies);
  const user = userId ? await getUserById(userId) : null;
  ctx.locals.user = user && !user.suspended_at ? user : null;

  if (isPage(path) && ctx.request.method === "GET") {
    if (!prefixed && !rewritten) {
      const saved = ctx.cookies.get(LANG_COOKIE)?.value;
      const ua = ctx.request.headers.get("user-agent") ?? "";
      const wanted = isLang(saved)
        ? saved
        : isLang(ctx.locals.user?.lang)
          ? ctx.locals.user.lang
          : BOT_RE.test(ua)
            ? null
            : browserLang(ctx.request.headers.get("accept-language"));
      if (wanted && wanted !== DEFAULT_LANG) return withHeaders(ctx.redirect(localePath(wanted, path) + search));
    }
    if (PROTECTED.test(path) && !ctx.locals.user) {
      return withHeaders(ctx.redirect(`${localePath(lang, "/login")}?next=${encodeURIComponent(path + search)}`));
    }
  }

  // Remember the language for emails (reminders) when it changes (after the language redirect).
  if (ctx.locals.user && isPage(path) && ctx.locals.user.lang !== lang) {
    await updateUser(ctx.locals.user.id, { lang }).catch(() => {});
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
