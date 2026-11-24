-- Profiles, following and list visibility.
--
-- Everyone starts private and without a username, so no existing account or
-- list shows up anywhere until its owner chooses to.

ALTER TABLE users ADD COLUMN username TEXT;          -- lowercase, unique; NULL = no public profile yet
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN is_private INTEGER NOT NULL DEFAULT 1;  -- 1: following needs approval
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Where a list appears. The list link always works, whatever this says.
--   'link'      only for people who have the link (how every list worked so far)
--   'followers' also on the owner's profile, for accepted followers
--   'public'    also on the owner's profile, for anyone who can see the profile
ALTER TABLE wishlists ADD COLUMN visibility TEXT NOT NULL DEFAULT 'link';

CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted',            -- 'pending' (request to a private profile) | 'accepted'
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX idx_follows_followee ON follows(followee_id, status);
