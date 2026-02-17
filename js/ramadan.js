// تابع لتحديد الصلاة القادمة
function highlightNextPrayer() {
  const now = new Date();
  const prayerItems = document.querySelectorAll(".prayer-item");
  let nextFound = false;

  prayerItems.forEach(item => {
    // إعادة الحالة الافتراضية لكل العناصر
    item.style.backgroundColor = "";
    item.style.fontWeight = "normal";

    const timeText = item.querySelector(".prayer-time").textContent;
    if (!timeText || timeText === "--:--") return;

    const [h, m] = timeText.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);

    if (!nextFound && prayerDate > now) {
      item.classList.add("next-prayer");
      item.style.fontWeight = "bold";
      nextFound = true;
    }
  });
}
function updateCountdown() {
  // تاريخ بداية رمضان المتوقع (20 فبراير 2026)
  const ramadanStart = new Date("2026-02-19T00:00:00");
  const ramadanEnd = new Date("2026-03-21T00:00:00"); // تقريبًا 30 يوم

  const now = new Date();
  let msg = "";
  let target;

  if (now < ramadanStart) {
    target = ramadanStart;
    msg = "متبقي حتى بداية رمضان 🌙";
  
  } else if (now >= ramadanStart && now <= ramadanEnd) {
    target = ramadanEnd;
    msg = "رمضان بدأ ✅ متبقي حتى نهاية رمضان";
  } else {
    document.getElementById("message").textContent = "رمضان انتهى 🎉";
    document.getElementById("countdown").style.display = "none";
    return;
  }

  const diff = target - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("message").textContent = msg;
}

// تحديث العداد كل دقيقة
updateCountdown();
setInterval(updateCountdown, 1000 * 60);

function getPrayerTimes() {
  const prayerMap = {
    "الفجر": "Fajr",
    "الشروق": "Sunrise",
    "الظهر": "Dhuhr",
    "العصر": "Asr",
    "المغرب": "Maghrib",
    "العشاء": "Isha"
  };

  const savedLat = localStorage.getItem("latitude");
  const savedLng = localStorage.getItem("longitude");
  const locationBtn = document.getElementById("locationBtn");

  if (savedLat && savedLng) {
    // عند وجود موقع محفوظ نخفي الزرار ونستخدمه مباشرة
    if (locationBtn) locationBtn.style.display = "none";
    fetchPrayerTimes(savedLat, savedLng, prayerMap);
  } else {
    // لو مفيش موقع محفوظ نظهر الزرار
    if (locationBtn) {
      locationBtn.style.display = "inline-block";
      locationBtn.onclick = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              localStorage.setItem("latitude", lat);
              localStorage.setItem("longitude", lng);

              // نخفي الزرار بعد تحديد الموقع
              locationBtn.style.display = "none";

              fetchPrayerTimes(lat, lng, prayerMap);
            },
            (error) => {
              alert("تعذر الحصول على الموقع، تأكد من تشغيل الإنترنت");
              console.error(error);
            }
          );
        } else {
          alert("المتصفح لا يدعم تحديد الموقع");
        }
      };
    }
  }
}

function fetchPrayerTimes(lat, lng, prayerMap) {
  fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`)
    .then(res => res.json())
    .then(data => {
      if (data.code === 200) {
        const timings = data.data.timings;
        const prayerRow = document.getElementById("prayerRow");
        function formatTo12HourArabic(time24) {
  let [hour, minute] = time24.split(":").map(Number);
  let suffix = hour >= 12 ? "م" : "ص"; // م = مساء، ص = صباح
  hour = ((hour + 11) % 12 + 1); // تحويل للـ 12 ساعة
  return hour + ":" + (minute < 10 ? "0" + minute : minute) + " " + suffix;
}
        prayerRow.querySelectorAll(".prayer-item").forEach(item => {
          const arabicName = item.querySelector(".prayer-name").textContent;
          const engName = prayerMap[arabicName];
          item.querySelector(".prayer-time").textContent = 
    timings[engName] ? formatTo12HourArabic(timings[engName]) : "--:--";
        });
        
        highlightNextPrayer();
      }
      
    })
    .catch(err => console.error(err));
}

window.addEventListener("load", getPrayerTimes);
// نستنى حتى يتم تحميل كل العناصر
document.addEventListener("DOMContentLoaded", function () {
  // نجيب كل أزرار النسخ
  const copyButtons = document.querySelectorAll(".copy-btn");

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const textToCopy = btn.dataset.text;
      if (!textToCopy) return;

      // نسخ النص إلى الحافظة
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          btn.textContent = "تم النسخ ✅";
          // نرجع النص الأصلي بعد 2 ثانية
          setTimeout(() => {
            btn.textContent = "نسخ";
          }, 2000);
        })
        .catch((err) => {
          console.error("خطأ في النسخ:", err);
          alert("حدث خطأ في النسخ، حاول مرة أخرى.");
        });
    });
  });
});
