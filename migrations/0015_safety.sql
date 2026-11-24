-- Safety: problem reports, reports about people/lists, blocking, and the
-- owner's moderation switches.

-- "Report a problem" (kind 'bug') and "Report" on a profile or list
-- (kind 'user' / 'list', target_id = users.id / wishlists.id).
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  target_id TEXT,
  reason TEXT,                                               -- spam | inappropriate | fake | other
  message TEXT,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,                                                -- where to answer (guests)
  page_url TEXT,
  user_agent TEXT,
  image_key TEXT,                                            -- optional screenshot (R2 reports/…)
  status TEXT NOT NULL DEFAULT 'open',                       -- open | done
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);

-- A blocked person can't follow, react to or see the blocker's profile.
CREATE TABLE blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- Moderation by the owner (/admin): a suspended account can't sign in and
-- disappears everywhere; a hidden list answers 404.
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE wishlists ADD COLUMN hidden_at INTEGER;
