import type { APIRoute } from "astro";
import { db, getItemWithList, now } from "@/lib/db";
import { apiT, fail, json, readJson } from "@/lib/http";
import { isReactionKind, reactionsFor } from "@/lib/gifts";
import { forgetReaction, notify } from "@/lib/notifications";

/** ❤️ or "I want this too" on someone's gift: `{ kind: "heart" | "want", on: boolean }`. Signed-in only. */
export const POST: APIRoute = async (ctx) => {
  const t = apiT(ctx);
  const user = ctx.locals.user;
  if (!user) return fail(t("signInToReact"), 401);
  const item = ctx.params.id ? await getItemWithList(ctx.params.id) : null;
  if (!item) return fail(t("notFound"), 404);
  if (item.owner_id === user.id) return fail(t("ownGift"), 403);

  const { kind, on } = await readJson<{ kind?: string; on?: boolean }>(ctx.request);
  if (!isReactionKind(kind) || typeof on !== "boolean") return fail(t("error"));
  const type = kind === "heart" ? "reaction_heart" : "reaction_want";

  if (on) {
    const res = await db()
      .prepare("INSERT OR IGNORE INTO item_reactions (item_id, user_id, kind, created_at) VALUES (?, ?, ?, ?)")
      .bind(item.id, user.id, kind, now())
      .run();
    if (res.meta.changes) await notify(item.owner_id, user.id, type, { wishlistId: item.wishlist_id, itemId: item.id });
  } else {
    await db().prepare("DELETE FROM item_reactions WHERE item_id = ? AND user_id = ? AND kind = ?").bind(item.id, user.id, kind).run();
    await forgetReaction(item.owner_id, user.id, type, item.id);
  }
  return json((await reactionsFor([item.id], user.id)).get(item.id));
};
