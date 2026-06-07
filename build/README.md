# Zone boundary build

These scripts regenerate `../data/zones.geojson` — the 13 ACJU prayer-time zone
polygons used by the site's "Locate Me" geofencing. You only need this if you
want to rebuild or refine the zone boundaries; the finished file is already
committed, so the website runs without any build step.

## What it does

1. `build-zones.js` maps each Sri Lankan **district** (geoBoundaries ADM2) to its
   ACJU zone, then cuts **Ampara** using two DS divisions (geoBoundaries ADM3) —
   Padiyathalawa + Dehiattakandiya → Zone 10 — and dissolves everything into 13
   zone polygons (`zones_full.geojson`).
2. `mapshaper` simplifies that to a compact `data/zones.geojson` (~118 KB).
3. `validate.js` checks 28 known town coordinates resolve to the correct zone.
4. `accuracy-sweep.js` samples tens of thousands of random points and reports how
   far any simplification mismatch sits from a real border (target: well under 100 m).

## Reproduce

```bash
# 1. Install build tools (Node 18+)
npm install

# 2. Download source boundaries (geoBoundaries gbOpen, pinned commit)
curl -sL "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/LKA/ADM2/geoBoundaries-LKA-ADM2.geojson" -o adm2.geojson
curl -sL "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/LKA/ADM3/geoBoundaries-LKA-ADM3.geojson" -o adm3.geojson

# 3. Build → produces zones_full.geojson + zones_zoned.geojson
node build-zones.js

# 4. Simplify into the shipped file
npx mapshaper zones_full.geojson -simplify 12% keep-shapes weighted \
  -o format=geojson precision=0.0001 force ../data/zones.geojson

# 5. Verify
node validate.js ../data/zones.geojson
node accuracy-sweep.js ../data/zones.geojson 50000
```

## Future refinement: the Nallur cut

ACJU's "Nallur" in Zone 02 is the **Nallur Grama Niladhari division** inside
Poonakary DS, Kilinochchi district (near Pooneryn, B357) — not Nallur in Jaffna.
It currently falls in Zone 03. To move it to Zone 02 once its exact boundary is
confirmed, add it as an override (an ADM4 GN polygon assigned `zone: '02'`) before
the dissolve step in `build-zones.js`.

Source files (`adm2.geojson`, `adm3.geojson`), `node_modules/`, and intermediate
outputs are git-ignored — only the scripts are committed.
