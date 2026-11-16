import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPTCore } from './helpers/loadPTCore.js';
import { loadMonthFixture } from './helpers/fixtures.js';

describe('time parsing / formatting primitives', () => {
  const PT = loadPTCore();

  describe('parseTime', () => {
    it('parses a plain AM time', () => {
      const d = PT.parseTime('5:00 AM');
      expect(d.getHours()).toBe(5);
      expect(d.getMinutes()).toBe(0);
    });
    it('parses a plain PM time', () => {
      const d = PT.parseTime('3:37 PM');
      expect(d.getHours()).toBe(15);
      expect(d.getMinutes()).toBe(37);
    });
    it('treats 12:00 AM as midnight (hour 0)', () => {
      const d = PT.parseTime('12:00 AM');
      expect(d.getHours()).toBe(0);
    });
    it('treats 12:15 PM as noon (hour 12), not 24', () => {
      const d = PT.parseTime('12:15 PM');
      expect(d.getHours()).toBe(12);
      expect(d.getMinutes()).toBe(15);
    });
    it('returns null for an empty/missing string', () => {
      expect(PT.parseTime('')).toBeNull();
      expect(PT.parseTime(undefined)).toBeNull();
    });
    it('returns null for a malformed string', () => {
      expect(PT.parseTime('not a time')).toBeNull();
      expect(PT.parseTime('25:00 AM')).not.toBeNull(); // regex doesn't range-check hour — documents current behaviour
    });
  });

  describe('minutesOfDay', () => {
    it('converts "6:22 AM" to 382', () => {
      expect(PT.minutesOfDay('6:22 AM')).toBe(6 * 60 + 22);
    });
    it('converts "12:15 PM" to 735', () => {
      expect(PT.minutesOfDay('12:15 PM')).toBe(12 * 60 + 15);
    });
    it('returns null for an unparseable string', () => {
      expect(PT.minutesOfDay('')).toBeNull();
    });
  });

  describe('splitTime', () => {
    it('splits a valid time into hm/ap parts', () => {
      expect(PT.splitTime('6:22 AM')).toEqual({ hm: '6:22', ap: 'AM' });
    });
    it('falls back to a placeholder for missing input', () => {
      expect(PT.splitTime('')).toEqual({ hm: '--:--', ap: '' });
      expect(PT.splitTime(undefined)).toEqual({ hm: '--:--', ap: '' });
    });
  });

  describe('minusMins (used for Imsak = Fajr - 2min)', () => {
    it('subtracts minutes within the same hour', () => {
      expect(PT.minusMins('5:00 AM', 2)).toBe('4:58 AM');
    });
    it('rolls back across the AM/PM boundary at noon', () => {
      expect(PT.minusMins('12:01 PM', 2)).toBe('11:59 AM');
    });
    it('rolls back across midnight (day boundary) correctly', () => {
      // A theoretical Fajr at 12:01 AM: Imsak must read 11:59 PM, not "-1:59 AM".
      expect(PT.minusMins('12:01 AM', 2)).toBe('11:59 PM');
    });
    it('returns empty string for unparseable input', () => {
      expect(PT.minusMins('', 2)).toBe('');
    });
  });

  describe('fmtHMS / fmtHM', () => {
    it('fmtHMS formats zero as 00:00:00', () => {
      expect(PT.fmtHMS(0)).toBe('00:00:00');
    });
    it('fmtHMS clamps negative durations to zero', () => {
      expect(PT.fmtHMS(-5000)).toBe('00:00:00');
    });
    it('fmtHMS formats an hour/minute/second mix', () => {
      expect(PT.fmtHMS(3661000)).toBe('01:01:01');
    });
    it('fmtHM omits the hour part under an hour', () => {
      expect(PT.fmtHM(5 * 60000)).toBe('5m');
    });
    it('fmtHM includes hours when >= 1h', () => {
      expect(PT.fmtHM(90 * 60000)).toBe('1h 30m');
    });
  });
});

describe('status() — current/next prayer resolution', () => {
  const PT = loadPTCore();
  const row = {
    date: '15-Jun', fajr: '5:00 AM', sunrise: '6:22 AM', luhr: '12:15 PM',
    asr: '3:37 PM', magrib: '6:07 PM', isha: '7:21 PM',
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function at(h, m) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    vi.setSystemTime(d);
  }

  it('returns isNextDay=true with no row at all', () => {
    expect(PT.status(null)).toEqual({ current: null, next: 'fajr', isNextDay: true });
  });

  it('before Fajr: no current prayer yet, next is fajr, not a rollover', () => {
    at(4, 0);
    expect(PT.status(row)).toEqual({ current: null, next: 'fajr', isNextDay: false });
  });

  it('exactly at Fajr time: Fajr is current (boundary is inclusive)', () => {
    at(5, 0);
    expect(PT.status(row)).toEqual({ current: 'fajr', next: 'sunrise', isNextDay: false });
  });

  it('between Magrib and Isha: current is magrib', () => {
    at(19, 0);
    expect(PT.status(row)).toEqual({ current: 'magrib', next: 'isha', isNextDay: false });
  });

  it('exactly at Isha: current flips straight to isha/fajr rollover, no gap', () => {
    at(19, 21);
    expect(PT.status(row)).toEqual({ current: 'isha', next: 'fajr', isNextDay: true });
  });

  it('well after Isha (near midnight): still isha -> fajr rollover', () => {
    at(23, 59);
    expect(PT.status(row)).toEqual({ current: 'isha', next: 'fajr', isNextDay: true });
  });
});

