# Data bugs — flagged by the timetable suite (`tests/timetable.test.js`)

Nothing here has been "fixed". ACJU's PDF is the source: Shehan checks each value against it,
then corrects the file, removes the entry from `tests/known-issues.json`, regenerates the
manifest and bumps `revision` (README, "How to change the data").

Rules checked on all 156 files: day count per month (February has 29 entries so leap years
work), `date` sequence, every time parses, `fajr < sunrise < luhr < asr < magrib < isha`,
no prayer moves more than 2 minutes between consecutive days (including month ends and
31 Dec → 1 Jan), and `zone` / `monthNum` / `districts` / `zoneName` agree with `zones.json`.

## Open

| # | File | Date | Rule | Value | Neighbouring days |
|---|---|---|---|---|---|
| 1 | `data/zone05-04.json` | 1-Apr | asr moves 3 min | asr `3:20 PM` | 29-Mar `3:24`, 30-Mar `3:23`, 31-Mar `3:23`, **1-Apr `3:20`**, 2-Apr `3:19`, 3-Apr `3:19`, 4-Apr `3:18` |

Likely a one-minute slip on 1-Apr or the 31-Mar end of the March table (a smooth run would be
31-Mar `3:22` or 1-Apr `3:21`), but that is a guess. Check the PDF.
Other zones at the same boundary step by 1 minute (zone 04: `3:25 → 3:24`; zone 06: `3:21 → 3:20`).
