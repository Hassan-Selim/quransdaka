(function () {
  "use strict";

  var API_SUWAR = "../json/surah-name.json";
  var API_RECITERS = "../json/reciters.json";
  var API_PAGES = "../json/quran-pages.json"; // مسار ملف الصفحات الجديد

  var STORAGE_RECITER = "quran-sadaka-reciter";
  var STORAGE_MOSHAF = "quran-sadaka-moshaf";

  // عناصر السور
  var elListView = document.getElementById("listView");
  var elSurahView = document.getElementById("surahView");
  var elListLoading = document.getElementById("listLoading");
  var elListError = document.getElementById("listError");
  var elSurahList = document.getElementById("surahList");
  var elBackToList = document.getElementById("backToList");
  var elSurahTitle = document.getElementById("surahTitle");
  var elVersesLoading = document.getElementById("versesLoading");
  var elVersesContainer = document.getElementById("versesContainer");
  
  // عناصر الصوت
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
  
  // متغيرات قسم الصفحات
  var currentPageNumber = 0;
  var totalPages = 604; // عدد صفحات المصحف

  // --- [تحديث: وظيفة الإخفاء الشاملة] ---
 function updateUIVisibility(isReading) {
    const toHide = document.querySelectorAll('.qpage, .ruqyah-wrapper, .banner, .continueBtn, .read-intro, #main-footer');
    const displayValue = isReading ? 'none' : '';

    toHide.forEach(el => {
        if(el) el.style.display = displayValue;
    });
    
    // باقي الكود بتاعك...
}

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
    updateUIVisibility(false);
  }

  function showSurah() {
    elListView.style.display = "none";
    elSurahView.style.display = "block";
    updateUIVisibility(true);
  }

  function showListError(msg) {
    elListLoading.style.display = "none";
    elSurahList.innerHTML = "";
    elListError.textContent = msg;
    elListError.style.display = "block";
  }

  function loadSuwar() {
    return fetch(API_SUWAR)
      .then((res) => res.json())
      .then((data) => {
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
        (s.englishName || "") +
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
      .then((res) => res.json())
      .then((data) => {
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
      a.name.localeCompare(b.name, "ar")
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
    if (!currentReciter || !currentReciter.moshaf || !currentReciter.moshaf.length)
      return;
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
    currentReciter = reciters.find((r) => String(r.id) === id) || null;
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

  const elReadCurrentTime = document.getElementById("readCurrentTime");
  const elReadDuration = document.getElementById("readDuration");
  const elReadProgressBar = document.getElementById("readProgressBar");
  const elReadProgressFill = document.getElementById("readProgressFill");
  const progressKnob = document.getElementById("readProgressKnob");

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  if (elReadAudio) {
    elReadAudio.addEventListener("loadedmetadata", () => {
      elReadDuration.textContent = formatTime(elReadAudio.duration);
    });

    elReadAudio.addEventListener("timeupdate", () => {
      elReadCurrentTime.textContent = formatTime(elReadAudio.currentTime);
      const percent = (elReadAudio.currentTime / elReadAudio.duration) * 100;
      elReadProgressFill.style.width = percent + "%";
      if (progressKnob) progressKnob.style.left = percent + "%";
    });
  }

  if (elReadProgressBar) {
    elReadProgressBar.addEventListener("click", (e) => {
      const rect = elReadProgressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = clickX / rect.width;
      elReadAudio.currentTime = percent * elReadAudio.duration;
    });
  }

  function openSurah(number) {
    showSurah();
    currentSurahNumber = number;

    elReadAudio.pause();
    elReadAudio.removeAttribute("src");
    elReadAudio.load();
    updateReadPlayPauseLabel();

    elSurahTitle.textContent = "";
    elVersesContainer.innerHTML = "";
    elVersesLoading.style.display = "block";

    if (reciters.length > 0) {
      fillReadReciterSelect();
      fillReadMoshafSelect();
      let savedR = localStorage.getItem(STORAGE_RECITER);
      let savedM = localStorage.getItem(STORAGE_MOSHAF);

      if (savedR && reciters.some((r) => String(r.id) === savedR)) {
        elReadReciter.value = savedR;
        onReadReciterChange();
        if (savedM !== null && currentReciter && currentReciter.moshaf) {
          let idx = parseInt(savedM, 10);
          if (idx >= 0 && idx < currentReciter.moshaf.length) {
            elReadMoshaf.value = String(idx);
            onReadMoshafChange();
          }
        }
      }
    }

    let surahInfo = suwar.find((s) => s.number === number);
    if (surahInfo) {
      history.replaceState(null, "", "#/surah/" + surahInfo.number);
      document.title = `سورة ${surahInfo.name} مكتوبة كاملة | Quran Sadaka`;
      localStorage.setItem("surah-lastSurah", number);
      localStorage.setItem("surah-lastAyah", 1);
    }

    fetch("../json/quran.json")
      .then((res) => res.json())
      .then((allSurahs) => {
        elVersesLoading.style.display = "none";
        let surahData = allSurahs.find((s) => s.number === number);

        if (!surahData || !surahData.ayahs) {
          elVersesContainer.innerHTML = '<p class="read-error">تعذر تحميل الآيات.</p>';
          return;
        }

        let block = document.createElement("div");
        block.className = "mushaf-block";

        let surahTitle = document.createElement("div");
        surahTitle.className = "surah-title";
        surahTitle.textContent = surahInfo.name;
        block.appendChild(surahTitle);

        if (number !== 9) {
          let basmalaSpan = document.createElement("span");
          basmalaSpan.className = "basmala";
          basmalaSpan.textContent = "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴾";
          block.appendChild(basmalaSpan);
        }

        surahData.ayahs.forEach((a) => {
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
            localStorage.setItem("surah-lastSurah", number);
            localStorage.setItem("surah-lastAyah", a.number);
            highlightAyah(a.number);
          });
          block.appendChild(verseWrapper);
        });

        elVersesContainer.appendChild(block);
        const savedAyah = localStorage.getItem("surah-lastAyah");
        if (savedAyah && parseInt(localStorage.getItem("surah-lastSurah"), 10) === number) {
          setTimeout(() => highlightAyah(savedAyah), 100);
        }
      })
      .catch((err) => {
        elVersesLoading.style.display = "none";
        console.error(err);
      });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener("click", function () {
      const savedSurah = localStorage.getItem("surah-lastSurah");
      if (savedSurah) openSurah(parseInt(savedSurah, 10));
    });
  }

  function highlightAyah(ayahId) {
    document.querySelectorAll(".verse-wrapper").forEach((v) => {
      if (parseInt(v.dataset.ayah, 10) === parseInt(ayahId, 10)) {
        v.classList.add("ayah-highlight");
        v.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        v.classList.remove("ayah-highlight");
      }
    });
  }

  var prevBtn = document.querySelector(".prev-btn");
  var nextBtn = document.querySelector(".next-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => currentSurahNumber > 1 && openSurah(currentSurahNumber - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => currentSurahNumber < suwar.length && openSurah(currentSurahNumber + 1));
  }

  // ==========================================
  // --- [قسم الصفحات الجديد بالكامل] ---
  // ==========================================

  function renderPagesList() {
    const elPagesList = document.getElementById("pages-list");
    if (!elPagesList) return;
    elPagesList.innerHTML = "";

    // إنشاء أزرار أو عناصر لـ 604 صفحة
    for (let i = 1; i <= totalPages; i++) {
      let item = document.createElement("div");
      item.className = "read-surah-item"; 
      item.style.textAlign = "center";
      item.style.justifyContent = "center";
      item.innerHTML = `<span class="surah-name-ar" style="font-size:1.1rem;">صفحة ${i}</span>`;
      
      item.addEventListener("click", () => openPage(i));
      elPagesList.appendChild(item);
    }
  }

  // --- [تحديث: دالة فتح الصفحة المظبوطة] ---
  function openPage(pageNum) {
    currentPageNumber = pageNum;
    
    document.getElementById("pages-list").style.display = "none";
    document.getElementById("pages-view").style.display = "block";
    if(typeof updateUIVisibility === 'function') updateUIVisibility(true);

    const pageVerses = document.getElementById("page-verses");
    const pageTitleEl = document.getElementById("page-title");
    pageVerses.innerHTML = '<p class="read-loading">جاري تجهيز الصفحة...</p>';

    Promise.all([
      fetch("../json/quran-pages.json").then((res) => res.json()),
      fetch("../json/quran.json").then((res) => res.json())
    ])
      .then(([pagesIndex, quranData]) => {
        pageVerses.innerHTML = "";
        let pageMap = pagesIndex[String(pageNum)];

        if (!pageMap || pageMap.length === 0) {
          pageVerses.innerHTML = '<p class="read-error">بيانات هذه الصفحة غير متوفرة.</p>';
          return;
        }

        let block = document.createElement("div");
        block.className = "mushaf-block";
        
        let currentSurahRendered = null; 
        let isFirstAyahOnPage = true; 

        pageMap.forEach((ref) => {
          let parts = ref.split(':'); 
          let surahNum = parts[0]; 
          let ayahNum = parts[1];  

          if (!surahNum || !ayahNum) return;

          let surahObj = quranData.find(s => String(s.number) === String(surahNum));
          let ayahObj = surahObj ? surahObj.ayahs.find(a => String(a.number) === String(ayahNum)) : null;
          
          let text = ayahObj ? ayahObj.text : "";

          // جلب اسم السورة الحقيقي من مصفوفة suwar
          let realSurahInfo = suwar.find(s => String(s.number) === String(surahNum));
          let cleanSurahName = realSurahInfo ? realSurahInfo.name : `سورة ${surahNum}`;

          // --- [لوجيك: رسم ترويسة السورة والبسملة] ---
          let shouldDrawHeader = false;
          if (isFirstAyahOnPage) {
              shouldDrawHeader = true;
              isFirstAyahOnPage = false; 
              if (pageTitleEl) pageTitleEl.textContent = ` ﴿ ${pageNum} ﴾ `;
          } else if (String(ayahNum) === "1" && currentSurahRendered !== String(surahNum)) {
              shouldDrawHeader = true;
          }

          if (shouldDrawHeader) {
              currentSurahRendered = String(surahNum);
              let titleDiv = document.createElement("div");
              titleDiv.className = "surah-title";
              titleDiv.textContent = cleanSurahName;
              block.appendChild(titleDiv);

              // إضافة البسملة (لأي سورة بتبدأ بآية 1، ما عدا سورة التوبة)
              if (String(ayahNum) === "1" && String(surahNum) !== "9") {
                  let basmalaDiv = document.createElement("div");
                  basmalaDiv.className = "basmala";
                  basmalaDiv.textContent = "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّيمِ ﴾";
                  block.appendChild(basmalaDiv);
              }
          }

          // --- [رسم الآية والترقيم (تجاهل الفاتحة آية 1 لو فاضية)] ---
          if (text && text.trim() !== "") {
              let verseWrapper = document.createElement("span");
              verseWrapper.className = "verse-wrapper";
              verseWrapper.dataset.surah = surahNum;
              verseWrapper.dataset.ayah = ayahNum;

              verseWrapper.addEventListener("click", function () {
                  localStorage.setItem("page-surah-lastSurah", surahNum);
                  localStorage.setItem("page-surah-lastAyah", ayahNum);
                  localStorage.setItem("page-quran-last-page", pageNum);

                  document.querySelectorAll(".verse-wrapper").forEach(v => v.classList.remove("ayah-highlight"));
                  this.classList.add("ayah-highlight");
              });

              let textSpan = document.createElement("span");
              textSpan.className = "verse-text";
              textSpan.textContent = text + " "; 

              let markerSpan = document.createElement("span");
              markerSpan.className = "verse-marker";
              markerSpan.textContent = ayahNum;

              verseWrapper.appendChild(textSpan);
              verseWrapper.appendChild(markerSpan);
              block.appendChild(verseWrapper);
          }
        });

        pageVerses.appendChild(block);
        localStorage.setItem("quran-last-page", pageNum);

        // --- [استرجاع التظليل بالمفاتيح المخصصة] ---
        const savedSurah = localStorage.getItem("page-surah-lastSurah"); 
        const savedAyah = localStorage.getItem("page-surah-lastAyah");
        
        if (savedSurah && savedAyah) {
            setTimeout(() => {
                let targetVerse = pageVerses.querySelector(`.verse-wrapper[data-surah="${savedSurah}"][data-ayah="${savedAyah}"]`);
                if (targetVerse) {
                    targetVerse.classList.add("ayah-highlight");
                    targetVerse.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 150); 
        }
      })
      .catch((err) => {
        pageVerses.innerHTML = '<p class="read-error">حدث خطأ في عرض الصفحة.</p>';
        console.error("Pages View Error:", err);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const backToPagesBtn = document.getElementById("backToPages");
    const prevPageBtn = document.querySelector(".prev-page");
    const nextPageBtn = document.querySelector(".next-page");
    const resumePageBtn = document.getElementById("resumePageBtn");

    if (backToPagesBtn) {
      backToPagesBtn.addEventListener("click", () => {
        document.getElementById("pages-view").style.display = "none";
        document.getElementById("pages-list").style.display = "grid"; 
        updateUIVisibility(false); 
      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPageNumber > 1) openPage(currentPageNumber - 1);
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (currentPageNumber < totalPages) openPage(currentPageNumber + 1);
      });
    }

    if (resumePageBtn) {
      resumePageBtn.addEventListener("click", () => {
        let savedPage = localStorage.getItem("quran-last-page");
        if (savedPage) openPage(parseInt(savedPage, 10));
        else alert("لا يوجد تقدم محفوظ للصفحات.");
      });
    }
    
    renderPagesList();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const btns = {
      swar: document.querySelector(".swar-page-btn"),
      juz: document.querySelector(".juz-page-btn"),
      pages: document.querySelector(".pages-page-btn") 
    };

    const sections = {
      swar: document.querySelector(".swar-section"),
      juz: document.querySelector(".juz-section"),
      pages: document.querySelector(".pages-section") 
    };

    function switchTab(activeTab) {
      Object.keys(btns).forEach((key) => {
        if (btns[key] && sections[key]) {
          if (key === activeTab) {
            btns[key].classList.add("active");
            sections[key].style.display = "block";
          } else {
            btns[key].classList.remove("active");
            sections[key].style.display = "none";
          }
        }
      });
      updateUIVisibility(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    if (btns.swar) btns.swar.addEventListener("click", () => switchTab("swar"));
    if (btns.juz) btns.juz.addEventListener("click", () => switchTab("juz"));
    if (btns.pages) btns.pages.addEventListener("click", () => switchTab("pages"));
    
    const backToJuz = document.getElementById("backToJuz");
    if (backToJuz) {
      backToJuz.addEventListener("click", () => {
        document.getElementById("juz-view").style.display = "none";
        document.getElementById("juz-list").style.display = "grid";
        updateUIVisibility(false);
      });
    }
  });

  Promise.all([loadSuwar(), loadReciters()]).then(() => renderSurahList());

  document.addEventListener("DOMContentLoaded", () => {
    const swipeZone = document.getElementById("pages-view");
    let touchstartX = 0;
    let touchendX = 0;

    if (swipeZone) {
        swipeZone.addEventListener('touchstart', function(e) {
            touchstartX = e.changedTouches[0].screenX;
        }, { passive: true });

        swipeZone.addEventListener('touchend', function(e) {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const threshold = 60; 
        if (touchendX < touchstartX - threshold) {
            if (currentPageNumber > 1) openPage(currentPageNumber - 1);
        }
        if (touchendX > touchstartX + threshold) {
            if (currentPageNumber < totalPages) openPage(currentPageNumber + 1);
        }
    }
  });
})();