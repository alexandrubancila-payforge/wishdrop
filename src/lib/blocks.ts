/**
 * Blocking (table `blocks`, migration 0015) and the rules for who shows up
 * in search and suggestions.
 *
 * A block removes the follows in both directions; after that the blocked
 * person can't follow, react to, or open the blocker's profile, and neither
 * shows up in the other's search.
 */
import { env } from "cloudflare:workers";
import { db, now, type User } from "./db";
import { forgetFollow } from "./notifications";

export const isBlocked = async (blockerId: string, blockedId: string) =>
  !!(await db().prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?").bind(blockerId, blockedId).first());

/** Either one blocked the other. */
export const blockedEitherWay = async (a: string, b: string) =>
  !!(await db()
    .prepare("SELECT 1 FROM blocks WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1)")
    .bind(a, b)
    .first());

export async function block(blocker: User, blocked: User) {
  await db().batch([
    db().prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)").bind(blocker.id, blocked.id, now()),
    db()
      .prepare("DELETE FROM follows WHERE (follower_id = ?1 AND followee_id = ?2) OR (follower_id = ?2 AND followee_id = ?1)")
      .bind(blocker.id, blocked.id),
    db()
      .prepare(
        "DELETE FROM item_reactions WHERE user_id = ? AND item_id IN (SELECT i.id FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE w.user_id = ?)",
      )
      .bind(blocked.id, blocker.id),
    db().prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ?").bind(blocker.id, blocked.id),
  ]);
  await forgetFollow(blocked.id, blocker.id);
}

export const unblock = (blockerId: string, blockedId: string) =>
  db().prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").bind(blockerId, blockedId).run();

export async function blockedBy(userId: string) {
  const { results } = await db()
    .prepare(
      `SELECT u.id, u.username, u.name, u.email, u.avatar_url, b.created_at
         FROM blocks b JOIN users u ON u.id = b.blocked_id
        WHERE b.blocker_id = ? ORDER BY b.created_at DESC`,
    )
    .bind(userId)
    .all<{ id: string; username: string | null; name: string | null; email: string; avatar_url: string | null; created_at: number }>();
  return results;
}

/** New accounts must confirm their email before others can find them (when REQUIRE_EMAIL_VERIFICATION is "true"). */
export const verifiedOnly = () => env.REQUIRE_EMAIL_VERIFICATION === "true";

/**
 * SQL condition for "u can appear to the viewer `?{n}`" in search and
 * suggestions: not suspended, email confirmed (or Google), no block either way.
 */
export function findableSql(viewerParam: string) {
  return `u.suspended_at IS NULL
    ${verifiedOnly() ? "AND (u.email_verified = 1 OR u.google_id IS NOT NULL)" : ""}
    AND NOT EXISTS (SELECT 1 FROM blocks bk WHERE (bk.blocker_id = u.id AND bk.blocked_id = ${viewerParam})
                                             OR (bk.blocker_id = ${viewerParam} AND bk.blocked_id = u.id))`;
}
