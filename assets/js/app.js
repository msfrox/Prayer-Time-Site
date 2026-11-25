/* ============================================================
   Sri Lanka Prayer Times — App v8
   assets/js/pt-core.js is the single source of truth for all
   data + time logic (parsing, status, geofencing, Hijri). This
   file is the DOM layer on top of it — render + event wiring only.
   ============================================================ */
'use strict';

// ── Version ───────────────────────────────────────────────
// Semver: bump PATCH for tiny fixes / data-only updates (new year JSON etc.),
// MINOR for improvements / bug fixes, MAJOR for new features or redesigns.
// Update README version history when you bump.
// Shown in the footer so users + reports can identify the build.
const SITE_VERSION = '8.0.0';

// ── Constants pulled from PT (pt-core.js) — kept as local names
// so the render code below didn't need to change call sites.
const DATA_BASE = PT.DATA_BASE;
const PRAYERS   = PT.PRAYERS;
const P_LABEL   = PT.P_LABEL;
// Own icon set: magrib differs from pt-core's (🏙️ vs 🌇) — a deliberate
// live-site choice, not something pt-core should override.
const P_ICON    = { fajr:'🌙', sunrise:'🌅', luhr:'☀️', asr:'🌤️', magrib:'🏙️', isha:'🌙' };

const MON_FULL  = PT.MON_FULL;
const MON_SHORT = PT.MON_SHORT;
const WDAY_S    = PT.WDAY_S;
const WDAY_F    = PT.WDAY_F;
const IDAY_F    = PT.IDAY_F;

const LS_ZONE  = 'slpt_zone';      // remembered zone across visits
const LS_ASKED = 'slpt_asked';     // first-run soft-ask already shown

// ── State ─────────────────────────────────────────────────
const S = {
  zones:      [],
  todayData:  null,   // ← ALWAYS current month's data for the selected zone
  tableData:  null,   // ← month-selector month (for monthly table only)
  zone:       '01',
  todayMonth: new Date().getMonth() + 1,   // real today's month — never changes
  tableMonth: new Date().getMonth() + 1,   // follows the selector
  year:       new Date().getFullYear(),
  tickTimer:  null,
  clockTimer: null,
};

// ── Utils ─────────────────────────────────────────────────
const pad = PT.pad;
const findRowByDate = PT.rowForDate;
const parseTime  = PT.parseTime;
const minusMins  = PT.minusMins;
const splitTime  = PT.splitTime;
const hijriDate  = PT.hijriToday;
const hijriShort = PT.hijriShort;
const hijriForDate = PT.hijriFor;

// Resolve a GPS coordinate to a zone (real ACJU zone polygons, lazy-loaded
// on first "Locate Me"). Points within SEA_BUFFER_KM of the coast snap to
// the nearest zone; beyond that we report "outside Sri Lanka".
// { zone:'NN', status:'exact'|'nearshore' } or { zone:null, status:'outside' }
const resolveZone = PT.resolveZone;
const loadZoneGeo = PT.loadGeo;

// ── Tiny toast (no markup needed) ──────────────────────────
let _toastTimer = null;
function toast(msg) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
}

// ── Remembered zone (localStorage, best-effort) ────────────
const saveZone = PT.setZone;
// Not PT.getZone — that defaults to '01' when unset, which would break the
// firstRun (never-chosen-before) check in init() below.
function savedZone()  { try { return localStorage.getItem(LS_ZONE); } catch { return null; } }
function markAsked()  { try { localStorage.setItem(LS_ASKED, '1'); } catch {} }
function wasAsked()   { try { return localStorage.getItem(LS_ASKED) === '1'; } catch { return false; } }

