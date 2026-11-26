# Tasks — Prayer-Time-Site

Cards run in this order. Each is tagged with the model that builds it; effort is `medium`
unless the card says otherwise. Decisions are in `decisions/`; cards point to them instead of
repeating them. Planned 2026-11-16 (fable-sprint S15); the questions behind the "BLOCKED"
cards are in `SHEHAN-TODO.md`.

House rules for every card: no framework and no build step for the site itself; prayer keys
are `fajr, sunrise, luhr, asr, magrib, isha` and are never renamed; no AI attribution in
commits; work on a branch, because **a push to `main` deploys to pray.gear.lk**.

---

### PT-0 — Deploy only the site, not the repo            [Sonnet] · effort medium · ~30 min
**Status 2026-11-17:** Done (`2d0ec37`; allowlisted `_site/` via `build/make-site.sh`). Taken from the commits, 2026-11-21 docs pass; the card's own Done-when was not re-run.
Why: `.github/workflows/pages.yml` uploads the whole repo root (`path: '.'`), so `BACKLOG.md`,
`TASKS.md`, `HANDOFF.md`, `SHEHAN-TODO.md`, `decisions/`, `tests/` and `build/` are all served
publicly at pray.gear.lk the moment they reach `main`.
Context to read: `.github/workflows/pages.yml`, README "Repository structure".
Do: make the workflow assemble a `_site/` folder from an explicit allowlist (`index.html`,
`manifest.json`, `sw.js`, `CNAME`, `assets/`, `data/`, and the preview pages that are still
live) and upload that. Keep the git-SHA injection into `sw.js` working. An allowlist, not a
blocklist, so a new doc is private by default.
Done when: the workflow file builds `_site/` from the allowlist; running the same copy steps
locally gives a folder with no `.md` file, no `tests/`, no `build/`, no
`decisions/`, no `node_modules/`; `sw.js` in `_site/` has no `__GIT_SHA__` placeholder after
the inject step; every path in `sw.js`'s cache list exists in `_site/`.
Don't: merge to `main` yourself; Shehan merges. Don't drop `CNAME`.

### PT-1 — The data contract: manifest and schema        [Sonnet] · effort medium · ~1.5 h
**Status 2026-11-17:** Done (`528a3c3`; manifest, schema, checksum test). Taken from the commits, 2026-11-21 docs pass; the card's own Done-when was not re-run.
Why: consumers need to know whether their copy of the timetable is current (ADR 0001).
Context to read: `decisions/0001-…`, README "Updating prayer-time data", `data/zones.json`,
one `data/zoneNN-MM.json`, `tests/README.md`.
Do: add `build/make-manifest.js` (Node standard library only) that writes `data/manifest.json`
with `contract: 1`, `revision`, `revised`, `source`, and `files` (path, sha256, bytes) for
every file under `data/` except the manifest itself, in sorted order so the output is stable.
Write `data/SCHEMA.md` (plain-language description of `manifest.json`, `zones.json`,
`zoneNN-MM.json`, `zones.geojson`) and `data/schema/*.schema.json`. Add a vitest test that
fails if the manifest does not match the files on disk. Add `npm run manifest`. Make
`sw.js` treat `manifest.json` as data (stale-while-revalidate), not shell. Document the
"how to change the data" steps in README, replacing the current "Updating" section's last
paragraph. First `revision` is `2026-11-16.1`; `source.edition` is whatever the existing files'
`year`/`source` fields support, and "unknown — confirm with Shehan" if they do not say.
Done when: `npm test` passes and includes the manifest test; editing one digit in any zone
file makes that test fail; `node build/make-manifest.js` run twice gives a byte-identical
file; `data/manifest.json` lists 158 files (156 zone files, `zones.json`, `zones.geojson`).
Don't: rename or reformat any existing data file (the checksums are the point, and Salah-board
has byte-identical copies today). Don't add a build step to the site.

