# Backlog

## Pending

- **Pick the winning LAYOUT direction** (added 2026-06-13, v7.1.0)
  Five ground-up UI experiments are live at `labs.html`: `ui-orbit.html` (radial dial),
  `ui-journey.html` (timeline), `ui-stories.html` (swipe week), `ui-bento.html`
  (dashboard), `ui-ambient.html` (immersive sky). They share `assets/js/pt-core.js`.
  Collect feedback, pick a direction, then promote it to `index.html` (replace or merge
  with the current layout), retire the unused experiments, bump MAJOR, update README.
  Some of these (Orbit dial, Bento Qibla compass, Ambient sky) are also candidates to
  lift into other projects.

- **Pick the winning COLOUR theme** (added 2026-06-13, v7.0.0)
  Five palette previews: `designs.html` → `design-1.html` (Daylight),
  `design-2.html` (Midnight), `design-3.html` (Heritage), `design-4.html` (Dawn),
  `design-5.html` (Bold). Collect user feedback (WhatsApp / email), pick one, then:
  1. Promote its theme to the chosen layout (merge `designs-base.css` + winning
     `designN.css`, or fold the tokens into `assets/css/style.css`).
  2. Remove the unused concept pages + the footer preview links.
  3. Bump version and update README history.

- **Decide what to keep public vs. archive.** The `design-*` and `ui-*` pages are
  `noindex` previews. Once a direction is chosen, move the rest out of the site root
  (e.g. an `archive/` folder) or delete, so only the shipped design remains.

- **Nallur zone override** (carried over from README "Deferred")
  Confirm with ACJU whether the Zone 02 "Nallur" entry is the Nallur GN division in
  Poonakary DS (Kilinochchi). If so, add the one-line override in
  `build/build-zones.js` (`OVERRIDES` section) and regenerate `zones.geojson`.

## Upcoming (from README)

- Android app (lightweight wrapper)
- iOS app (lightweight wrapper)
