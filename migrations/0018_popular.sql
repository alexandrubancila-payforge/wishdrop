-- The "Popular gifts" page (/popular).

-- A gift copied with "Add to my list" remembers where it came from, so the
-- original can count how often it was copied.
ALTER TABLE items ADD COLUMN copied_from TEXT REFERENCES items(id) ON DELETE SET NULL;
CREATE INDEX idx_items_copied_from ON items(copied_from);

-- 1 = my gifts from public lists may appear (anonymously) on /popular.
ALTER TABLE users ADD COLUMN show_in_popular INTEGER NOT NULL DEFAULT 1;
