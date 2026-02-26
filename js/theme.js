(function () {
  'use strict';

// theme.js
var STORAGE_KEY = 'quran-sadaka-theme';
var THEME_DARK = 'dark';
var THEME_LIGHT = 'light';

// جلب القيمة المخزنة أو اعتماد إعداد الجهاز
function getStored() {
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    // لو مفيش stored، استخدم إعداد الجهاز
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
  } catch (e) {
    return THEME_LIGHT;
  }
}

// تطبيق الوضع
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {}
}

// تبديل بين الوضعين
function toggleTheme() {
  var current = getStored();
  var next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  setTheme(next);
  updateToggleButton();
}

// تحديث زرار التبديل
function updateToggleButton() {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var isDark = getStored() === THEME_DARK;
  btn.setAttribute('aria-label', isDark ? 'الوضع النهاري' : 'الوضع الداكن');
  btn.title = isDark ? 'الوضع النهاري' : 'الوضع الداكن';
  btn.textContent = isDark ? '☀️' : '🌙';
}

// تهيئة الوضع عند تحميل الصفحة
function initTheme() {
  setTheme(getStored());
  updateToggleButton();
  
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

// استدعاء تلقائي عند DOMContentLoaded
const menu = document.getElementById('close-nav');
const menuicon = document.getElementById('menu-icon');
const closeIcon = document.querySelector('.close-icon'); // عنصر الـ ❌

if (menu && menuicon && closeIcon) {
  // فتح / غلق الـ menu
  menuicon.addEventListener('click', function () {
    if (menu.style.display === "grid") {
      menu.style.display = "none";
    } else {
      menu.style.display = "grid";
    }
  });

  // غلق الـ menu عند الضغط على الـ close icon
  closeIcon.addEventListener('click', function () {
    menu.style.display = "none";
  });

  // غلق الـ menu عند الضغط في أي مكان خارج الـ menu
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== menuicon) {
      menu.style.display = "none";
    }
  });
}


  (function () {
    const year = new Date().getFullYear();
    const ownerName = "Hassan Selim";
    const website = "https://www.hassanselim.art/";

    const copyright = document.createElement("div");

    copyright.style.textAlign = "center";
    copyright.style.padding = "15px";
    copyright.style.fontSize = "14px";
    copyright.style.color = "#999";

    copyright.innerHTML = `
        جميع الحقوق محفوظة © ${year} —
        <a href="${website}" target="_blank" style="color:#999;text-decoration:none;">
            ${ownerName}
        </a>
    `;

    document.body.appendChild(copyright);
  })();
})();
