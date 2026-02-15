const CACHE_VERSION = "v9";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// الملفات الأساسية فقط (Shell)
const urlsToCache = [
  "/",               
  "/index.html",
  "/css/style.css",
  "/js/theme.js",
  "/js/home.js",
  "/img/icon.png"
];

// تثبيت الكاش الأساسي بسرعة
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.all(
        urlsToCache.map(url =>
          fetch(url)
            .then(resp => cache.put(url, resp.clone()))
            .catch(err => console.warn("Failed to cache:", url, err))
        )
      )
    )
  );
});

// تفعيل وتنظيف الكاش القديم
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

// Fetch handler
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // صفحات HTML (Navigation)
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(cachedPage => {
        if (cachedPage) return cachedPage;

        return fetch(request)
          .then(networkResponse => {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
            return networkResponse;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // JSON / API → Network First + dynamic caching
  if (request.url.includes(".json") || request.url.includes("api")) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS / JS / Images → Cache First + Dynamic Caching
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then(networkResponse => {
        const responseClone = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
        return networkResponse;
      }).catch(() => {
        // Optional: fallback لملفات الصور أو CSS/JS
        return;
      });
    })
  );
});
