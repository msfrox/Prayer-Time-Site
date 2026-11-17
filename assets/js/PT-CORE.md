# pt-core.js — the shared prayer-times engine (v1.0.0)

DOM-free logic for ACJU Sri Lanka prayer times. A plain `<script>` (no modules, no build);
it adds one global, `PT`. `PT.VERSION` is the version; it is also in the file header.

**Rule for consumers (Salah-board, Brilliant, later apps): copy this file unmodified and
extend it from a second file.** Never edit your copy. If you need a change, make it here, bump
`VERSION`, and re-copy. Copy `data/` the way `data/SCHEMA.md` describes.

## Setup

```html
<script src="pt-core.js"></script>
<script>PT.configure({ dataBase: './my-data' })</script> <!-- default: './data' -->
```

`configure({ dataBase })` points the engine at your own copy of the data folder (no trailing
slash needed). It clears the loaded-month cache. It is the only thing `configure` accepts.

## Public API (`PT.*`)

- **Data:** `loadMonth(zone, month)` → the `zoneNN-MM.json` object (cached); `rowForDate(data,
  date)`, `todayRow(data)` → the day's row or `null`; `loadGeo()`, `resolveZone(lat, lng)` →
  `{zone, status: 'exact'|'nearshore'|'outside'}`; `locate()`.
- **Time logic:** `status(row)` → `{current, next, isNextDay}`; `nextTarget(...)`, `msUntil`,
  `segmentProgress`, `dayPhase`; `parseTime`, `minutesOfDay`, `splitTime`, `minusMins`,
  `fmtHMS`, `fmtHM`, `pad`.
- **Zones:** `ZONES` (generated from `data/zones.json`), `ZONE_CENTROID`, `getZone`,
  `setZone`, `zoneById`, `districtsLabel`.
- **Calendar and extras:** `hijriToday`, `hijriShort`, `hijriFor`, `qiblaBearing`,
  `qiblaForZone`, `shareToday`, `nowYear`.
- **Constants:** `PRAYERS`, `SALAH`, `P_LABEL`, `P_ICON`, `MON_FULL`, `MON_SHORT`, `WDAY_S`,
  `WDAY_F`, `IDAY_F`, `HIJ_MON`, `DATA_BASE`.

Prayer keys are `fajr, sunrise, luhr, asr, magrib, isha` and are never renamed. Times are
12-hour strings in Sri Lanka time.

## Keeping it honest

The inlined `ZONES` block is generated: `node build/sync-zones.js` rewrites it from
`data/zones.json`, and `tests/zones-sync.test.js` fails if they differ.
