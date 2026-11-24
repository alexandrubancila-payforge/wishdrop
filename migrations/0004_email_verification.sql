ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN verify_token TEXT;
ALTER TABLE users ADD COLUMN verify_expires INTEGER;
CREATE INDEX idx_users_verify_token ON users(verify_token);
