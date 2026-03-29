
/* const popup = document.getElementById("welcomePopup");
const STORAGE_KEY = "welcomePopupShown";

// لو العنصر موجود وما ظهرش قبل كده
if (popup && !localStorage.getItem(STORAGE_KEY)) {
  window.addEventListener("load", () => {
    // تظهر بعد 5 ثواني
    setTimeout(() => {
      popup.classList.add("show");

      // تختفي بعد 3 ثواني
      setTimeout(() => {
        popup.classList.remove("show");
      }, 3000);

      // سجلنا إنها ظهرت مرة واحدة
      localStorage.setItem(STORAGE_KEY, "true");
    }, 5000);
  });
}

 */
window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  setTimeout(() => {
    splash.style.display = "none";
  }, 2000); // تختفي بعد ثانيتين
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker مسجل بنجاح"))
    .catch(err => console.error("فشل تسجيل Service Worker:", err));
}


/* تثبيت التطبيق - النسخة الشاملة */
let deferredPrompt;
const installBar = document.getElementById('installBar');
const installBtn = document.getElementById('installBtn');
const installLater = document.getElementById('installLater');

const iosBtn = document.getElementById('iosBtn');
const iosPopup = document.getElementById('iosPopup');
const closePopup = document.getElementById('closePopup');

// 1. فحص الحالة: هل التطبيق مثبت فعلاً؟
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator.standalone === true);

// 2. فحص النظام (بدون تعقيد الـ Regex بتاع سافاري)
const ua = window.navigator.userAgent.toLowerCase();
const isIos = /iphone|ipad|ipod/.test(ua);

// تصفير الواجهة في البداية
installBar.style.display = 'none';
iosBtn.style.display = 'none';

// --- منطق أجهزة iOS (آيفون/آيباد) ---
if (isIos && !isStandalone) {
  // بنظهره لكل مستخدمي iOS لأن كلهم بيحتاجوا إضافة يدوية
  iosBtn.style.display = 'flex';
}

// --- منطق أجهزة أندرويد وويندوز (سامسونج، كروم، فايرفوكس...) ---
window.addEventListener('beforeinstallprompt', (e) => {
  // لو الحدث ده اشتغل، يبقى المتصفح بيدعم التثبيت التلقائي
  e.preventDefault();
  deferredPrompt = e;

  // إظهار البانر بعد 5 ثواني لو مش متسيف "لاحقاً"
  setTimeout(() => {
    if (!localStorage.getItem('installLater') && !isStandalone) {
      installBar.style.display = 'flex';
    }
  }, 5000);
});

// تنفيذ التثبيت (أندرويد/سامسونج/كروم)
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBar.style.display = 'none';
      localStorage.setItem('appInstalled', 'true');
    }
    deferredPrompt = null;
  }
});

// زرار "لاحقاً"
installLater.addEventListener('click', () => {
  installBar.style.display = 'none';
  localStorage.setItem('installLater', 'true');
});

// إظهار الـ Popup التعليمي لـ iOS
iosBtn.addEventListener('click', () => {
  iosPopup.style.display = 'flex';
});

// إغلاق الـ Popup
closePopup.addEventListener('click', () => {
  iosPopup.style.display = 'none';
});

// لو التطبيق مثبت، اخفي كل حاجة
if (isStandalone) {
  installBar.style.display = 'none';
  iosBtn.style.display = 'none';
}