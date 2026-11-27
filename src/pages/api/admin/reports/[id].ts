import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/admin";

/**
 * Mark a report handled (`{ status: "done" }`) or open again. Admin only.
 * "Done" closes every open report about the same profile, list or photo too.
 */
export const POST: APIRoute = async (ctx) => {
  if (!isAdmin(ctx.locals.user)) return fail("Not found", 404);
  const { status } = await readJson<{ status?: string }>(ctx.request);
  if (status !== "done" && status !== "open") return fail("Bad status");
  const id = ctx.params.id ?? "";
  if (status === "done") {
    await db()
      .prepare(
        `UPDATE reports SET status = 'done'
          WHERE id = ?1
             OR (status = 'open' AND kind IN ('user', 'list') AND target_id IS NOT NULL
                 AND (kind, target_id) = (SELECT kind, target_id FROM reports WHERE id = ?1))
             OR (status = 'open' AND kind = 'photo' AND image_key IS NOT NULL
                 AND (kind, image_key) = (SELECT kind, image_key FROM reports WHERE id = ?1))`,
      )
      .bind(id)
      .run();
  } else {
    await db().prepare("UPDATE reports SET status = 'open' WHERE id = ?").bind(id).run();
  }
  return json({ ok: true });
};
