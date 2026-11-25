import type { APIRoute } from "astro";
import { db, now } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { getGroupByCode, membership, SANTA_MAX } from "@/lib/santa";

/** Join a group with its invite code: `{ code }` → `{ id }`. Closed once names are drawn. */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const { code } = await readJson<{ code?: string }>(ctx.request);
  const group = code ? await getGroupByCode(String(code)) : null;
  if (!group) return fail(t("notFound"), 404);
  if (await membership(group.id, user.id)) return json({ id: group.id });
  if (group.drawn_at) return fail(t("santaDrawn"), 409);
  const res = await db()
    .prepare(
      `INSERT INTO santa_members (group_id, user_id, joined_at)
       SELECT ?1, ?2, ?3 WHERE (SELECT COUNT(*) FROM santa_members WHERE group_id = ?1) < ?4`,
    )
    .bind(group.id, user.id, now(), SANTA_MAX)
    .run();
  if (!res.meta.changes) return fail(t("santaFull"), 409);
  return json({ id: group.id });
};
