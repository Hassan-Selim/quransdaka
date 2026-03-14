// service-worker.js
const CACHE_VERSION = "v1.2.0";
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

const urlsToCache = [
  "/",
  "/index.html",
  "/ramadan/index.html",
  "/404.html",
  "/quran-read/index.html",
  "/css/style.css",
  "/css/ramadan.css",
  "/css/quran-read.css",
  "/js/theme.js",
  "/js/quran-read.js",
  "/js/ramadan.js",
  "/img/icon.webp",
];

// ======= INSTALL =======
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

// ======= ACTIVATE =======
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            return caches.delete(key);
        }),
      ),
    ),
  );
  self.clients.claim();
});

// ======= FETCH =======
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.destination === "audio") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((resp) => {
          const clone = resp.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return resp;
        }),
    ),
  );
});

// ======= إشعارات =======
let prayerTimers = [];

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/img/icon.webp",
      badge: "/img/icon.webp",
      data: { url: data.url },
    });
  }
  if (data.type === "SET_PRAYER_TIMES") {
    // الغاء أي مؤقتات سابقة
    prayerTimers.forEach((id) => clearTimeout(id));
    prayerTimers = [];
    const times = data.times;
    Object.entries(times).forEach(([name, timeObj]) => {
      const time = new Date(timeObj);
      const now = new Date();
      const diff = time - now;
      if (diff > 0) {
        const timer = setTimeout(() => {
          self.registration.showNotification(`حان الآن موعد صلاة ${name}`, {
            body: `الوقت الآن ${time.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" })}`,
            icon: "/img/icon.webp",
            badge: "/img/icon.webp",
            data: { url: "/prayer" },
          });
        }, diff);
        prayerTimers.push(timer);
      }
    });
  }
});

// فتح صفحة عند الضغط على الإشعار
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
