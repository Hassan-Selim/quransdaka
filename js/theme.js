(function () {
  'use strict';

 var STORAGE_KEY = 'quran-sadaka-theme';
var THEME_DARK = 'dark';
var THEME_LIGHT = 'light';
var THEME_AUTO = 'auto';

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
    root.setAttribute('data-theme', 'dark');
  } else if (stored === THEME_LIGHT) {
    root.setAttribute('data-theme', 'light');
  } else {
    // Auto: حسب نظام الجهاز
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }
}

function toggleTheme() {
  var current = getStored();
  var next;
  if (current === THEME_DARK) next = THEME_LIGHT;
  else if (current === THEME_LIGHT) next = THEME_AUTO; // يرجع للجهاز
  else next = THEME_DARK; // auto -> dark
  try { localStorage.setItem(STORAGE_KEY, next); } catch(e){}
  applyTheme();
  updateToggleButton();
}

function updateToggleButton() {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var stored = getStored();
  var label, icon;

  if (stored === THEME_DARK) { label='الوضع النهاري'; icon='☀️'; }
  else if (stored === THEME_LIGHT) { label='الوضع الداكن'; icon='🌙'; }
  else { label='اتباع نظام الجهاز'; icon='🩵'; }

  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.textContent = icon;
}

function init() {
  applyTheme();
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
    updateToggleButton();
  }

  // لو المستخدم غيّر وضع الجهاز live
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (getStored() === THEME_AUTO) applyTheme();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
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

