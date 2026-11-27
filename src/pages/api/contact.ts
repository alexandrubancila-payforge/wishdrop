import type { APIRoute } from "astro";
import { EMAIL_RE } from "@/lib/auth";
import { apiT, fail, json, readJson } from "@/lib/http";
import { sendOwnerEmail } from "@/lib/email";

export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const b = await readJson<{ name?: string; email?: string; message?: string; company?: string }>(ctx.request);
  if (b.company) return json({ ok: true }); // honeypot: bots fill the hidden field
  const name = String(b.name ?? "").trim().slice(0, 100);
  const email = String(b.email ?? "").trim().slice(0, 254);
  const message = String(b.message ?? "").trim().slice(0, 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 10) return fail(t("error"));
  const ok = await sendOwnerEmail({
    replyTo: email,
    subject: `WishDrop — mesaj de la ${name}`,
    emoji: "💌",
    title: `Mesaj nou de la ${name}`,
    facts: [
      ["Nume", name],
      ["Email", email],
    ],
    message,
    button: { label: "Răspunde", url: `mailto:${email}` },
    note: "Poți răspunde direct la acest email: ajunge la persoana care a scris.",
  });
  return ok ? json({ ok: true }) : fail(t("sendFail"), 502);
};
