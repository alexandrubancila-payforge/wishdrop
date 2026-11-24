/**
 * Email through the Cloudflare Email Service REST API
 * (POST /accounts/{CF_ACCOUNT_ID}/email/sending/send, token in CF_EMAIL_TOKEN).
 * Without a token (local dev) the message is printed to the console instead.
 */
import { env } from "cloudflare:workers";
import type { Lang } from "./i18n";

interface Message {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(msg: Message): Promise<boolean> {
  if (!env.CF_EMAIL_TOKEN) {
    console.log(`[email] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
    return true;
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${env.CF_EMAIL_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html ?? textToHtml(msg.text),
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
    },
  );
  if (!res.ok) console.error(`[email] send failed ${res.status}: ${await res.text()}`);
  return res.ok;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function textToHtml(text: string) {
  const body = escape(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#7c3aed">$1</a>')
    .replace(/\n/g, "<br>");
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2a1a3e;max-width:520px">${body}</div>`;
}

/* ---------- account emails, in the user's language ---------- */

const COPY: Record<Lang, { verifySubject: string; verify: string; resetSubject: string; reset: string }> = {
  ro: {
    verifySubject: "Confirmă adresa de email — WishDrop",
    verify: "Bună!\n\nConfirmă adresa de email pentru contul tău WishDrop:\n{link}\n\nLinkul e valabil 24 de ore.",
    resetSubject: "Resetează parola — WishDrop",
    reset: "Bună!\n\nAi cerut resetarea parolei pentru contul WishDrop. Alege o parolă nouă aici:\n{link}\n\nLinkul e valabil o oră. Dacă nu ai cerut tu, ignoră acest email.",
  },
  en: {
    verifySubject: "Confirm your email — WishDrop",
    verify: "Hi!\n\nPlease confirm the email address for your WishDrop account:\n{link}\n\nThe link is valid for 24 hours.",
    resetSubject: "Reset your password — WishDrop",
    reset: "Hi!\n\nYou asked to reset your WishDrop password. Choose a new one here:\n{link}\n\nThe link is valid for one hour. If it wasn't you, just ignore this email.",
  },
  de: {
    verifySubject: "Bestätige deine E-Mail — WishDrop",
    verify: "Hallo!\n\nBitte bestätige die E-Mail-Adresse für dein WishDrop-Konto:\n{link}\n\nDer Link ist 24 Stunden gültig.",
    resetSubject: "Passwort zurücksetzen — WishDrop",
    reset: "Hallo!\n\nDu hast angefordert, dein WishDrop-Passwort zurückzusetzen. Wähle hier ein neues:\n{link}\n\nDer Link ist eine Stunde gültig. Wenn du das nicht warst, ignoriere diese E-Mail.",
  },
  ru: {
    verifySubject: "Подтвердите email — WishDrop",
    verify: "Здравствуйте!\n\nПодтвердите адрес email для вашего аккаунта WishDrop:\n{link}\n\nСсылка действительна 24 часа.",
    resetSubject: "Сброс пароля — WishDrop",
    reset: "Здравствуйте!\n\nВы запросили сброс пароля WishDrop. Задайте новый пароль здесь:\n{link}\n\nСсылка действительна один час. Если это были не вы, просто проигнорируйте письмо.",
  },
};

export const sendVerifyEmail = (to: string, link: string, lang: Lang) =>
  sendEmail({ to, subject: COPY[lang].verifySubject, text: COPY[lang].verify.replace("{link}", link) });

export const sendResetEmail = (to: string, link: string, lang: Lang) =>
  sendEmail({ to, subject: COPY[lang].resetSubject, text: COPY[lang].reset.replace("{link}", link) });
