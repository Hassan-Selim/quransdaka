document.addEventListener("DOMContentLoaded", function () {

  /* =====================================================
     🔵 1️⃣ عداد رمضان
  ===================================================== */

  function updateRamadanCountdown() {

    const ramadanStart = new Date("2026-02-19T00:00:00");
    const ramadanEnd   = new Date("2026-03-21T00:00:00");

    const now = new Date();
    const messageEl = document.getElementById("message");
    const countdownBox = document.getElementById("countdown");

    if (!messageEl) return;

    let target, message;

    if (now < ramadanStart) {
      target = ramadanStart;
      message = "متبقي حتى بداية رمضان 🌙";
    }
    else if (now >= ramadanStart && now <= ramadanEnd) {
      target = ramadanEnd;
      message = "رمضان بدأ ✅ متبقي حتى نهاية رمضان";
    }
    else {
      messageEl.textContent = "عيد فطر مبارك 😃🎈 🎉";
      if (countdownBox) countdownBox.style.display = "none";
      return;
    }

    const diff = target - now;

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById("days").textContent    = days;
    document.getElementById("hours").textContent   = hours;
    document.getElementById("minutes").textContent = minutes;
    messageEl.textContent = message;
  }

  updateRamadanCountdown();
  setInterval(updateRamadanCountdown, 60000);



  /* =====================================================
     🟢 2️⃣ مواقيت الصلاة
  ===================================================== */

  let countdownInterval = null;

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
      if (locationBtn) locationBtn.style.display = "none";
      fetchPrayerTimes(savedLat, savedLng, prayerMap);
    } else {
      if (locationBtn) {
        locationBtn.style.display = "inline-block";
        locationBtn.onclick = () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;

              localStorage.setItem("latitude", lat);
              localStorage.setItem("longitude", lng);

              locationBtn.style.display = "none";
              fetchPrayerTimes(lat, lng, prayerMap);
            },
            () => alert("تعذر الحصول على الموقع")
          );
        };
      }
    }
  }



  function fetchPrayerTimes(lat, lng, prayerMap) {

    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`)
      .then(res => res.json())
      .then(data => {
        // بعد جلب أوقات الصلاة
const prayerTimes = data.data.timings; // Fajr, Dhuhr, Asr, Maghrib, Isha
if (typeof window.setupPrayerNotifications === "function") {
  window.setupPrayerNotifications(prayerTimes);
}

        if (data.code !== 200) return;

        const timings = data.data.timings;
        const prayerItems = document.querySelectorAll(".prayer-item");

        prayerItems.forEach(item => {

          const arabicName = item.querySelector(".prayer-name").textContent;
          const engName = prayerMap[arabicName];

          if (!timings[engName]) return;

          const time24 = timings[engName].split(" ")[0];

          item.querySelector(".prayer-time").dataset.time24 = time24;
          item.querySelector(".prayer-time").textContent = convertTo12Hour(time24);
        });

        highlightNextPrayer();
        startNextPrayerCountdown();
      })
      .catch(err => console.log(err));
  }



  function convertTo12Hour(time24) {
    let [hour, minute] = time24.split(":").map(Number);
    let suffix = hour >= 12 ? "م" : "ص";
    hour = ((hour + 11) % 12 + 1);
    return hour + ":" + (minute < 10 ? "0" + minute : minute) + " " + suffix;
  }



  /* =====================================================
     🟡 3️⃣ تحديد الصلاة القادمة
  ===================================================== */

  function getNextPrayer() {

    const now = new Date();
    const prayerItems = Array.from(document.querySelectorAll(".prayer-item"));

    for (let item of prayerItems) {

      const time24 = item.querySelector(".prayer-time").dataset.time24;
      if (!time24) continue;

      const [h, m] = time24.split(":").map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0, 0);

      if (prayerDate > now) {
        return { item, date: prayerDate };
      }
    }

    // لو اليوم خلص → الفجر بكرة
    const fajrTime = prayerItems[0].querySelector(".prayer-time").dataset.time24;
    const [h, m] = fajrTime.split(":").map(Number);

    const nextDay = new Date();
    nextDay.setDate(now.getDate() + 1);
    nextDay.setHours(h, m, 0, 0);

    return { item: prayerItems[0], date: nextDay };
  }



  function highlightNextPrayer() {

    document.querySelectorAll(".prayer-item")
      .forEach(item => item.classList.remove("next-prayer"));

    const next = getNextPrayer();
    if (next && next.item) {
      next.item.classList.add("next-prayer");
    }
  }



  /* =====================================================
     🔴 4️⃣ عداد الصلاة القادمة
  ===================================================== */

  function startNextPrayerCountdown() {

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {

      const next = getNextPrayer();
      if (!next) return;

      const now = new Date();
      const diff = next.date - now;

      const hours   = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const name = next.item.querySelector(".prayer-name").textContent;
      const countdownEl = document.getElementById("nextPrayerCountdown");

      if (countdownEl) {
        countdownEl.textContent =
          `الصلاة القادمة: ${name} بعد ${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
      }

      highlightNextPrayer();

    }, 1000);
  }



  getPrayerTimes();
});