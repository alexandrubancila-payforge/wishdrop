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

/** Where the next page of the feed starts: just older than this gift. */
export interface FeedCursor {
  at: number;
  id: string;
}

/** The feed only goes this far back (older gifts are on each friend's profile), so scrolling stays cheap. */
export const FEED_DAYS = 30;

/** Gifts added in the last FEED_DAYS on lists of people I follow, newest first; `before` pages further back. */
export async function friendsActivity(userId: string, limit = 30, before?: FeedCursor) {
  const { results } = await db()
    .prepare(
      `SELECT i.*, u.id AS owner_id, u.username AS owner_username, u.name AS owner_name, u.email AS owner_email,
              u.avatar_url AS owner_avatar, w.name AS list_name, w.slug AS list_slug
         FROM follows f
         JOIN users u ON u.id = f.followee_id AND u.suspended_at IS NULL
         JOIN wishlists w ON w.user_id = u.id AND w.visibility IN ('public', 'followers') AND w.hidden_at IS NULL
         JOIN items i ON i.wishlist_id = w.id AND i.received_at IS NULL
        WHERE f.follower_id = ? AND f.status = 'accepted'
          AND i.created_at > ?
          AND (? IS NULL OR i.created_at < ? OR (i.created_at = ? AND i.id < ?))
        ORDER BY i.created_at DESC, i.id DESC
        LIMIT ?`,
    )
    .bind(userId, Date.now() - FEED_DAYS * 86_400_000, before?.at ?? null, before?.at ?? null, before?.at ?? null, before?.id ?? "", limit)
    .all<FeedEntry>();
  return results;
}

export const FEED_PAGE = 30;

/**
 * One page of the feed as posts: gifts added to the same list in a row become
 * one post. The last post may go on into the next page, so unless this is the
 * end it waits for the next page (where it arrives whole).
 */
export async function feedPage(userId: string, before?: FeedCursor) {
  const items = await friendsActivity(userId, FEED_PAGE + 1, before);
  const more = items.length > FEED_PAGE;
  const page = items.slice(0, FEED_PAGE);
  const posts: FeedEntry[][] = [];
  for (const it of page) {
    const last = posts.at(-1);
    if (last && last[0].list_slug === it.list_slug) last.push(it);
    else posts.push([it]);
  }
  // Hold the last post back for the next page, unless it's the only one (a list with 30+ new gifts).
  if (more && posts.length > 1) posts.pop();
  const lastItem = posts.at(-1)?.at(-1);
  const next: FeedCursor | null = more && lastItem ? { at: lastItem.created_at, id: lastItem.id } : null;
  return { posts, next };
}

/** A friend who added gifts lately: one bubble in the row at the top of the feed. */
export interface StoryFriend {
  id: string;
  username: string | null;
  name: string | null;
  email: string;
  avatar_url: string | null;
  /** When their newest gift was added (also tells "seen" apart from "new"). */
  last_at: number;
  /** The list that newest gift is on. */
  list_slug: string;
}

/** People I follow who added gifts to a visible list in the last `days` days, most recent first. */
export async function storyFriends(userId: string, days = 7, limit = 20) {
  // SQLite: with MAX(), the bare column w.slug comes from the row holding that max.
  const { results } = await db()
    .prepare(
      `SELECT u.id, u.username, u.name, u.email, u.avatar_url, MAX(i.created_at) AS last_at, w.slug AS list_slug
         FROM follows f
         JOIN users u ON u.id = f.followee_id AND u.suspended_at IS NULL
         JOIN wishlists w ON w.user_id = u.id AND w.visibility IN ('public', 'followers') AND w.hidden_at IS NULL
         JOIN items i ON i.wishlist_id = w.id AND i.received_at IS NULL AND i.created_at > ?
        WHERE f.follower_id = ? AND f.status = 'accepted'
        GROUP BY u.id
        ORDER BY last_at DESC
        LIMIT ?`,
    )
    .bind(Date.now() - days * 86_400_000, userId, limit)
    .all<StoryFriend>();
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
              (SELECT COUNT(*) FROM wishlists w WHERE w.user_id = u.id AND w.visibility = 'public') AS lists,
              -- Someone I follow who follows them ("followed by Mihai"): those come first.
              (SELECT COALESCE(m.name, '@' || m.username)
                 FROM follows f2 JOIN users m ON m.id = f2.follower_id
                WHERE f2.followee_id = u.id AND f2.status = 'accepted'
                  AND f2.follower_id IN (SELECT followee_id FROM follows WHERE follower_id = ?1 AND status = 'accepted')
                LIMIT 1) AS via
         FROM users u
        WHERE u.id <> ?1 AND u.username IS NOT NULL AND ${findableSql("?1")}
          AND u.id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?1)
        ORDER BY via IS NULL, followers DESC, lists DESC, u.created_at DESC
        LIMIT ?2`,
    )
    .bind(userId, limit)
    .all<{ id: string; username: string; name: string | null; email: string; avatar_url: string | null; is_private: number; followers: number; lists: number; via: string | null }>();
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
