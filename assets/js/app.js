/* ============================================================
   Sri Lanka Prayer Times - Main Application
   All data loaded from /data/ folder (ACJU Timetables)
   ============================================================ */

'use strict';

// ── Constants ─────────────────────────────────────────────
const DATA_BASE = './data';

const PRAYER_ORDER = ['fajr', 'sunrise', 'luhr', 'asr', 'magrib', 'isha'];
const PRAYER_LABELS = {
  fajr: 'Fajr', sunrise: 'Sunrise', luhr: 'Zuhr', asr: 'Asr', magrib: 'Maghrib', isha: 'Isha'
};
const PRAYER_ICONS = {
  fajr: '🌙', sunrise: '🌅', luhr: '☀️', asr: '🌤️', magrib: '🌆', isha: '🌙'
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hijri month names
const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
];

// ── State ─────────────────────────────────────────────────
let state = {
  zones: [],
  currentData: null,
  currentZoneId: '01',
  currentMonthNum: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  today: new Date(),
  countdownInterval: null,
  clockInterval: null,
};

// ── Utility ───────────────────────────────────────────────
function parseTime(timeStr) {
  // Parses "4:52 AM" or "12:16 PM" into a Date for today
  if (!timeStr) return null;
  const [time, period] = timeStr.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, m, 0, 0);
  return d;
}

