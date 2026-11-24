ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_expires INTEGER;
CREATE INDEX idx_users_reset_token ON users(reset_token);
