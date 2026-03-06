// ============================
// ملف notifications.js كامل
// ============================

console.log("Notifications script loaded ✅");

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => console.log("Service Worker مسجل بنجاح:", registration))
    .catch(err => console.error("فشل تسجيل Service Worker:", err));
} else {
  console.warn("Service Worker غير مدعوم في هذا المتصفح.");
}

// دالة إرسال إشعار
function sendNotification(title, body, url = null) {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(title, {
          body,
          data: { url },
          icon: "../img/icon.webp"
        });
      }
    });
  }
}

// ============================
// أول ذكر عشوائي لكل جلسة
// ============================
function firstRandomAzkar() {
  if (!sessionStorage.getItem("firstVisitThisSession")) {
    const azkar = [
      "سبحان الله وبحمده",
      "اللهم ارحم موتانا وموتى المسلمين",
      "اللهم إنك عفو تحب العفو فاعف عنا",
      "أستغفر الله العظيم",
      "لا إله إلا الله وحده لا شريك له"
    ];
    const randomZikr = azkar[Math.floor(Math.random() * azkar.length)];
    sendNotification("ذكر اليوم 🌙", randomZikr, "../azkar");

    sessionStorage.setItem("firstVisitThisSession", "true");
  }
}

// ============================
// أذكار كل ساعة
// ============================
function hourlyAzkar() {
  const azkar = [
    "سبحان الله وبحمده",
    "اللهم ارحم موتانا وموتى المسلمين",
    "اللهم إنك عفو تحب العفو فاعف عنا",
    "أستغفر الله العظيم",
    "لا إله إلا الله وحده لا شريك له"
  ];
  const msg = azkar[Math.floor(Math.random() * azkar.length)];
  sendNotification("ذكر الساعة 🌙", msg, "../azkar");
}

// تشغيل كل ساعة
setInterval(hourlyAzkar, 1000 * 60 * 60);

// ============================
// أذكار الصباح والمساء
// ============================
function scheduleDailyAzkar() {
  scheduleNotification("أذكار الصباح 🌅", "اذكار الصباح: سبحان الله، الحمد لله ...", 6, 0, "../azkar");
  scheduleNotification("أذكار المساء 🌙", "اذكار المساء: أستغفر الله، اللهم صل على النبي ...", 18, 0, "../azkar");
}

function scheduleNotification(title, body, hour, minute, url) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  let diff = target - now;
  if (diff < 0) diff += 24 * 60 * 60 * 1000; // لو الوقت فات، اضف يوم

  setTimeout(() => {
    sendNotification(title, body, url);
    setInterval(() => sendNotification(title, body, url), 24 * 60 * 60 * 1000); // كرر كل يوم
  }, diff);
}

// ============================
// إشعارات مواقيت الصلاة
// ============================
// هذه الدالة مربوطة بملف ramadan.js
function setupPrayerNotifications(prayerTimes) {
  if (Notification.permission !== "granted") return;

  Object.entries(prayerTimes).forEach(([name, timeStr]) => {
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);

    let diff = prayerDate - now;
    if (diff > 0) {
      setTimeout(() => {
        sendNotification(`وقت صلاة ${name}`, `الصلاة الآن (${timeStr}) 🌙`, "../ramadan");
      }, diff);
    }
  });
}

window.setupPrayerNotifications = setupPrayerNotifications;

// ============================
// طلب إذن الإشعارات وتشغيل الأذكار
// ============================
document.addEventListener("DOMContentLoaded", () => {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      console.log("تم السماح بالإشعارات ✅");
      setTimeout(firstRandomAzkar, 6000); // أول ذكر بعد 3 ثواني
      scheduleDailyAzkar(); // أذكار الصباح والمساء
    } else {
      console.warn("الإشعارات مرفوضة ❌");
    }
  });
});