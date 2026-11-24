import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { forgetFollow, notify, requestBecameFollow } from "@/lib/notifications";

/** Accept or decline someone's request to follow me. */
export const POST: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const { user_id, action } = await readJson<{ user_id?: string; action?: string }>(ctx.request);
  if (!user_id || (action !== "accept" && action !== "decline")) return fail(apiT(ctx)("error"));
  const stmt =
    action === "accept"
      ? db().prepare("UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND followee_id = ? AND status = 'pending'")
      : db().prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ? AND status = 'pending'");
  const res = await stmt.bind(user_id, me.id).run();
  if (!res.meta.changes) return fail(apiT(ctx)("notFound"), 404);
  if (action === "accept") {
    await requestBecameFollow(me.id, user_id);
    await notify(user_id, me.id, "follow_accepted");
  } else {
    await forgetFollow(me.id, user_id);
  }
  return json({ ok: true });
};
