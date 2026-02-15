const CACHE_VERSION = "v8";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// كل الملفات الأساسية للـ Pre-cache
const urlsToCache = [
  "/",               
  "/index.html",

  // صفحات فرعية
  "/quran/index.html",
  "/ruqyah/index.html",
  "/radio/index.html",
  "/quran-read/index.html",
  "/ramadan/index.html",
  "/tasbeeh/index.html",
  "/about/index.html",

  // CSS
  "/css/style.css",
  "/css/home.css",
  "/css/quran.css",
  "/css/quran-read.css",
  "/css/about.css",
  "/css/ruqyah.css",
  "/css/ramadan.css",
  "/css/tasbeeh.css",
  "/css/radio.css",

  // JS
  "/js/home.js",
  "/js/quran.js",
  "/js/quran-read.js",
  "/js/ramadan.js",
  "/js/tasbeeh.js",
  "/js/theme.js",
  "/js/radio.js",

  // JSON
  "/json/quran.json",
  "/json/ayahTimings.json",
  "/json/reciters.json",
  "/json/surah-name.json",

  // الصور والأيقونات
  "/img/icon.png",
  "/img/banner.png",

  // Manifest
  "/manifest.json"
];

// تثبيت الكاش الأساسي
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

  // Navigation requests (HTML صفحات)
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(cachedPage => {
        if (cachedPage) return cachedPage;

        return fetch(request).then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          return networkResponse;
        }).catch(() => caches.match("/index.html")); // fallback
      })
    );
    return;
  }

  // JSON / API → Network First
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
