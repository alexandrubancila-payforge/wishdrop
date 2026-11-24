import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

/** Serve a photo from R2. Keys never change, so it can be cached for a year. */
export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key ?? "";
  if (!key.startsWith("items/") || key.includes("..")) return new Response("Not found", { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  if (request.headers.get("if-none-match") === obj.httpEtag) return new Response(null, { status: 304 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
};
