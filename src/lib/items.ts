/** Validation shared by "add gift" and "edit gift". */

export interface ItemFields {
  image_key?: string;
  product_url?: string | null;
  price?: string | null;
  /** 1 = really want · 0 = would be nice · -1 = just an idea. */
  priority?: number;
  /** NULL = normal gift; 2–20 = group gift. */
  group_size?: number | null;
}

export const GROUP_MIN = 2;
export const GROUP_MAX = 20;

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
  if ("priority" in body) {
    const p = body.priority;
    // `true`/`false` is the old "most wanted" star.
    const n = p === true ? 1 : p === false ? 0 : Math.round(Number(p) || 0);
    out.priority = Math.max(-1, Math.min(1, n));
  }
  if ("group_size" in body) {
    const g = body.group_size;
    if (g == null || g === "" || g === false || g === 0) out.group_size = null;
    else {
      const n = Math.round(Number(g));
      if (!(n >= GROUP_MIN && n <= GROUP_MAX)) return { error: "error" };
      out.group_size = n;
    }
  }
  return out;
}