// ── First-run soft-ask card ────────────────────────────────
// Shown once on a fresh visit: tapping "Allow" triggers the real GPS prompt.
function showLocatePrompt() {
  if (document.getElementById('locate-prompt')) return;
  const card = document.createElement('div');
  card.id = 'locate-prompt';
  card.className = 'locate-prompt';
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', 'Location permission');
  card.innerHTML =
    `<span class="lp-text">📍 Show prayer times for your area?</span>
     <span class="lp-actions">
       <button class="lp-allow" id="lp-allow">Allow</button>
       <button class="lp-skip" id="lp-skip">Not now</button>
     </span>`;
  document.body.appendChild(card);
  requestAnimationFrame(() => card.classList.add('visible'));

  const close = () => { markAsked(); card.classList.remove('visible'); setTimeout(() => card.remove(), 250); };
  document.getElementById('lp-allow').addEventListener('click', () => { close(); handleLocate(); });
  document.getElementById('lp-skip').addEventListener('click', close);
  card.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ── Data fetching ─────────────────────────────────────────
async function loadZones(){
  return { zones: PT.ZONES }; // inlined in pt-core — no fetch needed
}
const loadData = PT.loadMonth;
const findTodayRow = PT.todayRow;
const prayerStatus = PT.status;

// ── Header + Hero Date ─────────────────────────────────────
function renderHeader(){
  const now  = new Date();
  const hrs  = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const h12  = hrs % 12 || 12;
  const ampm = hrs < 12 ? 'AM' : 'PM';
  const timeStr = `${pad(h12)}:${pad(mins)}:${pad(secs)} ${ampm}`;
  const dateStr = `${WDAY_S[now.getDay()]}, ${now.getDate()} ${MON_SHORT[now.getMonth()+1]} ${now.getFullYear()}`;
  const hijriStr = hijriShort();
  const combined = `${timeStr} · ${dateStr}`;

  // Header date (hidden on mobile via CSS, visible on desktop)
  const gEl = document.getElementById('header-gregorian');
  const hEl = document.getElementById('header-hijri');
  if(gEl) gEl.textContent = combined;
  if(hEl) hEl.textContent = hijriStr;

  // Hero date block (always visible)
  const hgEl = document.getElementById('hero-date-greg');
  const hhEl = document.getElementById('hero-date-hijri');
  if(hgEl) hgEl.textContent = combined;
  if(hhEl) hhEl.textContent = hijriStr;
}

// ── Hero ──────────────────────────────────────────────────
// The hero ALWAYS uses S.todayData (real today), never the table month
// nextRow: tomorrow's row (passed when isNextDay=true so we show correct Fajr time)
function renderHero(data, row, nextRow, isNextDay) {
  const {current, next} = prayerStatus(row);
  const locEl   = document.getElementById('hero-location-name');
  const badgeEl = document.getElementById('hero-location-badge');
  if(locEl && data)   locEl.textContent = data.districts.join(' • ');
  if(badgeEl && data) badgeEl.textContent = data.zoneName;

  const lblEl = document.getElementById('hero-next-label');
  const nmEl  = document.getElementById('hero-next-name');
  const atEl  = document.getElementById('hero-next-at');

  // When after Isha, use tomorrow's row for the Fajr time
  const timeRow = (isNextDay && nextRow) ? nextRow : row;

  if(next && timeRow) {
    if(lblEl) lblEl.textContent = isNextDay ? "Tomorrow's Fajr" : (current ? 'Next Prayer' : 'First Prayer');
    if(nmEl)  nmEl.textContent = P_LABEL[next];
    if(atEl)  atEl.textContent = `at ${timeRow[next]}`;
  } else {
    if(nmEl) nmEl.textContent = '—';
    if(atEl) atEl.textContent = 'No more prayers today';
  }
}

// ── Featured card ─────────────────────────────────────────
function renderFeatured(row,current,next){
  const show = current||next||'fajr';
  const {hm,ap}=splitTime(row?.[show]||'');
  const badge=document.getElementById('featured-badge');
  const icon =document.getElementById('featured-icon');
  const name =document.getElementById('featured-name');
  const time =document.getElementById('featured-time');
  const ampm =document.getElementById('featured-ampm');
  const sub  =document.getElementById('featured-sub');
  if(icon) icon.textContent=P_ICON[show];
  if(name) name.textContent=P_LABEL[show];
  if(time&&time.childNodes[0]) time.childNodes[0].textContent=hm;
  if(ampm) ampm.textContent=' '+ap;
  if(badge){
    if(current===show){badge.textContent='NOW';badge.style.display='';}
    else if(next===show){badge.textContent='NEXT';badge.style.display='';}
    else{badge.style.display='none';}
  }
  if(sub){
    if(show==='fajr'&&row?.sunrise){
      const diff=Math.round((parseTime(row.sunrise)-parseTime(row.fajr))/60000);
      sub.textContent=`Sunrise in ${diff} min`;
    } else { sub.textContent=''; }
  }
}

// ── Prayer list ────────────────────────────────────────────
// nextRow: tomorrow's row — used to show correct Fajr time when isNextDay=true
function renderList(row, current, next, isNextDay, nextRow) {
  const panel = document.getElementById('prayer-list');
  if(!panel) return;
  if(!row) { panel.innerHTML = '<div class="loading-block"><span style="color:#aaa">No data for today</span></div>'; return; }
  panel.innerHTML = '';
  PRAYERS.forEach(key => {
    const isNow  = key === current;
    const isNext = key === next;
    const isPast = !isNow && !isNext && current && PRAYERS.indexOf(key) < PRAYERS.indexOf(current);
    // When after Isha, show tomorrow's Fajr time instead of today's
    const displayRow = (isNext && isNextDay && nextRow) ? nextRow : row;
    const {hm, ap} = splitTime(displayRow[key] || '');
    const badgeText = isNow ? 'Now' : (isNext ? (isNextDay ? 'Tomorrow' : 'Next') : '');
    const badge = isNow ? '<span class="pr-badge pr-badge-now">Now</span>'
                : isNext ? `<span class="pr-badge pr-badge-next">${badgeText}</span>` : '';
    const div = document.createElement('div');
    div.className = `prayer-row${isNow?' is-current':''}${isNext?' is-next':''}${isPast?' is-past':''}${key==='sunrise'?' is-sunrise':''}`;
    div.innerHTML = `<span class="pr-icon">${P_ICON[key]}</span>
      <span class="pr-name">${P_LABEL[key]}</span>${badge}
      <span class="pr-time">${hm}<span class="pr-time-ampm"> ${ap}</span></span>`;
    panel.appendChild(div);
  });
}

// ── Imsak / Iftar ─────────────────────────────────────────
function renderImsakIftar(row){
  if(!row) return;
  const imsak=minusMins(row.fajr,2);
  const {hm:ih,ap:ia}=splitTime(imsak);
  const {hm:mh,ap:ma}=splitTime(row.magrib||'');
  const iEl=document.getElementById('imsak-display');
  const fEl=document.getElementById('iftar-display');
  if(iEl) iEl.innerHTML=`${ih}<span class="imsak-value-ampm"> ${ia}</span>`;
  if(fEl) fEl.innerHTML=`${mh}<span class="imsak-value-ampm"> ${ma}</span>`;
}

// ── Countdown ─────────────────────────────────────────────
function renderCountdown(row, next, isNextDay) {
  const el = document.getElementById('hero-timer');
  if (!parseTime(row?.[next]) || !el) return;
  el.textContent = PT.fmtHMS(PT.msUntil(row, next, isNextDay));
}

// ── Monthly table ──────────────────────────────────────────
function renderMonthly(data){
  const tbody=document.getElementById('monthly-tbody');
  const title=document.getElementById('monthly-title');
  const zone =document.getElementById('monthly-zone');
  if(!tbody||!data) return;
  if(title) title.textContent=`${data.monthName} ${S.year}`;
  if(zone)  zone.textContent=`${data.zoneName} — ${data.districts.join(', ')}`;
  const now=new Date(), todayNum=now.getDate(), todayMon=now.getMonth()+1;
  tbody.innerHTML='';
  data.days.forEach(day=>{
    const[dNum]=day.date.split('-');
    const isToday=+dNum===todayNum&&data.monthNum===todayMon;
    // Use S.year (current real year) not data.year — prayer times are solar and
    // repeat every year, but the day of week shifts, so we need the actual year.
    const dow=new Date(S.year,data.monthNum-1,+dNum).getDay();
    const tr=document.createElement('tr');
    if(isToday){ tr.className='today-monthly'; tr.setAttribute('aria-current','date'); }
    if(dow===5) tr.classList.add('is-friday');
    tr.innerHTML=`<td><strong>${WDAY_S[dow]}</strong>, ${day.date}${isToday?'<span class="today-chip">Today</span>':''}</td>
      <td>${day.fajr}</td><td>${day.sunrise}</td><td>${day.luhr}</td>
      <td>${day.asr}</td><td>${day.magrib}</td><td>${day.isha}</td>`;
    tbody.appendChild(tr);
  });
}

// ── Apartment table ────────────────────────────────────────
function renderApt(data){
  const tbody=document.getElementById('apt-tbody');
  if(!tbody||!data?.apartmentDiff) return;
  const apt=data.apartmentDiff,fmt=n=>n<0?`−${Math.abs(n)}`:`+${n}`;
  tbody.innerHTML=`<tr>
    <td>${apt.lowRise.stories}</td><td>${apt.lowRise.heightM}</td>
    <td class="diff-neg">${fmt(apt.lowRise.fajr)}</td>
    <td class="diff-neg">${fmt(apt.lowRise.sunrise)}</td>
    <td class="diff-pos">${fmt(apt.lowRise.magrib)}</td>
    <td class="diff-pos">${fmt(apt.lowRise.isha)}</td>
  </tr><tr>
    <td>${apt.highRise.stories}</td><td>${apt.highRise.heightM}</td>
    <td class="diff-neg">${fmt(apt.highRise.fajr)}</td>
    <td class="diff-neg">${fmt(apt.highRise.sunrise)}</td>
    <td class="diff-pos">${fmt(apt.highRise.magrib)}</td>
    <td class="diff-pos">${fmt(apt.highRise.isha)}</td>
  </tr>`;
}

// ── Share builders ─────────────────────────────────────────
// displayYear: the year from the date picker (not data.year which is a JSON metadata field)
// Since timetable data is the same every year, displayYear is always the user-selected year.
function buildTodayShare(data, row, displayYear) {
  if (!data || !row) return '';
  const yr    = displayYear || S.year;
  const dNum  = +row.date.split('-')[0];
  const d     = new Date(yr, data.monthNum - 1, dNum);
  const imsak = minusMins(row.fajr, 2);
  // Uniform 3 dashes for every prayer — consistent regardless of name length
  const ln = (name, time) => `  ${name} ─── ${time}`;
  return [
    `Sri Lankan Prayer Times - ${data.districts.join(', ')}`,
    `${WDAY_F[d.getDay()]} ${dNum} ${data.monthName} ${yr} / ${IDAY_F[d.getDay()]} ${hijriDate()}`,
    `  Fajr ───── ${row.fajr}`,
    `  Sunrise ─── ${row.sunrise}`,
    `  Zuhr ──── ${row.luhr}`,
    `  Asr ───── ${row.asr}`,
    `  Maghrib ─── ${row.magrib}`,
    `  Isha ───── ${row.isha}`,
    `Shared from - pray.sakina.lk`,
    `Source: ACJU Official - www.acju.lk/prayer-times/`,
  ].join('\n');
}

function buildMonthShare(data, displayYear) {
  if (!data) return '';
  const yr  = displayYear || S.year;
  // Compact format: a/p suffix keeps times short so columns fit in WhatsApp
  const t = s => s ? s.replace(/ AM$/i,'a').replace(/ PM$/i,'p') : '—';
  const SEP = `──────────────────────────────`;  // shorter separator
  const lines = [
    `SRI LANKA PRAYER TIMES — ${data.monthName} ${yr}`,
    `${data.districts.join(', ')}`,
    `Source: ACJU | www.acju.lk/prayer-times/`,
    ``,
    SEP,
    `${'Date'.padEnd(8)} ${'Dy'.padEnd(4)} ${'Fajr'.padEnd(8)} ${'Zuhr'.padEnd(9)} ${'Asr'.padEnd(8)} ${'Maghrib'.padEnd(9)} Isha`,
    SEP,
  ];
  data.days.forEach(d => {
    const dow = new Date(yr, data.monthNum - 1, +d.date.split('-')[0]).getDay();
    lines.push(
      `${d.date.padEnd(8)} ${WDAY_S[dow].padEnd(4)} ${t(d.fajr).padEnd(8)} ${t(d.luhr).padEnd(9)} ${t(d.asr).padEnd(8)} ${t(d.magrib).padEnd(9)} ${t(d.isha)}`
    );
  });
  lines.push(SEP);
  lines.push(``);
  lines.push(`To generate your own prayer times, visit pray.sakina.lk`);
  return lines.join('\n');
}

// ── Canvas Image Generation ────────────────────────────────

function _cvSetup(w, h) {
  const canvas = document.createElement('canvas');
  const dpr    = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

function _txt(ctx, text, x, y, { size=13, weight='400', color='#1A1A1A', align='left' }={}) {
  ctx.save();
  ctx.fillStyle  = color;
  ctx.font       = `${weight} ${size}px "Plus Jakarta Sans",system-ui,-apple-system,sans-serif`;
  ctx.textAlign  = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function _hrule(ctx, x1, y, x2, color='rgba(0,0,0,.1)', lw=1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.restore();
}

// Light parchment background (used by both day and month images)
function _bgLight(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w * .6, h);
  g.addColorStop(0, '#F4F1EC');
  g.addColorStop(1, '#EDE9E0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Subtle warm gold glow top-right
  const g2 = ctx.createRadialGradient(w, 0, 0, w, 0, w * .65);
  g2.addColorStop(0, 'rgba(184,137,42,.07)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
}

function _goldBar(ctx, w, y) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#B8892A');
  g.addColorStop(.5, '#CFA344');
  g.addColorStop(1, '#B8892A');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, 3);
}

function generateDayCanvas(data, row, displayYear) {
  const W = 420, H = 430;
  const { canvas, ctx } = _cvSetup(W, H);
  const P = 26;
  _bgLight(ctx, W, H);
  _goldBar(ctx, W, 0);
  _goldBar(ctx, W, H - 3);

  let y = 30;
  // Header row
  _txt(ctx, 'SRI LANKA PRAYER TIMES', P, y, { size: 9.5, weight: '700', color: '#9A9890' });
  _txt(ctx, 'ACJU Official', W - P, y, { size: 9.5, color: '#B8892A', align: 'right' });
  y += 20;
  _txt(ctx, data.districts.join(', '), P, y, { size: 16, weight: '700', color: '#B8892A' });
  y += 8;
  _hrule(ctx, P, y, W - P, 'rgba(184,137,42,.4)');
  y += 18;

  const dNum = +row.date.split('-')[0];
  const d    = new Date(displayYear, data.monthNum - 1, dNum);
  _txt(ctx, `${WDAY_F[d.getDay()]}  /  ${IDAY_F[d.getDay()]}`, P, y, { size: 10.5, color: '#9A9890' });
  y += 32;
  _txt(ctx, `${dNum} ${data.monthName} ${displayYear}`, P, y, { size: 26, weight: '800', color: '#1A1A1A' });
  y += 23;
  _txt(ctx, hijriForDate(d), P, y, { size: 10.5, color: '#9A9890' });
  y += 18;
  _hrule(ctx, P, y, W - P, 'rgba(0,0,0,.08)');
  y += 25;

  // Prayer rows
  const prayers = [
    { name:'Fajr',    time:row.fajr,   muted:false },
    { name:'Sunrise', time:row.sunrise, muted:true  },
    { name:'Zuhr',    time:row.luhr,   muted:false },
    { name:'Asr',     time:row.asr,    muted:false },
    { name:'Maghrib', time:row.magrib, muted:false },
    { name:'Isha',    time:row.isha,   muted:false },
  ];
  prayers.forEach(({ name, time, muted }, i) => {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,.03)';
      ctx.fillRect(0, y - 22, W, 32);
    }
    const nc = muted ? '#8A9E8E' : '#4A4840';
    const tc = muted ? '#8A9E8E' : '#1A1A1A';
    const nw = muted ? '400' : '500';
    const tw = muted ? '400' : '700';
    _txt(ctx, name, P, y, { size: 13.5, weight: nw, color: nc });
    _txt(ctx, time || '—', W - P, y, { size: 14, weight: tw, color: tc, align: 'right' });
    y += 32;
  });

  y -= 20;
  _hrule(ctx, P, y, W - P, 'rgba(0,0,0,.08)');
  y += 20;
  _txt(ctx, 'Imsak · Sahr End', P, y, { size: 11, weight: '600', color: '#7A7870' });
  _txt(ctx, minusMins(row.fajr, 2), W - P, y, { size: 12.5, weight: '700', color: '#B8892A', align: 'right' });
  y += 37;
  _hrule(ctx, P, y, W - P, 'rgba(184,137,42,.25)');
  y += 13;
  _txt(ctx, 'www.acju.lk/prayer-times/', P, y, { size: 9, color: '#B0AEA8' });
  _txt(ctx, 'For full timetable, visit - pray.sakina.lk', W - P, y, { size: 9, color: '#312308', align: 'right' });

  return canvas;
}

