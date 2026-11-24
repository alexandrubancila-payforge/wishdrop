/**
 * Emails the owner (OWNER_EMAIL) when the site fails: an uncaught error or a
 * 5xx answer. At most one email per kind of error every 30 minutes (kept in
 * the SESSION KV), so a broken page doesn't flood the inbox.
 */
import { env, waitUntil } from "cloudflare:workers";
import { sendEmail } from "./email";

const QUIET_SECONDS = 30 * 60;

export function alertOwner(where: string, problem: string, detail = "") {
  if (!env.OWNER_EMAIL) return;
  const job = (async () => {
    const key = `alert:${where.replace(/[0-9a-f-]{8,}/gi, ":id")}:${problem.slice(0, 80)}`;
    if (await env.SESSION.get(key)) return;
    await env.SESSION.put(key, "1", { expirationTtl: QUIET_SECONDS });
    await sendEmail({
      to: env.OWNER_EMAIL,
      subject: `WishDrop — eroare: ${problem.slice(0, 80)}`,
      text: `Pagina: ${where}\nEroare: ${problem}\nOra: ${new Date().toISOString()}\n\n${detail.slice(0, 4000)}\n\n(Următorul email pentru aceeași eroare vine după cel puțin 30 de minute. Detalii: Cloudflare → Workers → wishdrop → Logs.)`,
    });
  })().catch((e) => console.error("alert failed", e));
  try {
    waitUntil(job);
  } catch {}
}
