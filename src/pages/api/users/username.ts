import type { APIRoute } from "astro";
import { apiT, json, requireUser } from "@/lib/http";
import { getUserByUsername, normalizeUsername, usernameProblem } from "@/lib/social";

/** Live check while typing a username in Settings. → { ok, error? } */
export const GET: APIRoute = async (ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const t = apiT(ctx);
  const username = normalizeUsername(ctx.url.searchParams.get("u"));
  const problem = usernameProblem(username);
  if (problem) return json({ ok: false, error: t(problem) });
  const owner = await getUserByUsername(username);
  if (owner && owner.id !== me.id) return json({ ok: false, error: t("usernameTaken") });
  return json({ ok: true });
};
