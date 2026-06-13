# Sri Lanka Prayer Times — ACJU Official Timetable

A fast, free, ad-light web app for accurate Islamic prayer times across **every
district of Sri Lanka**, based on the official timetables of the **All Ceylon
Jamiyyathul Ulama (ACJU)**.

🌐 **Live site:** [pray.gear.lk](https://pray.gear.lk)

It is, and will always remain, **free and non-commercial** (see [License](#license)).

---

## What it is

Sri Lanka is divided by ACJU into **13 prayer-time zones** covering all 25 districts.
Picking the wrong zone gives the wrong times, so the headline feature is getting you
into the *right* zone automatically — using your phone's location and the real
administrative boundaries — while still letting you choose manually at any time.

It's a **single static page** (HTML / CSS / vanilla JS, no framework, no backend). All
timetable data and zone boundary files are plain JSON served directly from GitHub Pages,
so it loads quickly and keeps working offline once cached.

---

## Design principles

These decisions were made at the start and remain the guiding constraints:

**1. No framework, no build step for the site itself.**
The site is a single `index.html`, one CSS file, one JS file. A visitor opens it and it
works — no React, no bundler, no hydration, nothing that requires a build pipeline.
The only build step that exists is a one-time offline script (`build/`) that generated
the geofencing boundary file; it never runs in production.

**2. No server, no database.**
All data lives as flat JSON files in `data/`. The site fetches exactly what it needs
(one zone + one month at a time, ~3–4 KB per request), not all 156 files at once.
There is nothing to maintain, nothing to go down except GitHub Pages.

**3. Load only what you need, when you need it.**
On page open the app fetches two small files: `zones.json` (zone list, ~2 KB) and one
`zoneNN-MM.json` (the selected zone's current month, ~4 KB). That is all. The
geofencing boundary file (`zones.geojson`, ~118 KB) is only fetched if the user
clicks "Locate Me". Other month/zone files are fetched only when the user changes the
selector. No bulk loading, no pre-fetching everything.

**4. Privacy-first, no personal data sent anywhere.**
The only thing stored on the user's device is their chosen zone (localStorage), so the
site remembers it on the next visit without sending anything to a server. GPS
coordinates never leave the browser — zone detection is pure client-side JS.

**5. Non-commercial, always free.**
No ads, no paywalls, no premium features. CC BY-NC-SA 4.0 licence ensures that any
derivative stays free too.

**6. Data comes from one source: ACJU.**
We do not calculate prayer times ourselves. The timetables are transcribed directly
from the official ACJU PDF timetables. This is a deliberate choice to avoid
calculation disagreements.

**7. The timetables are solar-based and valid for every year.**
Islamic prayer times are determined by the sun's position, which follows the Gregorian
(solar) calendar. The same date — say, 7 June — has essentially identical prayer times
in 2026, 2027, 2028, and beyond. The `year` field inside each JSON file is just
compilation metadata; the actual times are permanent. The app always displays the
current real year (`new Date().getFullYear()`), never the metadata year. The data
files **do not need to be replaced each year** unless ACJU itself revises the
timetable.

---

## Features

**Times & calendar**
- Prayer times for all **13 ACJU zones** (Fajr, Sunrise, Zuhr, Asr, Maghrib, Isha)
- The current prayer is highlighted, with a **live countdown** to the next one
- Correct roll-over to *tomorrow's Fajr* after Isha (fetches next month if needed)
- **Imsak / Sahr end** (2 min before Fajr) and **Iftar** (Maghrib) shown for fasting
- Live clock with **Gregorian + Hijri** dates (Umm al-Qura calendar via browser `Intl`)
- **Full monthly timetable** view, switchable by month
- **High-rise apartment adjustment** table (minute offsets for buildings 6–87 floors)

**Smart location (geofencing)**
- **"Locate Me"** uses real **point-in-polygon** detection against ACJU zone polygons —
  not a rough nearest-city guess — so accuracy is to the district boundary
- **First-run prompt**: a gentle "Show prayer times for your area?" card on the very
  first visit; tapping *Allow* triggers the real GPS prompt
- **Remembers your zone** across visits (stored locally on device) — no repeat prompts
- **Coastal sea-buffer**: if you're a few km offshore (boat, beach), it still snaps to
  the nearest zone rather than reporting "outside Sri Lanka"
- **Out-of-bounds handling**: if you're nowhere near Sri Lanka, it says so and leaves
  the picker to you instead of guessing
- **Manual district dropdown** always available as an override

**Sharing**
- Copy a clean plain-text timetable (works on any phone)
- Native share sheet (mobile)
- **Generate an image** — beautifully laid-out day card or full-month card for WhatsApp
- Shareable deep-links carry the selected zone and month (`?zone=07&month=8`)

**Quality of life**
- Fully **responsive** for mobile and desktop
- Works offline once loaded (files cached by the browser)
- Zone boundary file is lazy-loaded only when location is used — zero extra cost otherwise

## Upcoming

- 📱 **Android app**
- 🍏 **iOS app**

(Both planned as lightweight wrappers around the same free, non-commercial experience.)

---

## How data loads (and what does NOT load)

A common question: does the site download all district data on start-up?

**No.** The loading sequence is:

1. `zones.json` — the name/district list (~2 KB). This populates the dropdown.
2. `zoneNN-MM.json` — **one file** for the selected zone and current month (~3–4 KB).
   This drives everything on screen: today's times, countdown, monthly table.
3. If the user changes zone or month, one new `zoneNN-MM.json` is fetched.
4. If the user clicks "Locate Me", `zones.geojson` (~118 KB, ~35 KB gzipped) is fetched
   once and cached in memory for the session.

All 156 zone-month files (13 zones × 12 months) are in the repo for completeness, but
only the one that is currently needed is ever downloaded by a visitor.

---

## How the geofencing works

`data/zones.geojson` holds the 13 zone polygons, built once offline from official
district boundary data. When the user clicks "Locate Me" the app:

1. Reads the GPS coordinate (high-accuracy, browser `navigator.geolocation`).
2. Lazy-fetches `zones.geojson` if not already in memory.
3. Runs a **ray-casting point-in-polygon** test against each zone polygon.
4. If the point is inside a zone → exact match, done.
5. If not (e.g. you're on a boat), finds the nearest zone boundary. Within ~8 km →
   "nearshore snap". Beyond that → "outside Sri Lanka" toast, manual pick requested.

The polygons come from **geoBoundaries ADM2** (district level), with **ADM3** used
only to split Ampara: the Padiyathalawa and Dehiattakandiya DS divisions are carved
out of Ampara and assigned to Zone 10, while the remainder of Ampara stays in Zone 08.
This matches ACJU's actual zone definitions.

Validation: a tens-of-thousands-point accuracy sweep (`build/accuracy-sweep.js`)
confirms boundary error sits within a few tens of metres of a real zone line — far
finer than GPS itself.

**Deferred:** ACJU's "Nallur" entry in Zone 02 is the Nallur *Grama Niladhari*
division in Poonakary DS, Kilinochchi (near Pooneryn, road B357) — *not* Nallur in
Jaffna city. It is currently left in Zone 03. Once confirmed with ACJU, it can be
added as a one-line override in `build/build-zones.js` (the `OVERRIDES` section).

---

## Repository structure

```
/                        ← Website root (deploys as-is to GitHub Pages)
├── index.html           ← Entire page structure
├── assets/
│   ├── css/style.css    ← All styling (~33 KB, ~7.5 KB gzip)
│   └── js/app.js        ← All app logic incl. geofencing (~44 KB, ~14 KB gzip)
├── data/
│   ├── zones.json           ← Zone → district list (loaded at startup)
│   ├── zones.geojson        ← 13 zone polygons (lazy-loaded on "Locate Me", ~118 KB)
│   └── zoneNN-MM.json       ← Times per zone per month; 156 files, one loaded at a time
├── build/               ← One-time offline scripts — never run in production
│   ├── build-zones.js       ← Generates zones.geojson from ADM2/ADM3 sources
│   ├── validate.js          ← Spot-checks known towns against zone output
│   ├── accuracy-sweep.js    ← Dense random-point accuracy test
│   ├── adm2.geojson         ← geoBoundaries ADM2 (25 districts)
│   ├── adm3.geojson         ← geoBoundaries ADM3 (DS divisions, Ampara cut only)
│   └── package.json         ← turf, mapshaper (build deps only)
├── CNAME                ← pray.gear.lk custom domain
├── LICENSE              ← CC BY-NC-SA 4.0
└── .github/workflows/   ← GitHub Actions Pages deploy on push
```

---

## Performance characteristics

**Page weight (compressed / over the wire):**

| Asset | Raw | Transferred |
|-------|-----|-------------|
| HTML | 13 KB | 4.7 KB |
| style.css | 33 KB | 7.5 KB |
| app.js | 44 KB | 13.7 KB |
| zones.json (JS fetch) | ~2 KB | ~1 KB |
| zoneNN-MM.json (JS fetch) | ~4 KB | ~2 KB |
| Google Fonts (5 woff2) | ~60 KB | ~60 KB |
| zones.geojson | 118 KB | ~35 KB | ← **only on "Locate Me"** |

The site itself (HTML + CSS + JS + one data file) comes in at roughly **90 KB
transferred** on a cold load. Fonts add another 60 KB but are cached for a year after
the first visit.

**What is not loaded by default:**
- Any zone/month other than the selected one
- `zones.geojson` (geofencing boundaries)
- All 155 other `zoneNN-MM.json` files

---

## Updating prayer-time data

**The data files do not need to be replaced each year.** Prayer times are solar-based
and repeat on the same Gregorian dates every year. The app always uses the current
calendar year for display — the `year` field in each JSON is compilation metadata only.

The only reason to update the `data/` files is if **ACJU revises the timetable itself**
(e.g. they recalculate zone boundaries or adjust calculation methodology). In that case,
replace the relevant JSON files with fresh values from the new ACJU PDF.

Each `zoneNN-MM.json` has this structure:

```json
{
  "zone": "01",
  "monthName": "June",
  "monthNum": 6,
  "year": 2026,
  "zoneName": "Zone 01",
  "districts": ["Colombo", "Gampaha", "Kalutara"],
  "days": [
    { "date": "1-Jun", "fajr": "4:30 AM", "sunrise": "5:54 AM",
      "luhr": "12:10 PM", "asr": "3:35 PM", "magrib": "6:25 PM", "isha": "7:40 PM" }
  ],
  "apartmentDiff": {
    "lowRise":  { "stories": "06-35", "heightM": "24-140",  "fajr": -1, "sunrise": -1, "magrib": 1, "isha": 1 },
    "highRise": { "stories": "35-87", "heightM": "140-350", "fajr": -2, "sunrise": -2, "magrib": 2, "isha": 2 }
  },
  "note": "Kindly requested to set the end of Sahr two minutes before Fajr time.",
  "source": "All Ceylon Jamiyyathul Ulama (ACJU)"
}
```

To update for a new year: replace the 156 JSON files in `data/` with fresh values
from the new ACJU PDF. The `year` field in each file is metadata only; the app always
uses the current calendar year for display.

---

## Zone reference

| Zone | Districts |
|------|-----------|
| 01 | Colombo, Gampaha, Kalutara |
| 02 | Jaffna, Nallur *(Nallur GN, Poonakary DS — see Deferred above)* |
| 03 | Mullaitivu (excl. Nallur GN), Kilinochchi, Vavuniya |
| 04 | Mannar, Puttalam |
| 05 | Anuradhapura, Polonnaruwa |
| 06 | Kurunegala |
| 07 | Kandy, Matale, Nuwara Eliya |
| 08 | Batticaloa, Ampara (excl. Padiyathalawa + Dehiattakandiya DS) |
| 09 | Trincomalee |
| 10 | Badulla, Monaragala, Padiyathalawa DS, Dehiattakandiya DS |
| 11 | Ratnapura, Kegalle |
| 12 | Galle, Matara |
| 13 | Hambantota |

---

## Deploying (GitHub Pages)

1. Push to `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/pages.yml` auto-deploys on every push.

Custom domain: `CNAME` file points to `pray.gear.lk`. SSL is handled by Cloudflare
in front of GitHub Pages (Cloudflare DNS → GitHub Pages origin).

---

## Credits & attribution

- **Prayer timetables** — official work of the **All Ceylon Jamiyyathul Ulama (ACJU)**,
  prepared from calculations by the late Al-'Alim M.I. Abdus Samad Makdoomi
  (Rahmatullahi Alayhi), former president of ACJU and founder of Hassaniyya Arabic
  College. Source: [acju.lk](https://www.acju.lk) · info@acju.lk · +94 117 490 490
- **Administrative boundaries** — [geoBoundaries](https://www.geoboundaries.org)
  (gbOpen, CC BY 4.0), used to derive `data/zones.geojson`.
- **Typeface** — [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
  (SIL Open Font License 1.1).
- **Build tooling** — [Turf.js](https://turfjs.org) (union, difference, point-in-polygon
  validation) and Node.js.
- **Maintained by** [@msfrox](https://github.com/msfrox). Developed with assistance
  from Claude (Anthropic).

---

## Versioning

The site follows **semver** (`MAJOR.MINOR.PATCH`), displayed in the footer of the live site.

| Change type | Example | When to bump |
|-------------|---------|--------------|
| **PATCH** `x.x.↑` | `6.2.0 → 6.2.1` | Tiny fix, wording change, new year data update |
| **MINOR** `x.↑.0` | `6.2.0 → 6.3.0` | Bug fix, improvement, performance tweak |
| **MAJOR** `↑.0.0` | `6.2.0 → 7.0.0` | New feature, new section, or full redesign |

**How to bump the version when making a change:**
1. Update `SITE_VERSION` in `assets/js/app.js`
2. Add a row to the Version history table below

**Service worker cache versioning is fully automatic** — the GitHub Actions deploy
workflow injects the git commit SHA into `sw.js` on every push. You never need to
touch `sw.js` manually to bust the cache. The placeholder `__GIT_SHA__` in `sw.js`
is replaced at deploy time; the file in the repo always shows the placeholder.

---

## Version history

| Version | What changed |
|---------|-------------|
| **v7.1.0** | *Labs — 5 ground-up UI experiments.* New `labs.html` gallery linking five standalone, fully-working redesigns that each present the ACJU data a different way: **Orbit** (`ui-orbit.html`, 24-hour radial dial + sun arc + Qibla), **Journey** (`ui-journey.html`, vertical day timeline + day-progress), **Stories** (`ui-stories.html`, swipeable 7-day cards), **Bento** (`ui-bento.html`, dashboard: countdown, Qibla compass w/ live heading, prayer checklist + ring, month heatmap), **Ambient** (`ui-ambient.html`, immersive sky that shifts dawn→day→dusk→night by real sun times). All share a new DOM-agnostic engine `assets/js/pt-core.js` (reuses app.js logic + adds geofencing & Qibla bearing). Footer of the live site now links Labs + the colour themes. Previews only — live experience unchanged. |
| **v7.0.0** | *Design concepts.* Added 5 fully-working design previews (`design-1.html`…`design-5.html`: Daylight, Midnight, Heritage, Dawn, Bold) sharing the live site's `app.js` + data via a token-driven base stylesheet (`assets/css/designs-base.css` + `designN.css`). New `designs.html` selection page with preview cards and a link to the live site; footer link on the live site invites users to preview and vote. |
| **v6.3.0** | *Bug fix + docs.* Fixed day-of-week in monthly table using `data.year` (2026) instead of current real year — days would have been one off in 2027+. Documented solar-based data permanence: JSON files valid for all years, no yearly refresh needed. |
| **v6.2.0** | *PWA.* Added `manifest.json`, service worker (`sw.js`) with cache-first shell + stale-while-revalidate data strategy, offline fallback. Auto-versioned SW via git SHA injection in GitHub Actions. Site semver added to footer. |
| **v6.1.0** | *Performance.* Self-hosted Plus Jakarta Sans (variable font, eliminates Google Fonts dependency). Replaced GTM (345 KB) with direct GA4 snippet (8 KB, async). Inlined `zones.json`. Monthly table loads in background. README rewritten. |
| **v6.0** | *Geofenced location.* Replaced nearest-city guessing with real point-in-polygon zone detection using ADM2/ADM3 boundaries. Added first-run location prompt, remembered zone (localStorage), coastal sea-buffer snap, out-of-bounds handling. Full reproducible build pipeline in `build/`. |
| **v5.x** | *Sharing.* Copy-as-text, native share sheet, and generated day/month image cards (Canvas API). |
| **v4.x** | *2026 redesign.* New dark/gold theme, hero countdown section, mobile-first layout, Hijri date display. |
| **v3** | *Data-driven rebuild.* Moved from hardcoded HTML tables to zone + monthly JSON structure. Proper district → zone mapping. |
| **v0.1–v0.2** | Initial release. Static HTML prayer time table. |

---

## License

**Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International
(CC BY-NC-SA 4.0)** — see [LICENSE](LICENSE).

You are free to **use, study, share, and build on** this project for **any
non-commercial purpose**, provided you:

- **give credit**, and
- license your derivatives under the **same terms** (so they stay free too).

**Commercial / for-profit use is not permitted.** This keeps the project — and anything
built from it — free for the community, forever.

> Note on data: prayer timetables remain © ACJU. Boundary data is derived from
> geoBoundaries (CC BY 4.0). Please honour those sources' terms as well.
