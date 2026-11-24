/** Validation shared by "add gift" and "edit gift". */

export interface ItemFields {
  image_key?: string;
  product_url?: string | null;
  price?: string | null;
}

/**
 * Keeps only the fields present in `body`, cleaned. Returns `{ error: key }`
 * (an api.ts message key) when something is invalid.
 */
export function cleanItemFields(body: Record<string, unknown>): ItemFields | { error: string } {
  const out: ItemFields = {};
  if ("image_key" in body) {
    const key = body.image_key == null ? "" : String(body.image_key);
    if (key && !/^items\/[\w-]+\.[a-z0-9]+$/i.test(key)) return { error: "error" };
    out.image_key = key;
  }
  if ("product_url" in body) {
    const url = body.product_url == null ? "" : String(body.product_url).trim();
    if (url) {
      try {
        const u = new URL(url);
        if (!/^https?:$/.test(u.protocol) || url.length > 2000) return { error: "badUrl" };
      } catch {
        return { error: "badUrl" };
      }
    }
    out.product_url = url || null;
  }
  if ("price" in body) {
    const price = body.price == null ? "" : String(body.price).trim().slice(0, 40);
    out.price = price || null;
  }
  return out;
}
