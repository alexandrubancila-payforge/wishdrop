/**
 * Images in R2 (`wishdrop-images`). Keys look like `items/<uuid>.<ext>` — gift
 * photos and avatars alike — and are served by `/api/images/<key>`.
 */
import { env } from "cloudflare:workers";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const isImageType = (type: string) => type in EXT;

/** "/api/images/items/…" for a key, or "" when there is no image. */
export const imageUrl = (key: string | null | undefined) => (key ? `/api/images/${key}` : "");

/** Turn "/api/images/items/x.webp?v=1" back into "items/x.webp". */
export function keyFromUrl(url: string | null | undefined) {
  const m = url?.match(/^\/api\/images\/([^?#]+)/);
  return m ? m[1] : null;
}

/** Store a photo. `folder` "reports" keeps problem-report screenshots apart (only the admin can open them). */
export async function putImage(body: ArrayBuffer | ReadableStream, contentType: string, folder: "items" | "reports" = "items") {
  const key = `${folder}/${crypto.randomUUID()}.${EXT[contentType] ?? "jpg"}`;
  await env.BUCKET.put(key, body, { httpMetadata: { contentType } });
  return key;
}

export async function deleteImage(key: string | null | undefined) {
  if (key && key.startsWith("items/")) await env.BUCKET.delete(key).catch(() => {});
}

/** A separate copy of a photo (so deleting one gift never removes another's photo). "" when there is none. */
export async function copyImage(key: string | null | undefined) {
  if (!key || !key.startsWith("items/")) return "";
  const obj = await env.BUCKET.get(key);
  if (!obj) return "";
  return putImage(await obj.arrayBuffer(), obj.httpMetadata?.contentType ?? "image/jpeg");
}
