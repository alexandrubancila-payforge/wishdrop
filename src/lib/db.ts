/**
 * D1 access. The schema is in `migrations/` (recovered from the live database).
 * Times are Unix milliseconds. IDs are UUIDs.
 */
import { env } from "cloudflare:workers";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  google_id: string | null;
  name: string | null;
  avatar_url: string | null;
  email_verified: number;
  verify_token: string | null;
  verify_expires: number | null;
  reset_token: string | null;
  reset_expires: number | null;
  birthday: string | null;
  disable_seasons: number;
  /** Public address /@username; generated at sign-up, changeable in Settings. */
  username: string | null;
  bio: string | null;
  /** 1 = following needs approval. New accounts start public (0). */
  is_private: number;
  /** Set by the owner in /admin: can't sign in, hidden everywhere. */
  suspended_at: number | null;
  /** 1 = reminder emails about friends' birthdays and list events. */
  reminder_emails: number;
  /** Last language used on the site (for emails). */
  lang: string | null;
  /** 1 = gifts from my public lists may appear (anonymously) on /popular. */
  show_in_popular: number;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: number;
  hide_reservations: number;
  /** Where the list appears: 'public' | 'followers' | 'link' (see lib/social.ts). */
  visibility: "public" | "followers" | "link";
  /** Hidden by the owner in /admin: the list answers 404. */
  hidden_at: number | null;
  /** 'YYYY-MM-DD' of the event the list is for, or null. */
  event_date: string | null;
}

export interface Item {
  id: string;
  wishlist_id: string;
  image_key: string;
  /** Optional gift name, typed or scraped from the product page. */
  title: string | null;
  product_url: string | null;
  price: string | null;
  reserved_by: string | null;
  reserved_at: number | null;
  created_at: number;
  priority: number;
  reserve_token: string | null;
  reserver_user_id: string | null;
  /** Ticked by the owner as received: hidden from the public list. */
  received_at: number | null;
  /** NULL = normal gift; N = a group gift N people chip in for. */
  group_size: number | null;
  /** The gift this one was copied from ("Add to my list"), if any. */
  copied_from: string | null;
}

export const db = () => env.DB;
export const now = () => Date.now();
export const newId = () => crypto.randomUUID();

/* ---------- users ---------- */

export const getUserById = (id: string) =>
  db().prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();

export const getUserByEmail = (email: string) =>
  db().prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first<User>();

export const getUserByGoogleId = (googleId: string) =>
  db().prepare("SELECT * FROM users WHERE google_id = ?").bind(googleId).first<User>();

export async function createUser(u: {
  email: string;
  password_hash?: string;
  google_id?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  email_verified?: boolean;
  verify_token?: string | null;
  verify_expires?: number | null;
  username?: string | null;
}): Promise<User> {
  const id = newId();
  await db()
    .prepare(
      `INSERT INTO users (id, email, password_hash, created_at, google_id, name, avatar_url, email_verified, verify_token, verify_expires, username, is_private)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    )
    .bind(
      id,
      u.email.trim().toLowerCase(),
      u.password_hash ?? "",
      now(),
      u.google_id ?? null,
      u.name ?? null,
      u.avatar_url ?? null,
      u.email_verified ? 1 : 0,
      u.verify_token ?? null,
      u.verify_expires ?? null,
      u.username ?? null,
    )
    .run();
  return (await getUserById(id))!;
}

const USER_COLUMNS = new Set([
  "password_hash", "google_id", "name", "avatar_url", "email_verified", "verify_token",
  "verify_expires", "reset_token", "reset_expires", "birthday", "disable_seasons",
  "username", "bio", "is_private", "reminder_emails", "lang", "show_in_popular",
]);

export async function updateUser(id: string, fields: Partial<User>) {
  const keys = Object.keys(fields).filter((k) => USER_COLUMNS.has(k));
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (fields as Record<string, unknown>)[k] ?? null);
  await db().prepare(`UPDATE users SET ${set} WHERE id = ?`).bind(...values, id).run();
}

/* ---------- wishlists ---------- */

export const getWishlist = (id: string) =>
  db().prepare("SELECT * FROM wishlists WHERE id = ?").bind(id).first<Wishlist>();

export const getWishlistBySlug = (slug: string) =>
  db().prepare("SELECT * FROM wishlists WHERE slug = ?").bind(slug).first<Wishlist>();

/** A user's lists, newest first, with item counts and up to four cover images. */
/** One tile of a list's cover collage: a gift's photo, or its icon when it has none. */
export interface Cover {
  id: string;
  title: string | null;
  image_key: string;
}

export async function getUserWishlists(userId: string) {
  const { results } = await db()
    .prepare(
      `SELECT w.*,
              (SELECT COUNT(*) FROM items i WHERE i.wishlist_id = w.id AND i.received_at IS NULL) AS item_count,
              (SELECT COUNT(*) FROM items i WHERE i.wishlist_id = w.id AND i.received_at IS NULL AND i.reserved_at IS NOT NULL) AS reserved_count
         FROM wishlists w WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    )
    .bind(userId)
    .all<Wishlist & { item_count: number; reserved_count: number }>();
  const covers = await db()
    .prepare(
      // Photos first; gifts without one fill the collage with their icon (components/gifts/GiftArt.astro).
      `SELECT wishlist_id, id, title, image_key FROM items
        WHERE received_at IS NULL AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ?)
        ORDER BY image_key <> '' DESC, priority DESC, created_at DESC`,
    )
    .bind(userId)
    .all<Cover & { wishlist_id: string }>();
  return results.map((w) => ({
    ...w,
    covers: covers.results.filter((c) => c.wishlist_id === w.id).slice(0, 4).map(({ id, title, image_key }) => ({ id, title, image_key })),
  }));
}

