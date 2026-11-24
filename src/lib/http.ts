/** Small helpers for the JSON API in `src/pages/api/`. */
import type { APIContext } from "astro";
import type { User } from "./db";
import { splitLang, isLang, makeT, LANG_COOKIE, type Lang, type T } from "./i18n";
import apiStrings from "@/i18n/api";

/** API calls have no language prefix: use the page that made the request, then the saved language. */
export function requestLang(ctx: APIContext): Lang {
  const ref = ctx.request.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      if (u.host === ctx.url.host) return splitLang(u.pathname).lang;
    } catch {}
  }
  const saved = ctx.cookies.get(LANG_COOKIE)?.value;
  return isLang(saved) ? saved : "ro";
}

/** Translated API error messages for this request. */
export const apiT = (ctx: APIContext): T => makeT(requestLang(ctx), apiStrings);

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** `{ error }` with a message the client shows as-is. */
export const fail = (error: string, status = 400) => json({ error }, status);

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

/** The signed-in user, or a 401 response to return straight away. */
export function requireUser(ctx: APIContext): User | Response {
  return ctx.locals.user ?? fail("Unauthorized", 401);
}

export const isHttps = (ctx: APIContext) => ctx.url.protocol === "https:";
