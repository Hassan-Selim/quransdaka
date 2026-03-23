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
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
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
  let diff = ((targetRotation - currentRotation + 180) % 360) - 180;
  if (diff < -180) diff += 360;

  currentRotation += diff * lerpFactor;

  drawNewCompass(currentRotation);
  requestAnimationFrame(animateQibla);
}

// ======== تشغيل القبلة ========
// 1. المتغيرات لازم تكون معرفة عالمياً (Global) عشان الكل يشوفها
// ======== تشغيل القبلة ========
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

  // تشغيل الأنيميشن (رسم البوصلة)
  animateQibla();

  const enableBtn = document.getElementById("enableCompass");
  const statusText = document.getElementById("statusText");

  // 1. الشيك المباشر على اللوكال ستوريدج
  const isCompassEnabled = localStorage.getItem("compassEnabled");

  if (isCompassEnabled === "true") {
    // لو متسجل إنه "true" (يعني داس عليه قبل كده)
    if (enableBtn) {
      enableBtn.style.display = "none"; // اخفي الزرار فوراً
    }
    if (statusText) {
      statusText.textContent = "البوصلة تعمل بشكل سليم";
    }
    // تشغيل قراءة الحساسات
    startCompassData();
  } else {
    // لو مش متسجل (يعني أول زيارة)
    if (enableBtn) {
      enableBtn.style.display = "block"; // تأكيد إظهار الزرار

      enableBtn.onclick = function () {
        // الكود اللي بيتنفذ لما يدوس على الزرار
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          // للأجهزة اللي بتطلب إذن
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
          // للأجهزة العادية واللاب توب
          activateCompass(enableBtn, statusText);
        }
      };
    }
  }
}

// الدالة المسؤولة عن التفعيل والحفظ في اللوكال ستوريدج
function activateCompass(btnElement, textElement) {
  startCompassData();

  // 2. إخفاء الزرار بمجرد الضغط
  if (btnElement) {
    btnElement.style.display = "none";
  }

  if (textElement) {
    textElement.textContent = "البوصلة تعمل بشكل سليم";
  }

  // 3. الحفظ في اللوكال ستوريدج عشان ميظهرش في الريفرش اللي جاي
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
    true,
  );
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

  // أسماء الشهور
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
  // جرب -1 أو -2 لحد ما تظبط معاك 29 رمضان
  const h = getManualHijri();
  todayDateEl.textContent = `${h.dayName} ${h.day} ${h.monthName} ${h.year} هـ`;
}

updateHijriDate();

// ======== الإشعارات ========
// ======== الإشعارات (طلب الإذن الاحتياطي) ========
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

  // السطر السحري: إرسال المواقيت لملف الإشعارات ليراقبها في الخلفية
  if (window.setupPrayerNotifications) {
    window.setupPrayerNotifications(prayerTimes);
  }
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

  // الدائرة الخلفية
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

  // دائرة التقدم (البروجرس)
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

  // تحديث الكلاسات لتحديد الصلاة القادمة في القائمة
  prayerListEl.querySelectorAll(".prayer-item").forEach((item) => {
    item.classList.remove("next-prayer");
    if (item.querySelector(".prayer-name").textContent === next.name) {
      item.classList.add("next-prayer");
    }
  });

  nextPrayerNameEl.textContent = next.name;

  // تنظيف العداد القديم وبدء عداد جديد
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const now = new Date();
    const prev = getPreviousPrayer(next.name);
    const diff = next.time - now;

    // رسم دائرة التقدم
    drawProgress(prev.time, next.time);

    let displayDiff;

    if (diff >= 0) {
      displayDiff = diff; // قبل الصلاة (عد تنازلي)
    } else {
      const passed = Math.abs(diff);

      if (passed <= 15 * 60 * 1000) {
        displayDiff = passed; // بعد الصلاة بـ 15 دقيقة (عد تصاعدي)
      } else {
        updateNextPrayer(); // التحديث للصلاة اللي بعدها
        return;
      }
    }

    // حساب الساعات والدقائق والثواني للعداد
    const hours = Math.floor(displayDiff / 3600000);
    const minutes = Math.floor((displayDiff % 3600000) / 60000);
    const seconds = Math.floor((displayDiff % 60000) / 1000);

    countdownEl.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // تم إزالة كود الأذان والإشعارات من هنا
    // ملف notifications.js سيقوم بهذه المهمة الآن بكفاءة في الخلفية
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

// 1. تجميع العناصر في مصفوفات (عشان نقلل التكرار)
const navItems = document.querySelectorAll(".mobile-nav li");
const azkarDetails = document.querySelectorAll(".azkar-detils");