/** "Birthday list" → "birthday-list-3v7uzd" (the live site's slug shape). */
export function makeSlug(name: string) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "wishlist";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  return `${base}-${rand}`;
}

export async function createWishlist(userId: string, name: string): Promise<Wishlist> {
  const id = newId();
  await db()
    .prepare("INSERT INTO wishlists (id, user_id, name, slug, created_at, visibility) VALUES (?, ?, ?, ?, ?, 'public')")
    .bind(id, userId, name, makeSlug(name), now())
    .run();
  return (await getWishlist(id))!;
}

/* ---------- items ---------- */

export const getItem = (id: string) =>
  db().prepare("SELECT * FROM items WHERE id = ?").bind(id).first<Item>();

/** Most wanted first, then newest. */
export async function getItems(wishlistId: string) {
  const { results } = await db()
    .prepare("SELECT * FROM items WHERE wishlist_id = ? ORDER BY priority DESC, created_at DESC")
    .bind(wishlistId)
    .all<Item>();
  return results;
}

/** The item together with the list it belongs to (for ownership checks). */
export const getItemWithList = (id: string) =>
  db()
    .prepare(
      `SELECT i.*, w.user_id AS owner_id, w.slug AS wishlist_slug
         FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE i.id = ?`,
    )
    .bind(id)
    .first<Item & { owner_id: string; wishlist_slug: string }>();

/** Gifts the user reserved on other people's lists, and group gifts they joined (`group_count` set). */
export async function getReservationsOf(userId: string) {
  const cols = `i.*, w.name AS wishlist_name, w.slug AS wishlist_slug,
                u.name AS owner_name, u.email AS owner_email, u.avatar_url AS owner_avatar`;
  const { results } = await db()
    .prepare(
      `SELECT ${cols}, NULL AS group_count, i.reserved_at AS since
         FROM items i
         JOIN wishlists w ON w.id = i.wishlist_id
         JOIN users u ON u.id = w.user_id
        WHERE i.reserver_user_id = ?1
       UNION ALL
       SELECT ${cols}, (SELECT COUNT(*) FROM item_contributors c2 WHERE c2.item_id = i.id) AS group_count, c.created_at AS since
         FROM item_contributors c
         JOIN items i ON i.id = c.item_id
         JOIN wishlists w ON w.id = i.wishlist_id
         JOIN users u ON u.id = w.user_id
        WHERE c.user_id = ?1
        ORDER BY since DESC`,
    )
    .bind(userId)
    .all<
      Item & {
        wishlist_name: string;
        wishlist_slug: string;
        owner_name: string | null;
        owner_email: string;
        owner_avatar: string | null;
        group_count: number | null;
      }
    >();
  return results;
}
