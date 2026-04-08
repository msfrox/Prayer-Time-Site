/* ============================================================
   Sri Lanka Prayer Times — App v3
   Key fix: S.todayData always loads for real today's month.
            S.tableData follows the month selector (for table only).
   ============================================================ */
'use strict';

// ── Constants ─────────────────────────────────────────────
const DATA_BASE = './data';

const PRAYERS   = ['fajr','sunrise','luhr','asr','magrib','isha'];
const P_LABEL   = { fajr:'Fajr', sunrise:'Sunrise', luhr:'Zuhr', asr:'Asr', magrib:'Maghrib', isha:'Isha' };
const P_ICON    = { fajr:'🌙', sunrise:'🌅', luhr:'☀️', asr:'🌤️', magrib:'🏙️', isha:'🌙' };

const MON_FULL  = ['','January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const MON_SHORT = ['','Jan','Feb','Mar','Apr','May','Jun',
                   'Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAY_S    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WDAY_F    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const IDAY_F    = ["Al-Ahad","Al-Ithnayn","Ath-Thulathaa","Al-Arbi'aa","Al-Khamees","Al-Jumu'ah","As-Sabt"];
const HIJ_MON   = ['Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",
                   'Jumada al-Ula','Jumada al-Akhirah','Rajab',"Sha'ban",
                   'Ramadan','Shawwal',"Dhu al-Qi'dah",'Dhu al-Hijjah'];

// Zone geo-centres for auto-locate
const ZONES_GEO = [
  {id:'01',lat:6.93, lng:79.95},{id:'02',lat:9.67, lng:80.01},
  {id:'03',lat:9.00, lng:80.48},{id:'04',lat:8.58, lng:79.95},
  {id:'05',lat:8.30, lng:80.45},{id:'06',lat:7.50, lng:80.38},
  {id:'07',lat:7.30, lng:80.64},{id:'08',lat:7.70, lng:81.70},
  {id:'09',lat:8.59, lng:81.23},{id:'10',lat:6.99, lng:81.06},
  {id:'11',lat:6.70, lng:80.38},{id:'12',lat:6.05, lng:80.22},
  {id:'13',lat:6.12, lng:81.12},
];

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
const pad = n => String(n).padStart(2,'0');

function parseTime(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return null;
  let h = +m[1], min = +m[2];
  const pm = m[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  const d = new Date(); d.setHours(h, min, 0, 0); return d;
}

function minusMins(timeStr, mins) {
  const d = parseTime(timeStr); if (!d) return '';
  d.setMinutes(d.getMinutes() - mins);
  let h = d.getHours(), m = d.getMinutes();
  const pm = h >= 12;
  if (h > 12) h -= 12; if (h === 0) h = 12;
  return `${h}:${pad(m)} ${pm ? 'PM' : 'AM'}`;
}

function splitTime(str) {
  if (!str) return {hm:'--:--', ap:''};
  const m = str.match(/^(\d{1,2}:\d{2})\s*([AP]M)$/i);
  return m ? {hm:m[1], ap:m[2].toUpperCase()} : {hm:str, ap:''};
}

function hijriDate() {
  try {
    const now  = new Date();
    const day  = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric'}).format(now);
    const mon  = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{month:'numeric'}).format(now);
    const year = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{year:'numeric'}).format(now);
    return `${day} ${HIJ_MON[+mon-1] || ''} ${year} AH`;
  } catch { return ''; }
}

function hijriShort() {
  try {
    const now  = new Date();
    const day  = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric'}).format(now);
    const mon  = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{month:'numeric'}).format(now);
    const year = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{year:'numeric'}).format(now);
    return `${day} ${HIJ_MON[+mon-1]?.slice(0,7) || ''} ${year} AH`;
  } catch { return ''; }
}

