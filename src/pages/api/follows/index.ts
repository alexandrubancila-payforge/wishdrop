import type { APIRoute } from "astro";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { follow, getUserByUsername, unfollow } from "@/lib/social";
import { blockedEitherWay } from "@/lib/blocks";

/** Follow someone (or send a request if their profile is private). → { relation } */
export const POST: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const t = apiT(ctx);
  const { username } = await readJson<{ username?: string }>(ctx.request);
  const them = username ? await getUserByUsername(username) : null;
  if (!them) return fail(t("notFound"), 404);
  if (them.id === me.id) return fail(t("cantFollowSelf"));
  if (await blockedEitherWay(me.id, them.id)) return fail(t("blocked"), 403);
  return json({ relation: await follow(me, them) });
};

/** Unfollow, or withdraw a pending request. */
export const DELETE: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const { username } = await readJson<{ username?: string }>(ctx.request);
  const them = username ? await getUserByUsername(username) : null;
  if (!them) return fail(apiT(ctx)("notFound"), 404);
  await unfollow(me.id, them.id);
  return json({ relation: "none" });
};
