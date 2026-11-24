/**
 * Profiles and following (Instagram-style, one-way).
 *
 * - A user gets a public address /@username once they pick a username.
 * - Profiles are public by default; private ones need approval (following creates a request).
 * - A list's `visibility` decides whether it appears on the profile:
 *   'public' for anyone who can see the profile, 'followers' for accepted
 *   followers only, 'link' nowhere. The /w/<slug> link works in every case.
 */
import { db, now, type User, type Wishlist } from "./db";
import { findableSql } from "./blocks";
import { forgetFollow, notify } from "./notifications";

export type Visibility = "link" | "followers" | "public";
export const VISIBILITIES: Visibility[] = ["public", "followers", "link"];
export const isVisibility = (v: unknown): v is Visibility => VISIBILITIES.includes(v as Visibility);

/** none · requested (pending) · following (accepted) · self */
export type Relation = "self" | "following" | "requested" | "none";

/** 3–24 chars: letters, digits, dot, underscore; no dot at the ends or twice in a row. */
export const USERNAME_RE = /^(?![.])(?!.*[.]{2})[a-z0-9._]{3,24}(?<![.])$/;

/** Words that would look official or clash with site paths. */
const RESERVED = new Set([
  "admin", "administrator", "api", "app", "contact", "dashboard", "example", "help", "login", "logout",
  "moderator", "privacy", "register", "requests", "root", "search", "settings", "signup", "support",
  "system", "terms", "wishdrop", "www",
]);

export function normalizeUsername(raw: unknown) {
  return String(raw ?? "").trim().replace(/^@+/, "").toLowerCase();
}

/** null when fine, otherwise an api.ts message key. */
export function usernameProblem(username: string): string | null {
  if (!USERNAME_RE.test(username)) return "usernameInvalid";
  if (RESERVED.has(username)) return "usernameTaken";
  return null;
}

/**
 * A free username for a new account, from their name or email:
 * "Bancila Alexandru" → "bancila.alexandru", taken → "bancila.alexandru27".
 */
export async function suggestUsername(name: string | null | undefined, email: string) {
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 20)
      .replace(/\.+$/, "");
  let base = clean(name || "") || clean(email.split("@")[0]);
  if (base.length < 3) base = `${base || "user"}.wish`.replace(/^\./, "");
  if (usernameProblem(base)) base = `${base.replace(/[^a-z0-9]/g, "").slice(0, 16) || "user"}.wish`;

  const taken = async (u: string) =>
    !!(await db().prepare("SELECT 1 FROM users WHERE username = ?").bind(u).first());
  if (!usernameProblem(base) && !(await taken(base))) return base;
  for (let i = 0; i < 20; i++) {
    const digits = i < 10 ? 2 : 4;
    const candidate = `${base.slice(0, 24 - digits)}${Math.floor(Math.random() * 10 ** digits)
      .toString()
      .padStart(digits, "0")}`;
    if (!usernameProblem(candidate) && !(await taken(candidate))) return candidate;
  }
  return `user${Date.now().toString(36)}`;
}

/** A profile by username (suspended accounts don't exist for anyone). */
export const getUserByUsername = (username: string) =>
  db().prepare("SELECT * FROM users WHERE username = ? AND suspended_at IS NULL").bind(normalizeUsername(username)).first<User>();

export const displayName = (u: Pick<User, "name" | "email" | "username">) =>
  u.name || (u.username ? `@${u.username}` : u.email.split("@")[0]);

export async function relation(viewer: User | null, owner: User): Promise<Relation> {
  if (!viewer) return "none";
  if (viewer.id === owner.id) return "self";
  const row = await db()
    .prepare("SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?")
    .bind(viewer.id, owner.id)
    .first<{ status: string }>();
  if (!row) return "none";
  return row.status === "accepted" ? "following" : "requested";
}

/** Can this viewer see the owner's profile content (lists, followers)? */
export function canSeeProfile(owner: User, rel: Relation) {
  return rel === "self" || rel === "following" || !owner.is_private;
}

