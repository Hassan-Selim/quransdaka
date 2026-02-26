(function () {
  'use strict';

  var STORAGE_KEY = 'quran-sadaka-theme';
  var THEME_DARK = 'dark';
  var THEME_LIGHT = 'light';

  function getStored() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored === THEME_DARK ? THEME_DARK : THEME_LIGHT;
    } catch (e) {
      return THEME_LIGHT;
    }
  }

  function setTheme(theme) {
    var root = document.documentElement;
    if (theme === THEME_DARK) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function toggleTheme() {
    var current = getStored();
    var next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(next);
    updateToggleButton();
  }

  function updateToggleButton() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var isDark = getStored() === THEME_DARK;
    btn.setAttribute('aria-label', isDark ? 'الوضع النهاري' : 'الوضع الداكن');
    btn.title = isDark ? 'الوضع النهاري' : 'الوضع الداكن';
    btn.textContent = isDark ? '☀️' : '🌙';
  }

  function init() {
    setTheme(getStored());
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      updateToggleButton();
    }
  }
  

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
    const menu=document.getElementById('close-nav');
   const menuicon=document.getElementById('menu-icon');
   if (menu && menuicon) {
  menuicon.addEventListener('click', function () {
    if (menu.style.display === "grid") {
      menu.style.display = "none";
    } else {
      menu.style.display = "grid";
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
  setTimeout(() => {
    new Notification("صدقة جارية", { body: "لا تنسوا مشاركتنا في هذا المشروع كصدقة جارية!" });
}, 5000);
})();



