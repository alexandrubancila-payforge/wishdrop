-- Secret Santa: a group draws names; everyone gives a gift to one person.

CREATE TABLE santa_groups (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                                   -- invite link: /santa/join/<code>
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget TEXT,                                                 -- free text: "100 lei", "20 €"
  exchange_date TEXT,                                          -- 'YYYY-MM-DD'
  drawn_at INTEGER,                                            -- NULL until the draw
  created_at INTEGER NOT NULL
);

CREATE TABLE santa_members (
  group_id TEXT NOT NULL REFERENCES santa_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wishlist_id TEXT REFERENCES wishlists(id) ON DELETE SET NULL, -- the list their Santa sees
  giftee_id TEXT REFERENCES users(id) ON DELETE SET NULL,       -- who they give to (after the draw)
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_santa_members_user ON santa_members(user_id);

-- Santa notifications point at a group.
ALTER TABLE notifications ADD COLUMN santa_group_id TEXT REFERENCES santa_groups(id) ON DELETE CASCADE;