// 2. عمل "خريطة" تربط كل زرار بالقسم بتاعه
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

// 3. دالة العرض والإخفاء
function showSection(targetContent) {
  // لفة واحدة تخفي كل الأقسام الرئيسية
  sectionsMap.forEach((item) => {
    if (item.content) item.content.style.display = "none";
  });

  // إخفاء تفاصيل الأذكار
  azkarDetails.forEach((detail) => (detail.style.display = "none"));

  // عرض القسم المطلوب
  if (targetContent) targetContent.style.display = "block";
}

// 4. تشغيل الأحداث (Event Listeners) للتبديل بين الأقسام
sectionsMap.forEach((item) => {
  if (item.btn) {
    item.btn.addEventListener("click", () => showSection(item.content));
  }
});

// 5. إدارة كلاس الـ Active للـ Nav
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    // اختصار سطرين في سطر واحد باستخدام (Optional Chaining)
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

moreBtn.addEventListener("click", openMenu);

closeIcon.addEventListener("click", closeMenu);

overlay.addEventListener("click", closeMenu);

const dailyAzkar = [
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ (100 مرة)",
  "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
  "أستغفر الله وأتوب إليه",
  "لا حول ولا قوة إلا بالله العلي العظيم",
];

function displayDailyZikr() {
  // استخدام تاريخ اليوم للحصول على رقم ثابت طوال اليوم
  const today = new Date();
  const dateSeed = today.getFullYear() + today.getMonth() + today.getDate();

  // اختيار ذكر بناءً على التاريخ
  const index = dateSeed % dailyAzkar.length;

  document.getElementById("dailyZikrText").innerText = dailyAzkar[index];
}

// تشغيل الدالة عند تحميل الصفحة
window.onload = displayDailyZikr;

// دالة إظهار الأذكار
function showAzkar(sectionId) {
  document.getElementById("main-grid").style.display = "none"; // اخفاء الشبكة
  document.getElementById("azkar-display-area").style.display = "block"; // اظهار منطقة العرض

  // سكرول لأعلى الصفحة
  window.scrollTo(0, 0);
}

// دالة العودة
function hideAzkar() {
  document.getElementById("azkar-display-area").style.display = "none";
  document.getElementById("main-grid").style.display = "grid";
}

