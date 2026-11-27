import type { APIRoute } from "astro";
import { db, getUserById } from "@/lib/db";
import { checkUnsubscribe } from "@/lib/reminders";
import { isLang, DEFAULT_LANG, localePath, makeT } from "@/lib/i18n";
import strings from "@/i18n/reminders";

/** One-click "no more reminder emails" from the link in the email (signed, no login needed). */
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("u") ?? "";
  if (!(await checkUnsubscribe(userId, url.searchParams.get("s") ?? ""))) return new Response("Invalid link", { status: 400 });
  const user = await getUserById(userId);
  if (user) await db().prepare("UPDATE users SET reminder_emails = 0 WHERE id = ?").bind(userId).run();
  const lang = isLang(user?.lang) ? user!.lang : DEFAULT_LANG;
  const t = makeT(lang, strings);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return new Response(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WishDrop</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fffaf7;color:#2b2433;font:16px/1.5 system-ui,sans-serif;padding:16px}main{max-width:420px;background:#fff;border-radius:22px;padding:32px;text-align:center;box-shadow:0 8px 30px rgba(43,36,51,.08)}h1{font-size:22px;margin:0 0 8px}p{color:#75697f;margin:0 0 24px}a{display:inline-block;background:#f0726a;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px}</style></head>
<body><main><h1>${esc(t("offTitle"))}</h1><p>${esc(t("offText"))}</p><a href="${localePath(lang, "/")}">${esc(t("back"))}</a></main></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
};

/** Mail clients' one-click unsubscribe (RFC 8058) post to the same link. */
export const POST: APIRoute = async (ctx) => GET(ctx);
