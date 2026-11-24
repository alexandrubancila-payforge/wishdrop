/**
 * Runs before every request:
 * 1. Language: "/en/…", "/de/…", "/ru/…" are rewritten to the single page in
 *    src/pages with `locals.lang` set. An unprefixed page URL redirects to the
 *    language saved by the switcher (cookie `wd_lang`).
 * 2. Session: `locals.user` is the signed-in user or null.
 * 3. Pages behind login redirect to /login?next=….
 */
import { defineMiddleware } from "astro:middleware";
import { splitLang, localePath, isLang, LANG_COOKIE } from "./lib/i18n";
import { sessionUserId } from "./lib/auth";
import { getUserById } from "./lib/db";

const PROTECTED = /^\/(dashboard|settings|requests|feed|notifications|admin)(\/|$)/;
const isPage = (path: string) => !path.startsWith("/api/") && !path.startsWith("/_") && !/\.[a-z0-9]+$/i.test(path);

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname, search } = ctx.url;
  const { lang, path, prefixed } = splitLang(pathname);

  ctx.locals.lang = lang;
  ctx.locals.path = path;

  const userId = await sessionUserId(ctx.cookies);
  ctx.locals.user = userId ? await getUserById(userId) : null;

  if (isPage(path) && ctx.request.method === "GET") {
    if (!prefixed) {
      const saved = ctx.cookies.get(LANG_COOKIE)?.value;
      if (isLang(saved) && saved !== lang) return ctx.redirect(localePath(saved, path) + search);
    }
    if (PROTECTED.test(path) && !ctx.locals.user) {
      return ctx.redirect(`${localePath(lang, "/login")}?next=${encodeURIComponent(path + search)}`);
    }
  }

  if (prefixed) return next(path + search);
  return next();
});
