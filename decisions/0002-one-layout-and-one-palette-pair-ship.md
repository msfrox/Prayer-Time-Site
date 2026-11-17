# 0002 — One layout and one palette pair ship; the previews are archived

- **Status:** accepted with a condition, 2026-11-17. Shehan's answers (`SHEHAN-TODO.md`): layout = "a version of Ambient with the current features in the pull up"; palette = Daylight with a matching dark; previews to `archive/`. He asked to *see* it, so v9.0.0 is built as a preview and `classic.html` keeps the old page until he approves.
- **Date:** 2026-11-16

## Context

Since June 2026 the site has carried five layout experiments (`ui-*.html`, listed on
`labs.html`) and five palette previews (`design-1…5.html`, listed on `designs.html`), all
`noindex`, all wired to live data. `BACKLOG.md` has had "pick the layout" and "pick the
colour theme" open since 2026-06-13. Eleven extra pages mean eleven places a core change has
to be checked, and the live page still links to the picker.

The pick is Shehan's eye. This ADR records only *how* a pick is promoted, so the build
session does not have to decide it.

## Decision

1. **Exactly one layout ships at `/`.** Whatever is picked must keep everything the live page
   does today. The feature list is the acceptance test: all 13 zones, Locate Me with the
   first-run prompt, manual zone picker, live countdown with after-Isha rollover, Imsak and
   Iftar, Gregorian and Hijri dates, the full monthly table, the high-rise table, copy / share
   / image sharing, `?zone=&month=` deep links, offline use, and the PWA manifest.
   A picked experiment that lacks a section gets that section from the current page.
2. **One palette ships as a light and dark pair.** The site follows the phone's dark setting
   today and keeps doing so. If the picked palette is light, a dark partner is derived from
   it (and the reverse). Every text and background pair is contrast-checked to WCAG AA
   (4.5:1 for text) before it ships.
3. **Colours become tokens in `assets/css/style.css`**, replacing `designs-base.css` +
   `designN.css` for the shipped page.
4. **Everything not picked moves to `archive/`**, which the Pages deploy excludes. Nothing is
   deleted. The footer links to the pickers are removed.
5. **It is a MAJOR version** (v9.0.0) with a README history row.

## Consequences

- The promotion card (PT-4) is blocked until Q12 and Q13 are answered. Nothing else is.
- Pieces worth keeping from the experiments that were not picked (the Orbit dial, the Bento
  Qibla compass, the Ambient sky) stay readable in `archive/` for reuse in other projects.