function subtractMinutes(timeStr, mins) {
  const d = parseTime(timeStr);
  if (!d) return '';
  d.setMinutes(d.getMinutes() - mins);
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

function formatTimeTo12(date) {
  let h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

function padZero(n) { return String(n).padStart(2, '0'); }

function getHijriDate() {
  try {
    const now = new Date();
    const hijri = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(now);
    return hijri;
  } catch {
    // Fallback basic calculation (approximate)
    return '';
  }
}

// ── Data Loading ──────────────────────────────────────────
async function loadZones() {
  const res = await fetch(`${DATA_BASE}/zones.json`);
  if (!res.ok) throw new Error('Failed to load zones');
  return res.json();
}

async function loadPrayerData(zoneId, monthNum) {
  const key = `zone${String(zoneId).padStart(2,'0')}-${String(monthNum).padStart(2,'0')}`;
  const res = await fetch(`${DATA_BASE}/${key}.json`);
  if (!res.ok) throw new Error(`No data for ${key}`);
  return res.json();
}

// ── Get Today's Row ───────────────────────────────────────
function getTodayRow(data) {
  const today = new Date();
  const day = today.getDate();
  const monthAbbr = MONTH_NAMES[today.getMonth() + 1].slice(0, 3);
  const dateStr = `${day}-${monthAbbr}`;
  return data.days.find(r => r.date === dateStr) || null;
}

// ── Determine Current & Next Prayer ──────────────────────
function getCurrentAndNextPrayer(todayRow) {
  if (!todayRow) return { current: null, next: null };

  const now = new Date();
  const prayers = PRAYER_ORDER.map(key => ({
    key,
    time: parseTime(todayRow[key])
  })).filter(p => p.time);

  let current = null;
  let next = null;

  for (let i = 0; i < prayers.length; i++) {
    if (now >= prayers[i].time) {
      current = prayers[i].key;
      next = prayers[i + 1] || null;
    }
  }

  // If before Fajr
  if (!current) {
    next = prayers[0] || null;
  }

  return { current, next };
}

// ── Render Prayer Cards ───────────────────────────────────
function renderPrayerCards(todayRow, currentPrayer) {
  const grid = document.getElementById('prayer-cards-grid');
  if (!grid || !todayRow) return;

  const imsakTime = subtractMinutes(todayRow.fajr, 2);

  // Update imsak/iftar bar
  const imsakEl = document.getElementById('imsak-time');
  const iftarEl = document.getElementById('iftar-time');
  if (imsakEl) imsakEl.textContent = imsakTime;
  if (iftarEl) iftarEl.textContent = todayRow.magrib;

  grid.innerHTML = '';

  PRAYER_ORDER.forEach(key => {
    const isActive = key === currentPrayer;
    const isSunrise = key === 'sunrise';
    const card = document.createElement('div');
    card.className = `prayer-card${isActive ? ' active' : ''}${isSunrise ? ' sunrise-card' : ''}`;
    card.dataset.prayer = key;

    const timeStr = todayRow[key] || '';
    const [timeOnly, ampm] = timeStr.split(' ');

    card.innerHTML = `
      <div class="now-badge">Now</div>
      <div class="prayer-icon">${PRAYER_ICONS[key]}</div>
      <div class="prayer-name">${PRAYER_LABELS[key]}</div>
      <div class="prayer-time">${timeOnly || '--:--'}<span class="prayer-time-ampm"> ${ampm || ''}</span></div>
    `;
    grid.appendChild(card);
  });
}

// ── Render Countdown ──────────────────────────────────────
function updateCountdown(todayRow, nextPrayer) {
  const labelEl = document.getElementById('next-prayer-name');
  const timerEl = document.getElementById('countdown-timer');
  if (!labelEl || !timerEl || !nextPrayer || !todayRow) return;

  const nextTime = parseTime(todayRow[nextPrayer.key]);
  if (!nextTime) return;

  const now = new Date();
  let diff = nextTime - now;
  if (diff < 0) diff += 24 * 60 * 60 * 1000;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  labelEl.textContent = PRAYER_LABELS[nextPrayer.key];
  timerEl.textContent = `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
}

// ── Render Weekly Table ───────────────────────────────────
function renderWeeklyTable(data) {
  const tbody = document.getElementById('weekly-tbody');
  if (!tbody || !data) return;

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;

  // Get 7 days: today +/- few days
  const todayMonthAbbr = MONTH_NAMES[todayMonth].slice(0, 3);

  // Filter days around today
  let todayIdx = data.days.findIndex(r => r.date === `${todayDay}-${todayMonthAbbr}`);
  if (todayIdx === -1) todayIdx = 0;

  const start = Math.max(0, todayIdx - 1);
  const end = Math.min(data.days.length, start + 7);
  const weekDays = data.days.slice(start, end);

  tbody.innerHTML = '';

  weekDays.forEach((row, idx) => {
    const [dayNum, monthAbbr] = row.date.split('-');
    const isToday = parseInt(dayNum) === todayDay && data.monthNum === todayMonth;

    const dayOfWeek = new Date(data.year, data.monthNum - 1, parseInt(dayNum)).getDay();
    const dayName = WEEK_DAYS[dayOfWeek];

    const tr = document.createElement('tr');
    if (isToday) tr.className = 'today-row';

    tr.innerHTML = `
      <td>
        <strong>${dayName}</strong>, ${row.date}
        ${isToday ? '<span class="today-indicator">Today</span>' : ''}
      </td>
      <td>${row.fajr}</td>
      <td>${row.sunrise}</td>
      <td>${row.luhr}</td>
      <td>${row.asr}</td>
      <td>${row.magrib}</td>
      <td>${row.isha}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Full Monthly Table ─────────────────────────────
function renderMonthlyTable(data, selectedMonthNum) {
  const tbody = document.getElementById('monthly-tbody');
  const monthTitle = document.getElementById('monthly-month-title');
  const zoneLabel = document.getElementById('monthly-zone-label');

  if (!tbody || !data) return;

  if (monthTitle) monthTitle.textContent = `${data.monthName} ${data.year}`;
  if (zoneLabel) zoneLabel.textContent = `${data.zoneName} — ${data.districts.join(', ')}`;

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayMonthAbbr = MONTH_NAMES[todayMonth].slice(0, 3);

  tbody.innerHTML = '';

  data.days.forEach(row => {
    const [dayNum, monthAbbr] = row.date.split('-');
    const isToday = parseInt(dayNum) === todayDay && data.monthNum === todayMonth;
    const dayOfWeek = new Date(data.year, data.monthNum - 1, parseInt(dayNum)).getDay();
    const dayName = WEEK_DAYS[dayOfWeek];
    const isFriday = dayOfWeek === 5;

    const tr = document.createElement('tr');
    if (isToday) tr.className = 'today-row-monthly';
    if (isFriday) tr.style.fontWeight = '600';

    tr.innerHTML = `
      <td>
        <strong>${dayName}</strong>, ${row.date}
        ${isToday ? '<span class="today-indicator">Today</span>' : ''}
      </td>
      <td>${row.fajr}</td>
      <td>${row.sunrise}</td>
      <td>${row.luhr}</td>
      <td>${row.asr}</td>
      <td>${row.magrib}</td>
      <td>${row.isha}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Apartment Table ────────────────────────────────
function renderAptTable(data) {
  const tbody = document.getElementById('apt-tbody');
  if (!tbody || !data?.apartmentDiff) return;

  const apt = data.apartmentDiff;
  tbody.innerHTML = `
    <tr>
      <td>${apt.lowRise.stories}</td>
      <td>${apt.lowRise.heightM}</td>
      <td class="apt-diff-neg">${apt.lowRise.fajr}</td>
      <td class="apt-diff-neg">${apt.lowRise.sunrise}</td>
      <td class="apt-diff-pos">+${Math.abs(apt.lowRise.magrib)}</td>
      <td class="apt-diff-pos">+${Math.abs(apt.lowRise.isha)}</td>
    </tr>
    <tr>
      <td>${apt.highRise.stories}</td>
      <td>${apt.highRise.heightM}</td>
      <td class="apt-diff-neg">${apt.highRise.fajr}</td>
      <td class="apt-diff-neg">${apt.highRise.sunrise}</td>
      <td class="apt-diff-pos">+${Math.abs(apt.highRise.magrib)}</td>
      <td class="apt-diff-pos">+${Math.abs(apt.highRise.isha)}</td>
    </tr>
  `;
}

// ── Populate Zone Selector ────────────────────────────────
function populateZoneSelector(zones) {
  const sel = document.getElementById('zone-selector');
  if (!sel) return;
  sel.innerHTML = '';
  zones.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.id;
    opt.textContent = `${z.name} — ${z.districts.join(', ')}`;
    if (z.id === state.currentZoneId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Populate Month Selector ───────────────────────────────
function populateMonthSelector() {
  const sel = document.getElementById('month-selector');
  if (!sel) return;
  sel.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = MONTH_NAMES[i];
    if (i === state.currentMonthNum) opt.selected = true;
    sel.appendChild(opt);
  }
}

// ── Update Header Date ────────────────────────────────────
function updateHeaderDate() {
  const gEl = document.getElementById('header-date-gregorian');
  const hEl = document.getElementById('header-date-hijri');
  if (!gEl) return;

  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  gEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()+1]} ${now.getFullYear()}`;

  if (hEl) {
    const hijri = getHijriDate();
    hEl.textContent = hijri || '';
  }
}

// ── Update Location Display ───────────────────────────────
function updateLocationDisplay(data) {
  const h1 = document.getElementById('location-title');
  const meta = document.getElementById('location-meta');
  if (!h1 || !data) return;

  h1.textContent = `Prayer Times — ${data.districts.join(', ')}`;
  if (meta) {
    meta.innerHTML = `
      Sri Lanka &bull; ${data.zoneName}
      &bull; <span class="badge-source">✓ ACJU Official</span>
    `;
  }
}

// ── Main Render ───────────────────────────────────────────
async function renderAll(zoneId, monthNum, isInitial = false) {
  const mainEl = document.getElementById('main-content-area');

  try {
    // Show loading for data sections
    document.getElementById('prayer-cards-grid').innerHTML =
      '<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>';

    const data = await loadPrayerData(zoneId, monthNum);
    state.currentData = data;

    // Today's prayer status
    const todayRow = getTodayRow(data);
    const { current, next } = getCurrentAndNextPrayer(todayRow);

    // Render all sections
    renderPrayerCards(todayRow, current);
    renderWeeklyTable(data);
    renderMonthlyTable(data, monthNum);
    renderAptTable(data);
    updateLocationDisplay(data);

    // Start/restart countdown
    clearInterval(state.countdownInterval);
    if (next && todayRow) {
      updateCountdown(todayRow, next);
      const nextPrayerLabel = document.getElementById('next-prayer-name-wrap');
      if (nextPrayerLabel) nextPrayerLabel.classList.remove('hidden');
      state.countdownInterval = setInterval(() => {
        const newData = state.currentData;
        const newTodayRow = getTodayRow(newData);
        const { current: c, next: n } = getCurrentAndNextPrayer(newTodayRow);
        if (n) updateCountdown(newTodayRow, n);
        // Re-render cards only if current prayer changed
        if (c !== current) renderPrayerCards(newTodayRow, c);
      }, 1000);
    }

  } catch (err) {
    console.error('Error loading prayer data:', err);
    document.getElementById('prayer-cards-grid').innerHTML =
      `<div class="error-msg" style="grid-column:1/-1">
        Could not load prayer times. Please check your connection or select a different zone/month.
        <br><small>${err.message}</small>
      </div>`;
  }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  // Detect user's preferred zone from URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('zone')) state.currentZoneId = params.get('zone').padStart(2, '0');
  if (params.get('month')) state.currentMonthNum = parseInt(params.get('month'));

  updateHeaderDate();

  // Load zones metadata
  try {
    const { zones } = await loadZones();
    state.zones = zones;
    populateZoneSelector(zones);
  } catch (e) {
    console.warn('Zones metadata unavailable, using defaults');
  }

  populateMonthSelector();

  // Zone change
  document.getElementById('zone-selector')?.addEventListener('change', e => {
    state.currentZoneId = e.target.value;
    renderAll(state.currentZoneId, state.currentMonthNum);
    updateUrlParams();
  });

  // Month change
  document.getElementById('month-selector')?.addEventListener('change', e => {
    state.currentMonthNum = parseInt(e.target.value);
    renderAll(state.currentZoneId, state.currentMonthNum);
    updateUrlParams();
  });

  // Clock update
  state.clockInterval = setInterval(updateHeaderDate, 60000);

  // Load initial data
  await renderAll(state.currentZoneId, state.currentMonthNum, true);
}

function updateUrlParams() {
  const url = new URL(window.location);
  url.searchParams.set('zone', state.currentZoneId);
  url.searchParams.set('month', state.currentMonthNum);
  window.history.replaceState({}, '', url);
}

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
