/**
 * Group gifts (items.group_size + item_contributors) and reactions
 * (item_reactions). See migration 0014.
 */
import { db, now, type Item } from "./db";

export type ReactionKind = "heart" | "want";
export const isReactionKind = (k: unknown): k is ReactionKind => k === "heart" || k === "want";

export interface Contributor {
  id: string;
  item_id: string;
  name: string | null;
  user_id: string | null;
  token: string;
  created_at: number;
}

export const contributorCount = async (itemId: string) =>
  (await db().prepare("SELECT COUNT(*) AS n FROM item_contributors WHERE item_id = ?").bind(itemId).first<{ n: number }>())?.n ?? 0;

/** A group gift counts as reserved once every spot is taken (and stops being reserved when someone leaves). */
export const syncGroupReserved = (itemId: string) =>
  db()
    .prepare(
      `UPDATE items SET reserved_at = CASE
          WHEN (SELECT COUNT(*) FROM item_contributors c WHERE c.item_id = items.id) >= group_size THEN COALESCE(reserved_at, ?)
          ELSE NULL END
        WHERE id = ? AND group_size IS NOT NULL`,
    )
    .bind(now(), itemId)
    .run();

/**
 * Whether the owner may change a gift's group size. Returns an api.ts error
 * key, or null when the change is fine.
 */
export async function groupChangeError(item: Item, size: number | null): Promise<string | null> {
  if (size === item.group_size) return null;
  const count = await contributorCount(item.id);
  // A normal reservation (someone reserved it alone) blocks making it a group gift.
  if (size !== null && item.group_size === null && item.reserved_at) return "groupReserved";
  if (size === null && count > 0) return "groupHasPeople";
  if (size !== null && count > size) return "groupTooSmall";
  return null;
}

/** Contributors per gift for a list, in join order. */
export async function contributorsFor(wishlistId: string) {
  const { results } = await db()
    .prepare(
      `SELECT c.* FROM item_contributors c JOIN items i ON i.id = c.item_id
        WHERE i.wishlist_id = ? ORDER BY c.created_at`,
    )
    .bind(wishlistId)
    .all<Contributor>();
  const map = new Map<string, Contributor[]>();
  for (const c of results) map.set(c.item_id, [...(map.get(c.item_id) ?? []), c]);
  return map;
}

export interface ReactionSummary {
  heart: number;
  want: number;
  /** What the viewer has pressed. */
  mine: ReactionKind[];
}

/** Reaction counts (and the viewer's own) for the given gifts. */
export async function reactionsFor(itemIds: string[], viewerId: string | null) {
  const map = new Map<string, ReactionSummary>();
  for (const id of itemIds) map.set(id, { heart: 0, want: 0, mine: [] });
  for (let i = 0; i < itemIds.length; i += 50) {
    const chunk = itemIds.slice(i, i + 50);
    const { results } = await db()
      .prepare(
        `SELECT item_id, kind, COUNT(*) AS n, MAX(user_id = ?) AS mine
           FROM item_reactions WHERE item_id IN (${chunk.map(() => "?").join(",")})
          GROUP BY item_id, kind`,
      )
      .bind(viewerId ?? "", ...chunk)
      .all<{ item_id: string; kind: ReactionKind; n: number; mine: number }>();
    for (const r of results) {
      const s = map.get(r.item_id)!;
      if (r.kind === "heart" || r.kind === "want") s[r.kind] = r.n;
      if (r.mine) s.mine.push(r.kind);
    }
  }
  return map;
}
