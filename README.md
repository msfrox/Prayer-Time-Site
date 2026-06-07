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

It's a single static page (HTML/CSS/vanilla JS, no framework, no backend). All
timetable data and zone boundaries are plain files served straight from the host,
so it loads quickly and keeps working offline once cached.

## Features

**Times & calendar**
- Prayer times for all **13 ACJU zones** (Fajr, Sunrise, Zuhr, Asr, Maghrib, Isha)
- The current prayer is highlighted, with a **live countdown** to the next one
- Correct roll-over to *tomorrow's Fajr* after Isha
- **Imsak / Sahr end** (2 min before Fajr) and **Iftar** (Maghrib) shown for fasting
- Live clock with **Gregorian + Hijri** dates
- **Weekly and full monthly** timetable views, switchable by month
- **High-rise apartment adjustment** table (time offsets by building height)

**Smart location (geofencing)**
- **"Locate Me"** uses real **point-in-polygon** detection against the actual ACJU
  zone boundaries — not a rough nearest-city guess — so it's accurate to the district
- **First-run prompt**: a gentle "Show prayer times for your area?" card on a first
  visit; tapping *Allow* auto-selects your zone
- **Remembers your zone** across visits (stored locally on your device) — no repeat prompts
- **Coastal sea-buffer**: locations a few km offshore still snap to the nearest zone
- **Out-of-bounds handling**: if you're outside Sri Lanka, it tells you and leaves the
  picker to you instead of guessing
- Manual **district dropdown** always available as an override

**Sharing**
- Copy a clean text timetable, use the native share sheet, or **generate an image**
  (beautifully laid-out day card or full-month card) to share on WhatsApp etc.
- Shareable links carry the selected zone (`?zone=07`)

**Quality of life**
- Fully **responsive** for mobile and desktop
- **Works offline** once loaded (files cached by the browser)
- Zone boundary file is **lazy-loaded** only when you use location — zero extra weight otherwise

## Upcoming

- 📱 **Android app**
- 🍏 **iOS app**

(Both planned as lightweight wrappers around the same free, non-commercial experience.)

---

## How the geofencing works

`data/zones.geojson` holds the 13 zone polygons, built once from official boundary
data and bundled with the site (~118 KB, ~35 KB gzipped). On "Locate Me" the app:

1. Reads your GPS coordinate (high-accuracy).
2. Tests which zone polygon contains the point (ray-casting, handles offshore islands).
3. If you're just off the coast, snaps to the nearest zone within ~8 km.
4. If you're nowhere near Sri Lanka, reports it and leaves the choice to you.

The polygons are derived from district boundaries, with Ampara split at DS-division
level so **Padiyathalawa** and **Dehiattakandiya** correctly fall in Zone 10. The full,
reproducible build pipeline lives in [`build/`](build/README.md). Validation against
known towns and a tens-of-thousands-point accuracy sweep confirm any boundary error
sits within a few tens of metres of a real zone line — far finer than GPS itself.

## Repository structure

```
/                    ← Website (static, deploys as-is)
├── index.html       ← Main page
├── assets/
│   ├── css/style.css
│   └── js/app.js    ← App logic incl. geofencing
├── data/
│   ├── zones.json       ← Zone → district list
│   ├── zones.geojson    ← 13 zone polygons (for Locate Me)
│   └── zoneNN-MM.json   ← Times per zone per month (13 × 12 files)
├── build/           ← One-time scripts to regenerate zones.geojson (see build/README.md)
├── LICENSE          ← CC BY-NC-SA 4.0
└── .github/workflows/pages.yml
```

## Updating prayer-time data

The `data/` timetables are independent of the site code, so they can be refreshed
yearly without touching anything else. Each `zoneNN-MM.json` looks like:

```json
{
  "zone": "01",
  "monthName": "April",
  "monthNum": 4,
  "year": 2026,
  "districts": ["Colombo", "Gampaha", "Kalutara"],
  "days": [
    { "date": "1-Apr", "fajr": "4:52 AM", "sunrise": "6:09 AM",
      "luhr": "12:16 PM", "asr": "3:21 PM", "magrib": "6:21 PM", "isha": "7:30 PM" }
  ],
  "apartmentDiff": { }
}
```

## Zone reference

| Zone | Districts |
|------|-----------|
| 01 | Colombo, Gampaha, Kalutara |
| 02 | Jaffna, Nallur |
| 03 | Mullaitivu (excl. Nallur), Kilinochchi, Vavuniya |
| 04 | Mannar, Puttalam |
| 05 | Anuradhapura, Polonnaruwa |
| 06 | Kurunegala |
| 07 | Kandy, Matale, Nuwara Eliya |
| 08 | Batticaloa, Ampara |
| 09 | Trincomalee |
| 10 | Badulla, Monaragala, Padiyatalawa, Dehiattakandiya |
| 11 | Ratnapura, Kegalle |
| 12 | Galle, Matara |
| 13 | Hambantota |

## Deploying (GitHub Pages)

1. Push to GitHub.
2. Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/pages.yml` auto-deploys on every push to `main`.

---

## Credits & attribution

- **Prayer timetables** — the official work of the **All Ceylon Jamiyyathul Ulama
  (ACJU)**, prepared from calculations by the late Al-'Alim M.I. Abdus Samad Makdoomi
  (Rahmatullahi Alayhi). Source: [acju.lk](https://www.acju.lk) · info@acju.lk
- **Administrative boundaries** — [geoBoundaries](https://www.geoboundaries.org)
  (gbOpen, licensed CC BY 4.0), used to derive `data/zones.geojson`.
- **Typeface** — [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (SIL Open Font License).
- **Build tooling** — [mapshaper](https://github.com/mbloch/mapshaper) and
  [Turf.js](https://turfjs.org) (boundary dissolve, simplification, validation);
  Node.js and Python for the build scripts.
- **Maintained by** [@msfrox](https://github.com/msfrox). Developed with assistance
  from Claude (Anthropic).

Thank you to everyone whose open data and open-source tools made this possible.

## Version history

- **v6.0** — *Geofenced location.* Replaced nearest-city guessing with real
  point-in-polygon zone detection; added first-run location prompt, remembered zone,
  coastal sea-buffer, and out-of-bounds handling. Reproducible boundary build added.
- **v5.x** — *Sharing.* Copy-as-text, native share, and generated day/month image cards.
- **v4.x** — *2026 redesign.* New theme, mobile layout, and UX refinements.
- **v3** — *Data-driven rebuild.* Zone + monthly JSON structure.
- **v0.1–v0.2** — Initial release.

## License

**Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International
(CC BY-NC-SA 4.0)** — see [LICENSE](LICENSE).

You are free to **use, study, share, and build on** this project for **any
non-commercial purpose**, provided you:

- **give credit**, and
- license your derivatives under the **same** terms (so they stay free too).

**Commercial / for-profit use is not permitted.** This keeps the project — and
anything built from it — free for the community, forever. It also means this is
"source-available / free for non-commercial," not OSI "open source" (that label
requires permitting commercial use).

> Note on data: prayer timetables remain © ACJU, and the boundary data is derived
> from geoBoundaries (CC BY 4.0). Please honour those sources' terms as well.
