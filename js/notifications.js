// notifications.js
console.log("Notifications script loaded ✅");

// ======== تسجيل Service Worker ========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log("Service Worker مسجل بنجاح:", reg))
    .catch(err => console.error("فشل تسجيل Service Worker:", err));
} else {
  console.warn("Service Worker غير مدعوم في هذا المتصفح.");
}

// ======== دالة إرسال إشعار ========
function sendNotification(title, body, url) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon: "/img/icon.webp",
        badge: "/img/icon.webp",
        data: { url }
      });
    });
  } else {
    new Notification(title, { body, icon: "/img/icon.webp" });
  }
}

// ======== إشعار أول زيارة (ذكر اليوم) ========
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
    console.log(`First random azkar: ${randomZikr}`);
    // نرسل الإشعار بعد التأكد من جاهزية SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification("ذكر اليوم 🌙", {
          body: randomZikr,
          icon: "/img/icon.webp",
          badge: "/img/icon.webp",
          data: { url: "/azkar" }
        });
      });
    } else {
      new Notification("ذكر اليوم 🌙", { body: randomZikr, icon: "/img/icon.webp" });
    }

    sessionStorage.setItem("firstVisitThisSession", "true");
  }
}

// ======== أذكار كل ساعة ========
function hourlyAzkar() {
  const azkar = [
    "سبحان الله وبحمده",
    "اللهم ارحم موتانا وموتى المسلمين",
    "اللهم إنك عفو تحب العفو فاعف عنا",
    "أستغفر الله العظيم",
    "لا إله إلا الله وحده لا شريك له"
  ];
  const msg = azkar[Math.floor(Math.random() * azkar.length)];
  sendNotification("ذكر الساعة 🌙", msg, "/azkar");
}
setInterval(hourlyAzkar, 1000*60*60);

// ======== أذكار الصباح والمساء ========
function scheduleDailyAzkar() {
  scheduleNotification("أذكار الصباح 🌅", "اذكار الصباح: سبحان الله، الحمد لله ...", 6, 0, "/azkar");
  scheduleNotification("أذكار المساء 🌙", "اذكار المساء: أستغفر الله، اللهم صل على النبي ...", 18, 0, "/azkar");
}

function scheduleNotification(title, body, hour, minute, url) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  let diff = target - now;
  if(diff < 0) diff += 24*60*60*1000; // لو الوقت فات، نضيف يوم

  setTimeout(() => {
    sendNotification(title, body, url);
    setInterval(() => sendNotification(title, body, url), 24*60*60*1000); // كرر كل يوم
  }, diff);
}

// ======== إشعارات مواقيت الصلاة ========
function setupPrayerNotifications(prayerTimes) {
  if (Notification.permission !== "granted") return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // ✅ تحقق من وجود controller قبل postMessage
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SET_PRAYER_TIMES",
          times: prayerTimes
        });
      } else {
        console.warn("SW controller غير موجود، لم يتم إرسال مواقيت الصلاة");
      }
    });
  }
}
window.setupPrayerNotifications = setupPrayerNotifications;

// ======== طلب إذن الإشعارات وتشغيل الأذكار ========
document.addEventListener("DOMContentLoaded", () => {
  Notification.requestPermission().then(permission => {
    if(permission === "granted"){
      console.log("تم السماح بالإشعارات ✅");
      setTimeout(firstRandomAzkar, 3000); // أول ذكر بعد 3 ثواني
      scheduleDailyAzkar(); // أذكار الصباح والمساء
    } else {
      console.warn("الإشعارات مرفوضة ❌");
    }
  });
});