# ACJU source PDFs

The timetables in `data/` are typed from ACJU's PDFs. The PDFs are **not in this repo** (it is public, and they
are ACJU's files); they are kept as reference copies in two places. This folder holds one `SHA256SUMS` per
edition (checksum, size, file name, and download URL where known), so any copy can be proven to be that edition:
`cd <copy> && grep -v '^#' <this folder>/<edition>/SHA256SUMS | awk '{print $1"  "$3}' | sha256sum -c`.

Editions are named by the date the PDFs were made (no edition or year is printed on them).

| Edition | RUBY2 | Sapphire | Notes |
|---|---|---|---|
| `acju-2026-09-15/` | `~/office/Brands/Gear.lk/Site/Prayer Time Website/PDF-2026-09-15/` | `/srv/bulk/reference/acju-prayer-times/2026-09-15/` | Fetched 2026-11-26 from https://www.acju.lk/prayer-times/. 156 PDFs (13 zones × 12 months), adds the `ASR-HANAFI` column. `data/` is built from this set and checked against it in [the recheck](../docs/general/acju-recheck.md). |
| `acju-2025/` | `~/office/Brands/Gear.lk/Site/Prayer Time Website/PDF/` | `/srv/bulk/reference/acju-prayer-times/2025/` | Earlier download, URL not recorded. 156 PDFs made 2025-05-28 to 2025-12-02, six columns. The first `data/` was typed from it. Misprints: the Kurunegala pages for Feb, Apr, Jun, Sep, Nov are labelled `Zone: 05`; zone 01 and 02 May are named `…-4-May.pdf`. |

Both copies of both editions were checked against these lists on 2026-11-26. No edition before 2025 is on
disk, and ACJU's page serves only the current one.
