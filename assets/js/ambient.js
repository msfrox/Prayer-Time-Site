/* Ambient view (v9): sky colours that follow the time of day, and the pull-up sheet.
   All prayer data, countdown, zone, table and sharing logic stays in app.js / pt-core.js;
   this file only paints the sky and opens and closes the sheet. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  // [top, mid, bottom, glow, icon, icon top %, star opacity, label]
  // Mid and bottom are kept dark enough for white text (see HANDOFF contrast table).
  const SKY = {
    night:     ['#070C1F', '#0E1638', '#1A2350', '#9fb6ff', '🌙', '22%', 1,  'Night · Layl'],
    dawn:      ['#243056', '#5b4570', '#a24f4a', '#ffd27a', '🌅', '58%', .25, 'Dawn · Fajr'],
    morning:   ['#1d4f93', '#2a5f9f', '#3b6fa8', '#fff1c4', '☀️', '30%', 0,  'Morning · Duha'],
    noon:      ['#1a4a8c', '#25589a', '#34679f', '#ffffff', '☀️', '14%', 0,  'Midday · Zuhr'],
    afternoon: ['#244b7e', '#3a5f8c', '#5a6a80', '#ffe9a8', '🌤️', '40%', 0, 'Afternoon · Asr'],
    dusk:      ['#2a2350', '#6a2f55', '#9c3b30', '#ffae5c', '🌇', '60%', .2, 'Sunset · Maghrib'],
  };

  function paint() {
    try {
      const code = ($('zone-selector') && $('zone-selector').value) || PT.getZone();
      const m = new Date().getMonth() + 1;
      PT.loadMonth(code, m).then(data => {
        const row = PT.todayRow(data);
        if (!row) return;
        const ph = PT.dayPhase(row), p = SKY[ph] || SKY.night;
        const sky = $('sky');
        sky.style.setProperty('--sky-a', p[0]);
        sky.style.setProperty('--sky-b', p[1]);
        sky.style.setProperty('--sky-c', p[2]);
        root.style.setProperty('--glow', p[3]);
        $('celest').textContent = p[4];
        $('celest').style.top = p[5];
        $('stars').style.setProperty('--star', p[6]);
        $('phase').textContent = p[7];
        const sr = PT.minutesOfDay(row.sunrise), ms = PT.minutesOfDay(row.magrib);
        const now = new Date().getHours() * 60 + new Date().getMinutes();
        let f = (now - sr) / (ms - sr);
        f = Math.max(.05, Math.min(.95, isFinite(f) ? f : .5));
        $('celest').style.left = (f * 100) + '%';
      }).catch(() => {});
    } catch (e) { /* the page still works without the sky */ }
  }
  paint();
  setInterval(paint, 60000);
  // zone changed from the sheet: repaint soon after app.js has stored it
  document.addEventListener('change', e => { if (e.target && e.target.id === 'zone-selector') setTimeout(paint, 400); });

  // ── Pull-up sheet ──
  const sheet = $('sheet'), pull = $('btn-pull'), stage = $('stage');
  function setSheet(open) {
    sheet.classList.toggle('open', open);
    pull.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sheet-open', open);
    if (open) sheet.scrollTop = 0;
    (open ? sheet : pull).focus && (open ? sheet.focus({ preventScroll: true }) : pull.focus({ preventScroll: true }));
  }
  sheet.setAttribute('tabindex', '-1');
  pull.addEventListener('click', e => { e.stopPropagation(); setSheet(true); });
  stage.addEventListener('click', () => { if (!sheet.classList.contains('open')) setSheet(true); });
  $('btn-grip').addEventListener('click', () => setSheet(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet.classList.contains('open') && !document.querySelector('.share-modal-overlay.visible')) setSheet(false);
  });
  // swipe down on the grip area closes it
  let y0 = null;
  sheet.addEventListener('touchstart', e => { y0 = sheet.scrollTop === 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener('touchend', e => {
    if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) setSheet(false);
    y0 = null;
  }, { passive: true });
  // deep links (?zone=&month=) show the data straight away
  if (/[?&](zone|month)=/.test(location.search)) setSheet(true);
})();
