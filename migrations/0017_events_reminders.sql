-- Event date on a list (shown with a countdown) and reminder emails.

-- 'YYYY-MM-DD' (the day of the party / wedding / Christmas). NULL = none.
ALTER TABLE wishlists ADD COLUMN event_date TEXT;

-- Reminder emails about friends' birthdays and list events (1 = on).
ALTER TABLE users ADD COLUMN reminder_emails INTEGER NOT NULL DEFAULT 1;
-- Last language the person used on the site, for emails ('ro' | 'en' | 'de' | 'ru').
ALTER TABLE users ADD COLUMN lang TEXT;

-- Which reminders went out, so each is sent once
-- (key: 'bday:<user id>:<yyyy>' or 'event:<list id>:<date>').
CREATE TABLE reminders_sent (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);
