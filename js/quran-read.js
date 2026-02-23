
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
  var resumeBtn = document.getElementById("resumeBtn");

  var suwar = [];
  var reciters = [];
  var currentReciter = null;
  var currentMoshaf = null;
  var currentSurahNumber = 0;

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
      .then(res => res.json())
      .then(data => {
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
        '<span class="surah-num">' + s.number + "</span>" +
        '<div class="surah-info">' +
        '<span class="surah-name-ar">' + (s.name || "") + "</span>" +
        '<span class="surah-meta">' + (s.englishName || "") +
        " • " + typeAr + " • " + s.numberOfAyahs + " آية</span>" +
        "</div>";
      item.addEventListener("click", function () {
        openSurah(s.number);
      });
      elSurahList.appendChild(item);
    });
  }

  function loadReciters() {
    return fetch(API_RECITERS)
      .then(res => res.json())
      .then(data => {
        if (data.reciters) {
          reciters = data.reciters;
          return reciters;
        }
        return [];
      })
      .catch(() => []);
  }

  function fillReadReciterSelect() {
    elReadReciter.innerHTML = '<option value="">-- اختر القارئ --</option>';
    const sortedReciters = [...reciters].sort((a, b) =>
      a.name.localeCompare(b.name, 'ar')
    );
    sortedReciters.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      elReadReciter.appendChild(opt);
    });
  }

  function fillReadMoshafSelect() {
    elReadMoshaf.innerHTML = '<option value="">-- نوع التلاوة --</option>';
    if (!currentReciter || !currentReciter.moshaf || !currentReciter.moshaf.length) return;
    currentReciter.moshaf.forEach(function (m, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m.name || "قراءة " + (i + 1);
      elReadMoshaf.appendChild(opt);
    });
  }
