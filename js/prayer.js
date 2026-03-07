if (typeof PrayTimes === "undefined") {
    console.error("⚠️ مكتبة PrayTimes مش متعرفه! تأكد من تحميل praytime.js قبل هذا السكربت.");
} else {
    console.log("✅ مكتبة PrayTimes متعرفه وجاهزة");

    // 🌙 تهيئة PrayTimes
    const prayTimes = new PrayTimes("Egypt");
    prayTimes.adjust({ asr: "Standard" });
    prayTimes.tune({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });

    let countdownInterval = null;

    function convertTo12Hour(time24) {
        let [h, m] = time24.split(":").map(Number);
        const suffix = h >= 12 ? "م" : "ص";
        h = ((h + 11) % 12) + 1;
        return `${h}:${m < 10 ? "0" + m : m} ${suffix}`;
    }

    // ===================== جلب مواقيت الصلاة =====================
    function getPrayerTimes() {
        const savedLat = localStorage.getItem("latitude");
        const savedLng = localStorage.getItem("longitude");
        const locationBtn = document.getElementById("locationBtn");
        const prayerMap = {
            "الفجر": "Fajr",
            "الشروق": "Sunrise",
            "الظهر": "Dhuhr",
            "العصر": "Asr",
            "المغرب": "Maghrib",
            "العشاء": "Isha"
        };

        function fetchTimes(lat, lng) {
            fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`)
                .then(res => res.json())
                .then(data => {
                    if (data.code !== 200) return;
                    const timings = data.data.timings;
                    const prayerItems = document.querySelectorAll(".prayer-item");
                    const prayerTimesObj = {}; // للإشعارات

                    prayerItems.forEach(item => {
                        const arabicName = item.querySelector(".prayer-name").textContent;
                        const engName = prayerMap[arabicName];
                        if (!timings[engName]) return;

                        const time24 = timings[engName].split(" ")[0];
                        item.querySelector(".prayer-time").dataset.time24 = time24;
                        item.querySelector(".prayer-time").textContent = convertTo12Hour(time24);

                        prayerTimesObj[arabicName] = time24;
                    });

                    highlightNextPrayer();
                    startNextPrayerCountdown();

                    if (window.initNotifications) window.initNotifications(prayerTimesObj);
                })
                .catch(err => console.log(err));
        }

        if (savedLat && savedLng) {
            if (locationBtn) locationBtn.style.display = "none";
            fetchTimes(savedLat, savedLng);
        } else {
            if (locationBtn) {
                locationBtn.style.display = "inline-block";
                locationBtn.onclick = () => {
                    navigator.geolocation.getCurrentPosition(
                        pos => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            localStorage.setItem("latitude", lat);
                            localStorage.setItem("longitude", lng);
                            locationBtn.style.display = "none";
                            fetchTimes(lat, lng);
                        },
                        () => alert("تعذر الحصول على الموقع")
                    );
                };
            }
        }
    }

    // ===================== الصلاة القادمة =====================
    function getNextPrayer() {
  const now = new Date();
  const items = Array.from(document.querySelectorAll(".prayer-item"));

  for (let item of items) {
    const time24 = item.querySelector(".prayer-time")?.dataset?.time24;
    if (!time24) continue; // لو الوقت مش موجود، نتخطى العنصر
    const [h, m] = time24.split(":").map(Number);
    const d = new Date(); 
    d.setHours(h, m, 0, 0);
    if (d > now) return { item, date: d };
  }

  // لو اليوم خلص → الفجر بكرة
  const first = items[0];
  const firstTime = first.querySelector(".prayer-time")?.dataset?.time24;
  if (!firstTime) return null;
  const [h, m] = firstTime.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return { item: first, date: d };
}

    function highlightNextPrayer() {
        document.querySelectorAll(".prayer-item").forEach(item => item.classList.remove("next-prayer"));
        const next = getNextPrayer();
        if (next && next.item) next.item.classList.add("next-prayer");
    }

    // ===================== عداد الصلاة القادمة =====================
    function startNextPrayerCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            const next = getNextPrayer();
            if (!next) return;

            const now = new Date();
            const diff = next.date - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
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

    // ===================== إشعارات الصلاة =====================
    function setupPrayerNotifications(prayerTimes) {
        if (Notification.permission !== "granted") return;
        Object.entries(prayerTimes).forEach(([prayer, time]) => {
            const now = new Date();
            const [hour, minute] = time.split(":").map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hour, minute, 0, 0);

            const diff = prayerDate - now;
            if (diff > 0) {
                setTimeout(() => {
                    sendNotification(`وقت صلاة ${prayer} 🌙`, `الصلاة الآن ${time}`);
                }, diff);
            }
        });
    }

    window.initNotifications = setupPrayerNotifications;

    // ===================== بدء التطبيق =====================
    document.addEventListener("DOMContentLoaded", () => {
        getPrayerTimes();
    });
}
const canvas = document.getElementById("qiblaCompass");
const ctx = canvas.getContext("2d");
const center = canvas.width/2;
const radius = center - 15;
const kaabaLat = 21.4225;
const kaabaLng = 39.8262;
const hintEl = document.getElementById("qiblaHint");

// رسم البوصلة والدائرة والنقاط الداخلية
function drawCompassBase(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // الدائرة الخارجية
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2*Math.PI);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 4;
  ctx.stroke();

  // نقاط صغيرة حول الداخل
  const points = 36;
  for(let i=0;i<points;i++){
    const angle = (i/points) * 2*Math.PI;
    const x = center + Math.cos(angle)*(radius-10);
    const y = center + Math.sin(angle)*(radius-10);
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI);
    ctx.fillStyle = "#999";
    ctx.fill();
  }
}

// حساب زاوية القبلة بالنسبة للشمال
function calculateBearing(lat1,lng1){
  const φ1 = lat1*Math.PI/180;
  const φ2 = kaabaLat*Math.PI/180;
  const Δλ = (kaabaLng-lng1)*Math.PI/180;
  const y = Math.sin(Δλ)*Math.cos(φ2);
  const x = Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
  let θ = Math.atan2(y,x);
  θ = θ*180/Math.PI;
  return (θ+360)%360;
}

// رسم السهم المثلثي
function drawArrow(rotation){
  ctx.save();
  ctx.translate(center,center);
  ctx.rotate(rotation*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(0,-radius+20);
  ctx.lineTo(-8,-radius+35);
  ctx.lineTo(8,-radius+35);
  ctx.closePath();
  ctx.fillStyle = "#ff4d4d";
  ctx.fill();
  ctx.restore();
}

// رسم الكعبة على محيط البوصلة
function drawKaaba(rotation){
  ctx.save();
  ctx.translate(center,center);
  ctx.rotate(rotation*Math.PI/180);
  const kaabaSize = 16;
  const x = 0;
  const y = -radius+50;
  ctx.fillStyle = "#000";
  ctx.fillRect(x-kaabaSize/2,y-kaabaSize/2,kaabaSize,kaabaSize);
  ctx.restore();
}

// تهيئة البوصلة
function initQibla(lat,lng){
  function handleOrientation(event){
    const alpha = event.alpha || 0;
    const bearing = calculateBearing(lat,lng);
    const rotation = bearing - alpha;

    drawCompassBase();
    drawArrow(rotation);
    drawKaaba(rotation);
  }

  // طلب إذن على iOS
  if(typeof DeviceOrientationEvent.requestPermission === 'function'){
    DeviceOrientationEvent.requestPermission()
      .then(permission=>{
        if(permission === 'granted'){
          window.addEventListener("deviceorientation", handleOrientation, true);
          hintEl.textContent = "قم بتحريك الهاتف لتحريك البوصلة";
        } else hintEl.textContent = "لم يتم السماح بالوصول لمستشعر الحركة";
      }).catch(err=>console.error(err));
  } else {
    // Android أو متصفحات أخرى
    window.addEventListener("deviceorientation", handleOrientation, true);
    hintEl.textContent = "قم بتحريك الهاتف لتحريك البوصلة";
  }
}

// جلب موقع المستخدم
navigator.geolocation.getCurrentPosition(pos=>{
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  initQibla(lat,lng);
},err=>{
  hintEl.textContent = "يرجى تفعيل موقعك للوصول لاتجاه القبلة";
});