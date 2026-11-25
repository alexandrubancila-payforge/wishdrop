/**
 * The look of every email people get from WishDrop: logo, a white card with a
 * title, text, coral buttons and highlight boxes, and a small footer.
 * Table layout with inline styles, so it renders the same in Gmail, Outlook,
 * Apple Mail and phone apps. The plain-text version is built by each sender.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "button"; label: string; url: string }
  /** A big centered box: small label above a large value (e.g. "You're giving to" / "Maria"). */
  | { type: "highlight"; label: string; value: string }
  /** Small pills in a row (budget, date…). */
  | { type: "chips"; items: string[] }
  /** One line per thing (reminders): emoji, title, subtitle and a link. */
  | { type: "rows"; items: { emoji: string; title: string; sub: string; url: string; cta: string }[] }
  | { type: "note"; text: string };

export interface EmailContent {
  /** The grey line mail apps show next to the subject. */
  preheader: string;
  /** Emoji in the round badge above the title. */
  emoji: string;
  title: string;
  blocks: Block[];
  /** Small print at the bottom ("You got this email because…"). */
  footer: string;
  /** Optional "turn these emails off" link. */
  unsubscribe?: { label: string; url: string };
  lang: string;
}

const C = {
  paper: "#fffaf7",
  ink: "#2b2433",
  soft: "#75697f",
  coral: "#e3574f",
  coralSoft: "#fde3df",
  line: "#f1e7e3",
  sun: "#fdf0d5",
  sunInk: "#8a5d0b",
};
const FONT = `'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const SITE = "https://wishdrop.site";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 4px">
  <tr><td align="center" bgcolor="${C.coral}" style="border-radius:999px;mso-padding-alt:16px 34px">
    <a href="${esc(url)}" target="_blank" style="display:inline-block;padding:16px 34px;font-family:${FONT};font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
  </td></tr></table>`;
}

function block(b: Block) {
  switch (b.type) {
    case "p":
      return `<p style="margin:0 0 14px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.ink}">${esc(b.text)}</p>`;
    case "note":
      return `<p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${C.soft}">${esc(b.text)}</p>`;
    case "button":
      return button(b.label, b.url);
    case "highlight":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px">
  <tr><td align="center" bgcolor="${C.coralSoft}" style="border-radius:20px;padding:22px 16px">
    <div style="font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.coral}">${esc(b.label)}</div>
    <div style="margin-top:8px;font-family:${FONT};font-size:30px;line-height:1.15;font-weight:800;color:${C.ink}">${esc(b.value)}</div>
  </td></tr></table>`;
    case "chips":
      return `<p style="margin:14px 0 0;text-align:center">${b.items
        .map(
          (i) =>
            `<span style="display:inline-block;margin:4px 3px;padding:7px 14px;border-radius:999px;background:${C.sun};font-family:${FONT};font-size:14px;font-weight:700;color:${C.sunInk}">${esc(i)}</span>`,
        )
        .join("")}</p>`;
    case "rows":
      return b.items
        .map(
          (r) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;border:1px solid ${C.line};border-radius:18px">
  <tr>
    <td width="52" align="center" valign="top" style="padding:18px 0 16px 16px;font-size:30px;line-height:1">${r.emoji}</td>
    <td valign="top" style="padding:16px 16px 16px 12px">
      <div style="font-family:${FONT};font-size:17px;font-weight:800;color:${C.ink}">${esc(r.title)}</div>
      <div style="margin-top:3px;font-family:${FONT};font-size:14px;color:${C.soft}">${esc(r.sub)}</div>
      <a href="${esc(r.url)}" target="_blank" style="display:inline-block;margin-top:12px;padding:10px 18px;border-radius:999px;background:${C.coralSoft};font-family:${FONT};font-size:14px;font-weight:800;color:${C.coral};text-decoration:none">${esc(r.cta)} →</a>
    </td>
  </tr></table>`,
        )
        .join("");
  }
}

export function renderEmail(e: EmailContent) {
  return `<!doctype html>
<html lang="${esc(e.lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(e.title)}</title>
<style>@media (max-width:480px){.wd-card{padding:28px 20px !important}.wd-outer{padding:20px 10px !important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(e.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.paper}" style="background:${C.paper}">
  <tr><td align="center" class="wd-outer" style="padding:32px 14px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
      <tr><td align="center" style="padding:0 0 22px">
        <a href="${SITE}" target="_blank" style="text-decoration:none">
          <img src="${SITE}/icon-192.png?v=2" width="44" height="44" alt="" style="vertical-align:middle;border-radius:14px;border:0">
          <span style="vertical-align:middle;margin-left:10px;font-family:${FONT};font-size:24px;font-weight:800;color:${C.ink}">Wish<span style="color:${C.coral}">Drop</span></span>
        </a>
      </td></tr>
      <tr><td bgcolor="#ffffff" class="wd-card" style="background:#ffffff;border-radius:28px;padding:36px 32px;box-shadow:0 10px 40px rgba(43,36,51,.08)">
        <div style="text-align:center">
          <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:22px;background:${C.coralSoft};font-size:32px;text-align:center">${e.emoji}</div>
          <h1 style="margin:18px 0 18px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:800;color:${C.ink}">${esc(e.title)}</h1>
        </div>
        ${e.blocks.map(block).join("\n")}
      </td></tr>
      <tr><td align="center" style="padding:22px 20px 0">
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.soft}">${esc(e.footer)}</p>
        ${
          e.unsubscribe
            ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:12px"><a href="${esc(e.unsubscribe.url)}" style="color:${C.soft};text-decoration:underline">${esc(e.unsubscribe.label)}</a></p>`
            : ""
        }
        <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:${C.soft}"><a href="${SITE}" style="color:${C.coral};font-weight:700;text-decoration:none">wishdrop.site</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
