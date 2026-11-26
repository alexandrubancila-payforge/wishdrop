/**
 * The "Popular gifts" page (/popular): gifts from public lists of public
 * profiles whose owners didn't opt out (users.show_in_popular), shown
 * without their owner and without reservation state.
 *
 * Gifts with the same product link (ignoring ?tracking and #parts) are one
 * card. Score: ❤ + 2 × "I want it too" + 3 × copies + 3 × extra people who
 * have the same product.
 */
import { db } from "./db";

export interface PopularGift {
  /** The gift shown (the one with the most reactions in its group). */
  id: string;
  image_key: string;
  title: string | null;
  product_url: string | null;
  price: string | null;
  owner_id: string;
  created_at: number;
  heart: number;
  want: number;
  copies: number;
  /** How many people have this product in a list. */
  people: number;
  score: number;
}

/** "https://www.emag.ro/x/?ref=a#b" → "emag.ro/x" (same product, whatever the tracking). */
export function productKey(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return null;
  }
}

/** The newest eligible gifts with their counts (capped, newest first). */
async function candidates(limit = 2000) {
  const { results } = await db()
    .prepare(
      `SELECT i.id, i.image_key, i.title, i.product_url, i.price, i.created_at, i.copied_from, w.user_id AS owner_id,
              (SELECT COUNT(*) FROM item_reactions r WHERE r.item_id = i.id AND r.kind = 'heart') AS heart,
              (SELECT COUNT(*) FROM item_reactions r WHERE r.item_id = i.id AND r.kind = 'want') AS want,
              (SELECT COUNT(*) FROM items c WHERE c.copied_from = i.id) AS copies
         FROM items i
         JOIN wishlists w ON w.id = i.wishlist_id AND w.visibility = 'public' AND w.hidden_at IS NULL
         JOIN users u ON u.id = w.user_id AND u.suspended_at IS NULL AND u.is_private = 0 AND u.show_in_popular = 1
        WHERE i.received_at IS NULL AND i.image_key <> ''
        ORDER BY i.created_at DESC
        LIMIT ?`,
    )
    .bind(limit)
    .all<Omit<PopularGift, "people" | "score"> & { copied_from: string | null }>();
  return results;
}

export async function popularGifts(limit = 24) {
  const rows = await candidates();
  // Group the same product (or a gift with its copies) into one card.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = productKey(r.product_url) ?? `item:${r.copied_from ?? r.id}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const cards: PopularGift[] = [];
  for (const g of groups.values()) {
    const heart = g.reduce((n, r) => n + r.heart, 0);
    const want = g.reduce((n, r) => n + r.want, 0);
    const copies = g.reduce((n, r) => n + r.copies, 0);
    const people = new Set(g.map((r) => r.owner_id)).size;
    const best = [...g].sort((a, b) => b.heart + b.want - (a.heart + a.want) || b.created_at - a.created_at)[0];
    const { copied_from: _, ...shown } = best;
    cards.push({ ...shown, heart, want, copies, people, score: heart + 2 * want + 3 * copies + 3 * (people - 1) });
  }
  const popular = cards.filter((c) => c.score > 0).sort((a, b) => b.score - a.score || b.created_at - a.created_at).slice(0, limit);
  const shown = new Set(popular.map((c) => c.id));
  const recent = cards
    .filter((c) => !shown.has(c.id))
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
  return { popular, recent };
}
