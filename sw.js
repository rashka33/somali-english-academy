// Somali English Academy service worker — network-first with offline fallback.
// Bump CACHE on every publish so users never get stuck on an old build.
const CACHE = "sea-f28-placement-navigation";
const CORE = ["./", "./index.html", "./academy-ui.css", "./dictionary-client.js", "./academy-ui.js", "./tutor.js", "./tutor-config.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req, { cache: 'no-cache' });
      if (response.ok) {
        await cache.put(req, response.clone());
        return response;
      }
      return (await cache.match(req)) || response;
    } catch {
      return (await cache.match(req)) || Response.error();
    }
  })());
});
