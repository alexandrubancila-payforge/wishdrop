-- Exact counters for the strict request limits (login, sign-up, emails) in
-- lib/limits.ts. One row per key and minute; the daily cron deletes old rows.
CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  window INTEGER NOT NULL,   -- minute number (Unix ms / 60000)
  count INTEGER NOT NULL,
  PRIMARY KEY (key, window)
);
