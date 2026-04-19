// الدرع الواقي: لو العنصر مش موجود، خليه يرجع كائن وهمي بدل null عشان الكود مبيضربش
const safeGet = (id) => document.getElementById(id) || { 
    innerText: "", textContent: "", style: {}, 
    addEventListener: () => {}, querySelectorAll: () => [], 
    getContext: () => null, value: "" 
};
import * as adhan from "./adhan.js";
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}
const prayerListEl = document.querySelector(".prayer-list");
const nextPrayerNameEl = document.getElementById("nextPrayerName");
const countdownEl = document.getElementById("nextPrayerCountdown");
const progressCanvas = document.getElementById("prayerProgress");
const ctx = progressCanvas ? progressCanvas.getContext("2d") : null;
const todayDateEl = document.getElementById("todayDate");
const locationNameEl = document.getElementById("locationName");
const refreshLocationBtn = document.getElementById("refreshLocationBtn");
const adhanAudio = new Audio("../img/adhan.mp3");
let adhanPlayedFor = null;
const safeAddListener = (el, event, fn) => {
    if (el) el.addEventListener(event, fn);
};
function playAdhan(prayerName) {
  if (adhanPlayedFor !== prayerName) {
    adhanAudio
      .play()
      .then(() => {
        console.log(`تم تشغيل أذان ${prayerName}`);
        adhanPlayedFor = prayerName;
      })
      .catch((err) => {
        console.log("المتصفح يحتاج تفاعل (ضغطة) لتشغيل الصوت أول مرة.");
      });
  }
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "PLAY_AZAN_NOW") {
      playAdhan("الصلاة");
    }
  });
}
window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("playAzan") === "true") {
    setTimeout(() => {
      playAdhan("الصلاة");
    }, 1000);
  }
});
let prayerTimes = {};
let countdownInterval;
const lerpFactor = 0.1;
const kaabaLat = 21.4225;
const kaabaLng = 39.8262;
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
function drawNewCompass(rotation) {
  if (!qCtx) return;
  qCtx.clearRect(0, 0, qiblaCanvas.width, qiblaCanvas.height);
  qCtx.save();
  qCtx.translate(center, center);
  qCtx.rotate((rotation * Math.PI) / 180);
  qCtx.beginPath();
  qCtx.arc(0, 0, radius, 0, 2 * Math.PI);
  qCtx.lineWidth = 22;
  qCtx.strokeStyle = "#ff4d5a";
  qCtx.stroke();
  qCtx.beginPath();
  qCtx.fillStyle = "#ff4d5a";
  qCtx.moveTo(-18, -radius - 2);
  qCtx.lineTo(18, -radius - 2);
  qCtx.lineTo(0, -radius - 38);
  qCtx.closePath();
  qCtx.fill();
  qCtx.restore();
  drawKaabaIcon();
}
function drawKaabaIcon() {
  qCtx.save();
  qCtx.translate(center, center);
  const fontSize = 45;
  qCtx.font = `${fontSize}px serif`;
  qCtx.textAlign = "center";
  qCtx.textBaseline = "middle";
  qCtx.shadowBlur = 10;
  qCtx.shadowColor = "rgba(0,0,0,0.5)";
  qCtx.fillText("🕋", 0, 0);
  qCtx.restore();
}
function animateQibla() {
  let diff = ((targetRotation - currentRotation + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  currentRotation += diff * lerpFactor;
  drawNewCompass(currentRotation);
  requestAnimationFrame(animateQibla);
}
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
  qiblaBearing = calculateBearing(lat, lng);
  targetRotation = qiblaBearing;
  animateQibla();
  const enableBtn = document.getElementById("enableCompass");
  const statusText = document.getElementById("statusText");
  const isCompassEnabled = localStorage.getItem("compassEnabled");
  if (isCompassEnabled === "true") {
    if (enableBtn) {
      enableBtn.style.display = "none";
    }
    if (statusText) {
      statusText.textContent = "البوصلة تعمل بشكل سليم";
    }
    startCompassData();
  } else {
    if (enableBtn) {
      enableBtn.style.display = "block";
      enableBtn.onclick = function () {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          DeviceOrientationEvent.requestPermission()
            .then((permission) => {
              if (permission === "granted") {
                activateCompass(enableBtn, statusText);
              } else {
                if (statusText) statusText.textContent = "تم رفض إذن البوصلة";
              }
            })
            .catch(console.error);
        } else {
          activateCompass(enableBtn, statusText);
        }
      };
    }
  }
}
function activateCompass(btnElement, textElement) {
  startCompassData();
  if (btnElement) {
    btnElement.style.display = "none";
  }
  if (textElement) {
    textElement.textContent = "البوصلة تعمل بشكل سليم";
  }
  localStorage.setItem("compassEnabled", "true");
}
function startCompassData() {
  const eventName =
    "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";
  window.addEventListener(
    eventName,
    (e) => {
      let compass = 0;
      if (e.webkitCompassHeading) {
        compass = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha;
      }
      targetRotation = qiblaBearing - compass;
    },
    !0,
  );
}
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
  let jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5;
  let z = Math.floor(jd + 0.5);
  let cyc = Math.floor((z - 1948440 + 1.0) / 10631);
  let l = z - 1948440 - 10631 * cyc;
  let j = Math.floor((l - 1) / 354.36667);
  let r = l - Math.floor(j * 354.36667 + 0.5);
  let m = Math.floor((r - 1) / 29.5);
  let d = Math.floor(r - 29.5 * m + 0.5);
  let y = 30 * cyc + j + 1;
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
  return {
    dayName: weekdays[date.getDay()],
    day: d,
    monthName: months[m],
    year: y,
  };
}
function updateHijriDate() {
  const h = getManualHijri();
  // نتحقق أولاً: هل العنصر موجود في الصفحة الحالية؟
if (todayDateEl) {
    todayDateEl.textContent = `${h.dayName} ${h.day} ${h.monthName} ${h.year} هـ`;
}
}
updateHijriDate();
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}
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
  if (window.setupPrayerNotifications) {
    window.setupPrayerNotifications(prayerTimes);
  }
  
    window.prayerTimes = prayerTimes; // تأكيد تخزين البيانات عالمياً
    updateNextPrayer(); // تحديث العداد
    
    // السطر السحري: إرسال تنبيه لكل الموقع إن البيانات جهزت
    window.dispatchEvent(new Event('prayerTimesReady'));

}

