import type { APIRoute } from "astro";
import { apiT, fail, json, requireUser } from "@/lib/http";
import { imageUrl, isImageType, MAX_UPLOAD_BYTES, putImage } from "@/lib/storage";

/** Gift photos and avatars. The browser already downscales to WebP before sending. */
export const POST: APIRoute = async (ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const t = apiT(ctx);
  const form = await ctx.request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(t("badType"));
  if (!isImageType(file.type)) return fail(t("badType"));
  if (file.size > MAX_UPLOAD_BYTES) return fail(t("tooBig"), 413);
  const key = await putImage(await file.arrayBuffer(), file.type);
  return json({ image_key: key, url: imageUrl(key) });
};
