#!/usr/bin/env node
/**
 * One-off: give every account without a username one generated from its name
 * or email (same rule as src/lib/social.ts → suggestUsername). Profiles stay
 * private; people can change the name in Settings.
 *
 *   node scripts/backfill-usernames.mjs --local     # local D1
 *   node scripts/backfill-usernames.mjs --remote    # production
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const DB = "wishdrop-db";

function d1(args) {
  return execFileSync("npx", ["wrangler", "d1", "execute", DB, target, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}
const query = (sql) => JSON.parse(d1(["--json", "--command", sql]))[0].results;

const USERNAME_RE = /^(?![.])(?!.*[.]{2})[a-z0-9._]{3,24}(?<![.])$/;
const RESERVED = new Set(["admin", "administrator", "api", "app", "contact", "dashboard", "example", "help", "login", "logout", "moderator", "privacy", "register", "requests", "root", "search", "settings", "signup", "support", "system", "terms", "wishdrop", "www"]);
const ok = (u) => USERNAME_RE.test(u) && !RESERVED.has(u);
const clean = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 20).replace(/\.+$/, "");

const taken = new Set(query("SELECT username FROM users WHERE username IS NOT NULL").map((r) => r.username));
const users = query("SELECT id, name, email FROM users WHERE username IS NULL ORDER BY created_at");

const updates = [];
for (const u of users) {
  let base = clean(u.name || "") || clean(u.email.split("@")[0]);
  if (base.length < 3) base = `${base || "user"}.wish`.replace(/^\./, "");
  if (!ok(base)) base = `${base.replace(/[^a-z0-9]/g, "").slice(0, 16) || "user"}.wish`;
  let name = ok(base) && !taken.has(base) ? base : null;
  for (let i = 0; !name && i < 50; i++) {
    const digits = i < 20 ? 2 : 4;
    const c = `${base.slice(0, 24 - digits)}${String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, "0")}`;
    if (ok(c) && !taken.has(c)) name = c;
  }
  if (!name) throw new Error(`no username for ${u.id}`);
  taken.add(name);
  updates.push({ id: u.id, username: name });
}

if (!updates.length) {
  console.log("Every account already has a username.");
  process.exit(0);
}
const sql = updates.map((u) => `UPDATE users SET username = '${u.username}' WHERE id = '${u.id}' AND username IS NULL;`).join("\n");
const file = join(mkdtempSync(join(tmpdir(), "wd-")), "backfill.sql");
writeFileSync(file, sql + "\n");
d1(["--file", file]);
console.log(`${target}: ${updates.length} usernames set:\n` + updates.map((u) => `  @${u.username}`).join("\n"));
