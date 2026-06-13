# Backlog

## Pending

- **Pick the winning design concept** (added 2026-06-13, v7.0.0)
  Five fully-working previews are live: `designs.html` → `design-1.html` (Daylight),
  `design-2.html` (Midnight), `design-3.html` (Heritage), `design-4.html` (Dawn),
  `design-5.html` (Bold). Collect user feedback (WhatsApp / email), pick one, then:
  1. Promote its theme to the main site (merge `designs-base.css` + winning `designN.css`
     into `assets/css/style.css`, or point `index.html` at the new pair).
  2. Remove the other concept pages + the footer "preview new looks" link.
  3. Bump MAJOR version (full redesign) and update README history.

- **Nallur zone override** (carried over from README "Deferred")
  Confirm with ACJU whether the Zone 02 "Nallur" entry is the Nallur GN division in
  Poonakary DS (Kilinochchi). If so, add the one-line override in
  `build/build-zones.js` (`OVERRIDES` section) and regenerate `zones.geojson`.

## Upcoming (from README)

- Android app (lightweight wrapper)
- iOS app (lightweight wrapper)
