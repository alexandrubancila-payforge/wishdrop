/**
 * Request limits, checked by the middleware before any /api/ write:
 *
 *   login     5 / min  per IP + email          (password guessing)
 *   signup   20 / min  per IP                  (sign-up, Google sign-in)
 *   email     5 / min  per account or IP       (anything that sends an email)
 *   WRITE_LIMIT 120 / min per account or IP    (every other API write, and logins)
 *
 * The strict ones count exactly in D1 (table rate_limits): Cloudflare's
 * rate-limit binding counts per server and lets small limits through. The
 * broad WRITE_LIMIT uses the binding (wrangler.jsonc "ratelimits"), where
 * approximate is fine. If a counter fails, the request goes through.
 */
import type { APIContext } from "astro";
import { env } from "cloudflare:workers";
import { db } from "./db";

const EMAIL_ROUTES = /^\/api\/(auth\/forgot-password|auth\/resend-verification|contact|report)$/;
const SIGNUP_ROUTES = /^\/api\/auth\/(register|google)(\/|$)/;

export function clientIp(ctx: APIContext) {
  const h = ctx.request.headers.get("cf-connecting-ip");
  if (h) return h;
  try {
    return ctx.clientAddress;
  } catch {
    return "unknown";
  }
}

/** Exact: at most `limit` hits per key in the current minute. */
async function counted(key: string, limit: number) {
  try {
    const row = await db()
      .prepare(
        `INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1)
         ON CONFLICT (key, window) DO UPDATE SET count = count + 1
         RETURNING count`,
      )
      .bind(key, Math.floor(Date.now() / 60_000))
      .first<{ count: number }>();
    return (row?.count ?? 0) <= limit;
  } catch (e) {
    console.warn("rate limit counter failed", String(e));
    return true;
  }
}

/** Approximate, for the broad per-minute brake. */
async function broad(key: string) {
  const binding = env.WRITE_LIMIT;
  if (!binding) return true;
  try {
    return (await binding.limit({ key })).success;
  } catch {
    return true;
  }
}

/** False when this request is over a limit (answer 429). */
export async function withinLimits(ctx: APIContext, path: string): Promise<boolean> {
  const ip = clientIp(ctx);
  if (path === "/api/auth/login") {
    let email = "";
    try {
      email = String(((await ctx.request.clone().json()) as { email?: string }).email ?? "").trim().toLowerCase();
    } catch {}
    return (await counted(`login|${ip}|${email}`, 5)) && (await broad(ip));
  }
  if (SIGNUP_ROUTES.test(path)) return counted(`signup|${ip}`, 20);
  if (EMAIL_ROUTES.test(path)) return counted(`email|${ctx.locals.user?.id ?? ip}`, 5);
  return broad(ctx.locals.user?.id ?? ip);
}

/** Old counters (run by the daily cron). */
export const pruneLimits = () =>
  db().prepare("DELETE FROM rate_limits WHERE window < ?").bind(Math.floor(Date.now() / 60_000) - 60).run();
