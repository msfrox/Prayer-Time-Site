import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(import.meta.dirname, '..', '..', 'data');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Leap-day rule: the tables repeat every year, so February carries 29 entries (29-Feb is
// shown only in leap years by the app).
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const KEYS = ['fajr', 'sunrise', 'luhr', 'asr', 'magrib', 'isha'];
const ORDER = ['fajr', 'sunrise', 'luhr', 'asr', 'magrib', 'isha'];
const MAX_STEP = 2; // minutes between consecutive days

export const zoneFiles = () =>
  readdirSync(DATA).filter(f => /^zone\d\d-\d\d\.json$/.test(f)).sort();

export function parseTime(s) {
  const m = /^(1[0-2]|[1-9]):([0-5]\d) (AM|PM)$/.exec(s ?? '');
  if (!m) return null;
  let h = +m[1] % 12;
  if (m[3] === 'PM') h += 12;
  return h * 60 + +m[2];
}

export function collectProblems() {
  const zones = JSON.parse(readFileSync(join(DATA, 'zones.json'), 'utf8')).zones;
  const out = [];
  const add = (file, date, rule, detail) => out.push({ file, date, rule, detail });
  const byZone = {};

  for (const file of zoneFiles()) {
    const d = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
    const [, zid, mm] = /^zone(\d\d)-(\d\d)\.json$/.exec(file);
    const mi = +mm - 1;
    const z = zones.find(x => x.id === zid);
    if (!z) add(file, '', 'zone-exists', zid);
    else {
      if (d.zone !== zid) add(file, '', 'zone-matches', `file says ${d.zone}`);
      if (JSON.stringify(d.districts) !== JSON.stringify(z.districts)) add(file, '', 'districts-match', JSON.stringify(d.districts));
      if (d.zoneName !== z.name) add(file, '', 'zone-name-matches', d.zoneName);
    }
    if (d.monthNum !== +mm) add(file, '', 'month-matches', `monthNum ${d.monthNum}`);
    if (d.days.length !== DAYS_IN[mi]) add(file, '', 'day-count', `${d.days.length}, expected ${DAYS_IN[mi]}`);

    const mins = [];
    d.days.forEach((day, i) => {
      const exp = `${i + 1}-${MONTHS[mi]}`;
      if (day.date !== exp) add(file, day.date, 'date-sequence', `expected ${exp}`);
      const t = {};
      let ok = true;
      for (const k of KEYS) {
        t[k] = parseTime(day[k]);
        if (t[k] === null) { add(file, day.date, 'time-parses', `${k}=${JSON.stringify(day[k])}`); ok = false; }
      }
      if (ok) {
        for (let j = 1; j < ORDER.length; j++) {
          if (!(t[ORDER[j - 1]] < t[ORDER[j]])) add(file, day.date, 'prayer-order', `${ORDER[j - 1]} ${day[ORDER[j - 1]]} !< ${ORDER[j]} ${day[ORDER[j]]}`);
        }
      }
      mins.push(ok ? t : null);
    });
    (byZone[zid] ??= {})[+mm] = { file, days: d.days, mins };
  }

  // Day-to-day movement, within the month and across month ends (Dec 31 -> Jan 1 wraps).
  for (const zid of Object.keys(byZone)) {
    const seq = [];
    for (let m = 1; m <= 12; m++) if (byZone[zid][m]) seq.push(...byZone[zid][m].days.map((day, i) => ({ m, day, t: byZone[zid][m].mins[i], file: byZone[zid][m].file })));
    for (let i = 0; i < seq.length; i++) {
      const a = seq[i], b = seq[(i + 1) % seq.length];
      if (!a.t || !b.t) continue;
      for (const k of KEYS) {
        const diff = Math.abs(b.t[k] - a.t[k]);
        if (diff > MAX_STEP) {
          const prev = seq[(i - 1 + seq.length) % seq.length], next = seq[(i + 2) % seq.length];
          add(b.file, b.day.date, `jump-${k}`, `${a.day.date}=${a.day[k]} -> ${b.day.date}=${b.day[k]} (${diff} min); before: ${prev.day.date}=${prev.day[k]}, after: ${next.day.date}=${next.day[k]}`);
        }
      }
    }
  }
  return out;
}
