
/* ════════════════════════════════
   STATE
════════════════════════════════ */
let map, userMarker, destMarker, watchId;
let routePolyline = null;
let userPos   = null;
let mosques   = [];
let routeSteps= [];
let destLatLng= null;
let destName  = '';
let isNavActive = false;

/* ════════════════════════════════
   THEME TOGGLE (للمعاينة)
════════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme',
    html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

/* ════════════════════════════════
   FIND
════════════════════════════════ */
function startFind() {
  setBtnLoading(true);
  setStatus('جاري تحديد موقعك', true);
  if (!navigator.geolocation) return setStatus('المتصفح لا يدعم GPS', false, true);

  navigator.geolocation.getCurrentPosition(pos => {
    userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading || 0 };
    setStatus('جاري البحث عن المساجد القريبة…', true);
    fetchMosques();
  }, () => {
    setStatus('تعذّر تحديد موقعك — تحقق من الإذن وأعد المحاولة', false, true);
    setBtnLoading(false);
  }, { enableHighAccuracy: true, timeout: 12000 });
}
function scrollToMap() {
    setTimeout(() => {
        document.querySelector('.sec-head')?.scrollIntoView({ behavior: 'smooth' });
    }, 100); 
}

async function fetchMosques() {
  const { lat, lng } = userPos;
  const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:2500,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:2500,${lat},${lng}););out center 15;`;
  try {
    const res  = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q));
    const data = await res.json();
    mosques = data.elements
      .map(el => ({
        name: el.tags?.['name:ar'] || el.tags?.name || 'مسجد',
        lat:  el.lat ?? el.center?.lat,
        lng:  el.lon ?? el.center?.lon,
        dist: haversine(lat, lng, el.lat??el.center?.lat, el.lon??el.center?.lon)
      }))
      .filter(m => m.lat && m.lng)
      .sort((a,b) => a.dist - b.dist)
      .slice(0, 10);

    if (!mosques.length) {
      setStatus('لم يُعثر على مساجد في نطاق 2.5 كم', false, true);
      setBtnLoading(false);
      return;
    }
    setStatus('');
    setBtnLoading(false, 'تحديث النتائج');
    initMap();
    renderList();
  } catch {
    setStatus('خطأ في الاتصال — أعد المحاولة', false, true);
    setBtnLoading(false);
  }
}

/* ════════════════════════════════
   MAP
════════════════════════════════ */
function initMap() {
  document.getElementById('map-wrap').style.display = 'block';
  if (map) { map.remove(); map = null; }

  map = L.map('map', { zoomControl: false, attributionControl: false })
         .setView([userPos.lat, userPos.lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  /* سهم المستخدم */
  userMarker = L.marker([userPos.lat, userPos.lng], {
    icon: buildArrowIcon(userPos.heading),
    zIndexOffset: 1000
  }).addTo(map);

  /* أيقونات المساجد */
  mosques.forEach((m, i) => {
    const ic = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;
        background:linear-gradient(135deg,#0d9488,#0f766e);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(13,148,136,.4);
        border:2px solid #fff;
      "><span style="transform:rotate(45deg);font-size:16px;line-height:1">🕌</span></div>`,
      iconSize: [36,36], iconAnchor: [18,36], popupAnchor: [0,-38]
    });
    L.marker([m.lat,m.lng], { icon: ic }).addTo(map)
      .bindPopup(`<b style="font-family:var(--font-arabic)">${m.name}</b><br><span style="color:var(--color-gold-light)">${fmtDist(m.dist)}</span>`)
      .on('click', () => highlightCard(i));
  });
}

/* ════════════════════════════════
   LIST
════════════════════════════════ */

function renderList() {
  const c = document.getElementById('cards');
  c.innerHTML = '';
  mosques.forEach((m, i) => {
    const d = document.createElement('div');
    d.className = 'm-card';
    d.id = `mc${i}`;
    d.innerHTML = // جوه كود الـ JS اللي بيولد الكروت
`<div class="m-icon-wrap">🕌</div>
 <div class="m-info">
    <div class="m-name">${m.name}</div>
    <div class="m-dist">📍 ${fmtDist(m.dist)}</div>
 </div>
 <button class="go-btn" onclick="event.stopPropagation(); startNav(${i}); scrollToMap();">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
    ابدأ
 </button>`;
    d.addEventListener('click', () => { highlightCard(i); map.flyTo([m.lat,m.lng],17,{duration:.8}); });
    c.appendChild(d);
  });
  document.getElementById('list-lbl').textContent = `${mosques.length} مسجد في محيط 2.5 كم`;
  document.getElementById('list-wrap').style.display = 'block';
}

