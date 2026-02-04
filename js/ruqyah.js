(function () {
  'use strict';

  var API_RECITERS = 'https://mp3quran.net/api/v3/reciters?language=ar';

  var ruqyahItems = [
    { title: 'سورة الفاتحة', surahId: 1 },
    { title: 'سورة الإخلاص', surahId: 112 },
    { title: 'سورة الفلق', surahId: 113 },
    { title: 'سورة الناس', surahId: 114 }
  ];

  var defaultServer = null;
  var elList = document.getElementById('ruqyahList');
  var elPlayerBar = document.getElementById('ruqyahPlayerBar');
  var elPlayerTitle = document.getElementById('ruqyahPlayerTitle');
  var elBtnPrev = document.getElementById('ruqyahBtnPrev');
  var elBtnPlayPause = document.getElementById('ruqyahBtnPlayPause');
  var elBtnNext = document.getElementById('ruqyahBtnNext');
  var currentAudio = null;
  var currentBtn = null;
  var currentIndex = -1;
  var itemButtons = [];

  function pad(num) {
    return String(num).padStart(3, '0');
  }

  
    function getAudioUrl(surahId) {
  if (surahId === 'full') return fullRuqyahUrl;
  if (surahId === 'ful2') return fullRuqyahUrl2;
  if (surahId === 'ful3') return fullRuqyahUrl3;

  if (!defaultServer) return null;
  var base = defaultServer.replace(/\/$/, '');
  return base + '/' + pad(surahId) + '.mp3';
}


  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (currentBtn) {
      setPlayingState(currentBtn, false);
      currentBtn = null;
    }
  }

  function updatePlayPauseLabel() {
    if (!currentAudio) return;
    if (currentAudio.paused) {
      elBtnPlayPause.textContent = '▶ تشغيل';
      elBtnPlayPause.setAttribute('aria-label', 'تشغيل');
    } else {
      elBtnPlayPause.textContent = '⏸ إيقاف';
      elBtnPlayPause.setAttribute('aria-label', 'إيقاف');
    }
  }

  function updatePrevNextButtons() {
    elBtnPrev.disabled = currentIndex <= 0;
    elBtnNext.disabled = currentIndex < 0 || currentIndex >= ruqyahItems.length - 1;
  }

  function setPlayingState(btn, playing) {
    if (!btn) return;
    btn.classList.toggle('playing', playing);
    btn.textContent = playing ? '⏸' : '▶';
  }

  function playByIndex(index) {
    if (index < 0 || index >= ruqyahItems.length) return;
    var item = ruqyahItems[index];
    var url = getAudioUrl(item.surahId);
    if (!url) return;
    stopCurrent();
    currentIndex = index;
    currentBtn = itemButtons[index] || null;
    setPlayingState(currentBtn, true);
    elPlayerBar.classList.add('active');
    elPlayerTitle.textContent = item.title;
    elBtnPlayPause.textContent = '⏸ إيقاف';
    elBtnPlayPause.setAttribute('aria-label', 'إيقاف');
    updatePrevNextButtons();
    currentAudio = new Audio(url);
    currentAudio.play().catch(function (e) {
      console.error(e);
      setPlayingState(currentBtn, false);
    });
    currentAudio.onended = function () {
      setPlayingState(currentBtn, false);
      updatePlayPauseLabel();
    };
    currentAudio.onpause = function () {
      updatePlayPauseLabel();
    };
    currentAudio.onerror = function () {
      setPlayingState(currentBtn, false);
    };
  }

  function playRuqyah(item, btn) {
    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingState(btn, false);
      currentBtn = null;
      currentAudio = null;
      updatePlayPauseLabel();
      return;
    }
    var url = getAudioUrl(item.surahId);
    if (!url) {
      alert('جاري تحميل القراء. حاول مرة أخرى.');
      return;
    }
    var idx = ruqyahItems.findIndex(function (x) { return x.surahId === item.surahId; });
    if (idx >= 0) playByIndex(idx);
  }
  var fullRuqyahUrl = 'https://download.tvquran.com/download/selections/68/590e615aa1d3f.mp3';
  var fullRuqyahUrl2 = '//download.tvquran.com/download/TvQuran.com__Rouqia/TvQuran.com__r06.mp3';
  var fullRuqyahUrl3 = 'https://download.tvquran.com/download/TvQuran.com__Rouqia/TvQuran.com__r07.mp3';

ruqyahItems.unshift({
  title: 'الرقية الشرعية كاملة – الشيخ ماهر المعيقلي',
  surahId: 'full'
});

ruqyahItems.unshift({
  title: 'الرقية الشرعية كاملة – الشيخ سعد الغامدي',
  surahId: 'ful2'
});
ruqyahItems.unshift({
  title: 'الرقية الشرعية كاملة – الشيخ مشاري العقاسي',
  surahId: 'ful3'
});


  function playPrevious() {
    if (currentIndex > 0) playByIndex(currentIndex - 1);
  }

  function playNext() {
    if (currentIndex >= 0 && currentIndex < ruqyahItems.length - 1) playByIndex(currentIndex + 1);
  }

  function togglePlayPause() {
    if (!currentAudio) return;
    if (currentAudio.paused) {
      currentAudio.play();
      setPlayingState(currentBtn, true);
    } else {
      currentAudio.pause();
      setPlayingState(currentBtn, false);
    }
    updatePlayPauseLabel();
  }

  function render(server) {
    defaultServer = server;
    elList.innerHTML = '';
    itemButtons = [];
    ruqyahItems.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'ruqyah-item';
      var header = document.createElement('div');
      header.className = 'ruqyah-item-header';
      var btn = document.createElement('button');
      btn.className = 'play-btn';
      btn.textContent = '▶';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'تشغيل ' + item.title);
      btn.addEventListener('click', function () { playRuqyah(item, btn); });
      itemButtons[i] = btn;
      header.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="title">' + item.title + '</span>';
      header.appendChild(btn);
      div.appendChild(header);
      elList.appendChild(div);
    });
    elBtnPrev.addEventListener('click', playPrevious);
    elBtnNext.addEventListener('click', playNext);
    elBtnPlayPause.addEventListener('click', togglePlayPause);
  }

  fetch(API_RECITERS)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.reciters && data.reciters.length) {
        var reciter = data.reciters.find(function (r) {
          return r.moshaf && r.moshaf[0] && r.moshaf[0].surah_list && r.moshaf[0].surah_list.split(',').indexOf('1') >= 0;
        }) || data.reciters[0];
        var server = reciter.moshaf && reciter.moshaf[0] ? reciter.moshaf[0].server : null;
        if (server) {
          render(server);
        } else {
          elList.innerHTML = '<p class="ruqyah-intro">تعذر تحميل القراء. تحقق من الاتصال.</p>';
        }
      } else {
        elList.innerHTML = '<p class="ruqyah-intro">لا توجد بيانات.</p>';
      }
    })
    .catch(function (err) {
      console.error(err);
      elList.innerHTML = '<p class="ruqyah-intro">حدث خطأ في التحميل.</p>';
    });
})();
