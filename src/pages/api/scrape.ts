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
import { fetchText, parseProduct, UA } from "@/lib/product-page";

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
