# Data bugs — flagged by the timetable suite (`tests/timetable.test.js`)

ACJU's PDF is the source: each flagged value is checked against it, then the file is
corrected, the entry removed from `tests/known-issues.json`, the manifest regenerated and
`revision` bumped (README, "How to change the data").

Rules checked on all 156 files: day count per month (February has 29 entries so leap years
work), `date` sequence, every time parses, `fajr < sunrise < luhr < asr < magrib < isha`,
no prayer moves more than 2 minutes between consecutive days (including month ends and
31 Dec → 1 Jan), and `zone` / `monthNum` / `districts` / `zoneName` agree with `zones.json`.

## Open

None.

## Fixed

| # | File | Date | Rule | Fix |
|---|---|---|---|---|
| 1 | `data/zone05-04.json` | 1-Apr | asr moves 3 min | Fixed 26 Nov 2026 from ACJU's PDF: the whole file (and zone 05 Feb, Jun, Sep, Nov) held zone 06's table; 1 Apr asr is `3:22 PM`. See [the recheck](docs/general/acju-recheck.md). |
