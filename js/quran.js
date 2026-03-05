(function () {
  'use strict';

  const API_SUWAR = 'https://mp3quran.net/api/v3/suwar?language=ar';
  const API_RECITERS = 'https://mp3quran.net/api/v3/reciters?language=ar';
  const STORAGE_RECITER = 'quran-sadaka-reciter';
  const STORAGE_MOSHAF = 'quran-sadaka-moshaf';

  const elReciter = document.getElementById('reciter');
  const elMoshaf = document.getElementById('moshaf');
  const elPlayerBar = document.getElementById('playerBar');
  const elPlayerSurahName = document.getElementById('playerSurahName');
  const elMainAudio = document.getElementById('mainAudio');
  const elLoading = document.getElementById('loading');
  const elErrorMsg = document.getElementById('errorMsg');
  const elSurahList = document.getElementById('surahList');
  const elBtnPrev = document.getElementById('btnPrev');
  const elBtnPlayPause = document.getElementById('btnPlayPause');
  const elBtnNext = document.getElementById('btnNext');

  let suwar = [];
  let reciters = [];
  let currentReciter = null;
  let currentMoshaf = null;
  let currentSurahId = null;
  let currentSurahName = null;

  function pad(num) {
    return String(num).padStart(3, '0');
  }

  function showError(msg) {
    elLoading.style.display = 'none';
    elSurahList.innerHTML = '';
    elErrorMsg.textContent = msg;
    elErrorMsg.style.display = 'block';
  }

  function hideError() {
    elErrorMsg.style.display = 'none';
  }

  function isSurahInList(surahId) {
    if (!currentMoshaf || !currentMoshaf.surah_list) return false;
    const list = currentMoshaf.surah_list.split(',');
    return list.includes(String(surahId));
  }

  function getAudioUrl(surahId) {
    if (!currentMoshaf || !currentMoshaf.server) return null;
    if (!isSurahInList(surahId)) return null;
    const base = currentMoshaf.server.replace(/\/$/, '');
    return base + '/' + pad(surahId) + '.mp3';
  }

  function getPlayableSuwar() {
    if (!currentMoshaf) return [];
    return suwar.filter(function (s) { return isSurahInList(s.id); }).sort(function (a, b) { return a.id - b.id; });
  }

  function updatePlayPauseButton() {
    if (!elMainAudio.src) return;
    if (elMainAudio.paused) {
      elBtnPlayPause.textContent = '▶ ';
      elBtnPlayPause.setAttribute('aria-label', 'تشغيل');
    } else {
      elBtnPlayPause.textContent = '⏸ ';
      elBtnPlayPause.setAttribute('aria-label', 'إيقاف');
    }
  }

  function updatePrevNextButtons() {
    var list = getPlayableSuwar();
    var idx = list.findIndex(function (s) { return s.id === currentSurahId; });
    elBtnPrev.disabled = idx <= 0;
    elBtnNext.disabled = idx < 0 || idx >= list.length - 1;
  }

  function loadSuwar() {
    return fetch(API_SUWAR)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.suwar) {
          suwar = data.suwar;
          return suwar;
        }
        throw new Error('لا توجد بيانات سور');
      });
  }

  function loadReciters() {
    return fetch(API_RECITERS)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.reciters) {
          reciters = data.reciters;
          return reciters;
        }
        throw new Error('لا توجد بيانات قراء');
      });
  }

  function fillReciterSelect() {
    elReciter.innerHTML = '<option value="">-- اختر القارئ --</option>';
    const sortedReciters = [...reciters].sort(function(a, b) {
    return a.name.localeCompare(b.name, 'ar'); // للغة العربية
  });

    sortedReciters.forEach(function (r) {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      elReciter.appendChild(opt);
    });
  }

  function fillMoshafSelect() {
    elMoshaf.innerHTML = '<option value="">-- نوع القراءة --</option>';
    if (!currentReciter || !currentReciter.moshaf || !currentReciter.moshaf.length) return;
    currentReciter.moshaf.forEach(function (m, i) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m.name || 'قراءة ' + (i + 1);
      elMoshaf.appendChild(opt);
    });
  }

  function renderSurahList() {
    elLoading.style.display = 'none';
    hideError();
    elSurahList.innerHTML = '';
    suwar.forEach(function (s) {
      const item = document.createElement('div');
      item.className = 'surah-item';
      item.dataset.surahId = s.id;
      const typeText = s.makkia === 1 ? 'مكية' : 'مدنية';
      item.innerHTML =
        '<span class="surah-num">' + s.id + '</span>' +
        '<div class="surah-info">' +
          '<span class="name-ar">' + (s.name || '') + '</span>' +
          '<span class="name-en">' + ' ' + typeText + '</span>' +
        '</div>' +
        '<span class="play-icon">▶</span>';
      item.addEventListener('click', function () {
        playSurah(s.id, s.name);
        
        btnStop.style.display = "inline-block"; // يظهر Stop لما Play
        if (elPlayerBar.style.display === "none") {
        elPlayerBar.style.display = "grid";
    }
    audio.play();
    btnStop.style.display = "inline-block";
      });
      elSurahList.appendChild(item);
    });
  }

  function playSurah(surahId, surahName) {
    if (!currentMoshaf) {
      alert('يرجى اختيار القارئ ونوع القراءة أولاً.');
      return;
    }
    var url = getAudioUrl(surahId);
    if (!url) {
      alert('هذه السورة غير متوفرة لهذا القارئ.');
      return;
    }
    
    currentSurahId = surahId;
    currentSurahName = surahName || surahId;
    elPlayerSurahName.textContent = 'سورة ' + currentSurahName;
    elMainAudio.src = url;
    elMainAudio.play();
    elPlayerBar.classList.add('active');
    updatePlayPauseButton();
    updatePrevNextButtons();
  }

  function playPrevious() {
    var list = getPlayableSuwar();
    var idx = list.findIndex(function (s) { return s.id === currentSurahId; });
    if (idx > 0) {
      var prev = list[idx - 1];
      playSurah(prev.id, prev.name);
    }
  }

  function playNext() {
    var list = getPlayableSuwar();
    var idx = list.findIndex(function (s) { return s.id === currentSurahId; });
    if (idx >= 0 && idx < list.length - 1) {
      var next = list[idx + 1];
      playSurah(next.id, next.name);
    }
  }

  function togglePlayPause() {
    if (!elMainAudio.src) return;
    if (elMainAudio.paused) {
      elMainAudio.play();
    } else {
      elMainAudio.pause();
    }
    updatePlayPauseButton();
  }

  function onReciterChange() {
    var id = elReciter.value;
    currentReciter = reciters.find(function (r) { return String(r.id) === id; }) || null;
    currentMoshaf = null;
    fillMoshafSelect();
    if (currentReciter && currentReciter.moshaf && currentReciter.moshaf.length) {
      elMoshaf.value = '0';
      currentMoshaf = currentReciter.moshaf[0];
    }
    try {
      if (id) localStorage.setItem(STORAGE_RECITER, id);
    } catch (e) {}
  }

  function onMoshafChange() {
    if (!currentReciter || !currentReciter.moshaf) return;
    var i = parseInt(elMoshaf.value, 10);
    if (i >= 0 && i < currentReciter.moshaf.length) {
      currentMoshaf = currentReciter.moshaf[i];
      try {
        localStorage.setItem(STORAGE_MOSHAF, String(i));
      } catch (e) {}
    } else {
      currentMoshaf = null;
    }
  }

  elReciter.addEventListener('change', onReciterChange);
  elMoshaf.addEventListener('change', onMoshafChange);
  elBtnPrev.addEventListener('click', playPrevious);
  elBtnNext.addEventListener('click', playNext);
  elBtnPlayPause.addEventListener('click', togglePlayPause);
  elMainAudio.addEventListener('play', updatePlayPauseButton);
  elMainAudio.addEventListener('pause', updatePlayPauseButton);
  elMainAudio.addEventListener('ended', updatePlayPauseButton);

  Promise.all([loadSuwar(), loadReciters()])
    .then(function () {
      fillReciterSelect();
      fillMoshafSelect();
      var savedReciter = null;
      var savedMoshaf = null;
      try {
        savedReciter = localStorage.getItem(STORAGE_RECITER);
        savedMoshaf = localStorage.getItem(STORAGE_MOSHAF);
      } catch (e) {}
      if (savedReciter && reciters.some(function (r) { return String(r.id) === savedReciter; })) {
        elReciter.value = savedReciter;
        onReciterChange();
        if (savedMoshaf !== null && currentReciter && currentReciter.moshaf) {
          var idx = parseInt(savedMoshaf, 10);
          if (idx >= 0 && idx < currentReciter.moshaf.length) {
            elMoshaf.value = String(idx);
            onMoshafChange();
          }
        }
      }
      renderSurahList();
    })
    .catch(function (err) {
      showError('حدث خطأ في التحميل. تحقق من الاتصال بالإنترنت.');
      console.error(err);
    });
})();


