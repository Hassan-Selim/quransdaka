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
document.addEventListener('DOMContentLoaded', initTheme);