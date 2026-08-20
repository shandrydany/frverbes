/* Conjugueur service worker v2.3
   Стратегия: network-first для HTML (всегда свежая версия при наличии сети),
   stale-while-revalidate для остального (мгновенно из кэша + фоновое обновление). */
const CACHE = "conjugueur-v2.3";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./verbs.json",
  "./manifest.json",
  "./fonts/unbounded-cyr.woff2",
  "./fonts/unbounded-lat.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" ||
    (e.request.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // HTML: сначала сеть (свежая версия), кэш — только офлайн
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }

  // Статика: из кэша мгновенно + фоновое обновление кэша из сети
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const network = fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
