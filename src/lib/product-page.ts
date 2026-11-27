/**
 * Reading a shop's product page: its photo, name and price (Open Graph,
 * JSON-LD, microdata). Used by the auto-fill (pages/api/scrape.ts) and by
 * scripts/backfill-titles.ts. No Cloudflare bindings here, so scripts can run it.
 */

export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const MAX_HTML = 1_500_000;

export async function fetchText(url: string): Promise<string | null> {
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

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
/** HTML entities, also numeric (&#x27;) and double-encoded ones (&amp;amp;). */
const decode = (s: string) => {
  let out = s;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e.toLowerCase()] ?? m),
    );
    if (next === out) break;
    out = next;
  }
  return out.replace(/\s+/g, " ").trim();
};

function metaContent(html: string, names: string[]) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${name.replace(/[:.]/g, "\\$&")}["'][^>]*>`,
      "i",
    );
    const tag = html.match(re)?.[0];
    // content="…" or content='…' (an apostrophe inside double quotes is fine).
    const m = tag?.match(/content=(?:"([^"]*)"|'([^']*)')/i);
    const content = m?.[1] ?? m?.[2];
    if (content) return decode(content);
  }
  return null;
}

/** Titles that name a page, not a product: bot checks, shop home pages, app banners. */
const NOT_A_PRODUCT =
  /^(client challenge|just a moment|access denied|attention required|security check|robot check|page not found|404|landing page|open your gift|mercado libre|home|homepage|startseite)\b|online kaufen$|online fashion shop|is mainly design|^dm-drogerie markt$/i;
/** Trailing parts that name the shop, not the product. */
const SHOP_PART = /(\.(com|de|ro|md|ru|eu|net|org)\b|official|®|\bshop\b|\bstore\b|magazin|online|купить|amazon)/i;

/** "Lego Titanic 10294 | eMAG.ro" → "Lego Titanic 10294": drops shop names, "on Steam", Amazon's ": Amazon.de: Books". */
export function cleanTitle(raw: string | null, host: string) {
  if (!raw) return null;
  let title = decode(raw);
  title = title
    .replace(/\s*:\s*Amazon\.[a-z.]+(:.*)?$/i, "")
    .replace(/\s+(pe|on|auf|в)\s+Steam$/i, "")
    .replace(/^(Economisește|Save|Spare|Сэкономьте)\s+\d+%\s+(la jocul|on|bei|на)\s+/i, "");
  const shop = host.replace(/^www\./, "").split(".")[0].toLowerCase();
  for (let i = 0; i < 2; i++) {
    const parts = title.split(/\s+[|–—-]\s+/);
    if (parts.length < 2) break;
    const last = parts[parts.length - 1];
    const bare = last.toLowerCase().replace(/[^a-z0-9]/g, "");
    if ((bare && (bare.includes(shop) || shop.includes(bare))) || SHOP_PART.test(last)) title = parts.slice(0, -1).join(" - ");
    else break;
  }
  // Very long marketing titles (Pinterest, Amazon): keep the part before the first " | ".
  if (title.length > 80 && title.includes(" | ")) title = title.split(" | ")[0];
  title = title.trim();
  if (title.length < 3 || NOT_A_PRODUCT.test(title)) return null;
  return title.slice(0, 120);
}

export function parseProduct(html: string, host: string): { image: string | null; price: string | null; title: string | null } {
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
