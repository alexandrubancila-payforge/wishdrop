import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { apiT, fail, json, requireUser } from "@/lib/http";
import { db } from "@/lib/db";
import { isLang, DEFAULT_LANG, localePath, makeT, type Lang } from "@/lib/i18n";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/email-template";
import { notify } from "@/lib/notifications";
import { draw, getGroup, members, SANTA_MIN } from "@/lib/santa";
import strings from "@/i18n/santa";

/**
 * The organizer draws names (once, with at least SANTA_MIN people). Each
 * member gets a notification and an email naming only their own person.
 */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const group = await getGroup(ctx.params.id ?? "");
  if (!group || group.owner_id !== user.id) return fail(t("notFound"), 404);
  if (group.drawn_at) return fail(t("santaDrawn"), 409);
  const people = await members(group.id);
  if (people.length < SANTA_MIN) return fail(t("santaTooFew"), 400);

  const pairs = await draw(group);
  const byId = new Map(people.map((p) => [p.user_id, p]));
  // Each email in the language that person last used on the site.
  const { results: langRows } = await db()
    .prepare(`SELECT id, lang FROM users WHERE id IN (${people.map(() => "?").join(",")})`)
    .bind(...people.map((p) => p.user_id))
    .all<{ id: string; lang: string | null }>();
  const langOf = new Map(langRows.map((r) => [r.id, isLang(r.lang) ? r.lang : null]));
  const display = (p: { name: string | null; username: string | null; email: string }) =>
    p.name || (p.username ? `@${p.username}` : p.email.split("@")[0]);

  await Promise.all(
    [...pairs].map(async ([giverId, gifteeId]) => {
      const giver = byId.get(giverId)!;
      const giftee = byId.get(gifteeId)!;
      await notify(giverId, user.id, "santa_drawn", { santaGroupId: group.id }).catch(() => {});
      const lang: Lang = langOf.get(giverId) ?? (giverId === user.id ? ctx.locals.lang : DEFAULT_LANG);
      const s = makeT(lang, strings);
      const url = env.APP_URL + localePath(lang, `/santa/${group.id}`);
      const lines = [
        s("mail.hello", { name: giver.name ? ` ${giver.name.split(" ")[0]}` : "" }),
        "",
        s("mail.drawn", { group: group.name }),
        "",
        s("mail.giftee", { name: display(giftee) }),
        group.budget ? s("mail.budget", { budget: group.budget }) : "",
        group.exchange_date
          ? s("mail.date", { date: new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(group.exchange_date + "T00:00:00Z")) })
          : "",
        "",
        s("mail.see", { url }),
        "",
        s("mail.secret"),
      ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
      const chips = [
        group.budget ? s("mail.budget", { budget: group.budget }) : "",
        group.exchange_date
          ? `📅 ${new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(group.exchange_date + "T00:00:00Z"))}`
          : "",
      ].filter(Boolean);
      await sendEmail({
        to: giver.email,
        subject: s("mail.subject", { group: group.name }),
        text: lines.join("\n"),
        html: renderEmail({
          lang,
          preheader: s("mail.preheader"),
          emoji: "🎅",
          title: s("mail.title"),
          blocks: [
            { type: "p", text: `${s("mail.hello", { name: giver.name ? ` ${giver.name.split(" ")[0]}` : "" })} ${s("mail.drawn", { group: group.name })}` },
            { type: "highlight", label: s("mail.label"), value: display(giftee) },
            ...(chips.length ? [{ type: "chips" as const, items: chips }] : []),
            { type: "button", label: s("mail.button"), url },
            { type: "note", text: s("mail.secret") },
          ],
          footer: s("mail.footer"),
        }),
      }).catch(() => false);
    }),
  );
  return json({ ok: true, members: pairs.size });
};

