# 0001 — One prayer-times source: the published ACJU files, made a contract

- **Status:** accepted 2026-11-17 — Shehan answered "ok" in `SHEHAN-TODO.md` (S15 Q10, Q11)
- **Date:** 2026-11-16
- **Applies to:** Prayer-Time-Site (the home of the data), Salah-board, Brilliant's prayer
  popout (`brilliant-bar/bin/brilliant-prayer-fetch`), and any later faith app.

## Context

Three things use the ACJU prayer timetable today, and each gets it a different way:

| Consumer | How it gets the data today |
|---|---|
| pray.gear.lk (this repo) | `data/zoneNN-MM.json`, 156 files, fetched one at a time |
| Salah-board | a byte-identical copy in `display/data/`, copied by a PowerShell script |
| Brilliant's prayer popout | reads this repo's `data/` folder off the laptop's disk, falls back to `https://pray.gear.lk/data/` |

Nobody calculates prayer times. The tables are transcribed from ACJU's PDF, are solar-based,
and repeat every year. They change only if ACJU revises them. The zone list also exists three
times (`data/zones.json`, inlined in `assets/js/pt-core.js`, and Salah-board's copy), and the
inlined copy already words zones 08 and 10 differently from `zones.json`.

The copies cannot tell whether they are current. If ACJU revises a table, or a typing mistake
is fixed here, Salah-board boards and the laptop keep the old numbers with no sign of it. For
a prayer timetable a silent wrong minute is the worst failure there is.

Three shapes were considered for "one source":

1. **A shared npm package** holding the data and the engine.
2. **A small API on Cloudflare Workers** that answers "times for zone X on date Y".
3. **The files that are already published**, turned into a versioned contract.

## Decision

**Option 3.** `https://pray.gear.lk/data/` is the one source. It becomes a contract:

1. **`data/manifest.json`** is the entry point. It carries:
   - `contract`: the shape version, starting at `1`. It changes only if a field is renamed or
     removed, which this ADR forbids without a new ADR.
   - `revision`: a date-based string, bumped whenever any table value changes
     (`2026-11-16.1`), with `revised` (ISO date) and `source` (`"ACJU"` plus the edition of
     the PDF the tables were transcribed from).
   - `files`: every file under `data/` with its SHA-256 and size.
2. **`data/SCHEMA.md`** and a JSON Schema describe the file shapes that exist today. Nothing
   is renamed. The prayer keys stay `fajr, sunrise, luhr, asr, magrib, isha`; times stay
   12-hour strings in Sri Lanka time.
3. **`data/zones.json` is the only zone list.** `pt-core.js` stops carrying its own copy
   (it keeps an inlined copy only as a generated block that a test compares to `zones.json`).
4. **Consumers sync, they do not link.** Each keeps its own local copy and refreshes it from
   the manifest: download only files whose checksum differs, verify every checksum, swap the
   set in one step, keep the previous set. A consumer that is offline keeps working on what it
   has. No consumer reads another repo's folder off the disk.
5. **A change to the data is a reviewed change**: the validation suite (card PT-2) passes,
   the manifest is regenerated, `revision` is bumped, and the commit says which ACJU edition
   or which correction it is.
6. **ACJU tables only.** No calculation methods. `source` exists so a second source could be
   added under a new ADR without breaking a consumer.

The engine (`pt-core.js`) is shared the same way: this repo owns it, it carries a version
constant, and Salah-board vendors an unmodified copy and keeps its iqamah logic in a separate
file (Salah-board ADR 0002).

## Why not the others

- **A Worker API** answers a question nobody has. There is nothing to compute, so the API
  would only re-serve these files, and it adds a service that can fail between a masjid's
  board and its timetable. This site's own principle 2 is "no server, no database". Salah-board
  must run with no internet and would bundle the data regardless.
- **An npm package** suits the two web apps but not Brilliant's fetcher (Python) or a
  Salah-board with no build step. It also needs a registry or a git dependency for every
  consumer. A URL plus a checksum works from any language.

## Consequences

- One small file and one generator script are added here; the site itself is unchanged and
  stays build-free (the generator runs by hand or in a test, never in production).
- Salah-board gets a real update path and can show "timetable revision 2026-11-16.1" on its
  settings page.
- Brilliant no longer depends on a checkout of this repo being present on the laptop.
- The URL is now a promise. Moving the site off GitHub Pages must keep `/data/` and its
  permissive CORS header (`access-control-allow-origin: *`, confirmed 2026-11-16).
- If Shehan answers Q10 with "a Workers API", this ADR is superseded, but cards PT-1 and PT-2
  are still the first steps: an API would serve the same validated, versioned files.
