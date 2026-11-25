/**
 * Secret Santa (migration 0019). An organizer makes a group and shares the
 * invite link; members join with their account and pick the list their Santa
 * will see; the organizer draws. Each member then sees only whom they give
 * to — nobody, not even the organizer, sees the other pairs.
 */
import { db, newId, now } from "./db";

export const SANTA_MIN = 3;
export const SANTA_MAX = 100;

export interface SantaGroup {
  id: string;
  code: string;
  name: string;
  owner_id: string;
  budget: string | null;
  exchange_date: string | null;
  drawn_at: number | null;
  created_at: number;
}

export interface SantaMember {
  user_id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatar_url: string | null;
  wishlist_id: string | null;
  list_name: string | null;
  joined_at: number;
}

const CODE_ABC = "abcdefghijkmnpqrstuvwxyz23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => CODE_ABC[b % CODE_ABC.length]).join("");

export async function createGroup(ownerId: string, f: { name: string; budget: string | null; exchange_date: string | null }) {
  const id = newId();
  const code = newCode();
  await db().batch([
    db()
      .prepare("INSERT INTO santa_groups (id, code, name, owner_id, budget, exchange_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, code, f.name, ownerId, f.budget, f.exchange_date, now()),
    db().prepare("INSERT INTO santa_members (group_id, user_id, joined_at) VALUES (?, ?, ?)").bind(id, ownerId, now()),
  ]);
  return { id, code };
}

export const getGroup = (id: string) => db().prepare("SELECT * FROM santa_groups WHERE id = ?").bind(id).first<SantaGroup>();
export const getGroupByCode = (code: string) => db().prepare("SELECT * FROM santa_groups WHERE code = ?").bind(code).first<SantaGroup>();

export async function members(groupId: string) {
  const { results } = await db()
    .prepare(
      `SELECT m.user_id, u.name, u.username, u.email, u.avatar_url, m.wishlist_id, w.name AS list_name, m.joined_at
         FROM santa_members m JOIN users u ON u.id = m.user_id
         LEFT JOIN wishlists w ON w.id = m.wishlist_id
        WHERE m.group_id = ? ORDER BY m.joined_at`,
    )
    .bind(groupId)
    .all<SantaMember>();
  return results;
}

export const membership = (groupId: string, userId: string) =>
  db()
    .prepare("SELECT * FROM santa_members WHERE group_id = ? AND user_id = ?")
    .bind(groupId, userId)
    .first<{ group_id: string; user_id: string; wishlist_id: string | null; giftee_id: string | null }>();

/** My groups, newest first, with the member count. */
export async function myGroups(userId: string) {
  const { results } = await db()
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM santa_members x WHERE x.group_id = g.id) AS member_count
         FROM santa_members m JOIN santa_groups g ON g.id = m.group_id
        WHERE m.user_id = ? ORDER BY g.created_at DESC`,
    )
    .bind(userId)
    .all<SantaGroup & { member_count: number }>();
  return results;
}

/**
 * Random assignment where nobody draws themselves: shuffle, then each person
 * gives to the next one in the shuffled circle.
 */
export function drawPairs(userIds: string[]): Map<string, string> {
  const a = [...userIds];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return new Map(a.map((id, i) => [id, a[(i + 1) % a.length]]));
}

export async function draw(group: SantaGroup) {
  const ids = (await members(group.id)).map((m) => m.user_id);
  const pairs = drawPairs(ids);
  await db().batch([
    ...[...pairs].map(([giver, giftee]) =>
      db().prepare("UPDATE santa_members SET giftee_id = ? WHERE group_id = ? AND user_id = ?").bind(giftee, group.id, giver),
    ),
    db().prepare("UPDATE santa_groups SET drawn_at = ? WHERE id = ? AND drawn_at IS NULL").bind(now(), group.id),
  ]);
  return pairs;
}

/** Whom I give to, with the list they picked for their Santa. */
export const myGiftee = (groupId: string, userId: string) =>
  db()
    .prepare(
      `SELECT u.id, u.name, u.username, u.email, u.avatar_url, w.name AS list_name, w.slug AS list_slug
         FROM santa_members me
         JOIN users u ON u.id = me.giftee_id
         LEFT JOIN santa_members them ON them.group_id = me.group_id AND them.user_id = me.giftee_id
         LEFT JOIN wishlists w ON w.id = them.wishlist_id
        WHERE me.group_id = ? AND me.user_id = ?`,
    )
    .bind(groupId, userId)
    .first<{ id: string; name: string | null; username: string | null; email: string; avatar_url: string | null; list_name: string | null; list_slug: string | null }>();