### PT-2 — Validate the timetable itself                 [Sonnet] · effort medium · ~1.5 h
**Status 2026-11-17:** Done (`871e096`; the one flagged value is in BUGS.md). Taken from the commits, 2026-11-21 docs pass; the card's own Done-when was not re-run.
Why: the tables were typed in by hand from a PDF. A wrong minute is invisible until someone
prays by it. Nothing checks the values today (`build/validate.js` checks zone polygons only).
Context to read: `decisions/0001-…` point 5, one zone file, `tests/`.
Do: a vitest suite over all 156 files that checks: the right number of days for the month
(February has 29 entries or the leap-day rule is documented); `date` strings are in order and
match the month; every time parses; `fajr < sunrise < luhr < asr < magrib < isha` on every
day; no prayer moves more than 2 minutes between consecutive days, including across month
ends and from 31 December to 1 January; `zone`, `monthNum`, `districts` agree with
`zones.json`; neighbouring-zone sanity is NOT checked (zones legitimately differ).
Done when: `npm test` runs the suite; every failure it finds is listed in a new `BUGS.md`
with file, date, value and the neighbouring days' values.
Don't: "fix" a value the suite flags. ACJU's PDF is the source; a flagged value goes in
`BUGS.md` and `SHEHAN-TODO.md` for Shehan to check against the PDF. If the suite finds more
than about 20 problems, stop and report: the 2-minute rule is probably wrong, not the data.

### PT-3 — One zone list, and a versioned engine         [Sonnet] · effort medium · ~1 h
**Status 2026-11-17:** Done (`0325c97`). Taken from the commits, 2026-11-21 docs pass; the card's own Done-when was not re-run.
Why: `assets/js/pt-core.js` inlines its own zone list, which already words zones 08 and 10
differently from `data/zones.json`; and Salah-board needs to vendor the engine unmodified
(ADR 0001, Salah-board ADR 0002).
Context to read: `assets/js/pt-core.js` (top 40 lines and the public `PT` object),
`data/zones.json`, `tests/`.
Do: make `data/zones.json` the truth. Keep the inlined list (it saves a request) but mark it
as a generated block and add a test that compares it with `zones.json`; fix the wording to
match. Add `PT.VERSION` and a header line giving the version. Let `DATA_BASE` be overridden
(`PT.configure({ dataBase })`) so a consumer can point it at its own folder. Write
`assets/js/PT-CORE.md`: the public API in one page, and the rule "consumers copy this file
unmodified and extend it from a second file".
Done when: `npm test` passes with the new comparison test; the test fails if one district
name is changed in either place; `PT.VERSION` exists; the live page and all `ui-*`/`design-*`
pages still load data (check each file still references the same global and paths).
Don't: change any function's behaviour or signature. Don't convert to ES modules: every page
loads it with a plain `<script>` tag.

### PT-4 — Promote the picked layout and palette          [Sonnet] · effort medium · ~3 h
**Status 2026-11-18:** Partly done. On `main`, Ambient v9 is live as a Labs page, `/labs/ambient.html` (`5e09568`, `67cb755`); `/` is still the classic v8 page. The full swap (Ambient as `/`, `classic.html`, v9.0.0) is built on branch `build/pt-0-3` (`64b0da1`, pushed, not merged). Waits on Shehan's go after he tries Labs on his phone. Taken from the commits, 2026-11-21 docs pass.
**BLOCKED on Shehan: Q12 (layout) and Q13 (palette) in SHEHAN-TODO.md.**
Why: closes the two picks open since June (ADR 0002).
Context to read: `decisions/0002-…` (the feature list in point 1 is the acceptance test),
`BACKLOG.md`, the picked `ui-*.html`, `assets/css/designs-base.css` + the picked
`designN.css`, `index.html`, `assets/js/app.js`.
Do: follow ADR 0002. Build the picked layout into `index.html` on top of `pt-core.js`; carry
over every section the experiment lacks from the current page; fold the picked palette into
tokens in `assets/css/style.css` with a derived dark (or light) partner; move every preview
page and its CSS into `archive/` and remove the footer links; bump to v9.0.0 with a README
history row; update the PT-0 allowlist.
Done when: every item in ADR 0002's feature list is present (tick them off in the commit
body); a script-computed contrast ratio is ≥ 4.5:1 for every text/background token pair in
both themes (list the pairs and ratios in `HANDOFF.md`); `npm test` passes; page weight for a
cold load stays under 130 KB raw excluding fonts (README "Performance" table updated);
`archive/` is absent from `_site/`.
Don't: claim it looks right. Say "not seen on a screen, needs Shehan's look" and give him the
branch preview steps. Don't delete the previews. Don't merge to `main`.

