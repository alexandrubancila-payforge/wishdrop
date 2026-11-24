// Minimal, safe service worker for WishDrop.
// It only caches immutable static assets (hashed bundles, icons, demo images).
// HTML pages, the API and user images always go to the network, so logged-in
// content and reservations are never served stale.
const CACHE = "wishdrop-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_astro/") ||
    url.pathname.startsWith("/demo/") ||
    /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname);
  if (!isStatic) return; // network handles HTML / API / user images

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }),
  );
});
