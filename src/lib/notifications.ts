/**
 * Notifications for the bell in the header (table `notifications`,
 * migrations 0013 and 0014), shown and marked read on /notifications, and
 * mirrored to phones that turned on push (lib/push.ts).
 *
 *   follow / follow_request / follow_accepted   the follow flow (lib/social.ts)
 *   new_list / new_item                         someone I follow made a list or added gifts;
 *                                               several gifts fold into one row (`count`)
 *   reaction_heart / reaction_want              someone reacted to one of my gifts
 *
 * Rows older than 90 days are deleted whenever a new one is written.
 */
import { db, newId, now } from "./db";
import { localePath, makeT, isLang, type Lang, type T } from "./i18n";
import { pushToUsers } from "./push";
import strings from "@/i18n/notifications";
import { plural } from "@/components/dashboard/plural";

export type NotificationType =
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "new_list"
  | "new_item"
  | "reaction_heart"
  | "reaction_want"
  | "santa_drawn";

export const KEEP_DAYS = 90;

export interface NotificationRow {
  id: string;
  type: NotificationType;
  created_at: number;
  read_at: number | null;
  actor_id: string;
  count: number;
  username: string | null;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_private: number;
  /** My relation to the actor, for a "follow back" button. */
  my_status: "accepted" | "pending" | null;
  /** Whether the actor's request to follow me is still waiting. */
  request_pending: number;
  wishlist_id: string | null;
  list_name: string | null;
  list_slug: string | null;
  item_id: string | null;
  item_image: string | null;
  santa_group_id: string | null;
}

interface Ref {
  wishlistId?: string | null;
  itemId?: string | null;
  santaGroupId?: string | null;
}

const prune = () =>
  db().prepare("DELETE FROM notifications WHERE created_at < ?").bind(now() - KEEP_DAYS * 86_400_000);

