(function () {
  "use strict";

  var API_SUWAR = "../json/surah-name.json";
  var API_RECITERS = "../json/reciters.json";
  var STORAGE_RECITER = "quran-sadaka-reciter";
  var STORAGE_MOSHAF = "quran-sadaka-moshaf";

  var elListView = document.getElementById("listView");
  var elSurahView = document.getElementById("surahView");
  var elListLoading = document.getElementById("listLoading");
  var elListError = document.getElementById("listError");
  var elSurahList = document.getElementById("surahList");
  var elBackToList = document.getElementById("backToList");
  var elSurahTitle = document.getElementById("surahTitle");
  var elVersesLoading = document.getElementById("versesLoading");
  var elVersesContainer = document.getElementById("versesContainer");
  var elReadAudioBar = document.getElementById("readAudioBar");
  var elReadReciter = document.getElementById("readReciter");
  var elReadMoshaf = document.getElementById("readMoshaf");
  var elReadBack5 = document.getElementById("readBack5");
  var elReadPlayPause = document.getElementById("readPlayPause");
  var elReadFwd5 = document.getElementById("readFwd5");
  var elReadAudio = document.getElementById("readAudio");
  
  var suwar = [];
  var reciters = [];
  var currentReciter = null;
  var currentMoshaf = null;
  var currentSurahNumber = 0;
  var API_AYAT_TIMING = "https://mp3quran.net/api/v3/ayat_timing";
var ayahTimings = [];
var verseSpans = [];


  function pad(num) {
    return String(num).padStart(3, "0");
  }

  function isSurahInList(surahId) {
    if (!currentMoshaf || !currentMoshaf.surah_list) return false;
    var list = currentMoshaf.surah_list.split(",");
    return list.indexOf(String(surahId)) >= 0;
  }

  function getAudioUrl(surahId) {
    if (!currentMoshaf || !currentMoshaf.server) return null;
    if (!isSurahInList(surahId)) return null;
    var base = currentMoshaf.server.replace(/\/$/, "");
    return base + "/" + pad(surahId) + ".mp3";
  }

  function showList() {
    elListView.style.display = "block";
    elSurahView.style.display = "none";
  }

  function showSurah() {
    elListView.style.display = "none";
    elSurahView.style.display = "block";
  }

  function showListError(msg) {
    elListLoading.style.display = "none";
    elSurahList.innerHTML = "";
    elListError.textContent = msg;
    elListError.style.display = "block";
  }

  function loadSuwar() {
    return fetch(API_SUWAR)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.code === 200 && data.data) {
          suwar = data.data;
          return suwar;
        }
        throw new Error("لا توجد بيانات");
      });
  }

  function renderSurahList() {
    elListLoading.style.display = "none";
    elListError.style.display = "none";
    elSurahList.innerHTML = "";
    suwar.forEach(function (s) {
      var item = document.createElement("div");
      item.className = "read-surah-item";
      item.dataset.number = s.number;
      var typeAr = s.revelationType === "Meccan" ? "مكية" : "مدنية";
      item.innerHTML =
        '<span class="surah-num">' +
        s.number +
        "</span>" +
        '<div class="surah-info">' +
        '<span class="surah-name-ar">' +
        (s.name || "") +
        "</span>" +
        '<span class="surah-meta">' +
        (s.englishNameTranslation || "") +
        " • " +
        typeAr +
        " • " +
        s.numberOfAyahs +
        " آية</span>" +
        "</div>";
      item.addEventListener("click", function () {
        openSurah(s.number);
      });
      elSurahList.appendChild(item);
    });
  }

  function loadReciters() {
    return fetch(API_RECITERS)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.reciters) {
          reciters = data.reciters;
          return reciters;
        }
        return [];
      })
      .catch(function () {
        return [];
      });
  }

  function fillReadReciterSelect() {
    elReadReciter.innerHTML = '<option value="">-- اختر القارئ --</option>';
    const sortedReciters = [...reciters].sort(function(a, b) {
      return a.name.localeCompare(b.name, 'ar'); // للغة العربية
    });

    sortedReciters.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      elReadReciter.appendChild(opt);
    });
  }

  function fillReadMoshafSelect() {
    elReadMoshaf.innerHTML = '<option value="">-- نوع التلاوة --</option>';
    if (
      !currentReciter ||
      !currentReciter.moshaf ||
      !currentReciter.moshaf.length
    )
      return;
    currentReciter.moshaf.forEach(function (m, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m.name || "قراءة " + (i + 1);
      elReadMoshaf.appendChild(opt);
    });
  }

  function onReadReciterChange() {
    var id = elReadReciter.value;
    currentReciter =
      reciters.find(function (r) {
        return String(r.id) === id;
      }) || null;
    currentMoshaf = null;
    fillReadMoshafSelect();
    if (
      currentReciter &&
      currentReciter.moshaf &&
      currentReciter.moshaf.length
    ) {
      elReadMoshaf.value = "0";
      currentMoshaf = currentReciter.moshaf[0];
    }
    try {
      if (id) localStorage.setItem(STORAGE_RECITER, id);
    } catch (e) {}
  }

  function onReadMoshafChange() {
    if (!currentReciter || !currentReciter.moshaf) return;
    var i = parseInt(elReadMoshaf.value, 10);
    if (i >= 0 && i < currentReciter.moshaf.length) {
      currentMoshaf = currentReciter.moshaf[i];
      try {
        localStorage.setItem(STORAGE_MOSHAF, String(i));
      } catch (e) {}
    } else {
      currentMoshaf = null;
    }
  }

  function updateReadPlayPauseLabel() {
    if (!elReadAudio.src) return;
    if (elReadAudio.paused) {
      elReadPlayPause.textContent = "▶ تشغيل";
      elReadPlayPause.setAttribute("aria-label", "تشغيل");
    } else {
      elReadPlayPause.textContent = "⏸ إيقاف";
      elReadPlayPause.setAttribute("aria-label", "إيقاف");
    }
  }

  function playReadSurah() {
    if (!currentMoshaf) {
      alert("يرجى اختيار القارئ ونوع التلاوة.");
      return;
    }
    var url = getAudioUrl(currentSurahNumber);
    if (!url) {
      alert("هذه السورة غير متوفرة لهذا القارئ.");
      return;
    }
    elReadAudio.src = url;
    elReadAudio.play();
    updateReadPlayPauseLabel();
  }

  function toggleReadPlayPause() {
    if (!elReadAudio.src) {
      playReadSurah();
      return;
    }
    if (elReadAudio.paused) {
      elReadAudio.play();
    } else {
      elReadAudio.pause();
    }
    updateReadPlayPauseLabel();
  }

  function readBack5() {
    if (!elReadAudio.src) return;
    elReadAudio.currentTime = Math.max(0, elReadAudio.currentTime - 5);
  }

  function readFwd5() {
    if (!elReadAudio.src) return;
    var d = elReadAudio.duration;
    if (isFinite(d)) {
      elReadAudio.currentTime = Math.min(d, elReadAudio.currentTime + 5);
    } else {
      elReadAudio.currentTime += 5;
    }
  }

  function openSurah(number) {
    showSurah();
    currentSurahNumber = number;
    // ⬅️ إعادة مزامنة الصوت مع السورة الجديدة
    elReadAudio.pause();
    elReadAudio.removeAttribute("src");
    elReadAudio.load();
    updateReadPlayPauseLabel();

    elSurahTitle.textContent = "";
    elVersesContainer.innerHTML = "";
    elVersesLoading.style.display = "block";

    var surahInfo = suwar.find(function (s) {
      return s.number === number;
    });
    if (surahInfo) {
      elSurahTitle.textContent = surahInfo.name || "سورة " + number;
    }

    if (reciters.length > 0) {
      fillReadReciterSelect();
      fillReadMoshafSelect();
      var savedR = null,
        savedM = null;
      try {
        savedR = localStorage.getItem(STORAGE_RECITER);
        savedM = localStorage.getItem(STORAGE_MOSHAF);
      } catch (e) {}
      if (
        savedR &&
        reciters.some(function (r) {
          return String(r.id) === savedR;
        })
      ) {
        elReadReciter.value = savedR;
        onReadReciterChange();
        if (savedM !== null && currentReciter && currentReciter.moshaf) {
          var idx = parseInt(savedM, 10);
          if (idx >= 0 && idx < currentReciter.moshaf.length) {
            elReadMoshaf.value = String(idx);
            onReadMoshafChange();
          }
        }
      }
    }

    fetch("../json/quran.json")
  .then(function (res) {
    return res.json();
  })
  .then(function (allSurahs) {
    elVersesLoading.style.display = "none";

    var surahData = allSurahs.find(function (s) {
      return s.number === number;
    });

    if (surahData && surahData.ayahs) {
      var block = document.createElement("div");
      block.className = "mushaf-block";

      surahData.ayahs.forEach(function (a) {
        var textSpan = document.createElement("span");
        textSpan.className = "verse-text";
        textSpan.textContent = a.text.trim();

        var markerSpan = document.createElement("span");
        markerSpan.className = "verse-marker";
        markerSpan.textContent = a.number;

        block.appendChild(textSpan);
        block.appendChild(markerSpan);
      });

      elVersesContainer.appendChild(block);
    } else {
      elVersesContainer.innerHTML =
        '<p class="read-error">تعذر تحميل الآيات.</p>';
    }
  })
  .catch(function (err) {
    elVersesLoading.style.display = "none";
    elVersesContainer.innerHTML =
      '<p class="read-error">حدث خطأ في تحميل الملف المحلي.</p>';
    console.error(err);
  });
  }

  elReadReciter.addEventListener("change", onReadReciterChange);
  elReadMoshaf.addEventListener("change", onReadMoshafChange);
  elReadPlayPause.addEventListener("click", toggleReadPlayPause);
  elReadBack5.addEventListener("click", readBack5);
  elReadFwd5.addEventListener("click", readFwd5);
  elReadAudio.addEventListener("play", updateReadPlayPauseLabel);
  elReadAudio.addEventListener("pause", updateReadPlayPauseLabel);
  elReadAudio.addEventListener("ended", updateReadPlayPauseLabel);

  elBackToList.addEventListener("click", showList);

  function initReciters() {
    loadReciters().then(function () {
      fillReadReciterSelect();
      fillReadMoshafSelect();
      var savedR = null,
        savedM = null;
      try {
        savedR = localStorage.getItem(STORAGE_RECITER);
        savedM = localStorage.getItem(STORAGE_MOSHAF);
      } catch (e) {}
      if (
        savedR &&
        reciters.some(function (r) {
          return String(r.id) === savedR;
        })
      ) {
        elReadReciter.value = savedR;
        onReadReciterChange();
        if (savedM !== null && currentReciter && currentReciter.moshaf) {
          var idx = parseInt(savedM, 10);
          if (idx >= 0 && idx < currentReciter.moshaf.length) {
            elReadMoshaf.value = String(idx);
            onReadMoshafChange();
          }
        }
      }
    });
  }

  loadSuwar()
    .then(function () {
      renderSurahList();
      initReciters();
    })
    .catch(function (err) {
      showListError("حدث خطأ في التحميل. تحقق من الاتصال بالإنترنت.");
      console.error(err);
    });

  elBackToList.addEventListener("click", function () {
    elReadAudio.pause();
    elReadAudio.currentTime = 0;
  });
})();