// دالة الضغط على "تم"
function markAsDone(btn) {
  const card = btn.parentElement;
  card.style.opacity = "0.5";
  btn.innerText = "تمت";
  btn.classList.add("clicked");
}
// بنعمل مصفوفة (خريطة) بتضم كل قسم، الكارت بتاعه، والقسم اللي هيتفتح، وزرار الرجوع
const zikrCategories = [
  { card: ".card", section: ".prayer-zikr", backBtn: ".prayer-zikr .back-btn" }, // عدلت اختيار زرار الرجوع هنا عشان يكون دقيق
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

// بنعمل Loop يلف على كل الأقسام دي مرة واحدة
zikrCategories.forEach((item) => {
  // بنمسك العناصر من الـ HTML بناءً على الخريطة اللي فوق
  const cardElement = document.querySelector(item.card);
  const sectionElement = document.querySelector(item.section);
  // لو مفيش زرار مخصص جوه القسم، بنمسك الزرار العام (للاحتياط عشان زرار الصلاة عندك كان اسمه .back-btn بس)
  const backBtnElement =
    document.querySelector(item.backBtn) || document.querySelector(".back-btn");

  // التأكد إن العناصر موجودة عشان الكود ميضربش Error لو صفحة مفيهاش العناصر دي
  if (cardElement && sectionElement) {
    // حدث الفتح
    cardElement.addEventListener("click", () => {
      sectionElement.style.display = "flex";
    });
  }

  if (backBtnElement && sectionElement) {
    // حدث الإغلاق
    backBtnElement.addEventListener("click", () => {
      sectionElement.style.display = "none";
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  
  // دمجنا كل الأحداث في مكان واحد (Event Delegation)
  document.addEventListener("click", function (event) {
    
    // ==========================================
    // 1. كود إخفاء الذكر عند الضغط على "تم"
    // ==========================================
    if (event.target.classList.contains("done-btn")) {
      const listItem = event.target.closest("li");
      
      // بنمسك القسم الأب اللي جواه الذكر (تأكد إن ده كلاس القسم عندك)
      const currentSection = event.target.closest(".azkar-detils"); 

      if (listItem && currentSection) {
        // أنيميشن الاختفاء
        listItem.style.transition = "all 0.4s ease-in-out";
        listItem.style.opacity = "0";
        listItem.style.transform = "translateX(30px)";

        // بعد ما الأنيميشن يخلص
        setTimeout(() => {
          listItem.style.display = "none";
          listItem.classList.add("completed-zikr"); 

          // هنا التعديل: سمينا المتغير sectionShowBtn عشان يمسك زرار القسم ده بس
          const sectionShowBtn = currentSection.querySelector(".showHiddenBtnazz");

          // بنستخدم الاسم الجديد هنا عشان نتجنب الإيرور اللي ظهرلك
          if (sectionShowBtn) {
            sectionShowBtn.style.display = "block";
            // أنيميشن ناعم لظهور الزرار
            setTimeout(() => {
              sectionShowBtn.style.opacity = "1";
            }, 10);
          }
        }, 400);
      }
    }

    // ==========================================
    // 2. كود إرجاع الأذكار لما ندوس على زرار "الإظهار"
    // ==========================================
    if (event.target.classList.contains("showHiddenBtnazz")) {
      
      const currentSection = event.target.closest(".azkar-detils"); 

      if (currentSection) {
        const hiddenAzkar = currentSection.querySelectorAll(".completed-zikr");

        hiddenAzkar.forEach(zikr => {
          zikr.style.display = "flex"; 
          
          setTimeout(() => {
            zikr.style.opacity = "1";
            zikr.style.transform = "translateX(0)";
          }, 10);
          
          zikr.classList.remove("completed-zikr"); 
        });

        // نخفي زرار الإظهار نفسه
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
    // نجيب النص المرتبط بالزرار (الـ span اللي جنبه)
    const textToCopy = this.previousElementSibling.textContent;

    btn.textContent = "تم النسخ ✅";
    // نرجع النص الأصلي بعد 2 ثانية
    setTimeout(() => {
      btn.textContent = "نسخ";
    }, 2000);
    if (!textToCopy) return;

    // نسخ النص إلى الحافظة
    navigator.clipboard.writeText(textToCopy).catch((err) => {
      console.error("خطأ في النسخ:", err);
      alert("حدث خطأ في النسخ، حاول مرة أخرى.");
    });
  });
});

// تحديد العناصر من الـ HTML
const dhikrSelect = document.getElementById("dhikrSelect");
const counterDisplay = document.getElementById("counter");
const tasbeehBtn = document.getElementById("tasbeehBtn");
const resetBtn = document.getElementById("resetBtn");

// إعداد كائن (Object) لتخزين العداد لكل نوع من الذكر
// نقوم بجلب البيانات المحفوظة مسبقاً، وإن لم توجد ننشئ أصفاراً كبداية
let tasbeehCounts = JSON.parse(localStorage.getItem("tasbeehData")) || {
  subhan: 0,
  hamd: 0,
  takbeer: 0,
  tahlil: 0,
  istighfar: 0,
};

// دالة لتحديث الرقم المعروض على الشاشة بناءً على الذكر المختار
function updateDisplay() {
  const currentDhikr = dhikrSelect.value;
  counterDisplay.textContent = tasbeehCounts[currentDhikr];
}

// دالة لحفظ التغييرات في ذاكرة المتصفح
function saveData() {
  localStorage.setItem("tasbeehData", JSON.stringify(tasbeehCounts));
}

// 1. حدث الضغط على زر التسبيح
tasbeehBtn.addEventListener("click", () => {
  // معرفة الذكر المحدد حالياً
  const currentDhikr = dhikrSelect.value;

  // زيادة العداد بمقدار 1
  tasbeehCounts[currentDhikr]++;

  // تحديث الشاشة وحفظ البيانات
  updateDisplay();
  saveData();

  // تفعيل اهتزاز خفيف للموبايل (إن كان المتصفح يدعم ذلك)
  // 50 مللي ثانية تعطي إحساساً بنقرة زر خفيفة
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
});

// 2. حدث الضغط على زر تصفير العداد
resetBtn.addEventListener("click", () => {
  const currentDhikr = dhikrSelect.value;

  // التأكد من نية المستخدم قبل التصفير (اختياري، يمكنك إزالته إن أردت التصفير المباشر)
  if (confirm("هل أنت متأكد أنك تريد تصفير عداد هذا الذكر؟")) {
    tasbeehCounts[currentDhikr] = 0;
    updateDisplay();
    saveData();
  }
});

// 3. حدث تغيير الذكر من القائمة المنسدلة
dhikrSelect.addEventListener("change", () => {
  // بمجرد اختيار ذكر آخر، يتم عرض العداد الخاص به
  updateDisplay();
});

// تشغيل دالة التحديث عند فتح الصفحة لأول مرة لعرض الرقم الصحيح
updateDisplay();
