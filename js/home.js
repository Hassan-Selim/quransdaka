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

