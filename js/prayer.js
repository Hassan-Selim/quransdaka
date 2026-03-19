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


// ======== صوت الأذان داخل الصفحة فقط ========
const adhanAudio = new Audio("../img/adhan.mp3");
let adhanPlayedFor = null;

// ======== المتغيرات ========
let prayerTimes = {};
let countdownInterval;

// ======== القبلة ========
// ======== متغيرات القبلة (Global) ========



const lerpFactor = 0.1; 
const kaabaLat = 21.4225;
const kaabaLng = 39.8262;

// ======== حساب الزاوية (Bearing) ========
function calculateBearing(lat1, lng1) {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (kaabaLat * Math.PI) / 180;
    const Δλ = ((kaabaLng - lng1) * Math.PI) / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
}

// ======== دالة الرسم الجديدة (التصميم العصري) ========
function drawNewCompass(rotation) {
    if (!qCtx) return;
    qCtx.clearRect(0, 0, qiblaCanvas.width, qiblaCanvas.height);
    
    qCtx.save();
    qCtx.translate(center, center);
    qCtx.rotate((rotation * Math.PI) / 180); 

    // 1. الحلقة الحمراء الأساسية
    qCtx.beginPath();
    qCtx.arc(0, 0, radius, 0, 2 * Math.PI);
    qCtx.lineWidth = 22; 
    qCtx.strokeStyle = "#ff4d5a"; 
    qCtx.stroke();

    // 2. رأس السهم (المثلث) مدمج في الحلقة
    qCtx.beginPath();
    qCtx.fillStyle = "#ff4d5a";
    qCtx.moveTo(-18, -radius - 2); 
    qCtx.lineTo(18, -radius - 2);
    qCtx.lineTo(0, -radius - 38); 
    qCtx.closePath();
    qCtx.fill();

    qCtx.restore();

    // 3. رسم الكعبة في المركز (ثابتة)
    drawKaabaIcon();
}

function drawKaabaIcon() {
    qCtx.save();
    qCtx.translate(center, center);
    
    // إعدادات الخط وحجم الإيموجي
    const fontSize = 45; // كبرنا الحجم شوية عشان يبقى واضح
    qCtx.font = `${fontSize}px serif`;
    qCtx.textAlign = "center";
    qCtx.textBaseline = "middle";

    // إضافة ظل خفيف للإيموجي عشان يبرز عن الخلفية
    qCtx.shadowBlur = 10;
    qCtx.shadowColor = "rgba(0,0,0,0.5)";

    // رسم إيموجي الكعبة
    qCtx.fillText("🕋", 0, 0);
    
    qCtx.restore();
}

// ======== دالة التحريك السلس ========
function animateQibla() {
    // حل مشكلة النطة بين 0 و 360 درجة
    let diff = (targetRotation - currentRotation + 180) % 360 - 180;
    if (diff < -180) diff += 360;
    
    currentRotation += diff * lerpFactor;

    drawNewCompass(currentRotation);
    requestAnimationFrame(animateQibla);
}

// ======== تشغيل القبلة ========
// 1. المتغيرات لازم تكون معرفة عالمياً (Global) عشان الكل يشوفها
let qiblaBearing = 0;
let currentRotation = 0;
let targetRotation = 0;
let qiblaCanvas, qCtx, center, radius;

function initQibla(lat, lng) {
    qiblaCanvas = document.getElementById("qiblaCompass");
    if (!qiblaCanvas) return;

    qCtx = qiblaCanvas.getContext("2d");
    center = qiblaCanvas.width / 2;
    radius = 85;

    // الحساب الأصلي بتاعك (البوصلة ثابتة في البداية)
    qiblaBearing = calculateBearing(lat, lng);
    targetRotation = qiblaBearing; 

    // ابدأ الرسم فوراً حتى لو مفيش إذن (عشان السيركل تظهر)
    animateQibla();

    const enableBtn = document.getElementById('enableCompass');
    const statusText = document.getElementById('statusText');

    if (enableBtn) {
        enableBtn.onclick = function() {
            // طلب الإذن للأيفون
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permission => {
                        if (permission === 'granted') {
                            startCompassData();
                            enableBtn.style.display = 'none';
                            if(statusText) statusText.textContent = "البوصلة تعمل";
                        }
                    })
                    .catch(console.error);
            } else {
                // أندرويد
                startCompassData();
                enableBtn.style.display = 'none';
            }
        };
    }
}

function startCompassData() {
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(eventName, (e) => {
        let compass = 0;
        if (e.webkitCompassHeading) {
            compass = e.webkitCompassHeading;
        } else if (e.alpha !== null) {
            compass = 360 - e.alpha;
        }
        // تحديث الهدف للأنيميشن
        targetRotation = qiblaBearing - compass;
    }, true);
}


// ======== التاريخ الهجري ========
function getManualHijri(offset = 0) {
    let date = new Date();
    date.setDate(date.getDate() + offset);

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (month < 3) {
        year -= 1;
        month += 12;
    }

    let a = Math.floor(year / 100);
    let b = 2 - a + Math.floor(a / 4);
    let jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;

    let z = Math.floor(jd + 0.5);
    let cyc = Math.floor((z - 1948440 + 1.0) / 10631);
    let l = z - 1948440 - 10631 * cyc;
    let j = Math.floor((l - 1) / 354.36667);
    let r = l - Math.floor(j * 354.36667 + 0.5);
    let m = Math.floor((r - 1) / 29.5);
    let d = Math.floor(r - 29.5 * m + 0.5);
    let y = 30 * cyc + j + 1;

    // أسماء الشهور
    const months = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
    const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    return {
        dayName: weekdays[date.getDay()],
        day: d,
        monthName: months[m],
        year: y
    };
}

function updateHijriDate() {
    // جرب -1 أو -2 لحد ما تظبط معاك 29 رمضان
    const h = getManualHijri(); 
    todayDateEl.textContent = `${h.dayName} ${h.day} ${h.monthName} ${h.year} هـ`;
}

updateHijriDate();


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
  ctx.lineWidth = 12;
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
  ctx.lineWidth = 12;
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


// Draw route
async function drawRoute(from, to) {
  if (routeLayer) map.removeLayer(routeLayer);

  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();

  routeLayer = L.geoJSON(data.routes[0].geometry).addTo(map);
  map.fitBounds(routeLayer.getBounds());
}


