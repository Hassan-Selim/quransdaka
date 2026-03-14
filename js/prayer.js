// prayer.js
import * as adhan from "./adhan.js"; // نسخة محلية من adhan-clock
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

// ======== العناصر ========
const prayerListEl = document.querySelector(".prayer-list");
const nextPrayerNameEl = document.getElementById("nextPrayerName");
const countdownEl = document.getElementById("nextPrayerCountdown");
const progressCanvas = document.getElementById("prayerProgress");
const ctx = progressCanvas.getContext("2d");
const todayDateEl = document.getElementById("todayDate");
const locationNameEl = document.getElementById("locationName");
const refreshLocationBtn = document.getElementById("refreshLocationBtn");

const qiblaCanvas = document.getElementById("qiblaCompass");
const qCtx = qiblaCanvas.getContext("2d");
const center = qiblaCanvas.width / 2;
const radius = center - 15;
const kaabaLat = 21.4225;
const kaabaLng = 39.8262;

// ======== صوت الأذان داخل الصفحة فقط ========
const adhanAudio = new Audio("../img/adhan.mp3");
let adhanPlayedFor = null;

// ======== المتغيرات ========
let prayerTimes = {};
let countdownInterval;

// ======== القبلة ========
function calculateBearing(lat1, lng1) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (kaabaLat * Math.PI) / 180;
  const Δλ = ((kaabaLng - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

function drawCompassBase() {
  qCtx.clearRect(0, 0, qiblaCanvas.width, qiblaCanvas.height);
  qCtx.beginPath();
  qCtx.arc(center, center, radius, 0, 2 * Math.PI);
  qCtx.strokeStyle = "#555";
  qCtx.lineWidth = 4;
  qCtx.stroke();
}

function drawArrow(rotation) {
  qCtx.save();
  qCtx.translate(center, center);
  qCtx.rotate((rotation * Math.PI) / 180);
  qCtx.beginPath();
  qCtx.moveTo(0, -radius + 20);
  qCtx.lineTo(-8, -radius + 35);
  qCtx.lineTo(8, -radius + 35);
  qCtx.closePath();
  qCtx.fillStyle = "#ff4d4d";
  qCtx.fill();
  qCtx.restore();
}

function drawKaaba(rotation) {
  qCtx.save();
  qCtx.translate(center, center);
  qCtx.rotate((rotation * Math.PI) / 180);
  const kaabaSize = 16;
  qCtx.fillStyle = "#000";
  qCtx.fillRect(
    -kaabaSize / 2,
    -radius + 50 - kaabaSize / 2,
    kaabaSize,
    kaabaSize,
  );
  qCtx.restore();
}

function initQibla(lat, lng) {
  function handleOrientation(e) {
    const alpha = e.alpha || 0;
    const bearing = calculateBearing(lat, lng);
    const rotation = bearing - alpha;
    drawCompassBase();
    drawArrow(rotation);
    drawKaaba(rotation);
  }
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission().then((permission) => {
      if (permission === "granted")
        window.addEventListener("deviceorientation", handleOrientation, true);
    });
  } else window.addEventListener("deviceorientation", handleOrientation, true);
}

// ======== التاريخ الهجري ========
function gregorianToHijri(gDate, offset = 0) {
  const day = gDate.getDate() + offset;
  const month = gDate.getMonth();
  const year = gDate.getFullYear();

  const jd =
    Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor(
      (3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4,
    ) +
    day -
    32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * l) / 709);
  const d = l - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  return { day: d, month: m, year: y };
}

function updateHijriDate() {
  const now = new Date();
  const hijri = gregorianToHijri(now);
  const months = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];
  const weekdays = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  todayDateEl.textContent = `${weekdays[now.getDay()]} ${[hijri.day] - 2} ${months[hijri.month]} ${hijri.year} هـ`;
}
// ======== الإشعارات ========
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// ======== تحميل مواقيت الصلاة ========
function loadPrayerTimes(lat, lng) {
  const coords = new adhan.Coordinates(lat, lng);
  const params = adhan.CalculationMethod.Egyptian();
  const times = new adhan.PrayerTimes(coords, new Date(), params);

  prayerTimes = {
    الفجر: times.fajr,
    الشروق: times.sunrise,
    الظهر: times.dhuhr,
    العصر: times.asr,
    المغرب: times.maghrib,
    العشاء: times.isha,
  };

  updatePrayerList();
}

