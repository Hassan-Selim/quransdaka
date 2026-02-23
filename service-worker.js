const CACHE_VERSION = "v1.0.2";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// الملفات الأساسية فقط (App Shell)
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/theme.js",
  "/js/home.js",
  "/img/icon.png"
];

// ================= INSTALL =================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(urlsToCache);
    })
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
  self.clients.claim();
});

// ================= FETCH =================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 🚀 1️⃣ تجاهل أي طلب خارج الدومين (زي radiojar)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // 🚀 2️⃣ تجاهل أي ملفات صوت
  if (request.destination === "audio") {
    return;
  }

  // ================= HTML (Navigation) =================
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // ================= JSON / API =================
  if (request.url.endsWith(".json") || request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ================= CSS / JS / Images =================
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      });
    })
  );
});
