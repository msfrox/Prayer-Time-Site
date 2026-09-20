# Tests for `assets/js/pt-core.js`

`npm install && npm test` runs the suite (vitest). No browser needed — `pt-core.js`
is DOM-agnostic, so it's loaded directly in Node.

## How `pt-core.js` gets loaded without a browser

`pt-core.js` is written as `(function (global) {...})(window)` and references
`fetch`, `localStorage`, `navigator` as bare identifiers. `tests/helpers/loadPTCore.js`
wraps the file's source in `new Function('window', 'fetch', 'localStorage', 'navigator', src)`
and calls it with fakes — **not** `vm.createContext`, because a real `vm` sandbox is a
separate JS realm with its own `Date` constructor, which vitest's `vi.setSystemTime()`
(fake timers) cannot reach. `new Function` runs in the *same* realm as the test, so the
ambient `Date` pt-core calls `new Date()` on is the one vitest patches. This is the
reason fake-timer-based tests (`status()`, `nextTarget()`, `msUntil()`, `segmentProgress()`)
work at all — worth keeping if this suite is ever restructured.

## Where the fixtures come from

Per the task brief: don't invent fixtures, mine the ones that already exist.

- **Geofencing cases** (`tests/geofencing.test.js`) are extracted live from
  `build/validate.js`'s `CASES` array (`tests/helpers/fixtures.js:loadValidateCases`),
  via a regex + `Function` eval of just that array literal — not a `require()` of the
  whole script, because `validate.js` ends in a bare `process.exit()` that would kill
  the test runner. This means the geofencing tests **automatically track** whatever
  town/zone cases `build/validate.js` gains in the future; nothing to keep in sync by hand.
- **Prayer-time / month-boundary cases** (`tests/time-logic.test.js`) read the real
  `data/zone01-*.json` files directly (via `loadMonthFixture`), so the "Dec 31 → Jan 1"
  rollover test exercises the actual production data, not synthetic times.
- The sea-buffer nearshore/outside coordinates in `geofencing.test.js` were derived by
  probing the real `data/zones.geojson` with the same point-in-polygon/distance math
  pt-core uses (see git history of this file if the geometry is ever rebuilt and these
  need re-deriving) — not guessed.

## Timezone

`tests/setup.js` pins `process.env.TZ = 'Asia/Colombo'`. Sri Lanka has one timezone and
no DST, and `pt-core.js` uses local `Date` throughout, so pinning TZ makes "midnight"/
"after Isha" tests represent a real user's clock rather than whatever the CI host's TZ
happens to be.

## Verifying the suite can actually fail

Not part of the committed suite (nothing to run) — done manually before considering this
task complete, per the task brief's "check this" instruction:

1. Flipped the after-Isha branch in `status()` (`current:'isha'` → `current:'fajr'`,
   `isNextDay:true` → `false`) → 3 tests failed as expected (status + the two things
   that depend on it, incl. the Dec→Jan rollover test).
2. Set `SEA_BUFFER_KM` from 8 to 0 → the nearshore geofencing test failed as expected.

Both reverted; `git diff -- assets/js/pt-core.js` is empty. This task does not change
`pt-core.js` — see the task brief ("do not change the prayer-time logic itself").

## Coverage

- Zone resolution for every town in `build/validate.js`'s oracle (27 towns as of
  2026-09-21), including the two carve-outs it flags CRITICAL (Padiyathalawa,
  Dehiattakandiya), plus sea-buffer nearshore/outside cases and far-ocean/foreign-land
  cases.
- Prayer-time parsing/formatting primitives (`parseTime`, `minutesOfDay`, `splitTime`,
  `minusMins`, `fmtHMS`, `fmtHM`), including the AM/PM-boundary and midnight-rollover
  cases for `minusMins` (would matter if Imsak/Fajr were ever near midnight).
- `status()` boundary behaviour (inclusive `>=` comparisons, the exact-Isha transition).
- `nextTarget()` across a real month boundary (Dec 31 → Jan 1, using the real December
  and January fixture files) and the no-rollover mid-month path.
- `msUntil()`, `segmentProgress()` (incl. the before-Fajr "start at midnight" branch).
- `rowForDate`/`todayRow`, including that Feb 29 is present in the data permanently
  (the site's solar-time-is-permanent design — see README "Design principles" §7) and
  is only reachable with a real leap-year `Date` in the test itself.

**Not covered** (out of the task's stated minimum, and lower-risk): `dayPhase()`,
`shareToday()`, `qiblaBearing`/`qiblaForZone`, `hijriToday`/`hijriShort`/`hijriFor`
(thin wrappers around `Intl.DateTimeFormat`, not much of "our" logic to break).
Reasonable follow-up if this suite is extended.

## No bugs found

Went looking (that was explicitly in scope) but didn't find a genuine computation bug
in `pt-core.js` worth an `.skip`/xfail test. The one loose end noticed:
`parseTime`'s regex (`^(\d{1,2}):(\d{2})\s*([AP]M)$`) doesn't range-check the hour, so
e.g. `"25:00 AM"` parses without error instead of returning `null`. Not exercised in
practice — the data is transcribed from ACJU PDFs at build time, not user input — so
left as a documented non-issue (`tests/time-logic.test.js`, the parseTime malformed-input
test) rather than a fix, per "do not change the prayer-time logic itself".

## Where this stands

**Done.** Suite is green from a clean checkout, verified to fail when the logic is
deliberately broken (see above, reverted), 73 tests total. Nothing left in progress.

**If resuming/extending this task:** the natural next slice is `dayPhase()` and
`shareToday()` (listed above as not covered) — both are pure functions, same
`loadPTCore()` helper works unchanged.
