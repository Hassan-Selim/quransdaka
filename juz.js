document.addEventListener("DOMContentLoaded", async function () {
  let quranData = [];
  let juzData = {};
  let surahNames = [];

  const juzList = document.getElementById("juz-list");
  const juzView = document.getElementById("juz-view");
  const juzTitle = document.getElementById("juz-title");
  const juzVerses = document.getElementById("juz-verses");
  const backBtn = document.getElementById("backToJuz");
  const continueBtn = document.getElementById("continueBtn");
  const prevJuzBtn = document.querySelector(".prev-juz");
  const nextJuzBtn = document.querySelector(".next-juz");
  const readIntro = document.querySelector(".read-intro");

  let currentJuzNumber = 1; // البداية من أول جزء

  // تحميل البيانات
  async function loadData() {
    try {
      quranData = await (await fetch("../json/quran.json")).json();
      juzData = await (await fetch("../json/quran-juz.json")).json();
      const surahJson = await (await fetch("../json/surah-name.json")).json();
      surahNames = surahJson.data;

      renderJuzList();
      window.scrollTo({ top: 0, behavior: "instant" }); // Scroll من فوق عند تحميل الصفحة

    } catch (err) {
      console.error("خطأ في تحميل البيانات:", err);
    }
  }

  function renderJuzList() {
    juzList.innerHTML = "";
    for (let i = 1; i <= 30; i++) {
      const mapping = juzData[i]?.verse_mapping;
      let metaText = "";
      if (mapping) {
        const surahs = Object.keys(mapping);
        const firstSurah = surahs[0];
        const lastSurah = surahs[surahs.length - 1];
        const firstAyah = mapping[firstSurah].split("-")[0];
        const lastAyah = mapping[lastSurah].split("-")[1];
        const firstName = surahNames.find(s => s.number == firstSurah)?.name || "";
        const lastName = surahNames.find(s => s.number == lastSurah)?.name || "";
        metaText = `${firstName} ${firstAyah} - ${lastName} ${lastAyah}`;
      }

      const item = document.createElement("div");
      item.className = "read-surah-item";
      item.innerHTML = `
        <div class="surah-num">${i}</div>
        <div class="surah-info">
          <span class="surah-name-ar">الجزء ${i}</span>
          <div class="surah-meta">${metaText}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        displayJuz(i);
      });
      juzList.appendChild(item);
    }
  }

  function displayJuz(juzNumber, highlightAyah = null) {
    const juz = juzData[juzNumber];
    if (!juz) return;

    currentJuzNumber = juzNumber;

    // إخفاء زر تابع وعبارة اختيار الجزء عند عرض الجزء
    if (continueBtn) continueBtn.style.display = "none";
    if (readIntro) readIntro.style.display = "none";

    juzList.style.display = "none";
    juzView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "instant" }); // scroll top دائماً

    juzTitle.textContent = `الجزء ${juzNumber}`;
    juzVerses.innerHTML = "";

    const savedHighlight = highlightAyah;

    for (let surahNumber in juz.verse_mapping) {
      const range = juz.verse_mapping[surahNumber];
      const [start, end] = range.split("-").map(Number);
      const surahObj = surahNames.find(s => s.number == surahNumber);
      const surahData = quranData.find(s => s.number == surahNumber);
      if (!surahData) continue;

      const surahHeader = document.createElement("div");
      surahHeader.className = "surah-name";
      surahHeader.textContent = surahObj ? surahObj.name : "";
      juzVerses.appendChild(surahHeader);

      if (start === 1 && parseInt(surahNumber) !== 9) {
        const basmalaSpan = document.createElement("span");
        basmalaSpan.className = "basmala";
        basmalaSpan.textContent = "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴾";
        juzVerses.appendChild(basmalaSpan);
      }

      const ayat = surahData.ayahs.filter(a => a.number >= start && a.number <= end);
      ayat.forEach(ayah => {
        const verseWrapper = document.createElement("span");
        verseWrapper.className = "verse-wrapper";

        const textSpan = document.createElement("span");
        textSpan.className = "verse-text";
        textSpan.textContent = ayah.text.trim() + " ";

        const marker = document.createElement("span");
        marker.className = "verse-marker";
        marker.textContent = ayah.number;

        verseWrapper.appendChild(textSpan);
        verseWrapper.appendChild(marker);
        juzVerses.appendChild(verseWrapper);

        verseWrapper.addEventListener("click", () => {
          document.querySelectorAll(".verse-text").forEach(el => el.classList.remove("ayah-highlight"));
          textSpan.classList.add("ayah-highlight");
          localStorage.setItem("highlightAyah", ayah.number);
          localStorage.setItem("lastJuz", juzNumber);
        });

        if (savedHighlight && savedHighlight === ayah.number) {
          textSpan.classList.add("ayah-highlight");
          setTimeout(() => textSpan.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
      });
    }
  }

  // زر الرجوع
  backBtn.addEventListener("click", () => {
    juzView.style.display = "none";
    juzList.style.display = "grid";
    if (continueBtn) continueBtn.style.display = "inline-block";
    if (readIntro) readIntro.style.display = "block";
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  // Prev / Next
  prevJuzBtn.addEventListener("click", () => {
    if (currentJuzNumber > 1) {
      displayJuz(currentJuzNumber - 1);
    }
  });

  nextJuzBtn.addEventListener("click", () => {
    if (currentJuzNumber < 30) {
      displayJuz(currentJuzNumber + 1);
    }
  });

  // تابع من حيث توقفت
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const lastJuz = parseInt(localStorage.getItem("lastJuz"));
      const highlightAyah = parseInt(localStorage.getItem("highlightAyah"));
      if (lastJuz) displayJuz(lastJuz, highlightAyah);
    });
  }

  loadData();
});