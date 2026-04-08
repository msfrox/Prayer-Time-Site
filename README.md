# Sri Lanka Prayer Times — ACJU Official Timetable

Official Islamic prayer timetables for all districts of Sri Lanka, published by the **All Ceylon Jamiyyathul Ulama (ACJU)**.

## Features

- Prayer times for all 13 zones covering every district in Sri Lanka
- Current prayer highlighted with live countdown to next prayer
- Weekly and full monthly timetable views
- High-rise apartment adjustment table
- Imsak/Sahr end time auto-calculated (2 mins before Fajr)
- Fully responsive — works on mobile and desktop
- Works offline once loaded (data cached by browser)

## Repository Structure

```
/                   ← Website source (HTML/CSS/JS)
├── index.html      ← Main page
├── assets/
│   ├── css/style.css
│   └── js/app.js
├── data/           ← Prayer time data (JSON) — update independently
│   ├── zones.json
│   ├── zone01-01.json  (Zone 01, January)
│   ├── zone01-02.json  (Zone 01, February)
│   └── ...         (156 files total: 13 zones × 12 months)
└── .github/
    └── workflows/pages.yml
```

## Updating Prayer Time Data

The `data/` folder is kept separate from the website code so timetables can be updated yearly without touching the site.

Each JSON file follows this format:
```json
{
  "zone": "01",
  "monthName": "April",
  "monthNum": 4,
  "year": 2026,
  "districts": ["Colombo", "Gampaha", "Kalutara"],
  "days": [
    {
      "date": "1-Apr",
      "fajr": "4:52 AM",
      "sunrise": "6:09 AM",
      "luhr": "12:16 PM",
      "asr": "3:21 PM",
      "magrib": "6:21 PM",
      "isha": "7:30 PM"
    }
  ],
  "apartmentDiff": { ... }
}
```

## Zone Reference

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

## Data Source

All prayer times are sourced from the official **All Ceylon Jamiyyathul Ulama (ACJU)** timetables, prepared based on calculations by the late Al-'Alim M.I. Abdus Samad Makdoomi (Rahmatullahi Alayhi).

- Website: https://www.acju.lk
- Phone: +94 117 490 490
- Email: info@acju.lk

## Deploying to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages → Source: **GitHub Actions**
3. The workflow in `.github/workflows/pages.yml` will auto-deploy on every push to `main`

## License

Prayer time data © All Ceylon Jamiyyathul Ulama (ACJU). Website code is open source.