function generateMonthCanvas(data, displayYear) {
  const W     = 620;
  const ROW_H = 22;
  const HEAD  = 152;
  const FOOT  = 50;
  const H     = HEAD + data.days.length * ROW_H + FOOT;
  const { canvas, ctx } = _cvSetup(W, H);
  const P = 20;
  _bgLight(ctx, W, H);
  _goldBar(ctx, W, 0);
  _goldBar(ctx, W, H - 3);

  // Header section
  let y = 32;
  _txt(ctx, `SRI LANKA PRAYER TIMES — ${data.monthName.toUpperCase()} ${displayYear}`, P, y, { size: 13.5, weight: '900', color: '#4A4840' });
  _txt(ctx, 'ACJU Official', W - P, y, { size: 9.5, color: '#B8892A', align: 'right' });
  y += 19;
  _txt(ctx, data.districts.join(', '), P, y, { size: 11, color: '#B8892A' });
  y += 15;
  _txt(ctx, `${data.zoneName}  ·  ${hijriForDate(new Date(displayYear, data.monthNum - 1, 1))}`, P, y, { size: 9.5, color: '#9A9890' });
  y += 11;
  _hrule(ctx, P, y, W - P, 'rgba(184,137,42,.35)');
  y += 16;

  // Column definitions — 8 cols (Date, Day, Fajr, Sunrise, Zuhr, Asr, Maghrib, Isha)
  // For right-aligned cols, x is the right edge of the text
  const COLS = [
    { l:'Date',    x:P,   r:false            },
    { l:'Day',     x:80,  r:false            },
    { l:'Fajr',   x:170,  r:true             },
    { l:'Sunrise', x:256,  r:true, muted:true },  // muted sage
    { l:'Zuhr',   x:342,  r:true             },
    { l:'Asr',    x:428,  r:true             },
    { l:'Maghrib',x:514,  r:true             },
    { l:'Isha',   x:600,  r:true             },  // W - P = 600
  ];

  COLS.forEach(c => _txt(ctx, c.l, c.x, y, {
    size: 12, weight: '700',
    color: c.muted ? '#8A9E8E' : '#6B7D70',
    align: c.r ? 'right' : 'left'
  }));
  y += 8;
  _hrule(ctx, P, y, W - P, 'rgba(0,0,0,.1)');
  y += 17;

  const todayD = new Date().getDate(), todayM = new Date().getMonth() + 1;
  // Compact time: "4:32a" / "6:22p"
  const tc = s => s ? s.replace(/ AM$/i,'AM').replace(/ PM$/i,'PM') : '—';

  data.days.forEach((day, i) => {
    const dNum = +day.date.split('-')[0];
    const dow  = new Date(displayYear, data.monthNum - 1, dNum).getDay();
    const isTd = dNum === todayD && data.monthNum === todayM;
    const isFr = dow === 5;

    if (isTd) {
      ctx.fillStyle = 'rgba(184,137,42,.12)';
      ctx.fillRect(0, y - ROW_H + 5, W, ROW_H);
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,.025)';
      ctx.fillRect(0, y - ROW_H + 5, W, ROW_H);
    }

    const dateC = isTd ? '#B8892A' : isFr ? '#58655a' : '#4A4840';
    const timeC = isTd ? '#1A1A1A' : '#4A4840';
    const fw    = isTd ? '700' : '400';

    _txt(ctx, day.date,     P,  y-3, { size:10.5, weight:fw, color:dateC });
    _txt(ctx, WDAY_S[dow], 74, y-3, { size:9.5,  color:'#9A9890' });

    // Time values: Fajr, Sunrise (muted), Zuhr, Asr, Maghrib, Isha
    const times = [day.fajr, day.sunrise, day.luhr, day.asr, day.magrib, day.isha];
    times.forEach((tv, ti) => {
      const c  = COLS[ti + 2];
      const isSr = ti === 1; // Sunrise is index 1
      _txt(ctx, tc(tv), c.x, y, {
        size:   10.5,
        weight: isSr ? '400' : fw,
        color:  isSr ? '#8A9E8E' : timeC,
        align:  'right'
      });
    });
    y += ROW_H;
  });

  y += 4;
  _hrule(ctx, P, y, W - P, 'rgba(0,0,0,.08)');
  y += 14;
  _txt(ctx, 'www.acju.lk/prayer-times/', P, y, { size: 9, color: '#B0AEA8' });
  _txt(ctx, 'For full timetable, visit - pray.sakina.lk', W - P, y, { size: 9, color: '#312308', align: 'right' });

  return canvas;
}