elBackToList.addEventListener("click", function () {
  showList();
  elReadAudio.pause();
  elReadAudio.currentTime = 0;
});
  function onReadReciterChange() {
    var id = elReadReciter.value;
    currentReciter = reciters.find(r => String(r.id) === id) || null;
    currentMoshaf = null;
    fillReadMoshafSelect();
    if (currentReciter && currentReciter.moshaf && currentReciter.moshaf.length) {
      elReadMoshaf.value = "0";
      currentMoshaf = currentReciter.moshaf[0];
    }
    if (id) localStorage.setItem(STORAGE_RECITER, id);
  }

  function onReadMoshafChange() {
    if (!currentReciter || !currentReciter.moshaf) return;
    var i = parseInt(elReadMoshaf.value, 10);
    if (i >= 0 && i < currentReciter.moshaf.length) {
      currentMoshaf = currentReciter.moshaf[i];
      localStorage.setItem(STORAGE_MOSHAF, String(i));
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
  // عرض صفحة السورة
  showSurah();
  currentSurahNumber = number;

  // إعادة ضبط الصوت
  elReadAudio.pause();
  elReadAudio.removeAttribute("src");
  elReadAudio.load();
  updateReadPlayPauseLabel();

  // إعادة ضبط العنوان والآيات
  elSurahTitle.textContent = "";
  elVersesContainer.innerHTML = "";
  elVersesLoading.style.display = "block";

  // --- استدعاء القارئ والموشاف قبل fetch ---
  if (reciters.length > 0) {
    fillReadReciterSelect();
    fillReadMoshafSelect();
    let savedR = localStorage.getItem(STORAGE_RECITER);
    let savedM = localStorage.getItem(STORAGE_MOSHAF);

    if (savedR && reciters.some(r => String(r.id) === savedR)) {
      elReadReciter.value = savedR;
      onReadReciterChange();
      if (savedM !== null && currentReciter && currentReciter.moshaf) {
        let idx = parseInt(savedM, 10);
        if (idx >= 0 && idx < currentReciter.moshaf.length) {
          elReadMoshaf.value = String(idx);
          onReadMoshafChange();
        }
      }
    } else {
      // إذا مفيش حاجة محفوظة، خلي القارئ والموشاف فارغين
      elReadReciter.value = "";
      currentReciter = null;
      currentMoshaf = null;
    }
  }

  // --- حفظ اسم السورة وآيتك الأولى في localStorage ---
  let surahInfo = suwar.find(s => s.number === number);
  if (surahInfo) {
    localStorage.setItem("lastSurah", number);
    localStorage.setItem("lastSurahName", surahInfo.name || "");
    localStorage.setItem("lastAyah", 1);
  }

  // --- تحميل الآيات ---
  fetch("../json/quran.json")
    .then(res => res.json())
    .then(allSurahs => {
      elVersesLoading.style.display = "none";
      let surahData = allSurahs.find(s => s.number === number);

      if (!surahData || !surahData.ayahs) {
        elVersesContainer.innerHTML = '<p class="read-error">تعذر تحميل الآيات.</p>';
        return;
      }

      let block = document.createElement("div");
      block.className = "mushaf-block";

      // عنوان السورة
      let surahTitle = document.createElement("div");
      surahTitle.className = "surah-title";
      surahTitle.textContent = surahInfo.name;
      block.appendChild(surahTitle);

      // البسملة (ما عدا التوبة)
      if (number !== 9) {
        let basmalaSpan = document.createElement("span");
        basmalaSpan.className = "basmala";
        basmalaSpan.textContent = "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴾";
        block.appendChild(basmalaSpan);
      }

      // عرض الآيات
      surahData.ayahs.forEach(a => {
        let verseWrapper = document.createElement("span");
        verseWrapper.className = "verse-wrapper";
        verseWrapper.dataset.ayah = a.number;

        let textSpan = document.createElement("span");
        textSpan.className = "verse-text";
        textSpan.textContent = a.text.trim();

        let markerSpan = document.createElement("span");
        markerSpan.className = "verse-marker";
        markerSpan.textContent = a.number;

        verseWrapper.appendChild(textSpan);
        verseWrapper.appendChild(markerSpan);

        verseWrapper.addEventListener("click", function () {
          localStorage.setItem("lastSurah", number);
          localStorage.setItem("lastAyah", a.number);
          highlightAyah(a.number);
        });

        block.appendChild(verseWrapper);
      });

      elVersesContainer.appendChild(block);

      // --- تطبيق highlight محفوظ لو موجود ---
      let savedAyah = localStorage.getItem("lastAyah");
      let savedSurah = localStorage.getItem("lastSurah");
      if (savedAyah && parseInt(savedSurah, 10) === number) {
        setTimeout(() => highlightAyah(savedAyah), 100);
      }

    })
    .catch(err => {
      elVersesLoading.style.display = "none";
      elVersesContainer.innerHTML = '<p class="read-error">حدث خطأ في تحميل الملف المحلي.</p>';
      console.error(err);
    });
}

// التعامل مع زر الرجوع
window.addEventListener("popstate", function (event) {
  if (event.state && event.state.surah) {
    openSurah(event.state.surah);
  }
});

// زر "تابع من حيث توقفت"
if (resumeBtn) {
  resumeBtn.addEventListener("click", function () {
    const savedSurah = localStorage.getItem("lastSurah");
    const savedAyah = localStorage.getItem("lastAyah");

    if (!savedSurah) {
      alert("لا يوجد تقدم محفوظ");
      return;
    }

    openSurah(parseInt(savedSurah, 10));

    setTimeout(() => {
      if (savedAyah) highlightAyah(savedAyah);
    }, 200);
  });
}



// تحميل البيانات الأولية
Promise.all([loadSuwar(), loadReciters()])
  .then(function () {
    renderSurahList();
  })
  .catch(function (err) {
    console.error(err);
    showListError("حدث خطأ في تحميل البيانات.");
  });

elBackToList.addEventListener("click", function () {
  showList();
});

elReadReciter.addEventListener("change", onReadReciterChange);
elReadMoshaf.addEventListener("change", onReadMoshafChange);
elReadPlayPause.addEventListener("click", toggleReadPlayPause);
elReadBack5.addEventListener("click", readBack5);
elReadFwd5.addEventListener("click", readFwd5);


// أزرار التنقل بين السور
var prevBtn = document.querySelector(".prev-btn");
var nextBtn = document.querySelector(".next-btn");

if (prevBtn) {
  prevBtn.addEventListener("click", function () {
    if (currentSurahNumber > 1) {
      openSurah(currentSurahNumber - 1);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", function () {
    if (currentSurahNumber < suwar.length) {
      openSurah(currentSurahNumber + 1);
    }
  });
}

function highlightAyah(ayahId) {
  if (!ayahId) return;
  document.querySelectorAll(".verse-wrapper").forEach(v => {
    if (parseInt(v.dataset.ayah, 10) === parseInt(ayahId, 10)) {
      v.classList.add("ayah-highlight");
      v.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      v.classList.remove("ayah-highlight");
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const swarBtn = document.querySelector(".swar-page-btn");
  const juzBtn = document.querySelector(".juz-page-btn");
  const listView = document.getElementById("listView");
  const juzView = document.getElementById("juzView");
  const juzSection = document.querySelector(".juz-section");
  const swarSection = document.querySelector(".swar-section");
  const pageBtns = document.querySelector(".page-btns");
  const qpage = document.querySelector(".qpage");

  // تأكد العناصر موجودة قبل إضافة الـ event
  if (juzBtn) {
    juzBtn.addEventListener("click", function () {
      juzSection.style.display = "block";
      swarSection.style.display = "none";
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  if (swarBtn) {
    swarBtn.addEventListener("click", function () {
      juzSection.style.display = "none";
      swarSection.style.display = "block";
    });
  }

  if (pageBtns) {
    pageBtns.addEventListener("click", () => {
      if (qpage) qpage.style.display = "none";
    });
  }
});
})();     
