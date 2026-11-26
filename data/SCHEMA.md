# Prayer-time data contract (v1)

Everything under `https://pray.sakina.lk/data/` is the one published source of ACJU prayer
times (decision 0001). Consumers copy these files, check them against `manifest.json`, and
keep working offline on what they have. The same files still answer at `https://pray.gear.lk/data/` until the last reader there has moved (then that address retires); new readers use pray.sakina.lk. Machine-readable shapes are in `data/schema/`.

Nothing here is calculated. The tables are typed from ACJU's PDF; they are solar-based and
repeat on the same dates every year. Times are 12-hour strings in Sri Lanka time
(`"5:00 AM"`). Prayer keys are always `fajr, sunrise, luhr, asr, magrib, isha`.

## `manifest.json` — start here

| Field | Meaning |
|---|---|
| `contract` | Shape version, `1`. Changes only if a field is renamed or removed (needs a new ADR). |
| `revision` | `YYYY-MM-DD.N`. Bumped whenever any table value changes. Show it to users. |
| `revised` | ISO date of that revision. |
| `source` | `name`, `url`, and `edition` (which ACJU PDF the tables came from). |
| `files` | Every other file in `data/`: `path` (relative to `data/`), `sha256`, `bytes`. Sorted by path. |

How a consumer syncs: fetch `manifest.json`; if `revision` is unchanged, stop. Otherwise
download only files whose `sha256` differs, verify every checksum, swap the whole set in one
step, keep the previous set.

## `zones.json`

`{ "zones": [ { "id": "01", "name": "Zone 01", "districts": ["Colombo", ...] }, ... ] }` —
the only zone list (13 zones). `id` is a two-digit string.

## `zoneNN-MM.json` — one zone, one month (156 files)

`NN` = zone id, `MM` = month number. Fields: `zone`, `zoneName`, `districts`, `monthName`,
`monthNum`, `year` (compilation metadata only), `days` (one per calendar day; each has `date`
like `"1-Jan"` plus the six prayer keys), `apartmentDiff` (`lowRise` / `highRise` minute
offsets for fajr, sunrise, magrib, isha in tall buildings), `note`, `attribution` (some
files), and `source`, `sourceUrl`, `sourcePhone`, `sourceEmail`.

## `zones.geojson`

A GeoJSON `FeatureCollection` of 13 zone boundaries (`Polygon` or `MultiPolygon`), each with
`properties.zone` = the zone id. Used to find which zone a GPS position falls in.

## Changing the data

See "Updating prayer-time data" in the README. Short form: edit, run `npm test`, run
`npm run manifest -- --revision <new> --revised <date>`, commit with the reason.
