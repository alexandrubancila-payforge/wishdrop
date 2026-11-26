import type { APIRoute } from "astro";
import { apiT, fail, json, requireUser } from "@/lib/http";
import { imageUrl, isImageType, MAX_UPLOAD_BYTES, putImage } from "@/lib/storage";
import { checkImage, flagPhoto, MAX_CHECK_BYTES } from "@/lib/moderation";

/**
 * Gift photos and avatars. The browser already downscales to WebP before sending.
 * Every photo goes through the automatic check first (lib/moderation.ts).
 */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const form = await ctx.request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(t("badType"));
  if (!isImageType(file.type)) return fail(t("badType"));
  if (file.size > MAX_UPLOAD_BYTES) return fail(t("tooBig"), 413);
  const body = await file.arrayBuffer();
  // Too big to check (the browser normally sends ~200 KB): stored, but an admin looks at it.
  const { verdict } = body.byteLength <= MAX_CHECK_BYTES ? await checkImage(body) : { verdict: "review" as const };
  if (verdict === "block") return fail(t("imageRejected"), 422);
  const key = await putImage(body, file.type);
  if (verdict === "review") await flagPhoto(user.id, key, ctx.url.origin);
  return json({ image_key: key, url: imageUrl(key) });
};
