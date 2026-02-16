(function () {
  'use strict';

  const API_RADIOS = 'https://mp3quran.net/api/v3/radios?language=ar';

  const elLoading = document.getElementById('radioLoading');
  const elError = document.getElementById('radioError');
  const elList = document.getElementById('radioList');
  const elPlayerBar = document.getElementById('radioPlayerBar');
  const elPlayerTitle = document.getElementById('radioPlayerTitle');
  const elBtnPrev = document.getElementById('radioBtnPrev');
  const elBtnPlayPause = document.getElementById('radioBtnPlayPause');
  const elBtnNext = document.getElementById('radioBtnNext');

  let radios = [
    // 🎧 إذاعة القرآن الكريم من القاهرة (حط الرابط الصح هنا)
    {
      name: "إذاعة القرآن الكريم - القاهرة",
      url: "https://n01.radiojar.com/8s5u5tpdtwzuv?rj-ttl=5&rj-tok=AAABnGf6-xQACr6_yWCmwQ-NjQ "
    }
  ];
  let currentAudio = null;
  let currentBtn = null;
  let currentRadioIndex = -1;
  let radioButtons = [];

  function showError(msg) {
    elLoading.style.display = 'none';
    elList.innerHTML = '';
    elError.textContent = msg;
    elError.style.display = 'block';
  }

  function setPlayingState(btn, playing) {
    if (!btn) return;
    btn.classList.toggle('playing', playing);
    btn.textContent = playing ? '⏸ إيقاف' : '▶ تشغيل';
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
    elBtnPrev.disabled = currentRadioIndex <= 0;
    elBtnNext.disabled = currentRadioIndex < 0 || currentRadioIndex >= radios.length - 1;
  }

  function playByIndex(index) {
    if (index < 0 || index >= radios.length) return;
    var r = radios[index];
    stopCurrent();
    currentRadioIndex = index;
    currentBtn = radioButtons[index] || null;
    setPlayingState(currentBtn, true);
    elPlayerBar.classList.add('active');
    elPlayerTitle.textContent = r.name || 'محطة';
    elBtnPlayPause.textContent = '⏸ إيقاف';
    elBtnPlayPause.setAttribute('aria-label', 'إيقاف');
    updatePrevNextButtons();
    currentAudio = new Audio(r.url);
    currentAudio.play().catch(function (e) {
      console.error(e);
      alert('تعذر تشغيل المحطة. قد يكون الرابط غير متاح.');
      setPlayingState(currentBtn, false);
    });
    currentAudio.onerror = function () {
      setPlayingState(currentBtn, false);
    };
    currentAudio.onpause = function () {
      updatePlayPauseLabel();
    };
  }

  function playRadio(url, btn) {
    var idx = radioButtons.indexOf(btn);
    if (idx < 0) idx = radios.findIndex(function (r) { return r.url === url; });
    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingState(btn, false);
      currentBtn = null;
      currentAudio = null;
      updatePlayPauseLabel();
      return;
    }
    if (idx >= 0) playByIndex(idx);
  }

  function playPrevious() {
    if (currentRadioIndex > 0) playByIndex(currentRadioIndex - 1);
  }

  function playNext() {
    if (currentRadioIndex >= 0 && currentRadioIndex < radios.length - 1) playByIndex(currentRadioIndex + 1);
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

  function render() {
    elLoading.style.display = 'none';
    elError.style.display = 'none';
    elList.innerHTML = '';
    radioButtons = [];
    radios.forEach(function (r, i) {
      var item = document.createElement('div');
      item.className = 'radio-item';
      var btn = document.createElement('button');
      btn.className = 'play-btn';
      btn.textContent = '▶ تشغيل';
      btn.type = 'button';
      btn.addEventListener('click', function () { playRadio(r.url, btn); });
      radioButtons[i] = btn;
      item.innerHTML = '<span class="radio-icon">📻</span><span class="radio-name">' + (r.name || 'محطة') + '</span>';
      item.appendChild(btn);
      elList.appendChild(item);
    });
    elBtnPrev.addEventListener('click', playPrevious);
    elBtnNext.addEventListener('click', playNext);
    elBtnPlayPause.addEventListener('click', togglePlayPause);
  }

  fetch(API_RADIOS)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.radios && data.radios.length) {
        // ➕ ندمج محطات API بعد محطة القاهرة
        radios = radios.concat(data.radios);
        render();
      } else {
        render(); // حتى لو مفيش API احنا لسه عندنا القاهرة
      }
    })
    .catch(function (err) {
      // لو فشل الـ API بس لسه نظهر القاهرة
      console.error(err);
      render();
    });
})();
