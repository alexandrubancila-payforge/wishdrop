/**
 * Notifications for the bell in the header (table `notifications`,
 * migration 0013). Created by the follow flow in lib/social.ts and the
 * follow-request API; shown and marked read on /notifications.
 */
import { db, newId, now } from "./db";

export type NotificationType = "follow" | "follow_request" | "follow_accepted";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  created_at: number;
  read_at: number | null;
  actor_id: string;
  username: string | null;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_private: number;
  /** My relation to the actor, for a "follow back" button. */
  my_status: "accepted" | "pending" | null;
  /** Whether the actor's request to follow me is still waiting. */
  request_pending: number;
}

/** Record a notification, replacing an older one of the same kind from the same person. */
export async function notify(userId: string, actorId: string, type: NotificationType) {
  if (userId === actorId) return;
  await db().batch([
    db().prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ?").bind(userId, actorId, type),
    db()
      .prepare("INSERT INTO notifications (id, user_id, actor_id, type, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(newId(), userId, actorId, type, now()),
  ]);
}

/** Unfollowing or withdrawing a request takes its notification away, as on Instagram. */
export const forgetFollow = (followeeId: string, followerId: string) =>
  db()
    .prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type IN ('follow', 'follow_request')")
    .bind(followeeId, followerId)
    .run();

/** An accepted request reads as a follow from then on. */
export const requestBecameFollow = (followeeId: string, followerId: string) =>
  db()
    .prepare("UPDATE notifications SET type = 'follow' WHERE user_id = ? AND actor_id = ? AND type = 'follow_request'")
    .bind(followeeId, followerId)
    .run();

export async function unreadCount(userId: string) {
  return (
    (await db()
      .prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL")
      .bind(userId)
      .first<{ n: number }>())?.n ?? 0
  );
}

export async function listNotifications(userId: string, limit = 100) {
  const { results } = await db()
    .prepare(
      `SELECT n.id, n.type, n.created_at, n.read_at, n.actor_id,
              u.username, u.name, u.email, u.avatar_url, u.is_private,
              (SELECT f.status FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = n.actor_id) AS my_status,
              EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = n.actor_id AND f.followee_id = ?1 AND f.status = 'pending') AS request_pending
         FROM notifications n JOIN users u ON u.id = n.actor_id
        WHERE n.user_id = ?1
        ORDER BY n.created_at DESC
        LIMIT ?2`,
    )
    .bind(userId, limit)
    .all<NotificationRow>();
  return results;
}

export const markAllRead = (userId: string) =>
  db().prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").bind(now(), userId).run();