window.updatePrayerList = function () {
    if (!prayerListEl) return;
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
window.getNextPrayer = function () {
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
  if (idx === 0) return { time: prayerTimes.العشاء };
  return { time: prayerTimes[names[idx - 1]] };
}
function drawProgress(prevTime, nextTime) {
    if (!ctx) return;
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

    // --- 1. تحديث قائمة الصلوات (فقط لو العنصر موجود - صفحة الصلاة) ---
    if (typeof prayerListEl !== 'undefined' && prayerListEl) {
        prayerListEl.querySelectorAll(".prayer-item").forEach((item) => {
            item.classList.remove("next-prayer");
            if (item.querySelector(".prayer-name").textContent === next.name) {
                item.classList.add("next-prayer");
            }
        });
    }

    // --- 2. تحديث اسم الصلاة (يعمل في الصفحتين) ---
    if (nextPrayerNameEl) {
        nextPrayerNameEl.textContent = next.name;
    }

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date();
        const prev = getPreviousPrayer(next.name);
        const diff = next.time - now;

        // --- 3. رسم البروجرس (فقط لو الكانفاس موجود - صفحة الصلاة) ---
        if (typeof ctx !== 'undefined' && ctx && progressCanvas) {
            drawProgress(prev.time, next.time);
        }

        let displayDiff = diff >= 0 ? diff : 0;

        const hours = Math.floor(displayDiff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((displayDiff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((displayDiff % 60000) / 1000).toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}:${seconds}`;

        // --- 4. تحديث العداد (دعم الـ IDs المختلفة في الصفحتين) ---
        // العداد الأصلي (صفحة الصلاة)
        if (typeof countdownEl !== 'undefined' && countdownEl) {
            countdownEl.textContent = timeStr;
        }
        
        // عداد الصفحة الرئيسية (الذي وضعته في الـ HTML الجديد)
        const homeCount = document.getElementById("homeCountdown");
        if (homeCount) {
            homeCount.textContent = timeStr;
        }

    }, 1000);
}
async function getLocationAndUpdate() {
  if (localStorage.getItem("userLocation")) {
    const saved = JSON.parse(localStorage.getItem("userLocation"));
    startApp(saved.lat, saved.lng);
    if (locationNameEl) {
            locationNameEl.innerText = saved.region;
        }
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
        if (locationNameEl) {
    locationNameEl.innerText = region || "موقع غير معروف";
}
      }
      startApp(lat, lng);
    },
    (err) => {
      locationNameEl.innerText = "رفض تحديد الموقع";
    },
  );
}
if (refreshLocationBtn) {
  refreshLocationBtn.addEventListener("click", () => {
    locationNameEl.innerText = "...";
    localStorage.removeItem("userLocation");
    getLocationAndUpdate();
  });
}
function startApp(lat, lng) {
  initQibla(lat, lng);
  loadPrayerTimes(lat, lng);
  updateHijriDate();
}
document.addEventListener("DOMContentLoaded", getLocationAndUpdate);
const navItems = document.querySelectorAll(".mobile-nav li");
const azkarDetails = document.querySelectorAll(".azkar-detils");
const sectionsMap = [
  {
    btn: document.querySelector(".prayer-btn"),
    content: document.querySelector(".prayer-content"),
  },
  {
    btn: document.querySelector(".qibla-btn"),
    content: document.querySelector("#qiblaSection"),
  },
  {
    btn: document.querySelector(".zikr-btn"),
    content: document.querySelector(".azkar-wrapper"),
  },
];
function showSection(targetContent) {
  sectionsMap.forEach((item) => {
    if (item.content) item.content.style.display = "none";
  });
  azkarDetails.forEach((detail) => (detail.style.display = "none"));
  if (targetContent) targetContent.style.display = "block";
}
sectionsMap.forEach((item) => {
  if (item.btn) {
    item.btn.addEventListener("click", () => showSection(item.content));
  }
});
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelector(".mobile-nav li.active")?.classList.remove("active");
    item.classList.add("active");
  });
});
const moreBtn = document.querySelector(".more-btn");
const sideNav = document.getElementById("side-nav");
const closeIcon = document.querySelector(".close-icon");
const overlay = document.getElementById("menu-overlay");
function openMenu() {
  sideNav.classList.add("open");
  overlay.classList.add("show");
}
function closeMenu() {
  sideNav.classList.remove("open");
  overlay.classList.remove("show");
  moreBtn.classList.remove("active");
}
// تأمين زرار القائمة (سطر 464)
if (moreBtn) moreBtn.addEventListener("click", openMenu);
if (closeIcon) closeIcon.addEventListener("click", closeMenu);
if (overlay) overlay.addEventListener("click", closeMenu);
const dailyAzkar = [
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ (100 مرة)",
  "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
  "أستغفر الله وأتوب إليه",
  "لا حول ولا قوة إلا بالله العلي العظيم",
];
function displayDailyZikr() {
    const dailyZikrTextEl = document.getElementById("dailyZikrText");
    if (!dailyZikrTextEl) return; // حماية: لو مش موجود اخرج
    const today = new Date();
    const dateSeed = today.getFullYear() + today.getMonth() + today.getDate();
    const index = dateSeed % dailyAzkar.length;
    dailyZikrTextEl.innerText = dailyAzkar[index];
}
window.onload = displayDailyZikr;
function showAzkar(sectionId) {
  document.getElementById("main-grid").style.display = "none";
  document.getElementById("azkar-display-area").style.display = "block";
  window.scrollTo(0, 0);
}
function hideAzkar() {
  document.getElementById("azkar-display-area").style.display = "none";
  document.getElementById("main-grid").style.display = "grid";
}
function markAsDone(btn) {
  const card = btn.parentElement;
  card.style.opacity = "0.5";
  btn.innerText = "تمت";
  btn.classList.add("clicked");
}
const zikrCategories = [
  { card: ".card", section: ".prayer-zikr", backBtn: ".prayer-zikr .back-btn" },
  {
    card: ".morning",
    section: ".morning-zikr",
    backBtn: ".morning-zikr .back-btn",
  },
  {
    card: ".evening",
    section: ".evening-zikr",
    backBtn: ".evening-zikr .back-btn",
  },
  { card: ".dua", section: ".doaa-zikr", backBtn: ".doaa-zikr .back-btn" },
  {
    card: ".tasbeeh",
    section: ".tasbeeh-section",
    backBtn: ".tasbeeh-section .back-btn",
  },
];
zikrCategories.forEach((item) => {
  const cardElement = document.querySelector(item.card);
  const sectionElement = document.querySelector(item.section);
  const backBtnElement =
    document.querySelector(item.backBtn) || document.querySelector(".back-btn");
  if (cardElement && sectionElement) {
    window.scrollTo({ top: 0, behavior: "instant" });
    cardElement.addEventListener("click", () => {
      sectionElement.style.display = "flex";
    });
  }
  if (backBtnElement && sectionElement) {
    backBtnElement.addEventListener("click", () => {
      sectionElement.style.display = "none";
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("done-btn")) {
      const listItem = event.target.closest("li");
      const currentSection = event.target.closest(".azkar-detils");
      if (listItem && currentSection) {
        listItem.style.transition = "all 0.4s ease-in-out";
        listItem.style.opacity = "0";
        listItem.style.transform = "translateX(30px)";
        setTimeout(() => {
          listItem.style.display = "none";
          listItem.classList.add("completed-zikr");
          const sectionShowBtn =
            currentSection.querySelector(".showHiddenBtnazz");
          if (sectionShowBtn) {
            sectionShowBtn.style.display = "block";
            setTimeout(() => {
              sectionShowBtn.style.opacity = "1";
            }, 10);
          }
        }, 400);
      }
    }
    if (event.target.classList.contains("showHiddenBtnazz")) {
      const currentSection = event.target.closest(".azkar-detils");
      if (currentSection) {
        const hiddenAzkar = currentSection.querySelectorAll(".completed-zikr");
        hiddenAzkar.forEach((zikr) => {
          zikr.style.display = "flex";
          setTimeout(() => {
            zikr.style.opacity = "1";
            zikr.style.transform = "translateX(0)";
          }, 10);
          zikr.classList.remove("completed-zikr");
        });
        event.target.style.opacity = "0";
        setTimeout(() => {
          event.target.style.display = "none";
        }, 400);
      }
    }
  });
});
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const textToCopy = this.previousElementSibling.textContent;
    btn.textContent = "تم النسخ ✅";
    setTimeout(() => {
      btn.textContent = "نسخ";
    }, 2000);
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).catch((err) => {
      console.error("خطأ في النسخ:", err);
      alert("حدث خطأ في النسخ، حاول مرة أخرى.");
    });
  });
});
const dhikrSelect = document.getElementById("dhikrSelect");
const counterDisplay = document.getElementById("counter");
const tasbeehBtn = document.getElementById("tasbeehBtn");
const resetBtn = document.getElementById("resetBtn");
let tasbeehCounts = JSON.parse(localStorage.getItem("tasbeehData")) || {
  subhan: 0,
  hamd: 0,
  takbeer: 0,
  tahlil: 0,
  istighfar: 0,
};
window.updateDisplay = function () {
    if (!dhikrSelect) return;
  const currentDhikr = dhikrSelect.value;
  counterDisplay.textContent = tasbeehCounts[currentDhikr];
}
function saveData() {
  localStorage.setItem("tasbeehData", JSON.stringify(tasbeehCounts));
}
safeAddListener(tasbeehBtn, "click", () => {
  const currentDhikr = dhikrSelect.value;
  tasbeehCounts[currentDhikr]++;
  updateDisplay();
  saveData();
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
});
safeAddListener(resetBtn, "click", () => {
  const currentDhikr = dhikrSelect.value;
  if (confirm("هل أنت متأكد أنك تريد تصفير عداد هذا الذكر؟")) {
    tasbeehCounts[currentDhikr] = 0;
    updateDisplay();
    saveData();
  }
});
safeAddListener(dhikrSelect, "change", () => {
  updateDisplay();
});
updateDisplay();
window.getNextPrayer = getNextPrayer;
window.getManualHijri = getManualHijri;
window.prayerTimes = prayerTimes;
// محرك الدفع لضمان ظهور البيانات في الصفحة الرئيسية
function forceHomeUpdate() {
    if (typeof getNextPrayer !== 'function' || !prayerTimes || Object.keys(prayerTimes).length === 0) return;

    const next = getNextPrayer();
    if (!next) return;

    // تحديث الاسم
    const nameEl = document.getElementById("nextPrayerName");
    if (nameEl) nameEl.textContent = next.name;

    // تحديث التاريخ (للتأكيد)
    if (typeof getManualHijri === 'function') {
        const h = getManualHijri();
        const dateEl = document.getElementById("todayDate");
        if (dateEl) dateEl.textContent = `${h.dayName} ${h.day} ${h.monthName} ${h.year} هـ`;
    }

    // تشغيل العداد يدوياً إذا لم يكن قد بدأ
    if (typeof countdownInterval === 'undefined' || !countdownInterval) {
        updateNextPrayer(); 
    }
}

// محاولة التحديث بعد ثانية وبعد 3 ثواني لضمان تحميل الـ API
window.addEventListener('load', () => {
    setTimeout(forceHomeUpdate, 1000);
    setTimeout(forceHomeUpdate, 1000);
});