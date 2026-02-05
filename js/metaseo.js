(function() {
  // اسم الموقع
  const siteName = 'قرآن صدقة جارية';
  const siteUrl = 'https://www.hassanselim.art/';
  const defaultImage = siteUrl + 'path-to-your-image.jpg'; // حط صورة OG عامة

  // دالة لتحديث الميتا
  function updateMeta(surahName, surahNumber) {
    // عنوان الصفحة
    const title = `${surahName} – صدقة جارية | ${siteName}`;
    document.title = title;

    // وصف الصفحة
    const desc = `استمع لسورة ${surahName} رقم ${surahNumber} بصوت أشهر القراء، وشارك في صدقة جارية من خلال تلاوة القرآن والرقية الشرعية.`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // OG
    const ogTitle = document.querySelector('meta[property="og:title"]') || createMeta('og:title');
    ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]') || createMeta('og:description');
    ogDesc.setAttribute('content', desc);

    const ogUrl = document.querySelector('meta[property="og:url"]') || createMeta('og:url');
    ogUrl.setAttribute('content', siteUrl);

    const ogImage = document.querySelector('meta[property="og:image"]') || createMeta('og:image');
    ogImage.setAttribute('content', defaultImage);

    // Twitter
    const twTitle = document.querySelector('meta[name="twitter:title"]') || createMeta('twitter:title');
    twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]') || createMeta('twitter:description');
    twDesc.setAttribute('content', desc);

    const twImage = document.querySelector('meta[name="twitter:image"]') || createMeta('twitter:image');
    twImage.setAttribute('content', defaultImage);
  }

  // دالة مساعدة لإنشاء ميتا جديدة
  function createMeta(name) {
    const m = document.createElement('meta');
    if (name.startsWith('og:')) {
      m.setAttribute('property', name);
    } else {
      m.setAttribute('name', name);
    }
    document.head.appendChild(m);
    return m;
  }

  // مثال: لو عندك openSurah(number) موجود
  if (window.openSurah) {
    const originalOpenSurah = window.openSurah;
    window.openSurah = function(number) {
      originalOpenSurah(number);
      // احصل على اسم السورة من القائمة
      const surahEl = document.querySelector(`.read-surah-item[data-number="${number}"] .surah-name-ar`);
      const surahName = surahEl ? surahEl.textContent : 'سورة ' + number;
      updateMeta(surahName, number);
    };
  }

})();
