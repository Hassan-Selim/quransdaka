// notifications.js
console.log("Notifications script loaded ✅");

// ======== تسجيل Service Worker ========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js') // تأكد إن ده مسار ملف الـ SW بتاعك
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
  if(diff < 0) diff += 24*60*60*1000; 

  setTimeout(() => {
    sendNotification(title, body, url);
    setInterval(() => sendNotification(title, body, url), 24*60*60*1000); 
  }, diff);
}

// ======== التعديل الجديد: المراقبة المستمرة لمواقيت الصلاة ========
let currentPrayerTimes = null;
let lastNotifiedPrayer = null;

function setupPrayerNotifications(prayerTimes) {
  if (Notification.permission !== "granted") return;
  currentPrayerTimes = prayerTimes;
  console.log("تم استلام مواقيت الصلاة وتفعيل المراقبة ✅");
}
window.setupPrayerNotifications = setupPrayerNotifications;

// حلقة تفحص الوقت كل 10 ثواني طول ما الموقع مفتوح في أي صفحة
setInterval(() => {
  if (!currentPrayerTimes) return;

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTimeString = `${currentHour}:${currentMinute}`;

  Object.entries(currentPrayerTimes).forEach(([prayerName, timeObj]) => {
    // بناءً على كودك القديم، إنت بتبعت التاريخ كـ Date String أو Object
    // بنحوله لـ ساعات ودقائق عشان نقارنه بالوقت الحالي
    const prayerDate = new Date(timeObj);
    const prayerHour = prayerDate.getHours().toString().padStart(2, '0');
    const prayerMinute = prayerDate.getMinutes().toString().padStart(2, '0');
    const prayerTimeString = `${prayerHour}:${prayerMinute}`;

    if (currentTimeString === prayerTimeString && lastNotifiedPrayer !== prayerName) {
      lastNotifiedPrayer = prayerName;
      
      // 1. تشغيل صوت الأذان (تأكد من مسار ملف الصوت بتاعك)
      playAzanSound();

      // 2. إرسال أمر للـ Service Worker ليعرض الإشعار فوراً
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_PRAYER_NOTIFICATION",
          prayerName: prayerName
        });
      }
    }
  });

  // تفريغ المتغير في آخر دقيقة من الساعة عشان يشتغل اليوم اللي بعده
  if (now.getMinutes() === 59) {
     lastNotifiedPrayer = null;
  }
}, 10000);

function playAzanSound() {
  // ⚠️ ضع المسار الصحيح لملف الأذان الخاص بك هنا
  const azanAudio = new Audio('../img/adhan.mp3'); 
  azanAudio.play().catch(err => console.log("المتصفح منع التشغيل التلقائي للصوت:", err));
}

// ======== طلب إذن الإشعارات وتشغيل الأذكار ========
document.addEventListener("DOMContentLoaded", () => {
  Notification.requestPermission().then(permission => {
    if(permission === "granted"){
      console.log("تم السماح بالإشعارات ✅");
      setTimeout(firstRandomAzkar, 3000); 
      scheduleDailyAzkar(); 
    } else {
      console.warn("الإشعارات مرفوضة ❌");
    }
  });
});