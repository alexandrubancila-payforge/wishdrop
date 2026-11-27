/**
 * Layout check on a phone (375 px) and a computer (1280 px): opens the main
 * pages as a guest and as a signed-in user, and fails when a page
 * - scrolls sideways (something sticks out of the screen; names the culprits),
 * - throws a JavaScript error, or answers with a server error,
 * - or opens a menu or panel that doesn't fit on the screen.
 * Full-page screenshots go to tests/visual/out/ to look at by eye.
 *
 *   node tests/visual/layout.mjs http://localhost:4400
 *
 * Uses the Chrome installed on the machine (playwright-core, no browser download).
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const B = (process.argv[2] || "http://localhost:4400").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "out");
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: "phone", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  { name: "desktop", viewport: { width: 1280, height: 800 } },
];
const failures = [];
let checked = 0;
const fail = (where, what) => failures.push(`${where}: ${what}`);

const browser = await chromium.launch({ channel: "chrome", headless: true });

/** A signed-in user with a list that has the awkward cases: a long price, a gift with only a name, a link. */
async function makeUser(ctx) {
  const stamp = Date.now().toString(36);
  const headers = { origin: B, "content-type": "application/json" };
  const post = (path, data, method = "POST") => ctx.request.fetch(B + path, { method, headers, data });
  const reg = await post("/api/auth/register", { email: `layout-${stamp}@example.test`, password: `pw-${stamp}-layout` });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()}`);
  const username = `layout${stamp}`;
  await post("/api/account/profile", { username, name: "Layout Test" }, "PATCH");
  const list = await (await post("/api/wishlists", { name: "O listă cu un nume destul de lung ca să încerce rândul" })).json();
  await post(`/api/wishlists/${list.id}/items`, { title: "Parfum", price: "Un preț scris foarte foarte lung, cu-cuvinte-lipite-fara-spatii-si-detalii-multe" });
  await post(`/api/wishlists/${list.id}/items`, { title: "Carte de citit" });
  await post(`/api/wishlists/${list.id}/items`, { product_url: "https://example.com/produs-cu-un-link-lung/si-mai-lung", title: "Căști" });
  const slug = (await (await ctx.request.get(`${B}/ro/dashboard/${list.id}`)).text()).match(/\/w\/([a-z0-9-]+)/)?.[1];
  return { username, listId: list.id, slug };
}

async function check(page, label, path, extra) {
  const errors = [];
  const onError = (e) => errors.push(e.message);
  page.on("pageerror", onError);
  const res = await page.goto(B + path, { waitUntil: "networkidle" });
  checked++;
  if (!res || res.status() >= 500) fail(label, `HTTP ${res?.status()}`);
  // Sideways scroll: name the elements that stick out.
  const over = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= vw + 1) return null;
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== "fixed") {
        out.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].slice(0, 3).join(".")} (right ${Math.round(r.right)})`);
      }
    }
    return `page is ${document.documentElement.scrollWidth}px wide on a ${vw}px screen: ${out.slice(-3).join(", ")}`;
  });
  if (over) fail(label, over);
  if (extra) await extra(page, label);
  for (const e of errors) fail(label, `JavaScript error: ${e}`);
  page.off("pageerror", onError);
  await page.screenshot({ path: join(OUT, `${label.replace(/[^a-z0-9]+/gi, "-")}.png`), fullPage: true });
}

/** Opens something by clicking `button`, then checks `panel` is on screen. */
async function opensOnScreen(page, label, button, panel, what) {
  const b = page.locator(button).first();
  if (!(await b.count()) || !(await b.isVisible())) return;
  await b.click();
  await page.waitForTimeout(250);
  const box = await page.locator(panel).first().boundingBox();
  const vw = page.viewportSize().width;
  if (!box) fail(label, `${what} didn't open`);
  else if (box.x < 0 || box.x + box.width > vw + 1) fail(label, `${what} leaves the screen (${Math.round(box.x)}–${Math.round(box.x + box.width)} of ${vw}px)`);
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);
}

for (const size of SIZES) {
  const guest = await browser.newContext({ ...size, locale: "ro-RO" });
  const gp = await guest.newPage();
  const userCtx = await browser.newContext({ ...size, locale: "ro-RO" });
  const me = await makeUser(userCtx);
  const up = await userCtx.newPage();

  for (const [name, path] of [
    ["home", "/ro"],
    ["home-en", "/"],
    ["example", "/ro/example"],
    ["ideas", "/ro/idei"],
    ["popular", "/ro/popular"],
    ["login", "/ro/login"],
    ["register", "/ro/register"],
    ["public-list", `/ro/w/${me.slug}`],
  ]) {
    await check(gp, `${size.name} guest ${name}`, path, name === "popular" ? (p, l) => opensOnScreen(p, l, "#popular-about summary", "#popular-about > div", "the info popover") : undefined);
  }

  for (const [name, path, extra] of [
    ["feed", "/ro"],
    ["my-lists", "/ro/dashboard"],
    [
      "list-editor",
      `/ro/dashboard/${me.listId}`,
      async (p, l) => {
        await opensOnScreen(p, l, "#list-menu-btn", "#list-menu", "the list ⋯ menu");
        await opensOnScreen(p, l, "[data-menu-btn]", "[data-item-menu]:not([hidden])", "a gift's ⋯ menu");
      },
    ],
    ["reservations", "/ro/dashboard/reservations"],
    ["settings", "/ro/settings"],
    ["santa", "/ro/santa"],
    ["find-friends", "/ro/search"],
    ["profile", `/ro/@${me.username}`],
    ["public-list-owner", `/ro/w/${me.slug}`],
    ["popular-signed-in", "/ro/popular"],
  ]) {
    await check(up, `${size.name} user ${name}`, path, extra);
  }
  // The account menu in the header.
  await up.goto(`${B}/ro`);
  await opensOnScreen(up, `${size.name} user header`, "#user-menu-btn", "#user-menu-panel", "the account menu");

  await guest.close();
  await userCtx.close();
}
await browser.close();

console.log(`${checked} pages checked on phone and desktop, screenshots in tests/visual/out/`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("No layout problems.");
