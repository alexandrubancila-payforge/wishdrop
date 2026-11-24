/**
 * The signed-in home page: what the people you follow are up to.
 * Only lists they show on their profile ('public' or 'followers') appear, the
 * same rule as their profile page uses for an accepted follower.
 */
import { db, type Item } from "./db";
import { findableSql } from "./blocks";

export interface FeedEntry extends Item {
  owner_id: string;
  owner_username: string | null;
  owner_name: string | null;
  owner_email: string;
  owner_avatar: string | null;
  list_name: string;
  list_slug: string;
}

/** Gifts added recently on lists of people I follow. */
export async function friendsActivity(userId: string, limit = 30) {
  const { results } = await db()
    .prepare(
      `SELECT i.*, u.id AS owner_id, u.username AS owner_username, u.name AS owner_name, u.email AS owner_email,
              u.avatar_url AS owner_avatar, w.name AS list_name, w.slug AS list_slug
         FROM follows f
         JOIN users u ON u.id = f.followee_id AND u.suspended_at IS NULL
         JOIN wishlists w ON w.user_id = u.id AND w.visibility IN ('public', 'followers') AND w.hidden_at IS NULL
         JOIN items i ON i.wishlist_id = w.id AND i.received_at IS NULL
        WHERE f.follower_id = ? AND f.status = 'accepted'
        ORDER BY i.created_at DESC
        LIMIT ?`,
    )
    .bind(userId, limit)
    .all<FeedEntry>();
  return results;
}

export interface Birthday {
  id: string;
  username: string | null;
  name: string | null;
  email: string;
  avatar_url: string | null;
  birthday: string;
  /** Days until the next birthday (0 = today). */
  inDays: number;
  /** The next birthday as a date (UTC midnight). */
  next: Date;
}

/** Birthdays of people I follow in the next `days` days, soonest first. */
export async function upcomingBirthdays(userId: string, days = 60, now = new Date()): Promise<Birthday[]> {
  const { results } = await db()
    .prepare(
      `SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.birthday
         FROM follows f JOIN users u ON u.id = f.followee_id
        WHERE f.follower_id = ? AND f.status = 'accepted' AND u.birthday IS NOT NULL`,
    )
    .bind(userId)
    .all<Omit<Birthday, "inDays" | "next">>();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return results
    .map((u) => {
      const [, m, d] = u.birthday.split("-").map(Number);
      let next = Date.UTC(now.getUTCFullYear(), m - 1, d);
      if (next < today) next = Date.UTC(now.getUTCFullYear() + 1, m - 1, d);
      return { ...u, inDays: Math.round((next - today) / 86_400_000), next: new Date(next) };
    })
    .filter((u) => u.inDays <= days)
    .sort((a, b) => a.inDays - b.inDays);
}

/** People to follow when you follow nobody yet: the most followed public profiles. */
export async function suggestedPeople(userId: string, limit = 6) {
  const { results } = await db()
    .prepare(
      `SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.is_private,
              (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id AND f.status = 'accepted') AS followers,
              (SELECT COUNT(*) FROM wishlists w WHERE w.user_id = u.id AND w.visibility = 'public') AS lists
         FROM users u
        WHERE u.id <> ?1 AND u.username IS NOT NULL AND ${findableSql("?1")}
          AND u.id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?1)
        ORDER BY followers DESC, lists DESC, u.created_at DESC
        LIMIT ?2`,
    )
    .bind(userId, limit)
    .all<{ id: string; username: string; name: string | null; email: string; avatar_url: string | null; is_private: number; followers: number; lists: number }>();
  return results;
}

export interface UpcomingEvent extends Omit<Birthday, "birthday"> {
  list_name: string;
  list_slug: string;
}

/** Events (wishlists.event_date) on visible lists of people I follow, in the next `days` days. */
export async function upcomingEvents(userId: string, days = 60, now = new Date()): Promise<UpcomingEvent[]> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const { results } = await db()
    .prepare(
      `SELECT u.id, u.username, u.name, u.email, u.avatar_url, w.name AS list_name, w.slug AS list_slug, w.event_date
         FROM follows f
         JOIN users u ON u.id = f.followee_id AND u.suspended_at IS NULL
         JOIN wishlists w ON w.user_id = u.id AND w.visibility IN ('public', 'followers') AND w.hidden_at IS NULL
        WHERE f.follower_id = ? AND f.status = 'accepted' AND w.event_date BETWEEN ? AND ?`,
    )
    .bind(userId, iso(today), iso(today + days * 86_400_000))
    .all<Omit<UpcomingEvent, "inDays" | "next"> & { event_date: string }>();
  return results
    .map(({ event_date, ...e }) => {
      const next = Date.parse(event_date + "T00:00:00Z");
      return { ...e, inDays: Math.round((next - today) / 86_400_000), next: new Date(next) };
    })
    .sort((a, b) => a.inDays - b.inDays);
}
