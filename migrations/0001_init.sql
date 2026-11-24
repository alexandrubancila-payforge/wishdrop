-- Recovered from the live wishdrop-db schema (the original migration files were lost).
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE wishlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  wishlist_id TEXT NOT NULL,
  image_key TEXT NOT NULL,
  product_url TEXT,
  price TEXT,
  reserved_by TEXT,
  reserved_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE
);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_slug ON wishlists(slug);
CREATE INDEX idx_items_wishlist_id ON items(wishlist_id);