function highlightCard(i) {
  document.querySelectorAll('.m-card').forEach(c => c.classList.remove('sel'));
  document.getElementById(`mc${i}`)?.classList.add('sel');
  document.getElementById(`mc${i}`)?.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

/* ════════════════════════════════
   START NAV
════════════════════════════════ */
function startNav(idx) {
  const m = mosques[idx];
  destLatLng  = [m.lat, m.lng];
  destName    = m.name;
  isNavActive = true;

  highlightCard(idx);
  document.getElementById('nav-hud').style.display  = 'block';
  document.getElementById('stop-btn').style.display = 'block';
  document.getElementById('arrival-banner').style.display = 'none';
  setStatus('');
  setHUD('⬆️', 'جارٍ حساب المسار…', '', '');

  calcRoute(userPos.lat, userPos.lng, m.lat, m.lng);

  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(onPositionUpdate, null, {
    enableHighAccuracy: true, maximumAge: 2000, timeout: 10000
  });
}

/* ════════════════════════════════
   OSRM ROUTE
════════════════════════════════ */
async function calcRoute(fLat, fLng, tLat, tLng) {
  try {
    const url  = `https://router.project-osrm.org/route/v1/foot/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error();

    const route = data.routes[0];

    /* خط المسار — بـ teal color */
    if (routePolyline) map.removeLayer(routePolyline);
    const coords = route.geometry.coordinates.map(c => [c[1],c[0]]);
    routePolyline = L.polyline(coords, {
      color: '#0d9488', weight: 5, opacity: .9, lineCap: 'round', lineJoin: 'round'
    }).addTo(map);

    /* خط شفاف خلفي */
    L.polyline(coords, {
      color: '#5eead4', weight: 9, opacity: .25, lineCap: 'round', lineJoin: 'round'
    }).addTo(map);

    /* علامة الوجهة */
    if (destMarker) map.removeLayer(destMarker);
    destMarker = L.marker(destLatLng, {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:38px;height:38px;
          background:linear-gradient(135deg,#b45309,#d97706);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          box-shadow:0 3px 12px rgba(180,83,9,.5);
          border:2.5px solid #fff;
        ">🏁</div>`,
        iconSize:[38,38], iconAnchor:[19,19]
      })
    }).addTo(map);

    /* خطوات المسار */
    routeSteps = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        routeSteps.push({
          instruction: translateOSRM(step.maneuver.type, step.maneuver.modifier, step.name),
          arrow:       maneuverArrow(step.maneuver.type, step.maneuver.modifier),
          distance:    step.distance,
          lat:         step.maneuver.location[1],
          lng:         step.maneuver.location[0],
          done:        false
        });
      }
    }

    const totalMin = Math.round(route.duration / 60);
    setHUD(
      routeSteps[0]?.arrow || '⬆️',
      routeSteps[0]?.instruction || 'ابدأ',
      `بعد ${fmtDist(routeSteps[0]?.distance || 0)}`,
      `الإجمالي: ${fmtDist(route.distance)} · ~${totalMin} دقيقة مشياً`
    );

    map.fitBounds(L.latLngBounds(coords), { padding:[70,70] });

  } catch {
    setHUD('⬆️', 'تعذّر حساب المسار — تأكد من الاتصال', '', '');
  }
}

/* ════════════════════════════════
   WATCH POSITION
════════════════════════════════ */
function onPositionUpdate(pos) {
  if (!isNavActive) return;
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const hdg = pos.coords.heading || userPos.heading || 0;
  userPos = { lat, lng, heading: hdg };

  /* تحريك سهم المستخدم */
  userMarker.setLatLng([lat, lng]);
  userMarker.setIcon(buildArrowIcon(hdg));

  /* الخريطة تتبع المستخدم */
  map.panTo([lat, lng], { animate: true, duration: .5 });

  /* فحص الوصول */
  if (haversine(lat, lng, destLatLng[0], destLatLng[1]) < 25) {
    arrivedAtDest(); return;
  }

  /* تقليص خط المسار */
  trimRoute(lat, lng);

  /* تحديث HUD */
  advanceSteps(lat, lng);
}

function trimRoute(lat, lng) {
  if (!routePolyline) return;
  const pts = routePolyline.getLatLngs();
  if (pts.length < 2) return;
  let minD = Infinity, minI = 0;
  pts.forEach((p,i) => { const d = haversine(lat,lng,p.lat,p.lng); if(d<minD){minD=d;minI=i;} });
  if (minI > 0) routePolyline.setLatLngs(pts.slice(minI));
}

function advanceSteps(lat, lng) {
  let next = routeSteps.find(s => !s.done);
  if (!next) return;
  const d = haversine(lat, lng, next.lat, next.lng);
  if (d < 20) {
    next.done = true;
    speak(next.instruction);
    next = routeSteps.find(s => !s.done);
    if (!next) return;
  }
  const distToNext = haversine(lat, lng, next.lat, next.lng);
  setHUD(next.arrow, next.instruction, `بعد ${fmtDist(distToNext)}`,
         document.getElementById('hud-total').textContent);
}

