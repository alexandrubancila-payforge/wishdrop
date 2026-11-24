import type { APIRoute } from "astro";
import { updateUser } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";

/** Change (or, for Google-only accounts, set) the password. */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const body = await readJson<{ current?: string; new?: string }>(ctx.request);
  const next = String(body.new ?? "");
  if (user.password_hash && !(await verifyPassword(String(body.current ?? ""), user.password_hash))) {
    return fail(t("badCredentials"), 401);
  }
  if (next.length < 8) return fail(t("passwordShort"));
  await updateUser(user.id, { password_hash: await hashPassword(next) });
  return json({ ok: true });
};
