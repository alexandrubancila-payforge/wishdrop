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
  const { tokens, joins } = await readJson<{ tokens?: Record<string, string>; joins?: Record<string, string> }>(ctx.request);
  const pairs = (m: Record<string, string> | undefined) =>
    Object.entries(m ?? {}).filter(([id, tok]) => typeof id === "string" && typeof tok === "string").slice(0, 200);
  const reserve = db().prepare(
    "UPDATE items SET reserver_user_id = ? WHERE id = ? AND reserve_token = ? AND reserver_user_id IS NULL",
  );
  // Group gifts joined as a guest (localStorage "wd_join").
  const join = db().prepare(
    `UPDATE item_contributors SET user_id = ?1 WHERE item_id = ?2 AND token = ?3 AND user_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM item_contributors c WHERE c.item_id = ?2 AND c.user_id = ?1)`,
  );
  const stmts = [...pairs(tokens).map(([id, tok]) => reserve.bind(user.id, id, tok)), ...pairs(joins).map(([id, tok]) => join.bind(user.id, id, tok))];
  if (!stmts.length) return json({ linked: 0 });
  const results = await db().batch(stmts);
  return json({ linked: results.reduce((n, r) => n + (r.meta.changes ?? 0), 0) });
};
