const CACHE_VERSION = "v1.3.0"; // ارفع الفيرجن عشان نضمن المسح القديم
const STATIC_CACHE = `quran-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quran-dynamic-${CACHE_VERSION}`;

const urlsToCache = [
  "/",
  "/index.html",
  "/ramadan/",
  "/ramadan/index.html",
  "/quran-read/",
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
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ======= ACTIVATE =======
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

// ======= FETCH (النسخة المختصرة والمضمونة) =======
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // تجاهل أي شيء غير موقعنا وتجاهل الصوت
  if (!request.url.startsWith(self.location.origin) || request.destination === "audio") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. لو موجود في الكاش رجعه
      if (cachedResponse) {
        // تحديث الكاش في الخلفية
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {}); // تجاهل أخطاء الشبكة في الخلفية
        
        return cachedResponse;
      }

      // 2. لو مش موجود، روحه هاته من النت
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
          // 3. لو نت مفيش وكاش مفيش (الأوفلاين التام)
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
      });
    })
  );
});

// ======= الإشعارات (كما هي) =======
let prayerTimers = [];
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data.type === "SET_PRAYER_TIMES") {
    prayerTimers.forEach(clearTimeout);
    prayerTimers = [];
    Object.entries(data.times).forEach(([name, timeObj]) => {
      const diff = new Date(timeObj) - new Date();
      if (diff > 0) {
        const t = setTimeout(() => {
          self.registration.showNotification(`موعد صلاة ${name}`, {
            body: "حان الآن وقت الصلاة",
            icon: "/img/icon.webp"
          });
        }, diff);
        prayerTimers.push(t);
      }
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

// دالة لتحديد حجم الكاش
const limitCacheSize = (name, maxItems) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        // امسح أقدم ملف (أول واحد في المصفوفة)
        cache.delete(keys[0]).then(() => limitCacheSize(name, maxItems));
      }
    });
  });
};