// ======== عرض المواقيت ========
function updatePrayerList() {
  prayerListEl.querySelectorAll(".prayer-item").forEach((item) => {
    const name = item.querySelector(".prayer-name").textContent;
    if (prayerTimes[name]) {
      const time = prayerTimes[name];
      item.querySelector(".prayer-time").textContent = time.toLocaleTimeString(
        "ar-EG-u-nu-latn",
        { hour: "2-digit", minute: "2-digit" },
      );
      item.querySelector(".prayer-time").dataset.time = time;
    }
  });
  updateNextPrayer();
}

// ======== الصلاة القادمة والبروجرس ========
function getNextPrayer() {
  const now = new Date();
  for (const name of Object.keys(prayerTimes)) {
    if (name === "الشروق") continue;
    const t = prayerTimes[name];
    if (t > now) return { name, time: t };
  }
  const first = Object.keys(prayerTimes).find((n) => n !== "الشروق");
  const fajrTomorrow = new Date(prayerTimes[first]);
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  return { name: first, time: fajrTomorrow };
}

function getPreviousPrayer(currentName) {
  const names = Object.keys(prayerTimes).filter((n) => n !== "الشروق");
  const idx = names.indexOf(currentName);
  if (idx === 0) return { time: prayerTimes["العشاء"] };
  return { time: prayerTimes[names[idx - 1]] };
}

function drawProgress(prevTime, nextTime) {
  const now = new Date();
  const total = nextTime - prevTime;
  const elapsed = now - prevTime;
  let percent = elapsed / total;
  if (percent < 0) percent = 0;
  if (percent > 1) percent = 1;

  const r = progressCanvas.width / 2 - 10;
  ctx.clearRect(0, 0, progressCanvas.width, progressCanvas.height);

  ctx.beginPath();
  ctx.arc(
    progressCanvas.width / 2,
    progressCanvas.height / 2,
    r,
    0,
    2 * Math.PI,
  );
  ctx.strokeStyle = "#3c4f6b";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    progressCanvas.width / 2,
    progressCanvas.height / 2,
    r,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * percent,
  );
  ctx.strokeStyle = "#ff4d5a";
  ctx.lineWidth = 8;
  ctx.stroke();
}

function updateNextPrayer() {
  const next = getNextPrayer();
  if (!next) return;

  prayerListEl.querySelectorAll(".prayer-item").forEach((item) => {
    item.classList.remove("next-prayer");
    if (item.querySelector(".prayer-name").textContent === next.name)
      item.classList.add("next-prayer");
  });

  nextPrayerNameEl.textContent = next.name;

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const now = new Date();
    const prev = getPreviousPrayer(next.name);
    const diff = next.time - now;

    drawProgress(prev.time, next.time);

    let displayDiff;

    if (diff >= 0) {
      displayDiff = diff; // قبل الصلاة
    } else {
      const passed = Math.abs(diff);

      if (passed <= 15 * 60 * 1000) {
        displayDiff = passed; // بعد الصلاة عد تصاعدي
      } else {
        updateNextPrayer();
        return;
      }
    }

    const hours = Math.floor(displayDiff / 3600000);
    const minutes = Math.floor((displayDiff % 3600000) / 60000);
    const seconds = Math.floor((displayDiff % 60000) / 1000);

    countdownEl.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    if(Math.abs(diff)<1000 && adhanPlayedFor!==next.name){

  // تشغيل الأذان داخل الصفحة
  adhanAudio.play().catch(()=>console.log("Audio play failed"));

  // إشعار داخل أو خارج الصفحة
  if ("Notification" in window) {

    if (Notification.permission === "granted") {

      if (navigator.serviceWorker) {

        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.showNotification("حان الآن موعد الصلاة", {
              body: next.name,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: "prayer-notification"
            });
          }
        });

      } else {

        new Notification("حان الآن موعد الصلاة", {
          body: next.name
        });

      }

    }

  }

  adhanPlayedFor = next.name;
}

  }, 1000);
}

