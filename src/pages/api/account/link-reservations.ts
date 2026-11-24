import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { json, readJson, requireUser } from "@/lib/http";

/**
 * After login/sign-up: reservations made as a guest on this device (tokens in
 * localStorage "wd_resv") become the account's, so they show in "My reservations".
 */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { tokens } = await readJson<{ tokens?: Record<string, string> }>(ctx.request);
  const entries = Object.entries(tokens ?? {}).filter(([id, tok]) => typeof id === "string" && typeof tok === "string").slice(0, 200);
  if (!entries.length) return json({ linked: 0 });
  const stmt = db().prepare(
    "UPDATE items SET reserver_user_id = ? WHERE id = ? AND reserve_token = ? AND reserver_user_id IS NULL",
  );
  const results = await db().batch(entries.map(([id, tok]) => stmt.bind(user.id, id, tok)));
  return json({ linked: results.reduce((n, r) => n + (r.meta.changes ?? 0), 0) });
};
