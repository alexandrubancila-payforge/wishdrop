import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { db, getUserById, getWishlist, newId, now } from "@/lib/db";
import { EMAIL_RE } from "@/lib/auth";
import { apiT, fail, json } from "@/lib/http";
import { sendEmail } from "@/lib/email";
import { isImageType, putImage } from "@/lib/storage";

const REPORT_KINDS = ["bug", "user", "list"] as const;
const REPORT_REASONS = ["spam", "inappropriate", "fake", "other"] as const;
const MAX_SHOT = 5 * 1024 * 1024;

/**
 * "Report a problem" (kind bug, optional screenshot) and "Report" on a
 * profile or list (kind user/list + reason). Saved for /admin and emailed to
 * the owner. Multipart form: kind, target_id, reason, message, email,
 * page_url, company (honeypot), file.
 */
export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return fail(t("error"));
  }
  const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  if (get("company", 100)) return json({ ok: true }); // honeypot: bots fill the hidden field

  const kind = get("kind", 10) as (typeof REPORT_KINDS)[number];
  if (!REPORT_KINDS.includes(kind)) return fail(t("error"));
  const message = get("message", 3000);
  const user = ctx.locals.user;
  const email = user?.email ?? get("email", 254);
  if (email && !EMAIL_RE.test(email)) return fail(t("invalidEmail"));

  let reason: string | null = null;
  let target = "";
  let targetId: string | null = null;
  if (kind === "bug") {
    if (message.length < 5) return fail(t("messageShort"));
  } else {
    reason = get("reason", 20);
    if (!(REPORT_REASONS as readonly string[]).includes(reason)) return fail(t("error"));
    targetId = get("target_id", 64);
    if (kind === "user") {
      const u = await getUserById(targetId);
      if (!u) return fail(t("notFound"), 404);
      target = `profilul ${u.username ? "@" + u.username : u.email}`;
    } else {
      const l = await getWishlist(targetId);
      if (!l) return fail(t("notFound"), 404);
      target = `lista „${l.name}” (${ctx.url.origin}/w/${l.slug})`;
    }
  }

  let imageKey: string | null = null;
  const file = form.get("file");
  if (kind === "bug" && file instanceof File && file.size > 0) {
    if (file.size > MAX_SHOT) return fail(t("tooBig"), 413);
    if (!isImageType(file.type)) return fail(t("badType"));
    imageKey = await putImage(await file.arrayBuffer(), file.type, "reports");
  }

  const pageUrl = get("page_url", 500) || null;
  const ua = (ctx.request.headers.get("user-agent") ?? "").slice(0, 400);
  await db()
    .prepare(
      `INSERT INTO reports (id, kind, target_id, reason, message, reporter_id, email, page_url, user_agent, image_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(newId(), kind, targetId, reason, message || null, user?.id ?? null, email || null, pageUrl, ua, imageKey, now())
    .run();

  if (env.OWNER_EMAIL) {
    const who = user ? `${user.name || user.username || ""} <${user.email}>` : email || "anonim";
    await sendEmail({
      to: env.OWNER_EMAIL,
      replyTo: email || undefined,
      subject: kind === "bug" ? "WishDrop — problemă raportată" : `WishDrop — raport: ${target}`.slice(0, 150),
      text: [
        kind === "bug" ? "Problemă raportată" : `Raport despre ${target}\nMotiv: ${reason}`,
        message && `\n${message}`,
        `\nDe la: ${who}`,
        pageUrl && `Pagina: ${pageUrl}`,
        `Browser: ${ua}`,
        imageKey && "Are o captură de ecran.",
        `\nVezi și rezolvă: ${ctx.url.origin}/admin#reports`,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch(() => false);
  }
  return json({ ok: true });
};
