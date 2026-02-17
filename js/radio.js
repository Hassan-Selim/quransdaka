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

  // المحطات الافتراضية
  let radios = [
    {
      name: "إذاعة القرآن الكريم - القاهرة",
      "url" "https://qurango.net/radio/tarateel"
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
    elBtnPlayPause.textContent = currentAudio.paused ? '▶ تشغيل' : '⏸ إيقاف';
  }

  function updatePrevNextButtons() {
    elBtnPrev.disabled = currentRadioIndex <= 0;
    elBtnNext.disabled = currentRadioIndex < 0 || currentRadioIndex >= radios.length - 1;
  }

  function playByIndex(index) {
    if (index < 0 || index >= radios.length) return;
    const r = radios[index];
    stopCurrent();
    currentRadioIndex = index;
    currentBtn = radioButtons[index] || null;
    setPlayingState(currentBtn, true);
    elPlayerBar.classList.add('active');
    elPlayerTitle.textContent = r.name || 'محطة';
    elBtnPlayPause.textContent = '⏸ إيقاف';
    currentAudio = new Audio(r.url);
    currentAudio.preload = "none";
    currentAudio.play().catch(err => {
      console.error(err);
      alert('تعذر تشغيل المحطة. قد يكون الرابط غير متاح أو محجوب على جهازك.');
      setPlayingState(currentBtn, false);
    });
    currentAudio.onpause = updatePlayPauseLabel;
    updatePrevNextButtons();
  }

  function playRadio(url, btn) {
    const idx = radioButtons.indexOf(btn) >= 0 ? radioButtons.indexOf(btn) : radios.findIndex(r => r.url === url);
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
    if (currentAudio.paused) currentAudio.play();
    else currentAudio.pause();
    setPlayingState(currentBtn, !currentAudio.paused);
    updatePlayPauseLabel();
  }

  function render() {
    elLoading.style.display = 'none';
    elError.style.display = 'none';
    elList.innerHTML = '';
    radioButtons = [];
    radios.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'radio-item';
      const btn = document.createElement('button');
      btn.className = 'play-btn';
      btn.type = 'button';
      btn.textContent = '▶ تشغيل';
      btn.addEventListener('click', () => playRadio(r.url, btn));
      radioButtons[i] = btn;
      item.innerHTML = `<span class="radio-icon">📻</span><span class="radio-name">${r.name || 'محطة'}</span>`;
      item.appendChild(btn);
      elList.appendChild(item);
    });

    elBtnPrev.addEventListener('click', playPrevious);
    elBtnNext.addEventListener('click', playNext);
    elBtnPlayPause.addEventListener('click', togglePlayPause);
  }

  // جلب محطات API ودمجها
  fetch(API_RADIOS)
    .then(res => res.json())
    .then(data => {
      if (data.radios && data.radios.length) {
        radios = radios.concat(data.radios);
      }
      render();
    })
    .catch(err => {
      console.error(err);
      render();
    });

})();
