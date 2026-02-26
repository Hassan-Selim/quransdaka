const CACHE_VERSION = "v1.0.6";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

// App Shell فقط
const urlsToCache = [
  "/",
  "/index.html",
  "../css/style.css",
  "../js/theme.js",
  "../js/home.js",
  "../img/icon.webp"
];

// ================= INSTALL =================
self.addEventListener("install", (event) => {
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

  // تجاهل أي حاجة خارج الدومين
  if (!request.url.startsWith(self.location.origin)) return;

  // تجاهل الصوت
  if (request.destination === "audio") return;

  // ================= HTML =================
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

  // ================= JSON =================
  // 🔴 Network Only عشان مانكركبش الكاش
  if (request.url.endsWith(".json") || request.url.includes("/api/")) {
    event.respondWith(fetch(request));
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
          limitCacheSize(DYNAMIC_CACHE, 20);
        });
        return response;
      });
    })
  );
});