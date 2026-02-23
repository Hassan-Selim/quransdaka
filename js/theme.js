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
   menuicon.addEventListener('click',function(){
    if(menu.style.display==="grid"){ 
      menu.style.display="none";
   } else{
      menu.style.display="grid";
   }});
  

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
const menuIcon = document.getElementById('menu-icon');
const moreLinks = document.getElementById('more-links');

function toggleMenu() {
  if(moreLinks.style.display === 'flex') {
    moreLinks.style.display = 'none';
  } else {
    moreLinks.style.display = 'flex';
  }
}


const navItems = document.querySelectorAll(".mobile-nav .nav-item");
const indicator = document.querySelector(".mobile-nav .indicator");

function moveIndicator(element) {
  const itemWidth = element.offsetWidth;
  const itemLeft = element.offsetLeft;
  indicator.style.left = itemLeft + (itemWidth / 2) - 35 + "px";
}

navItems.forEach(item => {
  item.addEventListener("click", function () {
    navItems.forEach(i => i.classList.remove("active"));
    this.classList.add("active");
    moveIndicator(this);
  });
});

window.addEventListener("load", () => {
  const activeItem = document.querySelector(".mobile-nav .nav-item.active");
  if (activeItem) moveIndicator(activeItem);
  const currentPage = window.location.pathname;

navItems.forEach(item => {
  if (item.querySelector("a").getAttribute("href") === currentPage) {
    item.classList.add("active");
    moveIndicator(item);
  }
});
});