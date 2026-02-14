const CACHE_NAME = "quran-app-v1";
const urlsToCache = [
  "./",
  "./index.html",

  // الصفحات الفرعية
  "./quran/",
  "./ruqyah/",
  "./radio/",
  "./quran-read/",
  "./ramadan/",
  "./tasbeeh/",
  "./about/",

  // ملفات CSS
  "./css/style.css",
  "./css/home.css",
  "./css/quran.css",
  "./css/quran-read.css",
  "./css/about.css",
  "./css/ruqyah.css",
  "./css/ramadan.css",
  "./css/tasbeeh.css",
  "./css/radio.css",

  // ملفات JS
  "./js/home.js",
  "./js/quran.js",
  "./js/quran-read.js",
  "./js/ramadan.js",
  "./js/tasbeeh.js",
  "./js/theme.js",
  "./js/radio.js",
  "./js/ruquah.js",

  // ملفات JSON
  "./json/quran.json",
  "./json/ayahTimings.json",
  "./json/reciters.json",
  "./json/surah-name.json",

  // الصور والأيقونات
  "./img/icon.png",
  "./img/banner.png",
  "./img/tasbeeh.png",
  "./img/name.svg",
  "./img/about.svg",
  "./img/q.svg",
  "./img/ruqya.svg",
  "./img/qsound.svg",
  "./img/read.svg",
  "./img/ramadan.svg",
  "./img/radio.svg",
  "./img/menu.svg",
  "./img/home.svg",
  "./img/share.svg",
  

  // manifest
  "./manifest.json"
];

// تثبيت الكاش أول مرة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// تفعيل وإزالة الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// جلب الملفات من الكاش أو الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});