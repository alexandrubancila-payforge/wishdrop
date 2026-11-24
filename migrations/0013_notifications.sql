-- In-app notifications (the bell in the header), Instagram-style.
--   follow           actor started following user
--   follow_request   actor asked to follow user (private profile)
--   follow_accepted  actor (a private profile) accepted user's request
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- who sees it
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- who did it
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at);
