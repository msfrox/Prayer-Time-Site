/* ============================================================
   Sri Lanka Prayer Times — App v2
   Features: live countdown, auto-location, share, mobile list
   ============================================================ */
'use strict';

// ── Constants ─────────────────────────────────────────────
const DATA_BASE = './data';

const PRAYERS = ['fajr', 'sunrise', 'luhr', 'asr', 'magrib', 'isha'];
const PRAYER_LABEL = { fajr:'Fajr', sunrise:'Sunrise', luhr:'Zuhr', asr:'Asr', magrib:'Maghrib', isha:'Isha' };
const PRAYER_ICON  = { fajr:'🌙', sunrise:'🌅', luhr:'☀️', asr:'🌤️', magrib:'🏙️', isha:'🌙' };

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const MONTH_SHORT = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEK_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ISLAMIC_DAYS = ['Al-Ahad','Al-Ithnayn','Ath-Thulathaa','Al-Arbi\'aa','Al-Khamees','Al-Jumu\'ah','As-Sabt'];
const HIJRI_MONTHS = ['Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",
  'Jumada al-Ula','Jumada al-Akhirah','Rajab',"Sha'ban",
  'Ramadan','Shawwal',"Dhu al-Qi'dah",'Dhu al-Hijjah'];

// ── Zone geo-centre coords for auto-detect ─────────────────
const ZONE_CENTRES = [
  { id:'01', lat:6.93,  lng:79.95, label:'Colombo / Gampaha / Kalutara' },
  { id:'02', lat:9.67,  lng:80.01, label:'Jaffna / Nallur' },
  { id:'03', lat:9.00,  lng:80.48, label:'Mullaitivu / Kilinochchi / Vavuniya' },
  { id:'04', lat:8.58,  lng:79.95, label:'Mannar / Puttalam' },
  { id:'05', lat:8.30,  lng:80.45, label:'Anuradhapura / Polonnaruwa' },
  { id:'06', lat:7.50,  lng:80.38, label:'Kurunegala' },
  { id:'07', lat:7.30,  lng:80.64, label:'Kandy / Matale / Nuwara Eliya' },
  { id:'08', lat:7.70,  lng:81.70, label:'Batticaloa / Ampara' },
  { id:'09', lat:8.59,  lng:81.23, label:'Trincomalee' },
  { id:'10', lat:6.99,  lng:81.06, label:'Badulla / Monaragala' },
  { id:'11', lat:6.70,  lng:80.38, label:'Ratnapura / Kegalle' },
  { id:'12', lat:6.05,  lng:80.22, label:'Galle / Matara' },
  { id:'13', lat:6.12,  lng:81.12, label:'Hambantota' },
];

// ── State ─────────────────────────────────────────────────
const S = {
  zones: [],
  data: null,
  zone: '01',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  today: new Date(),
  tickInterval: null,
  clockInterval: null,
};

// ── Utility ───────────────────────────────────────────────
function pad(n) { return String(n).padStart(2,'0'); }