/* ════════════════════════════════
   ARRIVED
════════════════════════════════ */
function arrivedAtDest() {
  stopWatch();
  isNavActive = false;
  document.getElementById('nav-hud').style.display    = 'none';
  document.getElementById('stop-btn').style.display   = 'none';
  document.getElementById('arr-name').textContent     = destName;
  document.getElementById('arrival-banner').style.display = 'block';
  speak('وصلت إلى وجهتك، بلغك الله المسجد بخير');
}

/* ════════════════════════════════
   STOP NAV
════════════════════════════════ */
function stopNav() {
  isNavActive = false;
  stopWatch();
  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
  if (destMarker)    { map.removeLayer(destMarker);    destMarker    = null; }
  document.getElementById('nav-hud').style.display        = 'none';
  document.getElementById('stop-btn').style.display       = 'none';
  document.getElementById('arrival-banner').style.display = 'none';
  routeSteps = [];
  document.querySelectorAll('.m-card').forEach(c => c.classList.remove('sel'));
  map.setView([userPos.lat, userPos.lng], 15);
}

function stopWatch() {
  if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}

/* ════════════════════════════════
   ARROW ICON
════════════════════════════════ */
function buildArrowIcon(heading) {
  const h = heading || 0;
  return L.divIcon({
    className: '',
    html: `<svg width="38" height="38" viewBox="0 0 38 38" style="transform:rotate(${h}deg);transition:transform .4s;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))">
      <circle cx="19" cy="19" r="17" fill="rgba(13,148,136,.18)" stroke="rgba(13,148,136,.5)" stroke-width="1.5"/>
      <polygon points="19,5 27,30 19,25 11,30" fill="#0d9488" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
    iconSize:[38,38], iconAnchor:[19,19]
  });
}

/* ════════════════════════════════
   OSRM TRANSLATIONS
════════════════════════════════ */
function maneuverArrow(type, mod) {
  if (type==='arrive') return '🏁';
  if (type==='depart') return '⬆️';
  const m = mod || '';
  if (m==='sharp left')   return '↰';
  if (m==='sharp right')  return '↱';
  if (m==='slight left')  return '↖️';
  if (m==='slight right') return '↗️';
  if (m.includes('left')) return '⬅️';
  if (m.includes('right'))return '➡️';
  if (m==='uturn')        return '↩️';
  return '⬆️';
}

function translateOSRM(type, mod, name) {
  const s = name ? `على ${name}` : '';
  if (type==='depart')  return `ابدأ المسير ${s}`;
  if (type==='arrive')  return `وصلت إلى وجهتك`;
  if (type==='continue'||type==='new name') return `استمر ${s}`;
  if (type==='turn') {
    if (mod==='left')         return `انعطف يساراً ${s}`;
    if (mod==='right')        return `انعطف يميناً ${s}`;
    if (mod==='sharp left')   return `انعطف بحدة يساراً`;
    if (mod==='sharp right')  return `انعطف بحدة يميناً`;
    if (mod==='slight left')  return `انحرف يساراً ${s}`;
    if (mod==='slight right') return `انحرف يميناً ${s}`;
    if (mod==='uturn')        return `اعمل نصف دورة`;
  }
  if (type==='roundabout'||type==='rotary') return `ادخل الدوار ${s}`;
  if (type==='exit roundabout') return `اخرج من الدوار ${s}`;
  if (type==='merge') return `اندمج ${mod?.includes('left')?'يساراً':'يميناً'} ${s}`;
  if (type==='fork')  return `في المفترق ${mod?.includes('left')?'خذ اليسار':'خذ اليمين'}`;
  return `استمر ${s}`;
}

/* ════════════════════════════════
   SPEECH
════════════════════════════════ */
function speak(text) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA'; u.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
function haversine(lat1,lng1,lat2,lng2) {
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function fmtDist(m) { return m<1000 ? `${Math.round(m)} م` : `${(m/1000).toFixed(1)} كم`; }

function setStatus(msg, loading=false, isErr=false) {
  const el = document.getElementById('status-bar');
  el.className = 'status-bar' + (isErr ? ' err' : '');
  el.innerHTML = loading
    ? `${msg} <span class="dots"><span></span><span></span><span></span></span>`
    : msg;
}

function setBtnLoading(loading, label='تحديد موقعي وإيجاد المساجد') {
  const b = document.getElementById('find-btn');
  b.disabled = loading;
  b.childNodes[b.childNodes.length-1].textContent = ' ' + label;
}

function setHUD(arrow, step, dist, total) {
  document.getElementById('hud-arrow').textContent = arrow;
  document.getElementById('hud-step').textContent  = step;
  if (dist)  document.getElementById('hud-dist').textContent  = dist;
  if (total) document.getElementById('hud-total').textContent = total;
}
