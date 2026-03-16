/* 
window.addEventListener("load", function () {
  const popup = document.getElementById("welcomePopup");
  if (popup) {
    popup.classList.add("show");
  } else {
    console.warn("عنصر النافذة المنبثقة غير موجود");
  }
}); */
document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("welcomePopup");

  if (!popup) return;

  // شغل الـ popup بعد 3 ثواني
  setTimeout(function () {
    popup.classList.add("show");

    // اخفيه بعد 2.5 ثانية
    setTimeout(function () {
      popup.classList.remove("show");
    }, 4000);
  }, 3000);
});
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



/* تثبيت التطبيق */
let deferredPrompt;
const installBar = document.getElementById('installBar');
const installBtn = document.getElementById('installBtn');
const installLater = document.getElementById('installLater');
const installLTxt = document.querySelector('.install-text');

const iosBar = document.getElementById('iosBar');
const iosBtn = document.getElementById('iosBtn');
const iosPopup = document.getElementById('iosPopup');
const closePopup = document.getElementById('closePopup');

// Detect platform
const ua = window.navigator.userAgent.toLowerCase();
const isIos = /iphone|ipad|ipod/.test(ua);
const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator.standalone === true);

// Reset UI
installBar.style.display = 'none';
iosBtn.style.display = 'none';
iosPopup.style.display = 'none';

// iOS Safari logic
if (isIos && isSafari && !isStandalone) {
  iosBtn.style.display = 'flex'; // يظهر الزرار بس لو النظام iOS Safari
}

// Android/Windows logic
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // يظهر بعد delay معين (مثلاً 5 ثواني)
  setTimeout(() => {
    if (!localStorage.getItem('installLater') && !localStorage.getItem('appInstalled')) {
      installBar.style.display = 'flex';
    }
  }, 5000);
});

// زرار تثبيت (Android/Windows)
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted install');
      installBar.style.display = 'none';
      localStorage.setItem('appInstalled', 'true');
    } else {
      console.log('User dismissed install');
    }
    deferredPrompt = null;
  }
});

// زرار لاحقاً
installLater.addEventListener('click', () => {
  installBar.style.display = 'none';
  localStorage.setItem('installLater', 'true');
});

// منطق إخفاء/إظهار حسب الحالة
if (localStorage.getItem('installLater') === 'true') {
  installBar.style.display = 'none';
}

if (localStorage.getItem('appInstalled') === 'true' || isStandalone) {
  installBar.style.display = 'none';
  iosBtn.style.display = 'none';
  iosPopup.style.display = 'none';
}

// iOS زرار "إضافة"
iosBtn.addEventListener('click', () => {
  iosPopup.style.display = 'flex';
});

// إغلاق الـ popup
closePopup.addEventListener('click', () => {
  iosPopup.style.display = 'none';
});

// منطق إضافي: لو المستخدم رجع للرئيسية بعد ما يتنقل
window.addEventListener('popstate', () => {
  if (deferredPrompt && !localStorage.getItem('appInstalled') && !localStorage.getItem('installLater')) {
    installBar.style.display = 'flex';
  }
});

iosBtn.addEventListener('click', () => {
  iosPopup.style.display = 'block';
});

closePopup.addEventListener('click', () => {
  iosPopup.style.display = 'none';
  iosBtn.style.display = 'none';
  
});