async function shareCanvasImage(canvas, filename) {
  return new Promise(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) { resolve(false); return; }
      // Try native share with file (iOS Safari 15+, HTTPS required in production)
      if (navigator.canShare) {
        const file = new File([blob], filename, { type: 'image/png' });
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Prayer Times shared from - pray.sakina.lk' });
            resolve(true); return;
          }
        } catch (e) { if (e.name !== 'AbortError') console.warn('share:', e); }
      }
      // Fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve(true);
    }, 'image/png');
  });
}

// ── Dialog a11y helper: focus trap, Escape-to-close, focus return ─
// Also inerts every other top-level section while open, so a modal doesn't just
// out-tab-order the rest of the page — it actually removes it from the a11y tree,
// which is what stops the header/main/footer from still reading as low-contrast
// "visible" text underneath the modal's own backdrop tint.
let _dialogReturnFocus = null;
function siblingsOf(ov) {
  return Array.from(document.body.children).filter(el => el !== ov && el.tagName !== 'SCRIPT');
}
function openDialog(ov) {
  _dialogReturnFocus = document.activeElement;
  ov.removeAttribute('inert');
  ov.classList.add('visible');
  siblingsOf(ov).forEach(el => el.setAttribute('inert', ''));
  const focusable = ov.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  (focusable[0] || ov).focus();
  ov.addEventListener('keydown', trapDialogKey);
}
function closeDialog(ov) {
  ov.classList.remove('visible');
  ov.setAttribute('inert', '');
  siblingsOf(ov).forEach(el => el.removeAttribute('inert'));
  ov.removeEventListener('keydown', trapDialogKey);
  if (_dialogReturnFocus && typeof _dialogReturnFocus.focus === 'function') _dialogReturnFocus.focus();
  _dialogReturnFocus = null;
}
function trapDialogKey(e) {
  const ov = e.currentTarget;
  if (e.key === 'Escape') { e.preventDefault(); closeDialog(ov); return; }
  if (e.key !== 'Tab') return;
  const focusable = Array.from(ov.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ── Share modal ────────────────────────────────────────────
function openShareToday(data) {
  if (!data) { alert('No data loaded yet.'); return; }
  const ov        = document.getElementById('share-modal-overlay');
  const pr        = document.getElementById('share-preview-text');
  const dateInput = document.getElementById('share-date-input');
  const pickerRow = document.getElementById('share-date-picker');
  if (!ov || !pr) return;

  if (pickerRow) pickerRow.style.display = '';

  if (dateInput) {
    // Default to today — no min/max: timetables repeat every year so any date works
    const now = new Date();
    dateInput.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

    const updatePreview = async () => {
      const val = dateInput.value; // YYYY-MM-DD
      if (!val) return;
      const [y, m, d] = val.split('-').map(Number);

      // Re-use already-loaded data if possible; otherwise fetch on the fly
      let monthData;
      if (m === S.todayMonth && S.todayData) {
        monthData = S.todayData;
      } else if (m === S.tableMonth && S.tableData) {
        monthData = S.tableData;
      } else {
        pr.textContent = 'Loading…';
        try { monthData = await loadData(S.zone, m); }
        catch(e) { pr.textContent = 'No data for that month.'; ov._text = ''; return; }
      }

      const dayRow = findRowByDate(monthData, new Date(y, m-1, d));
      if (!dayRow) { pr.textContent = 'No data for that date.'; ov._text = ''; return; }

      const text = buildTodayShare(monthData, dayRow, y); // pass display year from picker
      pr.textContent = text;
      ov._text       = text;
      ov._shareCtx   = { type: 'today', data: monthData, row: dayRow, year: y };
    };

    dateInput.onchange = updatePreview;
    updatePreview();
  }

  openDialog(ov);
}

function openShareMonth(data, displayYear) {
  if (!data) { alert('No data loaded yet.'); return; }
  const ov        = document.getElementById('share-modal-overlay');
  const pr        = document.getElementById('share-preview-text');
  const pickerRow = document.getElementById('share-date-picker');
  if (!ov || !pr) return;

  if (pickerRow) pickerRow.style.display = 'none';

  const yr   = displayYear || S.year;
  const text = buildMonthShare(data, yr);
  pr.textContent = text;
  ov._text       = text;
  ov._shareCtx   = { type: 'month', data, year: yr };
  openDialog(ov);
}

function closeShare() {
  const ov = document.getElementById('share-modal-overlay');
  if (ov) closeDialog(ov);
}

// ── Selectors ─────────────────────────────────────────────
function populateZones(zones){
  const sel=document.getElementById('zone-selector'); if(!sel) return;
  sel.innerHTML='';
  zones.forEach(z=>{
    const o=document.createElement('option');
    o.value=z.id; o.textContent=z.districts.join(', ');
    if(z.id===S.zone) o.selected=true;
    sel.appendChild(o);
  });
}
function populateMonths(){
  const sel=document.getElementById('month-selector'); if(!sel) return;
  sel.innerHTML='';
  for(let i=1;i<=12;i++){
    const o=document.createElement('option');
    o.value=i; o.textContent=MON_FULL[i];
    if(i===S.tableMonth) o.selected=true;
    sel.appendChild(o);
  }
}
function pushParams(){
  const u=new URL(location.href);
  u.searchParams.set('zone',S.zone);
  u.searchParams.set('month',S.tableMonth);
  history.replaceState({},'',u);
}

// ── CORE RENDER SPLIT ─────────────────────────────────────
async function renderToday() {
  const panel = document.getElementById('prayer-list');
  if (panel) panel.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';

  try {
    // 1. Load Today's Data
    const data = await loadData(S.zone, S.todayMonth);
    S.todayData = data;
    const row = findTodayRow(data);
    const status = prayerStatus(row);

    // 2. Identify the Countdown Target (handles after-Isha rollover, incl.
    //    across a month boundary — fetching next month's file if needed)
    const { row: countdownRow } = await PT.nextTarget(S.zone, data, status);

    // 3. Render everything
    const tmrwRow = status.isNextDay ? countdownRow : null;
    renderHero(data, row, tmrwRow, status.isNextDay);
    renderFeatured(countdownRow, status.current, status.next);
    renderList(row, status.current, status.next, status.isNextDay, tmrwRow);
    renderImsakIftar(row);
    renderApt(data);

    // 4. Start the Timer
    clearInterval(S.tickTimer);
    S.tickTimer = setInterval(() => {
      const r = findTodayRow(S.todayData);
      const s = prayerStatus(r);
      
      // Update countdown to tomorrow if needed
      let cRow = r;
      if (s.isNextDay) {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        cRow = findRowByDate(S.todayData, tmrw) || countdownRow;
      }

      renderCountdown(cRow, s.next, s.isNextDay);

      // If a prayer starts (e.g., midnight passes), refresh the page
      if (s.current === null && r.date !== row.date) {
        location.reload(); 
      }
    }, 1000);

    renderCountdown(countdownRow, status.next, status.isNextDay);

  } catch (e) {
    console.error(e);
    if (panel) panel.innerHTML = `<div class="loading-block" style="color:#B82020;">Failed to load times.</div>`;
  }
}

async function renderTable(){
  const tbody=document.getElementById('monthly-tbody');
  if(tbody) tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:30px;color:#aaa;"><div class="spinner" style="margin:0 auto 8px"></div>Loading…</td></tr>`;
  try {
    const data=await loadData(S.zone, S.tableMonth);
    S.tableData=data;
    renderMonthly(data);
  } catch(e){
    if(tbody) tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:20px;color:#B82020;">Error loading data: ${e.message}</td></tr>`;
  }
}

// ── Auto-locate (real geofencing) ──────────────────────────
function handleLocate(){
  const btn=document.getElementById('btn-locate');
  const resetBtn=()=>{ if(btn){btn.textContent='📍 Locate Me';btn.classList.remove('locating');} };
  if(!navigator.geolocation){ toast('Geolocation isn’t supported on this device.'); return; }
  if(btn){btn.textContent='⏳ Locating…';btn.classList.add('locating');}

  navigator.geolocation.getCurrentPosition(
    async pos=>{
      try {
        await loadZoneGeo();
      } catch(e) {
        console.error(e); resetBtn(); toast('Couldn’t load location data. Please pick your district.');
        return;
      }
      const { latitude:lat, longitude:lng } = pos.coords;
      const { zone, status } = resolveZone(lat, lng);

      if (status === 'outside' || !zone) {
        resetBtn();
        toast('You appear to be outside Sri Lanka — please pick your district manually.');
        return;
      }

      S.zone = zone;
      saveZone(zone);                       // remember for return visits
      const sel=document.getElementById('zone-selector');
      if(sel) sel.value=S.zone;
      renderToday(); renderTable(); pushParams();
      resetBtn();
      const where = S.zones.find(z => z.id === zone)?.districts.join(', ') || `Zone ${zone}`;
      toast(status === 'nearshore'
        ? `Snapped to nearest coastal zone — ${where}.`
        : `📍 Showing times for ${where}.`);
    },
    err=>{
      resetBtn();
      toast(err && err.code===1
        ? 'Location permission denied — please pick your district manually.'
        : 'Couldn’t detect your location. Please pick your district manually.');
    },
    {enableHighAccuracy:true, timeout:10000, maximumAge:300000}
  );
}

// ── Init ──────────────────────────────────────────────────
async function init(){
  const p=new URLSearchParams(location.search);
  if(p.get('month')) S.tableMonth=parseInt(p.get('month'));

  // Zone source priority: shared link (?zone=) > remembered > first-run auto-detect
  let firstRun = false;
  if (p.get('zone')) {
    S.zone = p.get('zone').padStart(2,'0');
  } else if (savedZone()) {
    S.zone = savedZone();
  } else {
    firstRun = true;   // no link, never chosen before → offer auto-detect
  }

  renderHeader();
  S.clockTimer = setInterval(renderHeader, 1000); // 1s interval for live seconds

  // Show version in footer (very subtle — useful for debugging / support)
  const vEl = document.getElementById('footer-version');
  if (vEl) vEl.textContent = `v${SITE_VERSION}`;

  try{const{zones}=await loadZones();S.zones=zones;populateZones(zones);}catch(e){}
  populateMonths();

  document.getElementById('zone-selector')?.addEventListener('change',e=>{
    S.zone=e.target.value;
    saveZone(S.zone);   // a manual pick becomes the remembered zone
    renderToday(); renderTable(); pushParams();
  });

  document.getElementById('month-selector')?.addEventListener('change',e=>{
    S.tableMonth=parseInt(e.target.value);
    renderTable(); pushParams();
  });

  document.getElementById('btn-locate')?.addEventListener('click',handleLocate);

  // Share buttons
  document.getElementById('btn-share-today')?.addEventListener('click',()=>{
    openShareToday(S.todayData);
  });
  document.getElementById('btn-share-month')?.addEventListener('click',()=>{
    openShareMonth(S.tableData, S.year);
  });

  // Modal controls
  document.getElementById('btn-modal-close')?.addEventListener('click',closeShare);
  document.getElementById('share-modal-overlay')?.addEventListener('click',e=>{
    if(e.target.id==='share-modal-overlay') closeShare();
  });
  document.getElementById('btn-copy')?.addEventListener('click',async()=>{
    const t=document.getElementById('share-modal-overlay')?._text||'';
    try{
      await navigator.clipboard.writeText(t);
      const b=document.getElementById('btn-copy');
      if(b){b.textContent='✓ Copied!';b.classList.add('copied');setTimeout(()=>{b.textContent='📋 Copy';b.classList.remove('copied');},2000);}
    }catch{alert('Could not copy — please select and copy manually.');}
  });
  document.getElementById('btn-share-native')?.addEventListener('click',async()=>{
    const t=document.getElementById('share-modal-overlay')?._text||'';
    if(navigator.share){try{await navigator.share({title:'Sri Lanka Prayer Times',text:t});}catch{}}
    else{window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');}
  });

  // Image generation button
  document.getElementById('btn-share-img')?.addEventListener('click', async () => {
    const ov  = document.getElementById('share-modal-overlay');
    const ctx = ov?._shareCtx;
    if (!ctx) return;

    const btn = document.getElementById('btn-share-img');
    if (btn) { btn.textContent = '⏳ …'; btn.disabled = true; }

    try {
      let canvas, filename;
      if (ctx.type === 'today') {
        canvas   = generateDayCanvas(ctx.data, ctx.row, ctx.year);
        filename = `prayer-${ctx.row.date}-${ctx.data.monthName}-${ctx.year}.png`.toLowerCase();
      } else {
        canvas   = generateMonthCanvas(ctx.data, ctx.year);
        filename = `prayer-${ctx.data.monthName}-${ctx.year}.png`.toLowerCase();
      }
      await shareCanvasImage(canvas, filename);
    } catch(e) { console.error(e); alert('Could not generate image.'); }

    if (btn) { btn.textContent = '🖼️ ↗ Image'; btn.disabled = false; }
  });

  await renderToday();
  renderTable(); // intentionally not awaited — loads in background after today's times are shown

  // First visit with no shared-link zone → gently offer auto-detect.
  if (firstRun && !wasAsked() && navigator.geolocation) showLocatePrompt();
}

document.addEventListener('DOMContentLoaded',init);

// ── Service Worker registration ───────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}
