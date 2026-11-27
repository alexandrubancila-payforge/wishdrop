/**
 * Reminder emails, sent by the daily cron (src/worker.ts): 7 days before a
 * followed friend's birthday or the event date of one of their visible lists,
 * one email per person per day listing everything coming up. Each reminder
 * goes out once (table reminders_sent). People can turn them off in
 * Settings or with the signed link at the bottom of the email.
 */
import { env } from "cloudflare:workers";
import { db, now } from "./db";
import { isLang, DEFAULT_LANG, localePath, makeT, type Lang } from "./i18n";
import { sendEmail } from "./email";
import { renderEmail } from "./email-template";
import strings from "@/i18n/reminders";

const DAY = 86_400_000;
const AHEAD_DAYS = 7;

interface Row {
  user_id: string;
  email: string;
  r_name: string | null;
  r_lang: string | null;
  friend: string;
  key: string;
  date: string;
  url_path: string;
  list_name: string | null;
}

async function hmacHex(text: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`reminders-off:${text}`)));
  return [...sig.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The one-click "turn reminders off" link for a user. */
export async function unsubscribeUrl(userId: string) {
  return `${env.APP_URL}/api/reminders/off?u=${userId}&s=${await hmacHex(userId)}`;
}
export const checkUnsubscribe = async (userId: string, sig: string) => !!userId && sig === (await hmacHex(userId));

/** Who should hear about what today. `today` is for tests. */
export async function dueReminders(today = new Date()) {
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + AHEAD_DAYS * DAY;
  const target = new Date(base);
  const iso = target.toISOString().slice(0, 10);
  const year = target.getUTCFullYear();
  const recipient = `JOIN users r ON r.id = f.follower_id AND r.reminder_emails = 1 AND r.suspended_at IS NULL
                     AND (r.email_verified = 1 OR r.google_id IS NOT NULL)`;
  const friendName = "COALESCE(u.name, '@' || u.username, substr(u.email, 1, instr(u.email, '@') - 1))";
  const [bdays, events] = await Promise.all([
    db()
      .prepare(
        `SELECT r.id AS user_id, r.email, r.name AS r_name, r.lang AS r_lang, ${friendName} AS friend,
                'bday:' || u.id || ':' || ?2 AS key, ?1 AS date, '/@' || u.username AS url_path, NULL AS list_name
           FROM users u JOIN follows f ON f.followee_id = u.id AND f.status = 'accepted' ${recipient}
          WHERE u.suspended_at IS NULL AND u.username IS NOT NULL AND substr(u.birthday, 6, 5) = substr(?1, 6, 5)
            AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = u.id AND b.blocked_id = r.id) OR (b.blocker_id = r.id AND b.blocked_id = u.id))`,
      )
      .bind(iso, String(year))
      .all<Row>(),
    db()
      .prepare(
        `SELECT r.id AS user_id, r.email, r.name AS r_name, r.lang AS r_lang, ${friendName} AS friend,
                'event:' || w.id || ':' || w.event_date AS key, w.event_date AS date, '/w/' || w.slug AS url_path, w.name AS list_name
           FROM wishlists w JOIN users u ON u.id = w.user_id
           JOIN follows f ON f.followee_id = u.id AND f.status = 'accepted' ${recipient}
          WHERE w.event_date = ?1 AND w.visibility IN ('public', 'followers') AND w.hidden_at IS NULL AND u.suspended_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = u.id AND b.blocked_id = r.id) OR (b.blocker_id = r.id AND b.blocked_id = u.id))`,
      )
      .bind(iso)
      .all<Row>(),
  ]);
  const sent = new Set(
    (await db().prepare("SELECT user_id || '|' || key AS k FROM reminders_sent WHERE sent_at > ?").bind(now() - 400 * DAY).all<{ k: string }>())
      .results.map((r) => r.k),
  );
  const byUser = new Map<string, Row[]>();
  for (const row of [...bdays.results, ...events.results]) {
    if (sent.has(`${row.user_id}|${row.key}`)) continue;
    byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
  }
  return byUser;
}

export async function sendReminders(today = new Date()) {
  const due = await dueReminders(today);
  let emails = 0;
  for (const [userId, rows] of due) {
    const lang: Lang = isLang(rows[0].r_lang) ? rows[0].r_lang : DEFAULT_LANG;
    const t = makeT(lang, strings);
    const fmt = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" });
    const lines = rows.map((r) => {
      const url = env.APP_URL + localePath(lang, r.url_path);
      const date = fmt.format(new Date(r.date + "T00:00:00Z"));
      return r.list_name ? t("event", { friend: r.friend, list: r.list_name, date, url }) : t("birthday", { friend: r.friend, date, url });
    });
    const one = rows[0];
    const subject =
      rows.length === 1
        ? t("subjectOne", { what: one.list_name ? `„${one.list_name}”` : t("bdayWhat", { friend: one.friend }) })
        : t("subjectMany");
    const name = one.r_name ? ` ${one.r_name.split(" ")[0]}` : "";
    const offUrl = await unsubscribeUrl(userId);
    const ok = await sendEmail({
      to: one.email,
      subject,
      text: [t("hello", { name }), "", t("intro"), "", ...lines, "", t("outro"), "", "—", t("unsubscribe", { url: offUrl })].join("\n"),
      html: renderEmail({
        lang,
        preheader: t("html.preheader"),
        emoji: rows.some((r) => !r.list_name) ? "🎂" : "🎉",
        title: t("html.title"),
        blocks: [
          { type: "p", text: t("hello", { name }) },
          {
            type: "rows",
            items: rows.map((r) => {
              const date = fmt.format(new Date(r.date + "T00:00:00Z"));
              return r.list_name
                ? { emoji: "🎉", title: r.list_name, sub: t("html.eventSub", { friend: r.friend, date }), url: env.APP_URL + localePath(lang, r.url_path), cta: t("html.ctaEvent") }
                : { emoji: "🎂", title: r.friend, sub: t("html.bdaySub", { date }), url: env.APP_URL + localePath(lang, r.url_path), cta: t("html.ctaBday") };
            }),
          },
          { type: "note", text: t("outro") },
        ],
        footer: t("html.footer"),
        unsubscribe: { label: t("html.unsub"), url: offUrl },
      }),
    });
    if (!ok) continue;
    emails++;
    await db().batch(
      rows.map((r) => db().prepare("INSERT OR IGNORE INTO reminders_sent (user_id, key, sent_at) VALUES (?, ?, ?)").bind(userId, r.key, now())),
    );
  }
  await db().prepare("DELETE FROM reminders_sent WHERE sent_at < ?").bind(now() - 400 * DAY).run();
  console.log(`reminders: ${emails} emails`);
  return emails;
}
