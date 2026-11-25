/**
 * Email through the Cloudflare Email Service REST API
 * (POST /accounts/{CF_ACCOUNT_ID}/email/sending/send, token in CF_EMAIL_TOKEN).
 * Without a token (local dev) the message is printed to the console instead.
 */
import { env } from "cloudflare:workers";
import type { Lang } from "./i18n";
import { renderEmail } from "./email-template";

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

/** Plain emails (to the owner: contact form, reports, alerts) get a simple readable layout. */
function textToHtml(text: string) {
  const body = escape(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#e3574f">$1</a>')
    .replace(/\n/g, "<br>");
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b2433;max-width:560px">${body}</div>`;
}

/* ---------- account emails, in the user's language ---------- */

interface AccountCopy {
  subject: string;
  preheader: string;
  title: string;
  text: string;
  button: string;
  note: string;
}

const COPY: Record<Lang, { verify: AccountCopy; reset: AccountCopy; footer: string }> = {
  ro: {
    verify: {
      subject: "Confirmă adresa de email — WishDrop",
      preheader: "Un click și contul tău e gata.",
      title: "Confirmă-ți emailul",
      text: "Încă un pas și contul tău WishDrop e gata. După confirmare, prietenii te pot găsi în căutare.",
      button: "Confirmă emailul",
      note: "Linkul e valabil 24 de ore. Dacă nu tu ți-ai făcut cont, ignoră acest email.",
    },
    reset: {
      subject: "Resetează parola — WishDrop",
      preheader: "Alege o parolă nouă pentru contul tău.",
      title: "Resetează parola",
      text: "Ai cerut o parolă nouă pentru contul WishDrop. Apasă butonul și alege una.",
      button: "Alege o parolă nouă",
      note: "Linkul e valabil o oră. Dacă nu ai cerut tu, ignoră acest email; parola rămâne aceeași.",
    },
    footer: "Ai primit acest email pentru că ai un cont WishDrop.",
  },
  en: {
    verify: {
      subject: "Confirm your email — WishDrop",
      preheader: "One click and your account is ready.",
      title: "Confirm your email",
      text: "One more step and your WishDrop account is ready. Once confirmed, friends can find you in search.",
      button: "Confirm email",
      note: "The link is valid for 24 hours. If you didn't sign up, just ignore this email.",
    },
    reset: {
      subject: "Reset your password — WishDrop",
      preheader: "Choose a new password for your account.",
      title: "Reset your password",
      text: "You asked for a new WishDrop password. Press the button and choose one.",
      button: "Choose a new password",
      note: "The link is valid for one hour. If it wasn't you, ignore this email; your password stays the same.",
    },
    footer: "You got this email because you have a WishDrop account.",
  },
  de: {
    verify: {
      subject: "Bestätige deine E-Mail — WishDrop",
      preheader: "Ein Klick und dein Konto ist bereit.",
      title: "Bestätige deine E-Mail",
      text: "Nur noch ein Schritt, dann ist dein WishDrop-Konto bereit. Danach finden dich Freunde in der Suche.",
      button: "E-Mail bestätigen",
      note: "Der Link ist 24 Stunden gültig. Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail.",
    },
    reset: {
      subject: "Passwort zurücksetzen — WishDrop",
      preheader: "Wähle ein neues Passwort für dein Konto.",
      title: "Passwort zurücksetzen",
      text: "Du hast ein neues WishDrop-Passwort angefordert. Tippe auf den Button und wähle eins.",
      button: "Neues Passwort wählen",
      note: "Der Link ist eine Stunde gültig. Wenn du das nicht warst, ignoriere diese E-Mail; dein Passwort bleibt gleich.",
    },
    footer: "Du bekommst diese E-Mail, weil du ein WishDrop-Konto hast.",
  },
  ru: {
    verify: {
      subject: "Подтвердите email — WishDrop",
      preheader: "Один клик — и аккаунт готов.",
      title: "Подтвердите email",
      text: "Ещё один шаг — и ваш аккаунт WishDrop готов. После подтверждения друзья смогут найти вас в поиске.",
      button: "Подтвердить email",
      note: "Ссылка действительна 24 часа. Если вы не регистрировались, просто проигнорируйте письмо.",
    },
    reset: {
      subject: "Сброс пароля — WishDrop",
      preheader: "Задайте новый пароль для аккаунта.",
      title: "Сброс пароля",
      text: "Вы запросили новый пароль WishDrop. Нажмите кнопку и задайте его.",
      button: "Задать новый пароль",
      note: "Ссылка действительна один час. Если это были не вы, проигнорируйте письмо — пароль не изменится.",
    },
    footer: "Вы получили это письмо, потому что у вас есть аккаунт WishDrop.",
  },
};

/** Footer line for emails people get from WishDrop. */
export const accountFooter = (lang: Lang) => COPY[lang].footer;

function accountEmail(to: string, c: AccountCopy, link: string, lang: Lang) {
  return sendEmail({
    to,
    subject: c.subject,
    text: `${c.title}\n\n${c.text}\n\n${c.button}: ${link}\n\n${c.note}`,
    html: renderEmail({
      lang,
      preheader: c.preheader,
      emoji: c === COPY[lang].verify ? "✉️" : "🔑",
      title: c.title,
      blocks: [
        { type: "p", text: c.text },
        { type: "button", label: c.button, url: link },
        { type: "note", text: c.note },
      ],
      footer: COPY[lang].footer,
    }),
  });
}

export const sendVerifyEmail = (to: string, link: string, lang: Lang) => accountEmail(to, COPY[lang].verify, link, lang);

export const sendResetEmail = (to: string, link: string, lang: Lang) => accountEmail(to, COPY[lang].reset, link, lang);
