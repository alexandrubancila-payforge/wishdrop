import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { endSession } from "@/lib/auth";
import { json, requireUser } from "@/lib/http";
import { deleteImage, keyFromUrl } from "@/lib/storage";

/**
 * Delete the account: its lists, gifts and photos. Reservations this user made
 * on other people's lists stay (the gift is still taken), just unlinked.
 */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { results: photos } = await db()
    .prepare("SELECT i.image_key FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE w.user_id = ?")
    .bind(user.id)
    .all<{ image_key: string }>();
  await db().batch([
    db().prepare("UPDATE items SET reserver_user_id = NULL WHERE reserver_user_id = ?").bind(user.id),
    db().prepare("DELETE FROM follows WHERE follower_id = ?1 OR followee_id = ?1").bind(user.id),
    db().prepare("DELETE FROM notifications WHERE user_id = ?1 OR actor_id = ?1").bind(user.id),
    db().prepare("DELETE FROM items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ?)").bind(user.id),
    db().prepare("DELETE FROM wishlists WHERE user_id = ?").bind(user.id),
    db().prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  await Promise.all([...photos.map((p) => deleteImage(p.image_key)), deleteImage(keyFromUrl(user.avatar_url)), deleteImage(keyFromUrl(user.cover_url))]);
  endSession(ctx.cookies);
  return json({ ok: true });
};
