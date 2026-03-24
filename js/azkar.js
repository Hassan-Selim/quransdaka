
// نجيب كل أزرار النسخ


document.querySelectorAll(".done-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const li = this.closest("li");
    li.classList.add("hidden-azkar"); // نخفيه بالكلاس

    document.getElementById("showHiddenBtn").style.display = "block";
  });
});

document.getElementById("showHiddenBtn").addEventListener("click", function() {
  document.querySelectorAll(".hidden-azkar").forEach(li => {
    li.classList.remove("hidden-azkar"); // نشيل الكلاس فيرجع طبيعي
  });
  this.style.display = "none";
});
document.querySelectorAll(".done-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const li = this.closest("li");
    li.classList.add("hidden-azkar"); // نخفيه بالكلاس

    document.getElementById("showHiddenBtnaz").style.display = "block";
  });
});

document.getElementById("showHiddenBtnaz").addEventListener("click", function() {
  document.querySelectorAll(".hidden-azkar").forEach(li => {
    li.classList.remove("hidden-azkar"); // نشيل الكلاس فيرجع طبيعي
  });
  this.style.display = "none";
});
document.querySelectorAll(".done-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const li = this.closest("li");
    li.classList.add("hidden-azkar"); // نخفيه بالكلاس

    document.getElementById("showHiddenBtnazz").style.display = "block";
  });
});

document.getElementById("showHiddenBtnazz").addEventListener("click", function() {
  document.querySelectorAll(".hidden-azkar").forEach(li => {
    li.classList.remove("hidden-azkar"); // نشيل الكلاس فيرجع طبيعي
  });
  this.style.display = "none";
});
document.querySelectorAll(".done-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const li = this.closest("li");
    li.classList.add("hidden-azkar"); // نخفيه بالكلاس

    document.getElementById("showHiddenBtnazzz").style.display = "block";
  });
});

document.getElementById("showHiddenBtnazzz").addEventListener("click", function() {
  document.querySelectorAll(".hidden-azkar").forEach(li => {
    li.classList.remove("hidden-azkar"); // نشيل الكلاس فيرجع طبيعي
  });
  this.style.display = "none";
});


/* copybtn */

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    // نجيب النص المرتبط بالزرار (الـ span اللي جنبه)
    const textToCopy = this.previousElementSibling.textContent;

   btn.textContent = "تم النسخ ✅";
    // نرجع النص الأصلي بعد 2 ثانية
    setTimeout(() => {
      btn.textContent = "نسخ";
    }, 2000);
    if (!textToCopy) return;

    // نسخ النص إلى الحافظة
    navigator.clipboard.writeText(textToCopy)
      .catch((err) => {
        console.error("خطأ في النسخ:", err);
        alert("حدث خطأ في النسخ، حاول مرة أخرى.");
      });       
  });
});