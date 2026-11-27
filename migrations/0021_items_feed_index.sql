-- The feed reads each followed list's gifts from the last 30 days, newest first
-- (lib/feed.ts): this index answers that without scanning a list's older gifts.
CREATE INDEX IF NOT EXISTS idx_items_wishlist_created ON items(wishlist_id, created_at);
