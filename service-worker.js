const CACHE_NAME = "quran-sadaka-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/tasbeeh.html",
  "/ruqyah.html",
  "/quran.html",
  "/quran-read.html",
  "/radio.html",

  "css/style.css",
  
  "js/theme.js",
  "js/quran.js",
  "js/quran-read.js",
  "js/tasbeeh.js",
  "js/radio.js",
  "js/ruqyah.js",

  "/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