function geoKm(a,b,c,d){
  const R=6371,dA=(b-a)*Math.PI/180,dC=(d-c)*Math.PI/180;
  const x=Math.sin(dA/2)**2+Math.cos(a*Math.PI/180)*Math.cos(b*Math.PI/180)*Math.sin(dC/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function nearestZone(lat,lng){
  return ZONES_GEO.reduce((b,z)=>geoKm(lat,lng,z.lat,z.lng)<geoKm(lat,lng,b.lat,b.lng)?z:b).id;
}

// ── Data fetching ─────────────────────────────────────────
async function loadZones(){
  const r=await fetch(`${DATA_BASE}/zones.json`); return r.json();
}
async function loadData(zone,month){
  const k=`zone${String(zone).padStart(2,'0')}-${String(month).padStart(2,'0')}`;
  const r=await fetch(`${DATA_BASE}/${k}.json`);
  if(!r.ok) throw new Error(`No data: ${k}`);
  return r.json();
}

function findTodayRow(data){
  const t=new Date();
  const s=`${t.getDate()}-${MON_SHORT[t.getMonth()+1]}`;
  return data?.days?.find(d=>d.date===s)||null;
}

function prayerStatus(row){
  if(!row) return {current:null,next:'fajr'};
  const now=new Date();
  const times=PRAYERS.map(k=>({key:k,t:parseTime(row[k])}));
  let cur=null,nxt=null;
  for(let i=0;i<times.length;i++){
    if(times[i].t&&now>=times[i].t){cur=times[i].key;nxt=times[i+1]?.key||null;}
  }
  if(!cur) nxt=times[0].key;
  return {current:cur,next:nxt};
}

// ── Header ────────────────────────────────────────────────
function renderHeader(){
  const now=new Date();
  const g=document.getElementById('header-gregorian');
  const h=document.getElementById('header-hijri');
  if(g) g.textContent=`${WDAY_S[now.getDay()]}, ${now.getDate()} ${MON_SHORT[now.getMonth()+1]} ${now.getFullYear()}`;
  if(h) h.textContent=hijriShort();
}

// ── Hero ──────────────────────────────────────────────────
// The hero ALWAYS uses S.todayData (real today), never the table month
function renderHero(data,row){
  const {current,next}=prayerStatus(row);
  const locEl  =document.getElementById('hero-location-name');
  const badgeEl=document.getElementById('hero-location-badge');
  if(locEl&&data)  locEl.textContent=data.districts.join(' • ');
  if(badgeEl&&data) badgeEl.textContent=data.zoneName;

  const lblEl=document.getElementById('hero-next-label');
  const nmEl =document.getElementById('hero-next-name');
  const atEl =document.getElementById('hero-next-at');
  if(next&&row){
    if(lblEl) lblEl.textContent=current?'Next Prayer':'First Prayer';
    if(nmEl)  nmEl.textContent=P_LABEL[next];
    if(atEl)  atEl.textContent=`at ${row[next]}`;
  } else {
    if(nmEl) nmEl.textContent='—';
    if(atEl) atEl.textContent='No more prayers today';
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
function renderList(row,current,next){
  const panel=document.getElementById('prayer-list');
  if(!panel) return;
  if(!row){panel.innerHTML='<div class="loading-block"><span style="color:#aaa">No data for today</span></div>';return;}
  panel.innerHTML='';
  PRAYERS.forEach(key=>{
    const isNow=key===current, isNext=key===next;
    const isPast=!isNow&&!isNext&&current&&PRAYERS.indexOf(key)<PRAYERS.indexOf(current);
    const {hm,ap}=splitTime(row[key]||'');
    const badge=isNow?'<span class="pr-badge pr-badge-now">Now</span>'
               :isNext?'<span class="pr-badge pr-badge-next">Next</span>':'';
    const div=document.createElement('div');
    div.className=`prayer-row${isNow?' is-current':''}${isNext?' is-next':''}${isPast?' is-past':''}`;
    div.innerHTML=`<span class="pr-icon">${P_ICON[key]}</span>
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
function renderCountdown(row,next){
  const el=document.getElementById('hero-timer');
  if(!el||!next||!row){if(el)el.textContent='--:--:--';return;}
  const t=parseTime(row[next]); if(!t) return;
  let diff=t-new Date(); if(diff<0) diff+=86400000;
  const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  el.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ── Monthly table ──────────────────────────────────────────
// Uses S.tableData — follows the month selector
function renderMonthly(data){
  const tbody=document.getElementById('monthly-tbody');
  const title=document.getElementById('monthly-title');
  const zone =document.getElementById('monthly-zone');
  if(!tbody||!data) return;
  if(title) title.textContent=`${data.monthName} ${data.year}`;
  if(zone)  zone.textContent=`${data.zoneName} — ${data.districts.join(', ')}`;
  const now=new Date(), todayNum=now.getDate(), todayMon=now.getMonth()+1;
  tbody.innerHTML='';
  data.days.forEach(day=>{
    const[dNum]=day.date.split('-');
    const isToday=+dNum===todayNum&&data.monthNum===todayMon;
    const dow=new Date(data.year,data.monthNum-1,+dNum).getDay();
    const tr=document.createElement('tr');
    if(isToday) tr.className='today-monthly';
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
  const apt=data.apartmentDiff,fmt=n=>n<0?`−${Math.abs(n)} min`:`+${n} min`;
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

// ── Share ─────────────────────────────────────────────────
function buildTodayShare(data,row){
  if(!data||!row) return '';
  const d=new Date(data.year,data.monthNum-1,+row.date.split('-')[0]);
  const hijri=hijriDate();
  const imsak=minusMins(row.fajr,2);
  return [
    `🕌 SALAH TIME 🇱🇰`,
    `📍 ${data.districts.join(', ')}`,
    ``,
    `${WDAY_F[d.getDay()]} / ${IDAY_F[d.getDay()]}`,
    `${row.date.replace('-',' ')} ${data.monthName} ${data.year}`,
    hijri,
    ``,
    `Fajr      ${row.fajr}`,
    `Sunrise   ${row.sunrise}`,
    `Zuhr      ${row.luhr}`,
    `Asr       ${row.asr}`,
    `Maghrib   ${row.magrib}`,
    `Isha      ${row.isha}`,
    ``,
    `📌 Imsak (Sahr End): ${imsak}`,
    ``,
    `Source: ACJU Official`,
    `www.acju.lk`,
  ].join('\n');
}

function buildMonthShare(data){
  if(!data) return '';
  const hdr=`🕌 SALAH TIMES 🇱🇰 — ${data.monthName} ${data.year}\n📍 ${data.districts.join(', ')}\nSource: ACJU | www.acju.lk\n`;
  const rows=data.days.map(d=>{
    const dow=new Date(data.year,data.monthNum-1,+d.date.split('-')[0]).getDay();
    return `${d.date.padEnd(7)} ${WDAY_S[dow]}  ${d.fajr}  ${d.luhr}  ${d.asr}  ${d.magrib}  ${d.isha}`;
  }).join('\n');
  return hdr+'\n'+rows;
}

function openShare(text){
  const ov=document.getElementById('share-modal-overlay');
  const pr=document.getElementById('share-preview-text');
  if(!ov||!pr) return;
  pr.textContent=text; ov._text=text; ov.classList.add('visible');
}
function closeShare(){document.getElementById('share-modal-overlay')?.classList.remove('visible');}

// ── Selectors ─────────────────────────────────────────────
function populateZones(zones){
  const sel=document.getElementById('zone-selector'); if(!sel) return;
  sel.innerHTML='';
  zones.forEach(z=>{
    const o=document.createElement('option');
    o.value=z.id; o.textContent=`Zone ${z.id} — ${z.districts.join(', ')}`;
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
// renderToday: loads S.todayData (always current date's month), renders hero + cards
// renderTable: loads S.tableData (selected month), renders monthly table only

async function renderToday(){
  // Always load real today's month for the top section
  const panel=document.getElementById('prayer-list');
  if(panel) panel.innerHTML='<div class="loading-block"><div class="spinner"></div></div>';
  try {
    const data=await loadData(S.zone, S.todayMonth);
    S.todayData=data;
    const row=findTodayRow(data);
    const {current,next}=prayerStatus(row);
    renderHero(data,row);
    renderFeatured(row,current,next);
    renderList(row,current,next);
    renderImsakIftar(row);
    renderApt(data);

    // Start live tick
    clearInterval(S.tickTimer);
    let lastCur=current;
    S.tickTimer=setInterval(()=>{
      const r=findTodayRow(S.todayData);
      const {current:c,next:n}=prayerStatus(r);
      renderCountdown(r,n);
      if(c!==lastCur){
        lastCur=c;
        renderFeatured(r,c,n);
        renderList(r,c,n);
        renderHero(S.todayData,r);
      }
    },1000);
    renderCountdown(row,next);
  } catch(e){
    console.error(e);
    if(panel) panel.innerHTML=`<div class="loading-block" style="color:#B82020;">Failed to load.<br><small>${e.message}</small></div>`;
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

// ── Auto-locate ────────────────────────────────────────────
function handleLocate(){
  if(!navigator.geolocation){alert('Geolocation not supported.');return;}
  const btn=document.getElementById('btn-locate');
  if(btn){btn.textContent='⏳ Locating…';btn.classList.add('locating');}
  navigator.geolocation.getCurrentPosition(
    pos=>{
      S.zone=nearestZone(pos.coords.latitude,pos.coords.longitude);
      const sel=document.getElementById('zone-selector');
      if(sel) sel.value=S.zone;
      renderToday(); renderTable(); pushParams();
      if(btn){btn.textContent='📍 Locate Me';btn.classList.remove('locating');}
    },
    ()=>{
      alert('Could not detect location. Please select your zone manually.');
      if(btn){btn.textContent='📍 Locate Me';btn.classList.remove('locating');}
    },
    {timeout:8000,maximumAge:300000}
  );
}

// ── Init ──────────────────────────────────────────────────
async function init(){
  const p=new URLSearchParams(location.search);
  if(p.get('zone'))  S.zone=p.get('zone').padStart(2,'0');
  if(p.get('month')) S.tableMonth=parseInt(p.get('month'));

  renderHeader();
  S.clockTimer=setInterval(renderHeader,30000);

  // Zones
  try{const{zones}=await loadZones();S.zones=zones;populateZones(zones);}catch(e){}
  populateMonths();

  // Zone changes → reload both today section AND table
  document.getElementById('zone-selector')?.addEventListener('change',e=>{
    S.zone=e.target.value;
    renderToday(); renderTable(); pushParams();
  });

  // Month changes → ONLY reload the monthly table, NOT today's top section
  document.getElementById('month-selector')?.addEventListener('change',e=>{
    S.tableMonth=parseInt(e.target.value);
    renderTable(); pushParams();
    // Do NOT call renderToday() — hero stays showing real today
  });

  document.getElementById('btn-locate')?.addEventListener('click',handleLocate);

  // Share
  document.getElementById('btn-share-today')?.addEventListener('click',()=>{
    const row=findTodayRow(S.todayData);
    if(!row){alert('No data loaded yet.');return;}
    openShare(buildTodayShare(S.todayData,row));
  });
  document.getElementById('btn-share-month')?.addEventListener('click',()=>{
    if(!S.tableData){alert('No data loaded yet.');return;}
    openShare(buildMonthShare(S.tableData));
  });

  // Modal
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

  // Load both on init
  await renderToday();
  await renderTable();
}

document.addEventListener('DOMContentLoaded',init);
