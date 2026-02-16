const CACHE_VERSION = "v11";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 50; // الحد الأقصى لملفات الكاش الديناميكي

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

// وظيفة لتحديد حجم الكاش الديناميكي
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.url.includes("radio") || request.url.endsWith(".mp3") || request.url.endsWith(".aac") || request.url.endsWith(".m3u8")) {
  event.respondWith(fetch(request));
  return;
}

  // 🔴 استثناء ملفات الصوت من الـ Service Worker (مهم جدًا لـ iOS)
  if (request.destination === "audio" || request.url.endsWith(".mp3")) {
    event.respondWith(fetch(request));
    return;
  }

  // صفحات HTML (Navigation)
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(cachedPage => {
        if (cachedPage) return cachedPage;

        return fetch(request)
          .then(networkResponse => {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
              trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
            });
            return networkResponse;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // JSON / API → Network First + Dynamic Caching
  if (request.url.includes(".json") || request.url.includes("api")) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
            trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
          });
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
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
          trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
        });
        return networkResponse;
      });
    })
  );
});
