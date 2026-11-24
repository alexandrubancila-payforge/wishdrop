import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/admin";

/** Mark a report handled (`{ status: "done" }`) or open again. Admin only. */
export const POST: APIRoute = async (ctx) => {
  if (!isAdmin(ctx.locals.user)) return fail("Not found", 404);
  const { status } = await readJson<{ status?: string }>(ctx.request);
  if (status !== "done" && status !== "open") return fail("Bad status");
  await db().prepare("UPDATE reports SET status = ? WHERE id = ?").bind(status, ctx.params.id ?? "").run();
  return json({ ok: true });
};
