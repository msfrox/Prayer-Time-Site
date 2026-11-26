# HANDOFF — Prayer-Time-Site

_Replace this file at the end of every session; git history keeps the old versions._

## Current state (2026-11-18)

- **Live:** `/` is still the classic v8 page (byte-identical `index.html`, `app.js`, `style.css`).
  **New:** https://pray.gear.lk/labs/ambient.html (Ambient v9, linked from `/labs.html`) for Shehan to test on his phone.
- `main` = old main + PT-0..PT-3 (allowlist deploy via `build/make-site.sh`, manifest/schema, timetable test,
  versioned pt-core) + the Labs page. All old Labs pages and `designs.html` are still deployed.
- Labs page: `labs/ambient.html`, `assets/css/ambient-base.css` (Daylight tokens, light only: the dark
  media block was removed so the sheet matches the light sky view), `ambient.css`, `ambient.js`; data
  via `PT.configure({dataBase:"/data"})`. Locate prompt sits above the pull-up handle. SW pre-caches the Labs assets.
- Branch `build/pt-0-3` (pushed) still has the full PT-4 swap (Ambient as `/`, `classic.html`, derived dark).
  Its dark partner and prompt position fixes are NOT applied there; port `labs` fixes if he approves.
- `npm test` 87 pass; `build/validate.js` 28/28.

- **2026-11-26 (PT-6):** Shehan: "shall we just add a redirect to pray.gear.lk and make pray.sakina.lk the only one" → "Yes, redirect pages". Supersedes "keep both for ~6 months". pray.gear.lk (GitHub Pages) pages redirect to the same path on pray.sakina.lk via `build/make-gear-redirect.sh` in `pages.yml` only; `/data/`, CNAME and assets are untouched, and `sw.js` there is a retiring worker (clears caches, unregisters, reloads). `verify-site.sh --gear` fails CI if a page is not a redirect or `data/` differs. The Worker is unchanged. Installed copies on gear.lk lose their saved settings (stored per address; accepted). Retire gear.lk fully once the Salah-board reads from pray.sakina.lk.

## Resume

If Shehan approves: merge `build/pt-0-3` (or its PT-4 commit) onto `main`, apply the same two fixes
(light sheet decision, prompt `bottom`), keep or delete `/labs/ambient.html`. Next: PT-5 (needs ACJU's Nallur answer).

## Gotchas

- `data/`, `assets/`, `.github` may be mode 555: `chmod -R u+w` before switching branches.
- Labs page unseen on a real phone / iOS Safari. `build/contrast-check.js` lives only on `build/pt-0-3`.