function parseTime(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return null;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  const pm = m[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

function minutesBefore(timeStr, mins) {
  const d = parseTime(timeStr);
  if (!d) return '';
  d.setMinutes(d.getMinutes() - mins);
  let h = d.getHours(), m = d.getMinutes();
  const pm = h >= 12;
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${pad(m)} ${pm ? 'PM' : 'AM'}`;
}

function splitTime(str) {
  // Returns { hm: '4:48', ampm: 'AM' }
  if (!str) return { hm: '--:--', ampm: '' };
  const m = str.match(/^(\d{1,2}:\d{2})\s*([AP]M)$/i);
  if (m) return { hm: m[1], ampm: m[2].toUpperCase() };
  return { hm: str, ampm: '' };
}

function getHijriDate() {
  try {
    const now = new Date();
    const opts = { calendar: 'islamic-umalqura', day:'numeric', month:'long', year:'numeric' };
    // Use Intl to get hijri day and month number
    const dayFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day:'numeric' }).format(now);
    const monthFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month:'numeric' }).format(now);
    const yearFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year:'numeric' }).format(now);
    const mIdx = parseInt(monthFmt) - 1;
    return `${dayFmt} ${HIJRI_MONTHS[mIdx] || ''} ${yearFmt} AH`;
  } catch { return ''; }
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLng = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function nearestZone(lat, lng) {
  let best = ZONE_CENTRES[0];
  let bestDist = Infinity;
  ZONE_CENTRES.forEach(z => {
    const d = distanceKm(lat, lng, z.lat, z.lng);
    if (d < bestDist) { bestDist = d; best = z; }
  });
  return best.id;
}

// ── Data ──────────────────────────────────────────────────
async function loadZones() {
  const r = await fetch(`${DATA_BASE}/zones.json`);
  return r.json();
}
async function loadData(zone, month) {
  const key = `zone${String(zone).padStart(2,'0')}-${String(month).padStart(2,'0')}`;
  const r = await fetch(`${DATA_BASE}/${key}.json`);
  if (!r.ok) throw new Error(`No data: ${key}`);
  return r.json();
}

function todayRow(data) {
  const today = new Date();
  const str = `${today.getDate()}-${MONTH_SHORT[today.getMonth()+1]}`;
  return data.days.find(d => d.date === str) || null;
}

// ── Current prayer logic ───────────────────────────────────
function prayerStatus(row) {
  // Returns { current, next }
  if (!row) return { current: null, next: PRAYERS[0] };
  const now = new Date();
  const times = PRAYERS.map(k => ({ key: k, t: parseTime(row[k]) }));
  let current = null, next = null;
  for (let i = 0; i < times.length; i++) {
    if (times[i].t && now >= times[i].t) {
      current = times[i].key;
      next = times[i+1]?.key || null;
    }
  }
  if (!current) next = times[0].key; // before fajr
  return { current, next };
}

// ── Render Header Date ─────────────────────────────────────
function renderHeaderDate() {
  const now = new Date();
  const g = document.getElementById('header-gregorian');
  const h = document.getElementById('header-hijri');
  if (g) g.textContent = `${WEEK_DAYS[now.getDay()]}, ${now.getDate()} ${MONTH_SHORT[now.getMonth()+1]} ${now.getFullYear()}`;
  if (h) h.textContent = getHijriDate();
}

// ── Render Hero ────────────────────────────────────────────
function renderHero(data, row) {
  const { current, next } = prayerStatus(row);

  // Location name
  const locEl = document.getElementById('hero-location-name');
  const badgeEl = document.getElementById('hero-location-badge');
  if (locEl && data) locEl.textContent = data.districts.join(' • ');
  if (badgeEl && data) badgeEl.textContent = data.zoneName;

  // Next prayer display
  const labelEl = document.getElementById('hero-next-label');
  const nameEl  = document.getElementById('hero-next-name');
  const atEl    = document.getElementById('hero-next-at');

  if (next && row) {
    if (labelEl) labelEl.textContent = current ? 'Next Prayer' : 'First Prayer';
    if (nameEl)  nameEl.textContent = PRAYER_LABEL[next];
    if (atEl)    atEl.textContent = `at ${row[next]}`;
  } else {
    if (nameEl) nameEl.textContent = '—';
    if (atEl)   atEl.textContent = 'No more prayers today';
  }
}

// ── Render Featured Card ───────────────────────────────────
function renderFeatured(row, current, next) {
  const show = current || next || 'fajr';
  const el = {
    badge:  document.getElementById('featured-badge'),
    icon:   document.getElementById('featured-icon'),
    name:   document.getElementById('featured-name'),
    time:   document.getElementById('featured-time'),
    ampm:   document.getElementById('featured-ampm'),
    sub:    document.getElementById('featured-sub'),
  };

  if (el.icon) el.icon.textContent = PRAYER_ICON[show];
  if (el.name) el.name.textContent = PRAYER_LABEL[show];

  const timeStr = row?.[show] || '';
  const { hm, ampm } = splitTime(timeStr);
  if (el.time) el.time.childNodes[0].textContent = hm;
  if (el.ampm) el.ampm.textContent = ' ' + ampm;

  if (el.badge) {
    if (current === show) {
      el.badge.textContent = 'NOW';
      el.badge.style.display = '';
    } else if (next === show) {
      el.badge.textContent = 'NEXT';
      el.badge.style.display = '';
    } else {
      el.badge.style.display = 'none';
    }
  }

  // Sub-text: time to sunrise if Fajr, or blank
  if (el.sub) {
    if (show === 'fajr' && row?.sunrise) {
      const fajrT = parseTime(row.fajr);
      const sunT  = parseTime(row.sunrise);
      if (fajrT && sunT) {
        const diff = Math.round((sunT - fajrT) / 60000);
        el.sub.textContent = `Sunrise in ${diff} min`;
      }
    } else {
      el.sub.textContent = '';
    }
  }
}

// ── Render Prayer List ─────────────────────────────────────
function renderPrayerList(row, current, next) {
  const panel = document.getElementById('prayer-list');
  if (!panel) return;
  if (!row) {
    panel.innerHTML = '<div class="loading-block"><span>No data for today</span></div>';
    return;
  }

  panel.innerHTML = '';

  PRAYERS.forEach(key => {
    const isNow  = key === current;
    const isNext = key === next;
    const isPast = !isNow && !isNext && current && PRAYERS.indexOf(key) < PRAYERS.indexOf(current);

    const row_ = document.createElement('div');
    row_.className = `prayer-row${isNow?' is-current':''}${isNext?' is-next':''}${isPast?' is-past':''}`;
    row_.dataset.prayer = key;

    const { hm, ampm } = splitTime(row[key] || '');
    const badge = isNow
      ? '<span class="pr-badge pr-badge-now">Now</span>'
      : isNext
        ? '<span class="pr-badge pr-badge-next">Next</span>'
        : '';

    row_.innerHTML = `
      <span class="pr-icon">${PRAYER_ICON[key]}</span>
      <span class="pr-name">${PRAYER_LABEL[key]}</span>
      ${badge}
      <span class="pr-time">${hm}<span class="pr-time-ampm"> ${ampm}</span></span>
    `;
    panel.appendChild(row_);
  });
}

// ── Render Imsak / Iftar ───────────────────────────────────
function renderImsakIftar(row) {
  const imsakEl = document.getElementById('imsak-display');
  const iftarEl = document.getElementById('iftar-display');
  if (!row) return;

  const imsak = minutesBefore(row.fajr, 2);
  const { hm: ih, ampm: ia } = splitTime(imsak);
  const { hm: mh, ampm: ma } = splitTime(row.magrib || '');

  if (imsakEl) imsakEl.innerHTML = `${ih}<span class="imsak-value-ampm"> ${ia}</span>`;
  if (iftarEl) iftarEl.innerHTML = `${mh}<span class="imsak-value-ampm"> ${ma}</span>`;
}

// ── Render Countdown ──────────────────────────────────────
function renderCountdown(row, next) {
  const timerEl = document.getElementById('hero-timer');
  if (!timerEl || !next || !row) { if (timerEl) timerEl.textContent = '--:--:--'; return; }

  const nextT = parseTime(row[next]);
  if (!nextT) return;

  const now = new Date();
  let diff = nextT - now;
  if (diff < 0) diff += 86400000;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  timerEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ── Render Weekly Table ────────────────────────────────────
function renderWeekly(data) {
  const tbody = document.getElementById('weekly-tbody');
  if (!tbody || !data) return;

  const today = new Date();
  const todayNum = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const thisMonthAbbr = MONTH_SHORT[todayMonth];

  // Find today index
  let idx = data.days.findIndex(d => d.date === `${todayNum}-${thisMonthAbbr}`);
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 1);
  const slice = data.days.slice(start, start + 7);

  tbody.innerHTML = '';
  slice.forEach(day => {
    const [dNum, dMon] = day.date.split('-');
    const isToday = parseInt(dNum) === todayNum && data.monthNum === todayMonth;
    const dow = new Date(data.year, data.monthNum - 1, parseInt(dNum)).getDay();
    const tr = document.createElement('tr');
    if (isToday) tr.className = 'today-row';
    tr.innerHTML = `
      <td><strong>${WEEK_DAYS[dow]}</strong>, ${day.date}${isToday ? '<span class="today-chip">Today</span>' : ''}</td>
      <td>${day.fajr}</td>
      <td>${day.sunrise}</td>
      <td>${day.luhr}</td>
      <td>${day.asr}</td>
      <td>${day.magrib}</td>
      <td>${day.isha}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Monthly Table ───────────────────────────────────
function renderMonthly(data) {
  const tbody = document.getElementById('monthly-tbody');
  const title = document.getElementById('monthly-title');
  const zone  = document.getElementById('monthly-zone');
  if (!tbody || !data) return;

  if (title) title.textContent = `${data.monthName} ${data.year}`;
  if (zone)  zone.textContent  = `${data.zoneName} — ${data.districts.join(', ')}`;

  const today = new Date();
  const todayNum = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayAbbr = MONTH_SHORT[todayMonth];

  tbody.innerHTML = '';
  data.days.forEach(day => {
    const [dNum, dMon] = day.date.split('-');
    const isToday = parseInt(dNum) === todayNum && data.monthNum === todayMonth;
    const dow = new Date(data.year, data.monthNum - 1, parseInt(dNum)).getDay();
    const isFri = dow === 5;
    const tr = document.createElement('tr');
    if (isToday) tr.className = 'today-monthly';
    if (isFri) tr.classList.add('is-friday');
    tr.innerHTML = `
      <td><strong>${WEEK_DAYS[dow]}</strong>, ${day.date}${isToday ? '<span class="today-chip">Today</span>' : ''}</td>
      <td>${day.fajr}</td>
      <td>${day.sunrise}</td>
      <td>${day.luhr}</td>
      <td>${day.asr}</td>
      <td>${day.magrib}</td>
      <td>${day.isha}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Apartment Table ─────────────────────────────────
function renderApt(data) {
  const tbody = document.getElementById('apt-tbody');
  if (!tbody || !data?.apartmentDiff) return;
  const apt = data.apartmentDiff;
  const fmt = (n) => n < 0 ? `−${Math.abs(n)} min` : `+${n} min`;
  tbody.innerHTML = `
    <tr>
      <td>${apt.lowRise.stories}</td><td>${apt.lowRise.heightM}</td>
      <td class="diff-neg">${fmt(apt.lowRise.fajr)}</td>
      <td class="diff-neg">${fmt(apt.lowRise.sunrise)}</td>
      <td class="diff-pos">${fmt(apt.lowRise.magrib)}</td>
      <td class="diff-pos">${fmt(apt.lowRise.isha)}</td>
    </tr>
    <tr>
      <td>${apt.highRise.stories}</td><td>${apt.highRise.heightM}</td>
      <td class="diff-neg">${fmt(apt.highRise.fajr)}</td>
      <td class="diff-neg">${fmt(apt.highRise.sunrise)}</td>
      <td class="diff-pos">${fmt(apt.highRise.magrib)}</td>
      <td class="diff-pos">${fmt(apt.highRise.isha)}</td>
    </tr>
  `;
}

// ── Share ──────────────────────────────────────────────────
function buildShareText(data, day) {
  if (!data || !day) return '';
  const date = new Date(data.year, data.monthNum - 1, parseInt(day.date));
  const dowName = WEEK_FULL[date.getDay()];
  const islamicDay = ISLAMIC_DAYS[date.getDay()];
  const hijri = getHijriDate();
  const imsak = minutesBefore(day.fajr, 2);
  const loc = data.districts.join(', ');

  const lines = [
    `🕌 SALAH TIME 🇱🇰`,
    `📍 ${loc}`,
    ``,
    `${dowName} / ${islamicDay}`,
    `${day.date.replace('-',' ')} ${data.monthName} ${data.year}`,
    hijri ? `${hijri}` : '',
    ``,
    `Fajr      ${day.fajr}`,
    `Sunrise   ${day.sunrise}`,
    `Zuhr      ${day.luhr}`,
    `Asr       ${day.asr}`,
    `Maghrib   ${day.magrib}`,
    `Isha      ${day.isha}`,
    ``,
    `📌 Imsak (Sahr End): ${imsak}`,
    ``,
    `Source: ACJU Official Timetable`,
    `www.acju.lk`,
  ].filter(l => l !== null);
  return lines.join('\n');
}

function buildMonthShareText(data) {
  if (!data) return '';
  const header = `🕌 SALAH TIMES 🇱🇰 — ${data.monthName} ${data.year}\n📍 ${data.districts.join(', ')}\nSource: ACJU | www.acju.lk\n`;
  const rows = data.days.map(d => {
    const dow = new Date(data.year, data.monthNum-1, parseInt(d.date)).getDay();
    const day = WEEK_DAYS[dow];
    return `${d.date.padEnd(6)} ${day}  Fajr:${d.fajr}  Zuhr:${d.luhr}  Asr:${d.asr}  Magrib:${d.magrib}  Isha:${d.isha}`;
  }).join('\n');
  return header + '\n' + rows;
}

function openShareModal(text) {
  const overlay = document.getElementById('share-modal-overlay');
  const preview = document.getElementById('share-preview-text');
  if (!overlay || !preview) return;
  preview.textContent = text;
  overlay._shareText = text;
  overlay.classList.add('visible');
}

function closeShareModal() {
  document.getElementById('share-modal-overlay')?.classList.remove('visible');
}

// ── Selectors ─────────────────────────────────────────────
function populateZones(zones) {
  const sel = document.getElementById('zone-selector');
  if (!sel) return;
  sel.innerHTML = '';
  zones.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.id;
    opt.textContent = `Zone ${z.id} — ${z.districts.join(', ')}`;
    if (z.id === S.zone) opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateMonths() {
  const sel = document.getElementById('month-selector');
  if (!sel) return;
  sel.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = MONTH_NAMES[i];
    if (i === S.month) opt.selected = true;
    sel.appendChild(opt);
  }
}

// ── URL params ─────────────────────────────────────────────
function pushParams() {
  const url = new URL(location.href);
  url.searchParams.set('zone', S.zone);
  url.searchParams.set('month', S.month);
  history.replaceState({}, '', url);
}

// ── Full render ────────────────────────────────────────────
async function renderAll() {
  const panel = document.getElementById('prayer-list');
  if (panel) panel.innerHTML = '<div class="loading-block"><div class="spinner"></div><span>Loading…</span></div>';

  try {
    const data = await loadData(S.zone, S.month);
    S.data = data;

    const row = todayRow(data);
    const { current, next } = prayerStatus(row);

    renderHero(data, row);
    renderFeatured(row, current, next);
    renderPrayerList(row, current, next);
    renderImsakIftar(row);
    renderWeekly(data);
    renderMonthly(data);
    renderApt(data);

    // Start tick
    clearInterval(S.tickInterval);
    S.tickInterval = setInterval(() => {
      const r = todayRow(S.data);
      if (!r) return;
      const { current: c, next: n } = prayerStatus(r);
      renderCountdown(r, n);
      // Re-render prayer list only if status changed
      const featuredEl = document.querySelector('.prayer-featured');
      if (featuredEl && featuredEl.dataset.current !== c) {
        featuredEl.dataset.current = c || '';
        renderFeatured(r, c, n);
        renderPrayerList(r, c, n);
        renderHero(S.data, r);
      }
    }, 1000);
    // Initial tick
    renderCountdown(row, next);

  } catch (err) {
    console.error(err);
    if (panel) panel.innerHTML = `<div class="loading-block" style="color:#B82020;">Failed to load data.<br><small>${err.message}</small></div>`;
  }
}

// ── Auto-location ──────────────────────────────────────────
function handleLocate() {
  if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }
  const btn = document.getElementById('btn-locate');
  if (btn) { btn.textContent = '⏳ Locating…'; btn.classList.add('locating'); }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const zone = nearestZone(pos.coords.latitude, pos.coords.longitude);
      S.zone = zone;
      const sel = document.getElementById('zone-selector');
      if (sel) sel.value = zone;
      renderAll();
      pushParams();
      if (btn) { btn.textContent = '📍 Locate Me'; btn.classList.remove('locating'); }
    },
    err => {
      alert('Could not detect location. Please select your zone manually.');
      if (btn) { btn.textContent = '📍 Locate Me'; btn.classList.remove('locating'); }
    },
    { timeout: 8000, maximumAge: 300000 }
  );
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  // URL params
  const p = new URLSearchParams(location.search);
  if (p.get('zone'))  S.zone  = p.get('zone').padStart(2,'0');
  if (p.get('month')) S.month = parseInt(p.get('month'));

  renderHeaderDate();
  S.clockInterval = setInterval(renderHeaderDate, 30000);

  // Load zones
  try {
    const { zones } = await loadZones();
    S.zones = zones;
    populateZones(zones);
  } catch {}
  populateMonths();

  // Event listeners
  document.getElementById('zone-selector')?.addEventListener('change', e => {
    S.zone = e.target.value;
    renderAll(); pushParams();
  });
  document.getElementById('month-selector')?.addEventListener('change', e => {
    S.month = parseInt(e.target.value);
    renderAll(); pushParams();
  });
  document.getElementById('btn-locate')?.addEventListener('click', handleLocate);

  // Share buttons
  document.getElementById('btn-share-today')?.addEventListener('click', () => {
    const row = todayRow(S.data);
    if (!row) { alert('No data loaded yet.'); return; }
    openShareModal(buildShareText(S.data, row));
  });
  document.getElementById('btn-share-month')?.addEventListener('click', () => {
    if (!S.data) { alert('No data loaded yet.'); return; }
    openShareModal(buildMonthShareText(S.data));
  });

  // Share modal
  document.getElementById('btn-modal-close')?.addEventListener('click', closeShareModal);
  document.getElementById('share-modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'share-modal-overlay') closeShareModal();
  });
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const text = document.getElementById('share-modal-overlay')?._shareText || '';
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('btn-copy');
      if (btn) { btn.textContent = '✓ Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = '📋 Copy Text'; btn.classList.remove('copied'); }, 2000); }
    } catch { alert('Could not copy — please select and copy manually.'); }
  });
  document.getElementById('btn-share-native')?.addEventListener('click', async () => {
    const text = document.getElementById('share-modal-overlay')?._shareText || '';
    if (navigator.share) {
      try { await navigator.share({ title: 'Sri Lanka Prayer Times', text }); }
      catch {}
    } else {
      // Fallback: WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  });

  // Render
  await renderAll();
}

document.addEventListener('DOMContentLoaded', init);
