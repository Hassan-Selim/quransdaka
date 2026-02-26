console.log("Notifications script loaded ✅");

// ================= Service Worker =================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log("Service Worker مسجل بنجاح:", registration);

      // ================= Firebase Config =================
      const firebaseConfig = {
        apiKey: "AIzaSyCb_96TzCvRetQWHIqn-lExzGcCHKT7E0E",
        authDomain: "quran-sadaka.firebaseapp.com",
        projectId: "quran-sadaka",
        storageBucket: "quran-sadaka.appspot.com",
        messagingSenderId: "375258784873",
        appId: "1:375258784873:web:d92b2fc154187b0e1f2ef8",
        measurementId: "G-XJ4G6WV316"
      };

      // منع Duplicate App
      let app;
      try {
        app = firebase.app();
      } catch (e) {
        app = firebase.initializeApp(firebaseConfig);
      }

      const messaging = firebase.messaging();

      // ================= طلب إذن الإشعارات =================
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log("Notification permission granted.");

          messaging.getToken({
            vapidKey: "BBBtubURw4DTgm4XWhgNj-x0_kzHjnLt9pWA0_9In9wqpO3DmIecYxMdqcPlD3L6Mt7vPOmg8Q6Zc1KXc9oEGug"
          }).then(token => {
            console.log("User Token:", token);
          }).catch(err => {
            console.log("Error retrieving token:", err);
          });
        }
      });

      // ================= استقبال الإشعارات أثناء فتح الصفحة =================
      messaging.onMessage((payload) => {
        const { title, body } = payload.notification || {};
        if (title && body) {
          new Notification(title, { body });
        }
      });
    })
    .catch(err => console.error("فشل تسجيل Service Worker:", err));
} else {
  console.warn("Service Worker غير مدعوم في هذا المتصفح.");
}

// ================= دالة إرسال إشعارات عامة =================
function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(title, { body });
      }
    });
  }
}

// ================= إشعارات الأذكار كل ساعة =================
setInterval(() => {
  const azkar = [
    "سبحان الله وبحمده",
    "اللهم ارحم موتانا وموتى المسلمين",
    "اللهم إنك عفو تحب العفو فاعف عنا",
    "أستغفر الله العظيم",
    "لا إله إلا الله وحده لا شريك له"
  ];
  const msg = azkar[Math.floor(Math.random() * azkar.length)];
  sendNotification("ذكر اليوم 🌙", msg);
}, 1000 * 60 * 60); // كل ساعة

// ================= إشعارات الصلاة من API =================
function setupPrayerNotifications(prayerTimes) {
  if (!Notification.permission === "granted") return;

  Object.entries(prayerTimes).forEach(([name, timeStr]) => {
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);

    const diff = prayerDate - now;
    if (diff > 0) {
      setTimeout(() => {
        sendNotification(`وقت صلاة ${name}`, `الصلاة الآن (${timeStr}) 🌙`);
      }, diff);
    }
  });
}

// ⚠️ رابط هذه الدالة مع ramadan.js
window.setupPrayerNotifications = setupPrayerNotifications;