const CACHE_VERSION = "v1.0.9";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// الملفات الأساسية (App Shell)
const urlsToCache = [
  "/",
  "/index.html",
  "/ramadan/index.html",
  "/quran-read/index.html",
  "/css/style.css",
  "/css/ramadan.css",
  "/css/quran-read.css",
  "/js/theme.js",
  "/js/quran-read.js",
  "/js/ramadan.js",
  "/img/icon.webp"
];

// ================= INSTALL =================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache))
  );
});

// ================= ACTIVATE =================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// ================= LIMIT CACHE SIZE =================
function limitCacheSize(name, size) {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => limitCacheSize(name, size));
      }
    });
  });
}

// ================= FETCH =================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (!request.url.startsWith(self.location.origin)) return;

  // تخطي الأوديو من التخزين
  if (request.destination === "audio") return;

  // HTML navigation
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            limitCacheSize(DYNAMIC_CACHE, 20);
          });
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // JSON / API requests
  if (request.url.endsWith(".json") || request.url.includes("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // CSS / JS / Images
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
          limitCacheSize(DYNAMIC_CACHE, 20);
        });
        return response;
      });
    })
  );
});

// ================= NOTIFICATION CLICK =================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});