// ======== تحديد الموقع مع اسم المنطقة ========
async function getLocationAndUpdate() {
  if (localStorage.getItem("userLocation")) {
    const saved = JSON.parse(localStorage.getItem("userLocation"));
    startApp(saved.lat, saved.lng);
    locationNameEl.innerText = saved.region;
    return;
  }

  if (!navigator.geolocation) {
    locationNameEl.innerText = "الموقع غير مدعوم";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // جلب اسم المنطقة من Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        );
        const data = await res.json();
        const area =
          data.address.suburb ||
          data.address.neighbourhood ||
          data.address.city_district ||
          "";

        const city =
          data.address.city || data.address.town || data.address.state || "";

        const region = area ? `${area} - ${city}` : city;

        locationNameEl.innerText = region || "موقع غير معروف";

        locationNameEl.innerText = region;
        localStorage.setItem(
          "userLocation",
          JSON.stringify({ lat, lng, region }),
        );
      } catch (e) {
        locationNameEl.innerText = "موقع غير معروف";
      }

      startApp(lat, lng);
    },
    (err) => {
      locationNameEl.innerText = "رفض تحديد الموقع";
    },
  );
}

// ======== زرار تحديث الموقع ========
if (refreshLocationBtn) {
  refreshLocationBtn.addEventListener("click", () => {
    locationNameEl.innerText = "...";
    localStorage.removeItem("userLocation");
    getLocationAndUpdate();
  });
}

// ======== بدء التطبيق ========
function startApp(lat, lng) {
  initQibla(lat, lng);
  loadPrayerTimes(lat, lng);
  updateHijriDate();
}

document.addEventListener("DOMContentLoaded", getLocationAndUpdate);



// mobile-nav //
const prayerBtn = document.querySelector(".prayer-btn");
  const qiblaBtn = document.querySelector(".qibla-btn");
  const zikrBtn = document.querySelector(".zikr-btn");

  // نجيب الأقسام
  const prayerContent = document.querySelector(".prayer-content");
  const qiblaSection = document.querySelector("#qiblaSection");
  const zikrSection = document.querySelector(".zikr");

  // دالة تعرض قسم واحد وتخفي الباقي
  function showSection(section) {
    // نخفي الكل
    prayerContent.style.display = "none";
    qiblaSection.style.display = "none";
    zikrSection.style.display = "none";

    // نعرض القسم المطلوب
    section.style.display = "block";
  }

  // ربط الأزرار بالأقسام
  prayerBtn.addEventListener("click", () => showSection(prayerContent));
  qiblaBtn.addEventListener("click", () => showSection(qiblaSection));
  zikrBtn.addEventListener("click", () => showSection(zikrSection));

  const navItems = document.querySelectorAll(".mobile-nav li");

navItems.forEach(item => {
  item.addEventListener("click", () => {

    navItems.forEach(i => i.classList.remove("active"));

    item.classList.add("active");

  });
});
const moreBtn = document.querySelector(".more-btn");
const sideNav = document.getElementById("side-nav");
const closeIcon = document.querySelector(".close-icon");
const overlay = document.getElementById("menu-overlay");


function openMenu(){

  sideNav.classList.add("open");

  overlay.classList.add("show");

}

function closeMenu(){

  sideNav.classList.remove("open");

  overlay.classList.remove("show");
  moreBtn.classList.remove("active");

}

moreBtn.addEventListener("click", openMenu);

closeIcon.addEventListener("click", closeMenu);

overlay.addEventListener("click", closeMenu);
