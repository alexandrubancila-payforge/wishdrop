import type { APIRoute } from "astro";
import { apiT, fail, json, readJson, requireUser } from "@/lib/http";
import { createGroup } from "@/lib/santa";

/** Create a Secret Santa group: `{ name, budget?, exchange_date? }` → `{ id, code }`. */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const b = await readJson<{ name?: string; budget?: string; exchange_date?: string }>(ctx.request);
  const name = String(b.name ?? "").trim().slice(0, 60);
  if (!name) return fail(t("nameRequired"));
  const budget = String(b.budget ?? "").trim().slice(0, 40) || null;
  const date = String(b.exchange_date ?? "").trim();
  if (date && !(/^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date)))) return fail(t("error"));
  return json(await createGroup(user.id, { name, budget, exchange_date: date || null }), 201);
};
