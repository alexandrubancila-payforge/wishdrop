import type { APIRoute } from "astro";
import { updateUser } from "@/lib/db";
import { json, readJson, requireUser } from "@/lib/http";

/** Seasonal decorations on the owner's public lists (Christmas, Valentine's, Easter…). */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { disable } = await readJson<{ disable?: boolean }>(ctx.request);
  await updateUser(user.id, { disable_seasons: disable ? 1 : 0 });
  return json({ ok: true });
};
