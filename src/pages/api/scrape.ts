/**
 * Auto-fill from a product link: fetch the page, find the product photo, name and
 * price (Open Graph, JSON-LD, microdata), copy the photo into R2.
 *
 * Responses: { image_key, image_url, price, title } — image_key/title null when not found;
 * 400 { error: "amazon_blocked" } for Amazon; 422 { error: "blocked" } when the
 * site refuses or the page can't be read.
 */
import type { APIRoute } from "astro";
import { fail, json, readJson, requireUser } from "@/lib/http";
import { imageUrl, isImageType, putImage } from "@/lib/storage";
import { checkImage, flagPhoto, MAX_CHECK_BYTES } from "@/lib/moderation";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 8 * 1024 * 1024;

export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const { url } = await readJson<{ url?: string }>(ctx.request);

  let page: URL;
  try {
    page = new URL(String(url ?? ""));
    if (!/^https?:$/.test(page.protocol)) throw new Error();
  } catch {
    return fail("blocked", 422);
  }
  if (/(^|\.)amazon\.[a-z.]+$/i.test(page.hostname)) return fail("amazon_blocked", 400);

  const html = await fetchText(page.href);
  if (!html) return fail("blocked", 422);

  const meta = parseProduct(html, page.hostname);
  let image_key: string | null = null;
  if (meta.image) {
    try {
      image_key = await copyImage(new URL(meta.image, page).href, page.href, user.id, ctx.url.origin);
    } catch {}
  }
  return json({ image_key, image_url: image_key ? imageUrl(image_key) : null, price: meta.price, title: meta.title });
};

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "ro,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const text = await res.text();
    return text.slice(0, MAX_HTML);
  } catch {
    return null;
  }
}

/** The page's product photo, stored as our own copy after the automatic check (a refused photo leaves the gift without one). */
async function copyImage(src: string, referer: string, userId: string, origin: string) {
  const res = await fetch(src, {
    headers: { "user-agent": UA, accept: "image/*", referer },
    signal: AbortSignal.timeout(8000),
  });
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!res.ok || !isImageType(type)) throw new Error("not an image");
  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_IMAGE || body.byteLength < 500) throw new Error("bad size");
  const { verdict } = body.byteLength <= MAX_CHECK_BYTES ? await checkImage(body) : { verdict: "review" as const };
  if (verdict === "block") throw new Error("refused by the photo check");
  const key = await putImage(body, type);
  if (verdict === "review") await flagPhoto(userId, key, origin);
  return key;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function metaContent(html: string, names: string[]) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${name.replace(/[:.]/g, "\\$&")}["'][^>]*>`,
      "i",
    );
    const tag = html.match(re)?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return decode(content);
  }
  return null;
}

/** "Lego Titanic 10294 | eMAG.ro" → "Lego Titanic 10294": drops a trailing shop name. */
function cleanTitle(raw: string | null, host: string) {
  if (!raw) return null;
  let title = decode(raw).replace(/\s+/g, " ").trim();
  const parts = title.split(/\s+[|–—-]\s+/);
  const shop = host.replace(/^www\./, "").split(".")[0].toLowerCase();
  if (parts.length > 1) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (last && (last.includes(shop) || shop.includes(last))) title = parts.slice(0, -1).join(" - ");
  }
  return title.slice(0, 120) || null;
}

function parseProduct(html: string, host: string): { image: string | null; price: string | null; title: string | null } {
  let image = metaContent(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  let name: string | null = null;
  let price: string | null = null;
  let currency: string | null = null;

  // JSON-LD Product blocks (most shops).
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes: any[] = [data, ...(Array.isArray(data) ? data : []), ...(data["@graph"] ?? [])].flat();
      for (const n of nodes) {
        const type = [n?.["@type"]].flat().join(" ");
        if (!/Product/i.test(type)) continue;
        if (!name && typeof n.name === "string") name = n.name;
        if (!image) image = [n.image].flat().map((i: any) => (typeof i === "string" ? i : i?.url)).find(Boolean) ?? null;
        const offer = [n.offers].flat()[0];
        const p = offer?.price ?? offer?.lowPrice ?? offer?.priceSpecification?.price;
        if (!price && p != null) {
          price = String(p);
          currency = offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency ?? null;
        }
      }
    } catch {}
  }

  if (!price) {
    price = metaContent(html, ["product:price:amount", "og:price:amount", "price"]);
    currency = metaContent(html, ["product:price:currency", "og:price:currency", "priceCurrency"]);
  }
  if (!image) image = html.match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? null;

  const priceText = price ? `${price}${currency ? " " + currency : ""}`.trim() : null;
  name ??= metaContent(html, ["og:title", "twitter:title"]) ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
  return { image: image ? decode(image) : null, price: priceText, title: cleanTitle(name, host) };
}
