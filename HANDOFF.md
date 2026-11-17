# HANDOFF — Prayer-Time-Site

_Replace this file at the end of every session; git history keeps the old versions._

## Current state (2026-11-17 — PT-0 to PT-3 built on `build/pt-0-3`, not merged)

- Live site is still **v8.0.0**; nothing was pushed. Branch `build/pt-0-3` is cut from local `main`.
- **PT-0** `5772c2a` workflow builds `_site/` via `build/make-site.sh` (allowlist).
- **PT-1** `d4ad84d` `data/manifest.json` (163 files incl. schema docs), `data/SCHEMA.md`,
  `data/schema/*.schema.json`, `build/make-manifest.js`, `npm run manifest`, manifest test.
- **PT-2** `85da9e6` `tests/timetable.test.js`; one flagged value in `BUGS.md`.
- **PT-3** `b1ff42c` `PT.VERSION` 1.0.0, `PT.configure({dataBase})`, generated ZONES block +
  test, `assets/js/PT-CORE.md`, `build/sync-zones.js`.
- `npm test`: 87 passing. PT-4, PT-5 not started (no answers in `SHEHAN-TODO.md`).

## Resume

Shehan: preview with `bash build/make-site.sh /tmp/site && python3 -m http.server -d /tmp/site 8000`,
check, then merge `build/pt-0-3` to `main` (that deploys).
Next cards: PT-4 (needs layout + palette picks), PT-5 (needs ACJU's Nallur answer).

## Gotchas

- `data/`, `assets/`, `assets/css`, `assets/js` are mode 555. To change data: `chmod u+w data`,
  edit, `npm run manifest`, `chmod 555 data`. (data/ got new files this session: restored.)
- The card said the inlined zone list differed from `zones.json` for zones 08 and 10; it did
  not (identical at start). The new test keeps it so.
- Card PT-1 said 158 files; the manifest lists 163 because it also lists `SCHEMA.md` and the
  four schema files (ADR: "every file under data/"). Salah-board must copy those or ignore.
- `make-site.sh` deletes all `*.md` from `_site/`, so PT-CORE.md and SCHEMA.md are not served.
- `source.edition` in the manifest is "unknown — confirm with Shehan".
- Zone 05 1-Apr asr is flagged in `BUGS.md`/`tests/known-issues.json`; remove the entry when fixed.
