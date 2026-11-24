import type { APIRoute } from "astro";
import { json, readJson, requireUser } from "@/lib/http";
import { unfollow } from "@/lib/social";

/** Remove one of my followers. */
export const DELETE: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const { user_id } = await readJson<{ user_id?: string }>(ctx.request);
  if (user_id) await unfollow(user_id, me.id);
  return json({ ok: true });
};