### PT-5 — Nallur override                                [Sonnet] · effort low · ~20 min
**BLOCKED on ACJU's answer (SHEHAN-TODO.md).**
Why: ACJU lists "Nallur" under Zone 02; it is probably the Nallur GN division in Poonakary DS,
not Nallur in Jaffna town. Until confirmed it sits in Zone 03.
Context to read: README "Deferred", `build/build-zones.js` `OVERRIDES`, `build/README.md`.
Do: add the override, regenerate `zones.geojson`, rerun `validate.js` and `accuracy-sweep.js`,
regenerate the manifest and bump `revision`.
Done when: `validate.js` passes with a new Nallur test point; manifest test passes.
Don't: do this on a guess.

### PT-6 — Move the site to the sakina.lk domain                [Sonnet] · effort medium · ~2 h
Status: **step 1 done 2026-11-25** (host from Shehan: "use pray.sakina.lk … use Wrangler"). https://pray.sakina.lk is live: Worker `prayer-time-site` (static assets from `build/make-site.sh`, `wrangler.jsonc`, `build/worker.js`), deployed with `bash build/make-site.sh _site && npx wrangler deploy`. Share texts say pray.sakina.lk. pray.gear.lk stays on GitHub Pages, unchanged. **Decided 2026-11-26 (Shehan): "keep both for now. retire after about 6 months."** Both addresses stay live, no redirect now; retire pray.gear.lk around late May 2027 (six months from 26 Nov 2026). **Left:** then SCHEMA.md, README and readers (PT-R1) to the new host; a deploy of the Worker on push.
Why: Shehan, 25 Nov 2026: the site is fine as it is; "only thing is, we have to move that to the Sakina.lk domain".
Context to read: `CNAME`, `README.md`, ADR 0001 (the published data contract), every `pray.gear.lk` reference (pt-core.js, app.js, SCHEMA.md), PT-R1 (brilliant-bar's fetcher).
Do: agree the host name with Shehan (e.g. `pray.sakina.lk`); set up the domain (Cloudflare: Shehan); change the references; keep `pray.gear.lk` live (no redirect until the retirement, ~late May 2027, per Shehan 2026-11-26), and keep its `data/manifest.json` and data files answering until every reader has moved.
Done when: the new host serves the site and data, the old one redirects without breaking the data readers or the installed app (service worker scope), tests pass.
Needs Shehan: the host name, DNS, and the deploy (a push to `main` deploys).
Don't: change the layout or the look.

---

## Requests to other repos

### PT-R1 — Brilliant's fetcher syncs from the manifest   [Opus] · effort medium · ~1 h
For `brilliant-bar` (card belongs in Brilliant's tracker under S7, the `prayer` feed).
Why: `bin/brilliant-prayer-fetch` reads `~/Projects/Prayer-Time-Site/data/` off the disk, so
the desktop's prayer times depend on a git checkout being present and current (ADR 0001).
Do: keep a cache at `~/.cache/brilliant/prayer-data/`; on a timer (daily is plenty) fetch
`https://pray.gear.lk/data/manifest.json`, download files whose SHA-256 differs, verify, swap
atomically, keep the previous set; read only from the cache; keep `BRILLIANT_PRAYER_DATA` as a
development override; put the manifest `revision` in the published `prayer-times.json`.
Done when: with no Prayer-Time-Site checkout and no network, the popout still shows times
from the cache; a corrupted download is rejected and the old set stays.
Depends on: PT-1 merged and live.

## Later (not carded)

- Android and iOS wrappers (README "Upcoming").
- Lifting the Orbit dial and the Qibla compass as reusable components (brilliant-design
  web kit) once PT-4 has archived them.
