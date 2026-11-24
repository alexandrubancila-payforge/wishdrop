-- Gift features: received gifts, reactions, group gifts, list/gift
-- notifications and phone (Web Push) notifications.
--
-- items.priority (0007) already exists; it now has three levels:
--    1 = "I really want this"   0 = "would be nice" (default)   -1 = "just an idea"

-- The owner ticks a gift as received; it leaves the public list.
ALTER TABLE items ADD COLUMN received_at INTEGER;

-- Group gift: NULL = a normal gift; N = N people chip in together. The gift
-- counts as reserved (items.reserved_at) once N people have joined.
ALTER TABLE items ADD COLUMN group_size INTEGER;

CREATE TABLE item_contributors (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  name TEXT,                                                   -- NULL = anonymous
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,        -- signed-in contributor
  token TEXT NOT NULL,                                         -- lets a guest leave from the same device
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_item_contributors_item ON item_contributors(item_id);
CREATE INDEX idx_item_contributors_user ON item_contributors(user_id);

-- Reactions on a gift: 'heart' (like) or 'want' ("I want this too").
CREATE TABLE item_reactions (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, user_id, kind)
);
CREATE INDEX idx_item_reactions_user ON item_reactions(user_id);

-- Notifications about a list or a gift (new_list, new_item, reaction_heart,
-- reaction_want). `count` folds several new gifts into one row.
ALTER TABLE notifications ADD COLUMN wishlist_id TEXT REFERENCES wishlists(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN item_id TEXT REFERENCES items(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN count INTEGER NOT NULL DEFAULT 1;
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_actor_list ON notifications(actor_id, wishlist_id);

-- Phone/desktop notifications (Web Push). One row per browser.
CREATE TABLE push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'ro',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