describe('nextTarget() — after-Isha rollover across a real month boundary', () => {
  afterEach(() => vi.useRealTimers());

  it('Dec 31 after Isha resolves next Fajr from the real Jan 1 fixture data', async () => {
    const decData = loadMonthFixture('01', 12);
    const janData = loadMonthFixture('01', 1);
    const decRow = decData.days.find((d) => d.date === '31-Dec');
    expect(decRow).toBeTruthy();

    const PT = loadPTCore({
      fetchImpl: async (url) => {
        if (String(url).includes('zone01-01.json')) return { ok: true, json: async () => janData };
        throw new Error(`unexpected fetch: ${url}`);
      },
    });

    vi.useFakeTimers();
    const now = new Date();
    now.setMonth(11, 31); // Dec 31, whatever year the fake clock starts on
    now.setHours(22, 0, 0, 0); // well after Isha (7:21 PM)
    vi.setSystemTime(now);

    const st = PT.status(decRow);
    expect(st).toEqual({ current: 'isha', next: 'fajr', isNextDay: true });

    const target = await PT.nextTarget('01', decData, st);
    expect(target.isNextDay).toBe(true);
    expect(target.key).toBe('fajr');
    expect(target.row.date).toBe('1-Jan');
    expect(target.row.fajr).toBe(janData.days.find((d) => d.date === '1-Jan').fajr);
  });

  it('mid-month (no rollover) just returns today\'s row untouched', async () => {
    const PT = loadPTCore();
    const data = loadMonthFixture('01', 6);
    const row = data.days.find((d) => d.date === '15-Jun');
    const st = { current: 'fajr', next: 'sunrise', isNextDay: false };

    vi.useFakeTimers();
    const now = new Date();
    now.setMonth(5, 15); // Jun 15 — todayRow() reads the real "now" internally
    now.setHours(10, 0, 0, 0);
    vi.setSystemTime(now);

    const target = await PT.nextTarget('01', data, st);
    expect(target).toEqual({ row, key: 'sunrise', isNextDay: false });
  });
});

describe('msUntil()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('computes a same-day countdown with no rollover', () => {
    const PT = loadPTCore();
    const now = new Date();
    now.setHours(4, 0, 0, 0);
    vi.setSystemTime(now);
    const row = { fajr: '5:00 AM' };
    expect(PT.msUntil(row, 'fajr', false)).toBe(60 * 60 * 1000);
  });

  it('adds a full day when the target is tomorrow (isNextDay)', () => {
    const PT = loadPTCore();
    const now = new Date();
    now.setHours(22, 0, 0, 0); // 10pm
    vi.setSystemTime(now);
    const row = { fajr: '5:00 AM' }; // 7 hours away, once wrapped to tomorrow
    expect(PT.msUntil(row, 'fajr', true)).toBe(7 * 60 * 60 * 1000);
  });

  it('returns 0 when the target time is missing/unparseable', () => {
    const PT = loadPTCore();
    expect(PT.msUntil({}, 'fajr', false)).toBe(0);
  });
});

describe('segmentProgress()', () => {
  const PT = loadPTCore();
  const row = { fajr: '5:00 AM', sunrise: '6:00 AM' };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is 0 right at the start of the segment', () => {
    const now = new Date(); now.setHours(5, 0, 0, 0); vi.setSystemTime(now);
    const st = { current: 'fajr', next: 'sunrise', isNextDay: false };
    expect(PT.segmentProgress(row, st)).toBe(0);
  });

  it('is 0.5 exactly halfway through the segment', () => {
    const now = new Date(); now.setHours(5, 30, 0, 0); vi.setSystemTime(now);
    const st = { current: 'fajr', next: 'sunrise', isNextDay: false };
    expect(PT.segmentProgress(row, st)).toBeCloseTo(0.5, 10);
  });

  it('before Fajr, the segment starts at midnight rather than a null time', () => {
    const now = new Date(); now.setHours(2, 30, 0, 0); vi.setSystemTime(now);
    const st = { current: null, next: 'fajr', isNextDay: false };
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const fajr = PT.parseTime('5:00 AM');
    const expected = (now.getTime() - midnight.getTime()) / (fajr.getTime() - midnight.getTime());
    expect(PT.segmentProgress(row, st)).toBeCloseTo(expected, 10);
  });

  it('clamps to [0,1] and returns 0 for a missing row', () => {
    expect(PT.segmentProgress(null, { current: 'fajr', next: 'sunrise', isNextDay: false })).toBe(0);
  });
});

describe('rowForDate / todayRow against real fixture data', () => {
  it('finds the row for a specific day of a real month file', () => {
    const PT = loadPTCore();
    const data = loadMonthFixture('01', 1);
    const row = PT.rowForDate(data, new Date(2026, 0, 1));
    expect(row).toEqual(data.days.find((d) => d.date === '1-Jan'));
  });

  it('returns null for a date outside the given month\'s data', () => {
    const PT = loadPTCore();
    const data = loadMonthFixture('01', 1); // January only
    const row = PT.rowForDate(data, new Date(2026, 1, 1)); // Feb 1
    expect(row).toBeNull();
  });

  it('finds Feb 29, which is present in the data permanently (solar times, not calendar-year-specific)', () => {
    const PT = loadPTCore();
    const data = loadMonthFixture('01', 2);
    // 2028 is a real leap year — Feb 29 is only a valid JS Date in one.
    // (2026 isn't leap: `new Date(2026, 1, 29)` silently normalizes to Mar 1.)
    const row = PT.rowForDate(data, new Date(2028, 1, 29));
    expect(row).not.toBeNull();
    expect(row.date).toBe('29-Feb');
  });
});