/** Record a notification, replacing an older one of the same kind from the same person (about the same gift). */
export async function notify(userId: string, actorId: string, type: NotificationType, ref: Ref = {}) {
  if (userId === actorId) return;
  await db().batch([
    prune(),
    db()
      .prepare(
        "DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND COALESCE(item_id, '') = ? AND COALESCE(santa_group_id, '') = ?",
      )
      .bind(userId, actorId, type, ref.itemId ?? "", ref.santaGroupId ?? ""),
    db()
      .prepare(
        "INSERT INTO notifications (id, user_id, actor_id, type, created_at, wishlist_id, item_id, santa_group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(newId(), userId, actorId, type, now(), ref.wishlistId ?? null, ref.itemId ?? null, ref.santaGroupId ?? null),
  ]);
  pushNotification([userId], actorId, type, ref, 1);
}

/** Take back a reaction's notification when the reaction is removed. */
export const forgetReaction = (userId: string, actorId: string, type: NotificationType, itemId: string) =>
  db()
    .prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND item_id = ? AND read_at IS NULL")
    .bind(userId, actorId, type, itemId)
    .run();

/**
 * Tell the owner's accepted followers about a new list or a new gift, when
 * the list shows on the profile ('public' or 'followers'). A new gift folds
 * into an unread note about the same list instead of adding another one;
 * only people who got a fresh note get a push.
 */
export async function notifyFollowers(ownerId: string, type: "new_list" | "new_item", wishlistId: string, itemId: string | null = null) {
  const t = now();
  const stmts = [prune()];
  if (type === "new_item") {
    stmts.push(
      db()
        .prepare(
          `UPDATE notifications SET count = count + 1, item_id = ?, created_at = ?
            WHERE actor_id = ? AND wishlist_id = ? AND type IN ('new_list', 'new_item') AND read_at IS NULL`,
        )
        .bind(itemId, t, ownerId, wishlistId),
    );
  }
  stmts.push(
    db()
      .prepare(
        `INSERT INTO notifications (id, user_id, actor_id, type, created_at, wishlist_id, item_id, count)
         SELECT lower(hex(randomblob(16))), f.follower_id, ?1, ?2, ?3, ?4, ?5, ?6
           FROM follows f JOIN wishlists w ON w.id = ?4 AND w.visibility IN ('public', 'followers')
          WHERE f.followee_id = ?1 AND f.status = 'accepted'
            AND NOT EXISTS (SELECT 1 FROM notifications n
                             WHERE n.user_id = f.follower_id AND n.actor_id = ?1 AND n.wishlist_id = ?4
                               AND n.type IN ('new_list', 'new_item') AND n.read_at IS NULL)
         RETURNING user_id`,
      )
      .bind(ownerId, type, t, wishlistId, itemId, type === "new_item" ? 1 : 0),
  );
  const results = await db().batch<{ user_id: string }>(stmts);
  const fresh = (results[results.length - 1].results ?? []).map((r) => r.user_id);
  pushNotification(fresh, ownerId, type, { wishlistId, itemId }, 1);
}

/** Unfollowing or withdrawing a request takes its notifications away, as on Instagram. */
export const forgetFollow = (followeeId: string, followerId: string) =>
  db().batch([
    db()
      .prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type IN ('follow', 'follow_request')")
      .bind(followeeId, followerId),
    db()
      .prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type IN ('new_list', 'new_item')")
      .bind(followerId, followeeId),
  ]);

/** An accepted request reads as a follow from then on. */
export const requestBecameFollow = (followeeId: string, followerId: string) =>
  db()
    .prepare("UPDATE notifications SET type = 'follow' WHERE user_id = ? AND actor_id = ? AND type = 'follow_request'")
    .bind(followeeId, followerId)
    .run();

/**
 * Which rows to show: list news only while the list still shows on the
 * profile (and, for followers-only lists, while I still follow), and nothing
 * past the 90 days.
 */
const VISIBLE = `n.user_id = ?1 AND n.created_at >= ?2 AND (
    n.type NOT IN ('new_list', 'new_item')
    OR EXISTS (SELECT 1 FROM wishlists wv WHERE wv.id = n.wishlist_id AND wv.hidden_at IS NULL AND (
         wv.visibility = 'public'
         OR (wv.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows fv
               WHERE fv.follower_id = ?1 AND fv.followee_id = wv.user_id AND fv.status = 'accepted')))))`;

const since = () => now() - KEEP_DAYS * 86_400_000;

export async function unreadCount(userId: string) {
  return (
    (await db()
      .prepare(`SELECT COUNT(*) AS n FROM notifications n WHERE ${VISIBLE} AND n.read_at IS NULL`)
      .bind(userId, since())
      .first<{ n: number }>())?.n ?? 0
  );
}

export async function listNotifications(userId: string, limit = 100) {
  const { results } = await db()
    .prepare(
      `SELECT n.id, n.type, n.created_at, n.read_at, n.actor_id, n.count, n.wishlist_id, n.item_id, n.santa_group_id,
              u.username, u.name, u.email, u.avatar_url, u.is_private,
              COALESCE(w.name, sg.name) AS list_name, w.slug AS list_slug, i.image_key AS item_image,
              (SELECT f.status FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = n.actor_id) AS my_status,
              EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = n.actor_id AND f.followee_id = ?1 AND f.status = 'pending') AS request_pending
         FROM notifications n
         JOIN users u ON u.id = n.actor_id
         LEFT JOIN wishlists w ON w.id = n.wishlist_id
         LEFT JOIN items i ON i.id = n.item_id
         LEFT JOIN santa_groups sg ON sg.id = n.santa_group_id
        WHERE ${VISIBLE}
        ORDER BY n.created_at DESC
        LIMIT ?3`,
    )
    .bind(userId, since(), limit)
    .all<NotificationRow>();
  return results;
}

export const markAllRead = (userId: string) =>
  db().prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").bind(now(), userId).run();

/* ---------- wording (shared by the page and the push) ---------- */

export const actorName = (u: { name: string | null; username: string | null; email: string }) =>
  u.name || (u.username ? `@${u.username}` : u.email.split("@")[0]);

/** The sentence for a notification with `{name}` left in, for the caller to fill (bold on the page). */
export function sentenceTemplate(t: T, lang: Lang, n: { type: NotificationType; count: number; list_name: string | null }) {
  const list = n.list_name ?? "";
  if (n.type === "new_item") return n.count > 1 ? plural(t, lang, "new_items", n.count, { list }) : t("new_item", { list });
  if (n.type === "new_list") return t("new_list", { list });
  if (n.type === "santa_drawn") return t("santa_drawn", { list });
  return t(n.type);
}

/** Where tapping the notification leads. */
export function notificationUrl(
  lang: Lang,
  n: { type: NotificationType; list_slug: string | null; wishlist_id: string | null; santa_group_id?: string | null },
) {
  if (n.type === "santa_drawn" && n.santa_group_id) return localePath(lang, `/santa/${n.santa_group_id}`);
  if ((n.type === "new_list" || n.type === "new_item") && n.list_slug) return localePath(lang, `/w/${n.list_slug}`);
  if (n.type.startsWith("reaction_") && n.wishlist_id) return localePath(lang, `/dashboard/${n.wishlist_id}`);
  return localePath(lang, "/notifications");
}

function pushNotification(userIds: string[], actorId: string, type: NotificationType, ref: Ref, count: number) {
  if (!userIds.length) return;
  pushToUsers(userIds, async (l) => {
    const lang: Lang = isLang(l) ? l : "ro";
    const t = makeT(lang, strings);
    const [actor, list] = await Promise.all([
      db().prepare("SELECT name, username, email FROM users WHERE id = ?").bind(actorId).first<{ name: string | null; username: string | null; email: string }>(),
      ref.wishlistId
        ? db().prepare("SELECT name, slug FROM wishlists WHERE id = ?").bind(ref.wishlistId).first<{ name: string; slug: string }>()
        : ref.santaGroupId
          ? db().prepare("SELECT name, NULL AS slug FROM santa_groups WHERE id = ?").bind(ref.santaGroupId).first<{ name: string; slug: string }>()
          : null,
    ]);
    const body = sentenceTemplate(t, lang, { type, count, list_name: list?.name ?? null }).replace("{name}", actor ? actorName(actor) : "");
    return {
      title: "WishDrop",
      body,
      url: notificationUrl(lang, { type, list_slug: list?.slug ?? null, wishlist_id: ref.wishlistId ?? null, santa_group_id: ref.santaGroupId ?? null }),
      tag: ref.wishlistId ? `list-${ref.wishlistId}` : `${type}-${actorId}`,
    };
  });
}
