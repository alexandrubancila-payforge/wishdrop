/**
 * The owner's /admin page: whoever signs in with OWNER_EMAIL (the secret that
 * also receives the contact form) sees the site's numbers.
 */
import { env } from "cloudflare:workers";
import { db, now } from "./db";

export const isAdmin = (user: { email: string } | null | undefined) =>
  !!user && !!env.OWNER_EMAIL && user.email.trim().toLowerCase() === env.OWNER_EMAIL.trim().toLowerCase();

const DAY = 86_400_000;

export async function siteStats(weeks = 12) {
  const t = now();
  const d7 = t - 7 * DAY;
  const d30 = t - 30 * DAY;
  const totals = await db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM users) AS users,
              (SELECT COUNT(*) FROM users WHERE created_at >= ?1) AS users7,
              (SELECT COUNT(*) FROM users WHERE created_at >= ?2) AS users30,
              (SELECT COUNT(*) FROM wishlists) AS lists,
              (SELECT COUNT(*) FROM wishlists WHERE created_at >= ?1) AS lists7,
              (SELECT COUNT(*) FROM wishlists WHERE created_at >= ?2) AS lists30,
              (SELECT COUNT(*) FROM items) AS gifts,
              (SELECT COUNT(*) FROM items WHERE created_at >= ?1) AS gifts7,
              (SELECT COUNT(*) FROM items WHERE created_at >= ?2) AS gifts30,
              (SELECT COUNT(*) FROM items WHERE reserved_at IS NOT NULL) AS reserved,
              (SELECT COUNT(*) FROM items WHERE reserved_at >= ?1) AS reserved7,
              (SELECT COUNT(*) FROM items WHERE reserved_at >= ?2) AS reserved30,
              (SELECT COUNT(*) FROM items WHERE received_at IS NOT NULL) AS received,
              (SELECT COUNT(*) FROM items WHERE group_size IS NOT NULL) AS groupGifts,
              (SELECT COUNT(*) FROM item_contributors) AS joins,
              (SELECT COUNT(*) FROM item_reactions) AS reactions,
              (SELECT COUNT(*) FROM follows WHERE status = 'accepted') AS follows,
              (SELECT COUNT(*) FROM follows WHERE created_at >= ?1 AND status = 'accepted') AS follows7,
              (SELECT COUNT(DISTINCT user_id) FROM push_subscriptions) AS pushUsers,
              (SELECT COUNT(*) FROM users WHERE google_id IS NOT NULL) AS googleUsers,
              (SELECT COUNT(DISTINCT user_id) FROM wishlists) AS usersWithLists`,
    )
    .bind(d7, d30)
    .first<Record<string, number>>();

  // Sign-ups, lists, gifts and reservations per week (Monday-based, UTC), oldest first.
  const today = new Date(t);
  const monday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - ((today.getUTCDay() + 6) % 7) * DAY;
  const start = monday - (weeks - 1) * 7 * DAY;
  const bucket = (col: string, table: string) =>
    db()
      .prepare(`SELECT CAST((${col} - ?1) / ?2 AS INTEGER) AS w, COUNT(*) AS n FROM ${table} WHERE ${col} >= ?1 GROUP BY w`)
      .bind(start, 7 * DAY)
      .all<{ w: number; n: number }>();
  const [u, l, g, r] = await Promise.all([
    bucket("created_at", "users"),
    bucket("created_at", "wishlists"),
    bucket("created_at", "items"),
    bucket("reserved_at", "items"),
  ]);
  const series = (rows: { w: number; n: number }[]) => {
    const out = new Array(weeks).fill(0);
    for (const row of rows) if (row.w >= 0 && row.w < weeks) out[row.w] = row.n;
    return out as number[];
  };
  const weekly = Array.from({ length: weeks }, (_, i) => ({
    start: new Date(start + i * 7 * DAY),
    users: series(u.results)[i],
    lists: series(l.results)[i],
    gifts: series(g.results)[i],
    reserved: series(r.results)[i],
  }));

  const recent = await db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.username, u.avatar_url, u.created_at, u.google_id IS NOT NULL AS google,
              (SELECT COUNT(*) FROM wishlists w WHERE w.user_id = u.id) AS lists,
              (SELECT COUNT(*) FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE w.user_id = u.id) AS gifts
         FROM users u ORDER BY u.created_at DESC LIMIT 15`,
    )
    .all<{ id: string; email: string; name: string | null; username: string | null; avatar_url: string | null; created_at: number; google: number; lists: number; gifts: number }>();

  const topLists = await db()
    .prepare(
      `SELECT w.name, w.slug, w.visibility, u.name AS owner_name, u.username AS owner_username, u.email AS owner_email,
              COUNT(i.id) AS gifts, SUM(i.reserved_at IS NOT NULL) AS reserved
         FROM wishlists w JOIN users u ON u.id = w.user_id LEFT JOIN items i ON i.wishlist_id = w.id
        GROUP BY w.id ORDER BY gifts DESC LIMIT 8`,
    )
    .all<{ name: string; slug: string; visibility: string; owner_name: string | null; owner_username: string | null; owner_email: string; gifts: number; reserved: number }>();

  return { totals: totals ?? {}, weekly, recent: recent.results, topLists: topLists.results };
}

export interface ReportRow {
  id: string;
  kind: "bug" | "user" | "list" | "photo";
  target_id: string | null;
  reason: string | null;
  message: string | null;
  email: string | null;
  page_url: string | null;
  user_agent: string | null;
  image_key: string | null;
  status: "open" | "done";
  created_at: number;
  reporter_name: string | null;
  reporter_username: string | null;
  target_username: string | null;
  target_name: string | null;
  target_suspended: number | null;
  list_name: string | null;
  list_slug: string | null;
  list_hidden: number | null;
  /** How many reports this target has in total. */
  same_target: number;
}

/** Open reports first (oldest first, so nothing waits forever), then the last 20 handled. */
export async function adminReports() {
  const query = (where: string, order: string, limit: number) =>
    db()
      .prepare(
        `SELECT r.*, ru.name AS reporter_name, ru.username AS reporter_username,
                tu.username AS target_username, tu.name AS target_name, tu.suspended_at AS target_suspended,
                tl.name AS list_name, tl.slug AS list_slug, tl.hidden_at AS list_hidden,
                (SELECT COUNT(*) FROM reports r2 WHERE r2.target_id = r.target_id AND r2.kind = r.kind) AS same_target
           FROM reports r
           LEFT JOIN users ru ON ru.id = r.reporter_id
           LEFT JOIN users tu ON r.kind IN ('user', 'photo') AND tu.id = r.target_id
           LEFT JOIN wishlists tl ON r.kind = 'list' AND tl.id = r.target_id
          WHERE ${where} ORDER BY ${order} LIMIT ${limit}`,
      )
      .all<ReportRow>();
  const [open, done] = await Promise.all([
    query("r.status = 'open'", "r.created_at ASC", 200),
    query("r.status = 'done'", "r.created_at DESC", 20),
  ]);
  return { open: open.results, done: done.results };
}
