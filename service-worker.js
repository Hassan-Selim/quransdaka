const CACHE_VERSION = "v1.4.2";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

const urlsToCache = [
  "/",
  "/index.html",
  "/prayer/",
  "/prayer/index.html",
  "/quran-read/",
  "/about/",
  "/about/index.html",
  "/quran-read/index.html",
  "/css/style.css",
  "/css/about.css",
  "/css/prayer.css",
  "/css/quran-read.css",
  "/js/theme.js",
  "/js/quran-read.js",
  "/js/prayer.js",
  "/img/icon.webp",
  "/img/icon-192.png", 
  "/img/icon-512.png",
];

// ======= الدوال المساعدة (تعديل بسيط لضمان الأمان) =======
const limitCacheSize = async (name, maxItems) => {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(name, maxItems);
  }
};

const putInCache = async (request, response, cacheName) => {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  limitCacheSize(cacheName, 50);
};

// ======= الأحداث (Install & Activate) - بدون تغيير =======
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
  self.clients.claim();
});

// ======= جلب البيانات (Fetch) - بدون تغيير =======
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request.url.startsWith(self.location.origin) || request.destination === "audio") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            putInCache(request, networkResponse, DYNAMIC_CACHE);
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          putInCache(request, networkResponse.clone(), DYNAMIC_CACHE);
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === "navigate") return caches.match("/index.html");
      });
    }),
  );
});

// ======= الإشعارات (التعديل هنا) =======

self.addEventListener("message", (event) => {
  if (event.data.type === "SHOW_PRAYER_NOTIFICATION") {
    const options = {
      body: "حي على الصلاة، حي على الفلاح",
      icon: "/img/icon-192.webp",
      badge: "/img/icon-192.webp",
      vibrate: [200, 100, 200, 100, 200],
      data: { 
        prayerName: event.data.prayerName,
        url: "/prayer/index.html?playAzan=true" // هنبعت بارامتر عشان نشغل الصوت فوراً
      }
    };
    self.registration.showNotification(`موعد صلاة ${event.data.prayerName} 🕌`, options);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // 1. لو فيه تابة مفتوحة فعلاً للموقع، نركز عليها ونبعتلها تشغل الصوت
      for (let client of windowClients) {
        if (client.url.includes('/prayer/') && 'focus' in client) {
          client.postMessage({ type: 'PLAY_AZAN_NOW' });
          return client.focus();
        }
      }
      // 2. لو مفيش تابة مفتوحة، نفتح صفحة الصلاة بالبارامتر
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});