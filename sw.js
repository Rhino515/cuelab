/* CueLab Service Worker (offline + installable PWA)
   - Cache-first for app shell
   - Network-first for nothing (we're fully local)
*/
const CACHE_NAME = "cuelab-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/app.css",
  "./src/main.js",
  "./src/router.js",
  "./src/store/store.js",
  "./src/store/seed.js",
  "./src/utils/time.js",
  "./src/utils/dom.js",
  "./src/utils/stats.js",
  "./src/components/layout.js",
  "./src/components/ui.js",
  "./src/pages/home.js",
  "./src/pages/stats.js",
  "./src/pages/browse.js",
  "./src/pages/tools.js",
  "./src/pages/drill_detail.js",
  "./src/pages/drill_run.js",
  "./src/pages/drill_edit.js",
  "./src/pages/library.js",
  "./src/pages/table_lab.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    // Cache-first for app shell assets.
    if (cached) return cached;

    try {
      const res = await fetch(req);
      // Cache new GET requests.
      if (req.method === "GET" && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      // If navigation offline, return cached index.html (SPA).
      if (req.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});
