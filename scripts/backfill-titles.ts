/**
 * One-off: gives gifts that have a product link but no name the name from
 * their shop page (same parsing as the auto-fill, lib/product-page.ts).
 * Only fills empty names; never overwrites one.
 *
 *   npx tsx scripts/backfill-titles.ts            # dry run: prints what it would set
 *   npx tsx scripts/backfill-titles.ts --apply    # writes to the live database
 *   npx tsx scripts/backfill-titles.ts --local    # the local database instead
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchText, parseProduct } from "../src/lib/product-page.ts";

const apply = process.argv.includes("--apply");
const where = process.argv.includes("--local") ? "--local" : "--remote";
const d1 = (...args: string[]) =>
  execFileSync("npx", ["wrangler", "d1", "execute", "wishdrop-db", where, ...args], { encoding: "utf8", env: { ...process.env, CI: "true" }, stdio: ["ignore", "pipe", "pipe"] });

const rows: { id: string; product_url: string }[] = JSON.parse(
  d1("--json", "--command", "SELECT id, product_url FROM items WHERE (title IS NULL OR title = '') AND product_url IS NOT NULL AND product_url <> ''"),
)[0].results;
console.log(`${rows.length} gifts without a name`);

const found: { id: string; title: string }[] = [];
let i = 0;
async function worker() {
  while (i < rows.length) {
    const r = rows[i++];
    let host = "";
    try {
      host = new URL(r.product_url).hostname;
    } catch {
      continue;
    }
    if (/(^|\.)amazon\./i.test(host)) continue;
    // Adult shops: their names don't go anywhere they could be shown to others.
    if (/sex|xshop|adult|erotic/i.test(host)) continue;
    const html = await fetchText(r.product_url);
    const title = html ? parseProduct(html, host).title : null;
    if (title) found.push({ id: r.id, title });
    console.log(`${title ? "✓" : "·"} ${host} ${title ?? ""}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`\nnames found: ${found.length} of ${rows.length}`);

if (apply && found.length) {
  const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
  const sql = found.map((f) => `UPDATE items SET title = ${q(f.title)} WHERE id = ${q(f.id)} AND (title IS NULL OR title = '');`).join("\n");
  const file = join(mkdtempSync(join(tmpdir(), "wd-titles-")), "titles.sql");
  writeFileSync(file, sql);
  console.log(d1("--file", file).split("\n").slice(-6).join("\n"));
}
