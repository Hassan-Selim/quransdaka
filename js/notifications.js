console.log("Notifications script loaded ✅");

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => console.log("Service Worker مسجل بنجاح:", registration))
    .catch(err => console.error("فشل تسجيل Service Worker:", err));
} else {
  console.warn("Service Worker غير مدعوم في هذا المتصفح.");
}



// ================= دالة إرسال إشعارات =================
function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.showNotification(title, { body });
    });
  }
}

// ================= إشعارات الأذكار كل ساعة =================
function hourlyAzkar() {
  const azkar = [
    "سبحان الله وبحمده",
    "اللهم ارحم موتانا وموتى المسلمين",
    "اللهم إنك عفو تحب العفو فاعف عنا",
    "أستغفر الله العظيم",
    "لا إله إلا الله وحده لا شريك له"
  ];
  const msg = azkar[Math.floor(Math.random() * azkar.length)];
  sendNotification("ذكر اليوم 🌙", msg);
}

// شغل كل ساعة
setInterval(hourlyAzkar, 1000 * 60 * 60);

// ================= إشعارات الصباح والمساء =================
function scheduleNotification(title, body, hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  let diff = target - now;
  if (diff < 0) diff += 24 * 60 * 60 * 1000; // لو الوقت فات، اضف يوم

  setTimeout(() => {
    sendNotification(title, body);
    setInterval(() => sendNotification(title, body), 24 * 60 * 60 * 1000); // كرر كل يوم
  }, diff);
}

function scheduleMorningEvening() {
  scheduleNotification("أذكار الصباح 🌅", "اذكار الصباح: سبحان الله، الحمد لله ...", 6, 0);
  scheduleNotification("أذكار المساء 🌙", "اذكار المساء: أستغفر الله، اللهم صل على النبي ...", 18, 0);
}

// شغل بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", scheduleMorningEvening);

// ================= إشعارات الصلاة =================
// ⚠️ هذه الدالة مرتبطة بـ ramadan.js بعد جلب مواقيت الصلاة
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
        sendNotification(`وقت صلاة ${name}`, `الصلاة الآن (${timeStr}) 🌙`);
      }, diff);
    }
  });
}

// ربطها مع ramadan.js
window.setupPrayerNotifications = setupPrayerNotifications;

// ================= طلب إذن الإشعارات =================
Notification.requestPermission().then(permission => {
  if (permission === "granted") console.log("تم السماح بالإشعارات ✅");
  else console.warn("الإشعارات مرفوضة ❌");
});