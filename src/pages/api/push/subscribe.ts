import type { APIRoute } from "astro";
import { db, now } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { isLang } from "@/lib/i18n";
import { pushConfigured } from "@/lib/push";

interface Body {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  lang?: string;
}

/** Remember this browser's push subscription for the signed-in user (POST) or forget it (DELETE). */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  if (!pushConfigured()) return fail(t("pushNotConfigured"), 503);
  const { subscription: sub, lang } = await readJson<Body>(ctx.request);
  const endpoint = sub?.endpoint ?? "";
  const p256dh = sub?.keys?.p256dh ?? "";
  const auth = sub?.keys?.auth ?? "";
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
    return fail(t("error"));
  }
  await db()
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, lang, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang`,
    )
    .bind(endpoint, user.id, p256dh, auth, isLang(lang) ? lang : "ro", now())
    .run();
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { subscription: sub } = await readJson<Body>(ctx.request);
  await db().prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?").bind(sub?.endpoint ?? "", user.id).run();
  return json({ ok: true });
};
