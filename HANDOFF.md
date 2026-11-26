# HANDOFF — Prayer-Time-Site

_Replace this file at the end of every session; git history keeps the old versions._

## Current state (2026-11-26, ACJU recheck)

- **Data fix ready, NOT merged or pushed:** branch `claude/heuristic-kilby-26722e`, three commits on top of `main`:
  1. fix(data): zone 05 Feb/Apr/Jun/Sep/Nov held zone 06's table (since the first commit; ACJU's 2025
     Kurunegala pages were labelled `Zone: 05`) and zone 10 May had ACJU's 2025 values, which 2026 corrects (43 cells).
     Revision `2026-11-26.2`, `source.edition`.
  2. feat(data): optional `asrHanafi` on every day of all 156 files (ACJU's new column). Revision `2026-11-26.3`.
  3. docs: the report, research index, BUGS, SHEHAN-TODO, TASKS, this file, and `sources/` (checksum lists only).
- **ACJU PDFs are kept out of git** (public repo): both editions on RUBY2 under `~/office/Brands/Gear.lk/Site/Prayer Time
  Website/` (`PDF/` = 2025, `PDF-2026-09-15/`) and on Sapphire under `/srv/bulk/reference/acju-prayer-times/`; see `sources/README.md`.
- **Recheck result** ([summary](docs/general/acju-recheck.md), [raw](docs/research-raw/acju-recheck-2026-11-26.md)): ACJU's
  current 156 PDFs (made 15 Sep 2026, no edition printed) match 150 files exactly; the Shafi'i times changed only in zone 10 May.
  Read three ways (poppler text, pdfminer, OCR of all 33,306 cells); all agree. Our data was typed from the 2025 edition (151/156 exact).
- Checks on the branch: `npm test` 87/87, `build/validate.js` 28/28, `make-site` + `verify-site` ok, Salah-board
  `check_zone_file` passes all 157 files, brilliant-bar `brilliant-prayer-fetch` (override mode) reads revision `.3`.
- Unchanged from before: the site at https://pray.sakina.lk is deployed by hand (`wrangler`); pray.gear.lk (Pages, deploys
  on push to `main`) redirects pages but still serves `/data/` for the Salah-board.

## Resume: merge and deploy (Shehan's one yes)

Live data feeds the site, the Salah-board (polls `pray.gear.lk/data/`) and the bar (reads `~/Projects/Prayer-Time-Site/data/`
first, then `pray.sakina.lk/data/`). From the main checkout `~/Projects/Prayer-Time-Site`:

1. `chmod -R u+w data assets .github` (they may be mode 555)
2. `git checkout main && git merge --no-ff claude/heuristic-kilby-26722e` (fix only, without Hanafi:
   merge the fix(data) commit alone; the later commits then need cherry-picking, and the docs describe the Hanafi field)
3. `npm test`
4. `git push origin main` → Pages redeploys pray.gear.lk; the Salah-board picks up revision `.3` on its next refresh
5. `bash build/make-site.sh _site && npx wrangler deploy` → pray.sakina.lk (needs Shehan's Cloudflare login)

The bar sees the new data as soon as step 2 lands in the main checkout.

Still open for Shehan otherwise: ACJU's Nallur answer (PT-5).

## Gotchas

- `data/`, `assets/`, `.github` may be mode 555: `chmod -R u+w` before switching branches.
- Zone files are `json.dumps(indent=2)` with no trailing newline; keep that byte form (Salah-board compares checksums).
- Never commit the ACJU PDFs (public repo); `sources/` holds only their checksums.
- ACJU file names: zones 03/09/12 are `NN.-…-Hanafi_MM_0MM.pdf`; zone 01 June dates read `Jun-1`.
- Labs page unseen on a real phone / iOS Safari. `build/contrast-check.js` lives only on `build/pt-0-3`.