/** The lists shown on the owner's profile for this viewer. */
export async function profileLists(owner: User, rel: Relation) {
  if (!canSeeProfile(owner, rel)) return [];
  const shown = rel === "self" || rel === "following" ? ["public", "followers"] : ["public"];
  const { results } = await db()
    .prepare(
      `SELECT w.*,
              (SELECT COUNT(*) FROM items i WHERE i.wishlist_id = w.id AND i.received_at IS NULL) AS item_count,
              (SELECT COUNT(*) FROM items i WHERE i.wishlist_id = w.id AND i.received_at IS NULL AND i.reserved_at IS NULL) AS available_count
         FROM wishlists w
        WHERE w.user_id = ? AND w.hidden_at IS NULL AND w.visibility IN (${shown.map(() => "?").join(",")})
        ORDER BY w.created_at DESC`,
    )
    .bind(owner.id, ...shown)
    .all<Wishlist & { visibility: Visibility; item_count: number; available_count: number }>();
  const covers = await db()
    .prepare(
      `SELECT wishlist_id, image_key FROM items
        WHERE image_key <> '' AND received_at IS NULL AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ?)
        ORDER BY priority DESC, created_at DESC`,
    )
    .bind(owner.id)
    .all<{ wishlist_id: string; image_key: string }>();
  return results.map((w) => ({
    ...w,
    covers: covers.results.filter((c) => c.wishlist_id === w.id).map((c) => c.image_key).slice(0, 4),
  }));
}

export async function followCounts(userId: string) {
  return (await db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND status = 'accepted') AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND status = 'accepted') AS following`,
    )
    .bind(userId)
    .first<{ followers: number; following: number }>()) ?? { followers: 0, following: 0 };
}

export const pendingCount = async (userId: string) =>
  (await db()
    .prepare("SELECT COUNT(*) AS n FROM follows WHERE followee_id = ? AND status = 'pending'")
    .bind(userId)
    .first<{ n: number }>())?.n ?? 0;

type PersonRow = Pick<User, "id" | "username" | "name" | "email" | "avatar_url" | "is_private"> & { created_at: number };
const PERSON = "u.id, u.username, u.name, u.email, u.avatar_url, u.is_private";

/** People who follow `userId` ('accepted') or asked to ('pending'), newest first. */
export async function followersOf(userId: string, status: "accepted" | "pending" = "accepted") {
  const { results } = await db()
    .prepare(
      `SELECT ${PERSON}, f.created_at FROM follows f JOIN users u ON u.id = f.follower_id
        WHERE f.followee_id = ? AND f.status = ? ORDER BY f.created_at DESC LIMIT 500`,
    )
    .bind(userId, status)
    .all<PersonRow>();
  return results;
}

export async function followingOf(userId: string) {
  const { results } = await db()
    .prepare(
      `SELECT ${PERSON}, f.created_at FROM follows f JOIN users u ON u.id = f.followee_id
        WHERE f.follower_id = ? AND f.status = 'accepted' ORDER BY f.created_at DESC LIMIT 500`,
    )
    .bind(userId)
    .all<PersonRow>();
  return results;
}

/** Only people who picked a username (and pass findableSql) can be found. Exact and prefix matches first. */
export async function searchUsers(q: string, viewerId: string | null = null) {
  const term = q.trim().replace(/^@+/, "").toLowerCase().slice(0, 50);
  if (term.length < 2) return [];
  const like = term.replace(/[%_\\]/g, (c) => "\\" + c);
  const { results } = await db()
    .prepare(
      `SELECT ${PERSON}, u.created_at,
              (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id AND f.status = 'accepted') AS followers
         FROM users u
        WHERE u.username IS NOT NULL AND ${findableSql("?3")}
          AND (u.username LIKE ?1 || '%' ESCAPE '\\' OR lower(u.name) LIKE '%' || ?1 || '%' ESCAPE '\\')
        ORDER BY (u.username = ?2) DESC, (u.username LIKE ?1 || '%' ESCAPE '\\') DESC, followers DESC
        LIMIT 30`,
    )
    .bind(like, term, viewerId ?? "")
    .all<PersonRow & { followers: number }>();
  return results;
}

/** Follow (public profile) or ask to follow (private profile). */
export async function follow(follower: User, followee: User) {
  const status = followee.is_private ? "pending" : "accepted";
  const res = await db()
    .prepare(
      `INSERT INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (follower_id, followee_id) DO NOTHING`,
    )
    .bind(follower.id, followee.id, status, now())
    .run();
  if (res.meta.changes) await notify(followee.id, follower.id, status === "accepted" ? "follow" : "follow_request");
  return (await relation(follower, followee)) as "following" | "requested";
}

/** Unfollow, withdraw a request, or remove a follower — and drop its notification. */
export async function unfollow(followerId: string, followeeId: string) {
  await db().prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?").bind(followerId, followeeId).run();
  await forgetFollow(followeeId, followerId);
}

/** Going public accepts everyone who was waiting; their requests now read as follows. */
export async function acceptAllPending(userId: string) {
  await db().batch([
    db().prepare("UPDATE follows SET status = 'accepted' WHERE followee_id = ? AND status = 'pending'").bind(userId),
    db().prepare("UPDATE notifications SET type = 'follow' WHERE user_id = ? AND type = 'follow_request'").bind(userId),
  ]);
}
