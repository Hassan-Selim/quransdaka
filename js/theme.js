(function () {
  "use strict";

  var STORAGE_KEY = "quran-sadaka-theme";
  var THEME_DARK = "dark";
  var THEME_LIGHT = "light";
  var THEME_AUTO = "auto";

  function getStored() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? stored : THEME_AUTO;
    } catch (e) {
      return THEME_AUTO;
    }
  }
function applyTheme() {
    var root = document.documentElement;
    var stored = getStored();

    if (stored === THEME_DARK) {
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark"; // إشارة صريحة للمتصفح
    } else if (stored === THEME_LIGHT) {
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light"; // إشارة صريحة للمتصفح
    } else {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }
  }

  function toggleTheme() {
    var current = getStored();
    var next;
    if (current === THEME_DARK) next = THEME_LIGHT;
    else if (current === THEME_LIGHT)
      next = THEME_AUTO; // يرجع للجهاز
    else next = THEME_DARK; // auto -> dark
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    applyTheme();
    updateToggleButton();
  }

  function updateToggleButton() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var stored = getStored();
    var label, icon;

    if (stored === THEME_DARK) {
      label = "الوضع النهاري";
      icon = "☀️";
    } else if (stored === THEME_LIGHT) {
      label = "الوضع الداكن";
      icon = "🌙";
    } else {
      label = "اتباع نظام الجهاز";
      icon = "🩵";
    }

    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.textContent = icon;
  }

  function init() {
    applyTheme();
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", toggleTheme);
      updateToggleButton();
    }

    // لو المستخدم غيّر وضع الجهاز live
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          if (getStored() === THEME_AUTO) applyTheme();
        });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  const menu = document.getElementById("close-nav");
  const menuicon = document.getElementById("menu-icon");
  const closeIcon = document.querySelector(".close-icon"); // عنصر الـ ❌

  if (menu && menuicon && closeIcon) {
    // فتح / غلق الـ menu
    menuicon.addEventListener("click", function () {
      if (menu.style.display === "grid") {
        menu.style.display = "none";
      } else {
        menu.style.display = "grid";
      }
    });

    // غلق الـ menu عند الضغط على الـ close icon
    closeIcon.addEventListener("click", function () {
      menu.style.display = "none";
    });

    // غلق الـ menu عند الضغط في أي مكان خارج الـ menu
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && e.target !== menuicon) {
        menu.style.display = "none";
      }
    });
  }

  const header = document.querySelector(".page-header");

  let lastScroll = 0;
  let ticking = false;
  const threshold = 20;
  const offset = 80;

  function updateHeader() {
    if (!header) return; // لو العنصر مش موجود، اخرج من الدالة

    const currentScroll = window.scrollY;
    const diff = currentScroll - lastScroll;

    if (Math.abs(diff) < threshold) {
      ticking = false;
      return;
    }

    if (diff > 0 && currentScroll > offset) {
      // نازل
      header.classList.add("hide");
    } else {
      // طالع
      header.classList.remove("hide");
    }

    lastScroll = currentScroll;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });
 
function triggerPrayerNotification(prayerName) {
    // 1. إظهار الإشعار (بيشتغل في كل الصفحات)
    if (Notification.permission === "granted") {
        new Notification("حان الآن موعد صلاة " + prayerName, {
            body: "ذكر الله خير من الدنيا وما فيها",
            icon: "/img/icon-512.png"
        });
    }

    // 2. تشغيل الصوت (فقط لو المستخدم في صفحة الصلاة)
    const isPrayerPage = window.location.pathname.includes('prayer.html'); // اتأكد من اسم صفحتك
    
    if (isPrayerPage) {
        let azanAudio = new Audio('audio/azan.mp3'); // مسار ملف الصوت عندك
        azanAudio.play().catch(e => {
            console.log("المتصفح منع التشغيل التلقائي للصوت، لازم المستخدم يتفاعل مع الصفحة أولاً");
        });
    }
}
})();
