(function(){

const tasbeehBtn = document.getElementById('tasbeehBtn');
const counterEl = document.getElementById('counter');
const dhikrSelect = document.getElementById('dhikrSelect');
const resetBtn = document.getElementById('resetBtn');
const clickSound = document.getElementById('clickSound');
const progressCircle = document.querySelector('.progress-ring__circle');

const RING_LENGTH = 2 * Math.PI * 90; // circumference

let counts = JSON.parse(localStorage.getItem('tasbeehCounts')) || {};
let strokes = JSON.parse(localStorage.getItem('tasbeehStrokes')) || {};

function getKey(){
  return dhikrSelect.value;
}

function updateRing(){
  const key = getKey();
  const strokeCount = strokes[key] || 0;
  let progress = strokeCount % 33;
  const offset = RING_LENGTH - (progress / 33) * RING_LENGTH;
  progressCircle.style.strokeDashoffset = offset;
  if(progress === 33 || strokeCount % 33 === 0 && strokeCount !== 0){
    progressCircle.style.stroke = 'green';
  } else {
    progressCircle.style.stroke = '#e7770e';
  }
}

function loadCount(){
  const key = getKey();
  counterEl.textContent = counts[key] || 0;
  updateRing();
}

tasbeehBtn.addEventListener('click',()=>{

  const key = getKey();
  counts[key] = (counts[key] || 0) + 1;
  strokes[key] = (strokes[key] || 0) + 1;

  counterEl.textContent = counts[key];
  localStorage.setItem('tasbeehCounts', JSON.stringify(counts));
  localStorage.setItem('tasbeehStrokes', JSON.stringify(strokes));

  clickSound.currentTime = 0;
  clickSound.play();

  if(navigator.vibrate){
    navigator.vibrate(30);
  }

  updateRing();

});

dhikrSelect.addEventListener('change',loadCount);

resetBtn.addEventListener('click',()=>{
  if(confirm('تصفير هذا الذكر؟')){
    const key = getKey();
    counts[key] = 0;
    strokes[key] = 0;
    counterEl.textContent = 0;
    localStorage.setItem('tasbeehCounts', JSON.stringify(counts));
    localStorage.setItem('tasbeehStrokes', JSON.stringify(strokes));
    updateRing();
  }
});

loadCount();

})();
