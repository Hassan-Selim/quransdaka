const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// الملفات الأساسية (Shell)
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/theme.js",
  "/js/home.js",
  "/img/icon.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        urlsToCache.map((url) =>
          fetch(url)
            .then(resp => cache.put(url, resp.clone()))
            .catch(err => console.warn("Failed to cache:", url, err))
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE, DYNAMIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // ❌ استثناء روابط الراديو من الكاش
  if (request.url.includes("radiojar.com") || request.url.includes("mp3quran.net/api/v3/radios")) {
    event.respondWith(fetch(request));
    return;
  }

  // صفحات HTML → Network First
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return resp;
        })
        .catch(() => caches.match("/index.html"))
      )
    );
    return;
  }

  // JSON → Network First + dynamic cache
  if (request.url.endsWith(".json") || request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS / JS / Images → Cache First
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        return resp;
      })
      .catch(() => undefined)
    )
  );
});