/* progressBar */
// عناصر DOM
const audio = document.getElementById("mainAudio");
const btnPlayPause = document.getElementById("btnPlayPause");
const btnStop = document.getElementById("btnStop");
const volumeSlider = document.getElementById("volumeSlider");
const volumeIcon = document.getElementById("volumeIcon");
const readProgressBar = document.getElementById("readProgressBar");
const readProgressFill = document.getElementById("readProgressFill");
const readProgressKnob = document.getElementById("readProgressKnob");
const readCurrentTime = document.getElementById("readCurrentTime");
const readDuration = document.getElementById("readDuration");
const btnAutoReplay = document.getElementById("btnAutoReplay");

// حالة التشغيل
let isPlaying = false;
let isAutoReplay = false;

// السورة الافتراضية


// ======================
// Play / Pause
// ======================
btnPlayPause.addEventListener("click", () => {
    if (!isPlaying) {
        audio.play();
        btnStop.style.display = "inline-block"; // يظهر Stop لما Play
    } else {
        audio.pause();
    }
});

audio.addEventListener("play", () => {
    isPlaying = true;
    btnPlayPause.textContent = "⏸";
});

audio.addEventListener("pause", () => {
    isPlaying = false;
    btnPlayPause.textContent = "▶";
});

// ======================
// Stop
// ======================
btnStop.style.display = "none"; // مخفي في البداية

