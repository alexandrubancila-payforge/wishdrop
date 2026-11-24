// Minimal, safe service worker for WishDrop.
// HTML pages, the API and user images always go to the network, so logged-in
// content and reservations are never served stale.
//
// - Hashed bundles (/_astro/…) and demo photos never change: cache-first.
// - Icons, the manifest, fonts and other public files can change under the
//   same name: serve the cached copy for speed, but refresh it in the
//   background so the next visit gets the new one.
//
// Bump CACHE when an update must reach everyone at once (activate deletes the
// old caches). v2: the Pastel redesign replaced every icon. v3: push.
const CACHE = "wishdrop-static-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const immutable = url.pathname.startsWith("/_astro/") || url.pathname.startsWith("/demo/");
  const refreshable = /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname) && !url.pathname.startsWith("/api/");
  if (!immutable && !refreshable) return; // network handles HTML / API / user images

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      if (cached) {
        if (refreshable) event.waitUntil(fresh);
        return cached;
      }
      return fresh;
    }),
  );
});

// Phone notifications (Web Push, sent by src/lib/push.ts): { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "WishDrop", {
      body: data.body || "",
      icon: "/icon-192.png?v=2",
      tag: data.tag,
      data: { url: data.url || "/notifications" },
    }),
  );
});

// Tapping it opens the page (reusing an open WishDrop tab when there is one).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) {
        if (new URL(tab.url).origin === self.location.origin && "navigate" in tab) {
          return tab.focus().then(() => tab.navigate(url));
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
