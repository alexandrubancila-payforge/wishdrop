import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/http";

/**
 * "Download my data" (GDPR, art. 15/20): everything stored about the signed-in
 * user as one JSON file. Secrets (password hash, tokens) are left out.
 */
export const GET: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const all = async <T,>(sql: string) => (await db().prepare(sql).bind(user.id).all<T>()).results;
  const [lists, gifts, reservations, groupGifts, reactions, followers, following, blocks, notifications, pushDevices, reports] = await Promise.all([
    all("SELECT id, name, slug, visibility, hide_reservations, created_at FROM wishlists WHERE user_id = ? ORDER BY created_at"),
    all(
      `SELECT i.id, i.wishlist_id, i.product_url, i.price, i.priority, i.group_size, i.image_key, i.created_at, i.received_at,
              i.reserved_at, i.reserved_by
         FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE w.user_id = ? ORDER BY i.created_at`,
    ),
    all(
      `SELECT i.id AS item_id, w.name AS list, i.product_url, i.price, i.reserved_at, i.reserved_by AS shown_name
         FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE i.reserver_user_id = ?`,
    ),
    all(
      `SELECT c.item_id, w.name AS list, c.name AS shown_name, c.created_at
         FROM item_contributors c JOIN items i ON i.id = c.item_id JOIN wishlists w ON w.id = i.wishlist_id WHERE c.user_id = ?`,
    ),
    all("SELECT item_id, kind, created_at FROM item_reactions WHERE user_id = ?"),
    all("SELECT u.username, f.status, f.created_at FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ?"),
    all("SELECT u.username, f.status, f.created_at FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ?"),
    all("SELECT u.username, b.created_at FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ?"),
    all("SELECT type, actor_id, wishlist_id, item_id, count, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at"),
    all("SELECT lang, created_at FROM push_subscriptions WHERE user_id = ?"),
    all("SELECT kind, reason, message, page_url, created_at, status FROM reports WHERE reporter_id = ?"),
  ]);
  const data = {
    exported_at: new Date().toISOString(),
    note: "Times are Unix milliseconds. Photos: https://wishdrop.site/api/images/<image_key>",
    account: {
      id: user.id,
      email: user.email,
      email_verified: !!user.email_verified,
      google_login: !!user.google_id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      birthday: user.birthday,
      avatar_url: user.avatar_url,
      cover_url: user.cover_url,
      private_profile: !!user.is_private,
      created_at: user.created_at,
    },
    lists,
    gifts,
    reservations_i_made: reservations,
    group_gifts_i_joined: groupGifts,
    reactions_i_gave: reactions,
    followers,
    following,
    blocked: blocks,
    notifications,
    push_devices: pushDevices,
    reports_i_sent: reports,
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="wishdrop-${user.username || "data"}-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
};