btnStop.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    btnPlayPause.textContent = "▶";
});

// ======================
// Auto Replay 🔁
// ======================
btnAutoReplay.addEventListener("click", () => {
    isAutoReplay = !isAutoReplay;
    btnAutoReplay.style.color = isAutoReplay ? "green" : "black";
    btnAutoReplay.classList.add("activeBtn")
});

audio.addEventListener("ended", () => {
    if (isAutoReplay) {
      
        audio.currentTime = 0;
        audio.play();
    } else {
      btnAutoReplay.classList.remove("activeBtn")
        isPlaying = false;
        btnPlayPause.textContent = "▶";
    }
});


// Volume Control
// ======================
function setAudioVolume(value) {
  audio.volume = value; // value من 0 إلى 1

  if (value == 0) volumeIcon.textContent = "🔇";
  else if (value < 0.5) volumeIcon.textContent = "🔉";
  else volumeIcon.textContent = "🔊";
}

// عند تغيير السلايدر
volumeSlider.addEventListener("input", () => {
  setAudioVolume(parseFloat(volumeSlider.value));
});

// ضبط القيمة الأولية
setAudioVolume(parseFloat(volumeSlider.value));

// فتح/غلق السلايدر عند الضغط على الأيقونة
volumeIcon.addEventListener("click", () => {
  volumeSlider.classList.toggle("show");
});


// ======================
// Progress Bar
// ======================
audio.addEventListener("timeupdate", () => {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    readProgressFill.style.width = percent + "%";
    readProgressKnob.style.left = percent + "%";
    readCurrentTime.textContent = formatTime(audio.currentTime);
    readDuration.textContent = formatTime(audio.duration);
});

readProgressBar.addEventListener("click", (e) => {
    const rect = readProgressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = offsetX / rect.width;
    audio.currentTime = percent * audio.duration;
});

// ======================
// دالة الوقت
// ======================
function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2,"0")}`;
}