# ACJU recheck, 26 Nov 2026 (raw report)

Full check of every `data/zoneNN-MM.json` against the timetables ACJU publishes now. The short version
is in [`docs/general/acju-recheck.md`](../general/acju-recheck.md).

## Source and edition

- Page: https://www.acju.lk/prayer-times/ (the QR on each PDF points here). It links exactly
  156 PDFs, 13 zones × 12 months, all under `wp-content/uploads/2026/10/`.
- Downloaded 26 Nov 2026; kept outside the repo (RUBY2 and Sapphire; `sources/README.md`), checksums in `sources/acju-2026-09-15/SHA256SUMS`. Shehan's `~/Downloads/ABDM/Documents/05.-Anuradhapura-4.pdf` is byte-identical to the
  site's copy.
- **Edition:** no year, edition or revision date is printed on any page. The PDF metadata says
  Adobe InDesign 15.0, created **15 Sep 2026** (all 156, 15:50–16:40 +0530); uploaded October 2026.
  This is what `manifest.json` `source.edition` now records.
- **Year:** none printed. February has 29 rows (the 29th included), as our files do; the tables
  are the repeating solar table, not tied to one year.
- **New in this edition:** an `ASR-HANAFI` column beside `ASR-SHAFIE`. Everything else on the page
  (zone header, districts, the Sahr note, the apartment offsets −1/−1/+1/+1 for 06–35 storeys and
  −2/−2/+2/+2 for 35–87, the Makdoomi attribution, contact details) matches what our files hold.
- File names: 10 zones are `NN.-Place-M.pdf`; zones 03, 09 and 12 are
  `NN.-…-Sri-lanka-Hanafi_MM_0MM.pdf`. Zone 01 June writes dates as `Jun-1` instead of `1-Jun`.

## Method: three independent reads, all must agree

The PDFs were treated as untrusted data: parsed by scripts kept outside the download folder, Python
run with `-I`, only poppler/pdfminer/tesseract reading the files.

1. **Parser A, poppler text layer.** `pdftotext -layout`, then a regex per row: date + 7 times.
   Zone from the file name, cross-checked against the `Zone: NN` printed on the page.
2. **Parser B, pdfminer.six (20260107), a separate PDF engine.** Rows rebuilt from character
   boxes (baseline buckets, tokens split on x gaps). Zone and month taken from the page text, not the file name.
3. **Pixel check, tesseract 5.5.4 OCR of the rendered page.** Each of the 33,306 time cells
   (4,758 rows × 7 columns) is cropped from a `pdftoppm` render and read on its own (one-line
   mode, whitelist `0-9 : A P M`), so a misread cannot shift a row. Cell positions come from word
   boxes; the values come only from pixels. A cell that misreads at 300 dpi is retried at 450, 220
   and 600 dpi; a cell that never matches is looked at by eye.

Results:

- A and B: 156/156 tables, 4,758/4,758 rows, all 7 columns **identical**. Every expected date
  present in order (Feb 1–29).
- OCR: **33,306/33,306 cells match** the text layer. 32,157 read right first time at 300 dpi; 1,149 needed
  a retry at another resolution (colon read as `1`/`7`, a dropped digit); none needed the by-eye fallback.
- Two pages also checked by eye against the render (zone 10 May, zone 05 November).
- ACJU's own values pass the repo's timetable rules (`tests/timetable.test.js`) and
  `asr < asrHanafi < magrib` on every day (Hanafi is 50–75 min after Shafi'i).

## Findings

28,548 Shafi'i cells compared (156 files × days × 6 fields). **623 differ, all in 6 files.**
The other 150 files match ACJU exactly, every value.

**Not a new edition of the times.** The Shafi'i times ACJU publishes now are the ones we have; the
new edition adds the Hanafi column and corrects one table. The differences have two causes:

1. **Zone 05 (Anuradhapura, Polonnaruwa), Feb, Apr, Jun, Sep, Nov: our files hold zone 06's
   (Kurunegala) table**, because ACJU's 2025 Kurunegala pages for those months were labelled `Zone: 05` (see below). The `days` arrays of `zone05-{02,04,06,09,11}.json` are identical to
   `zone06-{02,04,06,09,11}.json`, and each matches ACJU's zone 06 PDF with 0 differences. Present
   since the first commit (`aecc53b`, "V0.1 Initial Push"). 580 cells, ±1–3 min. Zone 05 Jan, Mar,
   May, Jul, Aug, Oct, Dec are correct.
   - This explains BUGS.md #1 (zone 05, 1 Apr asr `3:20`): the "jump" was the seam between real
     zone 05 March and the zone 06 copy in April. ACJU's 1 Apr asr for zone 05 is `3:22 PM`.
2. **Zone 10 (Badulla, Monaragala, Dehiattakandiya, Padiyatalawa), May: ACJU corrected it in 2026.**
   Ours matches ACJU's 2025 page exactly (see below); the 2026 page differs in 43 cells by 1 min (magrib 1 min early
   on all 31 days, 6-May by 2; asr 7, fajr 2, sunrise 2, isha 1). ACJU's version is the continuous one:
   ours went 30-Apr magrib `6:15` → 1-May `6:14`. The 2025 page was also laid out differently from the
   rest (`May-01`, `04:32 AM`), which suggests it was redone separately.

Δ spread over the 623: −3: 1, −2: 94, −1: 253, +1: 228, +2: 47 (minutes, ACJU − ours).

## The 2025 edition (found on disk afterwards)

Shehan's earlier download was at `~/office/Brands/Gear.lk/Site/Prayer Time Website/PDF/`: 156 PDFs, made
28 May – 2 Dec 2025 (most on 1 Jul 2025), six time columns, no Hanafi. Kept in place and copied to Sapphire
(`sources/README.md`), checksums in `sources/acju-2025/SHA256SUMS`; the original download URL was not recorded. One other copy of
its zone 01 January sits in `~/porch/from-basement-downloads/Documents/` (byte-identical);
`~/Projects/_archive/Junk/Sri Lanka Prayer Times.pdf` is a printout of the site's code, not a timetable.

Parsed with the same text-layer method (keyed by the zone in the file name and the month of the rows):

- **Our pre-fix data was typed from this edition:** 151 of 156 tables match it exactly, zone 10 May
  included. Two independent sources (the typed JSON and the parsed PDFs) agreeing to the cell rules out a
  parsing error. The 5 that differ are the zone 05 files below.
- **The cause of the zone 05 error:** the 2025 Kurunegala pages for Feb, Apr, Jun, Sep and Nov carry the
  right Kurunegala table and district line but a misprinted corner label `Zone: 05`. The tables were
  sorted by that label, so those five Kurunegala tables went into our zone 05 files. ACJU's real zone 05
  pages for those months match the 2026 edition exactly. The 2026 edition labels them correctly.
- **2025 → 2026, Shafi'i times:** 155 of 156 tables identical; only zone 10 May changed (the 43 cells above).
- Other 2025 slips, file names only: zone 01 and 02 May are named `…-4-May.pdf`.

## Differences

### Per zone-month and field (cells that differ)

| Zone | Month | fajr | sunrise | luhr | asr | magrib | isha | Total | Cause |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 02 | 10 | 23 | 4 | 9 | 27 | 29 | 102 | our file is a copy of zone 06's table |
| 05 | 04 | 27 | 25 | 6 | 30 | 18 | 25 | 131 | our file is a copy of zone 06's table |
| 05 | 06 | 30 | 30 | 5 | 9 | 30 | 30 | 134 | our file is a copy of zone 06's table |
| 05 | 09 | 18 | 14 | 4 | 26 | 5 | 6 | 73 | our file is a copy of zone 06's table |
| 05 | 11 | 26 | 28 | 10 | 16 | 30 | 30 | 140 | our file is a copy of zone 06's table |
| 10 | 05 | 2 | 2 | 0 | 7 | 31 | 1 | 43 | ACJU's 2025 values, corrected in 2026 (magrib 1 min later all month) |
| | | 113 | 122 | 29 | 97 | 141 | 121 | **623** | |

### Every difference (ours → ACJU, Δ minutes)

#### zone05-02.json (102 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 1-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 1-Feb | magrib | 6:18 PM | 6:16 PM | -2 |
| 1-Feb | isha | 7:29 PM | 7:28 PM | -1 |
| 2-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 2-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 2-Feb | luhr | 12:24 PM | 12:23 PM | -1 |
| 2-Feb | magrib | 6:18 PM | 6:17 PM | -1 |
| 2-Feb | isha | 7:29 PM | 7:28 PM | -1 |
| 3-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 3-Feb | magrib | 6:18 PM | 6:17 PM | -1 |
| 3-Feb | isha | 7:30 PM | 7:28 PM | -2 |
| 4-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 4-Feb | magrib | 6:18 PM | 6:17 PM | -1 |
| 4-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 5-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 5-Feb | asr | 3:46 PM | 3:45 PM | -1 |
| 5-Feb | magrib | 6:19 PM | 6:17 PM | -2 |
| 5-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 6-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 6-Feb | asr | 3:46 PM | 3:45 PM | -1 |
| 6-Feb | magrib | 6:19 PM | 6:18 PM | -1 |
| 6-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 7-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 7-Feb | asr | 3:46 PM | 3:45 PM | -1 |
| 7-Feb | magrib | 6:19 PM | 6:18 PM | -1 |
| 7-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 8-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 8-Feb | asr | 3:46 PM | 3:45 PM | -1 |
| 8-Feb | magrib | 6:19 PM | 6:18 PM | -1 |
| 8-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 9-Feb | sunrise | 6:28 AM | 6:29 AM | +1 |
| 9-Feb | asr | 3:46 PM | 3:45 PM | -1 |
| 9-Feb | magrib | 6:20 PM | 6:18 PM | -2 |
| 9-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 10-Feb | magrib | 6:20 PM | 6:19 PM | -1 |
| 10-Feb | isha | 7:30 PM | 7:29 PM | -1 |
| 11-Feb | sunrise | 6:27 AM | 6:28 AM | +1 |
| 11-Feb | magrib | 6:20 PM | 6:19 PM | -1 |
| 11-Feb | isha | 7:31 PM | 7:29 PM | -2 |
| 12-Feb | sunrise | 6:27 AM | 6:28 AM | +1 |
| 12-Feb | magrib | 6:20 PM | 6:19 PM | -1 |
| 12-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 13-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 13-Feb | sunrise | 6:27 AM | 6:28 AM | +1 |
| 13-Feb | magrib | 6:20 PM | 6:19 PM | -1 |
| 13-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 14-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 14-Feb | sunrise | 6:27 AM | 6:28 AM | +1 |
| 14-Feb | magrib | 6:20 PM | 6:19 PM | -1 |
| 14-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 15-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 15-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 15-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 16-Feb | fajr | 5:08 AM | 5:09 AM | +1 |
| 16-Feb | sunrise | 6:26 AM | 6:27 AM | +1 |
| 16-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 16-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 17-Feb | sunrise | 6:26 AM | 6:27 AM | +1 |
| 17-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 17-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 18-Feb | sunrise | 6:26 AM | 6:27 AM | +1 |
| 18-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 18-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 19-Feb | asr | 3:45 PM | 3:44 PM | -1 |
| 19-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 19-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 20-Feb | fajr | 5:07 AM | 5:08 AM | +1 |
| 20-Feb | sunrise | 6:25 AM | 6:26 AM | +1 |
| 20-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 20-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 21-Feb | fajr | 5:07 AM | 5:08 AM | +1 |
| 21-Feb | sunrise | 6:25 AM | 6:26 AM | +1 |
| 21-Feb | luhr | 12:24 PM | 12:23 PM | -1 |
| 21-Feb | magrib | 6:21 PM | 6:20 PM | -1 |
| 21-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 22-Feb | luhr | 12:24 PM | 12:23 PM | -1 |
| 22-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 23-Feb | sunrise | 6:24 AM | 6:25 AM | +1 |
| 23-Feb | asr | 3:43 PM | 3:44 PM | +1 |
| 23-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 24-Feb | sunrise | 6:24 AM | 6:25 AM | +1 |
| 24-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 24-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 25-Feb | fajr | 5:06 AM | 5:07 AM | +1 |
| 25-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 25-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 26-Feb | sunrise | 6:23 AM | 6:24 AM | +1 |
| 26-Feb | asr | 3:42 PM | 3:43 PM | +1 |
| 26-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 26-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 27-Feb | sunrise | 6:23 AM | 6:24 AM | +1 |
| 27-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 27-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 28-Feb | fajr | 5:05 AM | 5:06 AM | +1 |
| 28-Feb | luhr | 12:23 PM | 12:22 PM | -1 |
| 28-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 28-Feb | isha | 7:31 PM | 7:30 PM | -1 |
| 29-Feb | sunrise | 6:22 AM | 6:23 AM | +1 |
| 29-Feb | asr | 3:41 PM | 3:42 PM | +1 |
| 29-Feb | magrib | 6:22 PM | 6:21 PM | -1 |
| 29-Feb | isha | 7:31 PM | 7:30 PM | -1 |

#### zone05-04.json (131 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-Apr | fajr | 4:50 AM | 4:49 AM | -1 |
| 1-Apr | asr | 3:20 PM | 3:22 PM | +2 |
| 1-Apr | magrib | 6:19 PM | 6:20 PM | +1 |
| 1-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 2-Apr | sunrise | 6:07 AM | 6:06 AM | -1 |
| 2-Apr | asr | 3:19 PM | 3:21 PM | +2 |
| 2-Apr | magrib | 6:19 PM | 6:20 PM | +1 |
| 2-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 3-Apr | fajr | 4:49 AM | 4:48 AM | -1 |
| 3-Apr | asr | 3:19 PM | 3:20 PM | +1 |
| 3-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 4-Apr | sunrise | 6:06 AM | 6:05 AM | -1 |
| 4-Apr | asr | 3:18 PM | 3:19 PM | +1 |
| 4-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 5-Apr | fajr | 4:48 AM | 4:47 AM | -1 |
| 5-Apr | sunrise | 6:05 AM | 6:04 AM | -1 |
| 5-Apr | luhr | 12:13 PM | 12:12 PM | -1 |
| 5-Apr | asr | 3:17 PM | 3:18 PM | +1 |
| 5-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 6-Apr | fajr | 4:47 AM | 4:46 AM | -1 |
| 6-Apr | sunrise | 6:05 AM | 6:04 AM | -1 |
| 6-Apr | asr | 3:16 PM | 3:17 PM | +1 |
| 6-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 7-Apr | fajr | 4:47 AM | 4:46 AM | -1 |
| 7-Apr | sunrise | 6:04 AM | 6:03 AM | -1 |
| 7-Apr | asr | 3:15 PM | 3:17 PM | +2 |
| 7-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 8-Apr | fajr | 4:46 AM | 4:45 AM | -1 |
| 8-Apr | sunrise | 6:04 AM | 6:03 AM | -1 |
| 8-Apr | asr | 3:14 PM | 3:16 PM | +2 |
| 8-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 9-Apr | asr | 3:13 PM | 3:15 PM | +2 |
| 9-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 10-Apr | fajr | 4:45 AM | 4:44 AM | -1 |
| 10-Apr | sunrise | 6:03 AM | 6:02 AM | -1 |
| 10-Apr | asr | 3:13 PM | 3:14 PM | +1 |
| 10-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 11-Apr | fajr | 4:44 AM | 4:43 AM | -1 |
| 11-Apr | sunrise | 6:02 AM | 6:01 AM | -1 |
| 11-Apr | asr | 3:14 PM | 3:13 PM | -1 |
| 11-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 12-Apr | fajr | 4:44 AM | 4:43 AM | -1 |
| 12-Apr | sunrise | 6:02 AM | 6:01 AM | -1 |
| 12-Apr | luhr | 12:11 PM | 12:10 PM | -1 |
| 12-Apr | asr | 3:15 PM | 3:13 PM | -2 |
| 12-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 13-Apr | fajr | 4:43 AM | 4:42 AM | -1 |
| 13-Apr | sunrise | 6:01 AM | 6:00 AM | -1 |
| 13-Apr | asr | 3:15 PM | 3:14 PM | -1 |
| 13-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 14-Apr | fajr | 4:43 AM | 4:42 AM | -1 |
| 14-Apr | sunrise | 6:01 AM | 6:00 AM | -1 |
| 14-Apr | asr | 3:16 PM | 3:14 PM | -2 |
| 14-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 15-Apr | fajr | 4:42 AM | 4:41 AM | -1 |
| 15-Apr | asr | 3:16 PM | 3:15 PM | -1 |
| 15-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 15-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 16-Apr | fajr | 4:42 AM | 4:40 AM | -2 |
| 16-Apr | sunrise | 6:00 AM | 5:59 AM | -1 |
| 16-Apr | luhr | 12:10 PM | 12:09 PM | -1 |
| 16-Apr | asr | 3:17 PM | 3:15 PM | -2 |
| 16-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 16-Apr | isha | 7:28 PM | 7:29 PM | +1 |
| 17-Apr | fajr | 4:41 AM | 4:40 AM | -1 |
| 17-Apr | sunrise | 6:00 AM | 5:59 AM | -1 |
| 17-Apr | asr | 3:17 PM | 3:16 PM | -1 |
| 17-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 18-Apr | fajr | 4:41 AM | 4:39 AM | -2 |
| 18-Apr | sunrise | 5:59 AM | 5:58 AM | -1 |
| 18-Apr | asr | 3:18 PM | 3:16 PM | -2 |
| 18-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 19-Apr | fajr | 4:40 AM | 4:39 AM | -1 |
| 19-Apr | sunrise | 5:59 AM | 5:58 AM | -1 |
| 19-Apr | asr | 3:18 PM | 3:17 PM | -1 |
| 19-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 20-Apr | fajr | 4:40 AM | 4:38 AM | -2 |
| 20-Apr | sunrise | 5:58 AM | 5:57 AM | -1 |
| 20-Apr | asr | 3:19 PM | 3:17 PM | -2 |
| 20-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 20-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 21-Apr | fajr | 4:39 AM | 4:38 AM | -1 |
| 21-Apr | sunrise | 5:58 AM | 5:57 AM | -1 |
| 21-Apr | luhr | 12:09 PM | 12:08 PM | -1 |
| 21-Apr | asr | 3:19 PM | 3:18 PM | -1 |
| 21-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 21-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 22-Apr | fajr | 4:38 AM | 4:37 AM | -1 |
| 22-Apr | asr | 3:19 PM | 3:18 PM | -1 |
| 22-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 22-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 23-Apr | fajr | 4:38 AM | 4:37 AM | -1 |
| 23-Apr | sunrise | 5:57 AM | 5:56 AM | -1 |
| 23-Apr | asr | 3:20 PM | 3:19 PM | -1 |
| 23-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 23-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 24-Apr | fajr | 4:38 AM | 4:36 AM | -2 |
| 24-Apr | sunrise | 5:57 AM | 5:56 AM | -1 |
| 24-Apr | asr | 3:20 PM | 3:19 PM | -1 |
| 24-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 24-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 25-Apr | fajr | 4:37 AM | 4:36 AM | -1 |
| 25-Apr | sunrise | 5:56 AM | 5:55 AM | -1 |
| 25-Apr | asr | 3:21 PM | 3:19 PM | -2 |
| 25-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 25-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 26-Apr | fajr | 4:37 AM | 4:35 AM | -2 |
| 26-Apr | sunrise | 5:56 AM | 5:55 AM | -1 |
| 26-Apr | luhr | 12:08 PM | 12:07 PM | -1 |
| 26-Apr | asr | 3:21 PM | 3:20 PM | -1 |
| 26-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 26-Apr | isha | 7:29 PM | 7:30 PM | +1 |
| 27-Apr | fajr | 4:36 AM | 4:35 AM | -1 |
| 27-Apr | sunrise | 5:56 AM | 5:55 AM | -1 |
| 27-Apr | luhr | 12:08 PM | 12:07 PM | -1 |
| 27-Apr | asr | 3:21 PM | 3:20 PM | -1 |
| 27-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 28-Apr | fajr | 4:36 AM | 4:34 AM | -2 |
| 28-Apr | sunrise | 5:55 AM | 5:54 AM | -1 |
| 28-Apr | asr | 3:22 PM | 3:21 PM | -1 |
| 28-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 29-Apr | fajr | 4:35 AM | 4:34 AM | -1 |
| 29-Apr | sunrise | 5:55 AM | 5:54 AM | -1 |
| 29-Apr | asr | 3:22 PM | 3:21 PM | -1 |
| 29-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 29-Apr | isha | 7:30 PM | 7:31 PM | +1 |
| 30-Apr | fajr | 4:35 AM | 4:33 AM | -2 |
| 30-Apr | sunrise | 5:55 AM | 5:53 AM | -2 |
| 30-Apr | asr | 3:23 PM | 3:21 PM | -2 |
| 30-Apr | magrib | 6:18 PM | 6:19 PM | +1 |
| 30-Apr | isha | 7:30 PM | 7:31 PM | +1 |

#### zone05-06.json (134 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 1-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 1-Jun | luhr | 12:08 PM | 12:07 PM | -1 |
| 1-Jun | magrib | 6:24 PM | 6:25 PM | +1 |
| 1-Jun | isha | 7:39 PM | 7:40 PM | +1 |
| 2-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 2-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 2-Jun | asr | 3:34 PM | 3:33 PM | -1 |
| 2-Jun | magrib | 6:24 PM | 6:25 PM | +1 |
| 2-Jun | isha | 7:39 PM | 7:41 PM | +2 |
| 3-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 3-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 3-Jun | magrib | 6:24 PM | 6:25 PM | +1 |
| 3-Jun | isha | 7:39 PM | 7:41 PM | +2 |
| 4-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 4-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 4-Jun | magrib | 6:24 PM | 6:26 PM | +2 |
| 4-Jun | isha | 7:40 PM | 7:41 PM | +1 |
| 5-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 5-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 5-Jun | asr | 3:35 PM | 3:34 PM | -1 |
| 5-Jun | magrib | 6:25 PM | 6:26 PM | +1 |
| 5-Jun | isha | 7:40 PM | 7:42 PM | +2 |
| 6-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 6-Jun | sunrise | 5:51 AM | 5:49 AM | -2 |
| 6-Jun | luhr | 12:09 PM | 12:08 PM | -1 |
| 6-Jun | magrib | 6:25 PM | 6:26 PM | +1 |
| 6-Jun | isha | 7:40 PM | 7:42 PM | +2 |
| 7-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 7-Jun | sunrise | 5:51 AM | 5:50 AM | -1 |
| 7-Jun | magrib | 6:25 PM | 6:27 PM | +2 |
| 7-Jun | isha | 7:41 PM | 7:42 PM | +1 |
| 8-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 8-Jun | sunrise | 5:51 AM | 5:50 AM | -1 |
| 8-Jun | asr | 3:36 PM | 3:35 PM | -1 |
| 8-Jun | magrib | 6:25 PM | 6:27 PM | +2 |
| 8-Jun | isha | 7:41 PM | 7:43 PM | +2 |
| 9-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 9-Jun | sunrise | 5:52 AM | 5:50 AM | -2 |
| 9-Jun | magrib | 6:26 PM | 6:27 PM | +1 |
| 9-Jun | isha | 7:41 PM | 7:43 PM | +2 |
| 10-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 10-Jun | sunrise | 5:52 AM | 5:50 AM | -2 |
| 10-Jun | magrib | 6:26 PM | 6:27 PM | +1 |
| 10-Jun | isha | 7:42 PM | 7:43 PM | +1 |
| 11-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 11-Jun | sunrise | 5:52 AM | 5:50 AM | -2 |
| 11-Jun | magrib | 6:26 PM | 6:28 PM | +2 |
| 11-Jun | isha | 7:42 PM | 7:44 PM | +2 |
| 12-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 12-Jun | sunrise | 5:52 AM | 5:50 AM | -2 |
| 12-Jun | asr | 3:37 PM | 3:36 PM | -1 |
| 12-Jun | magrib | 6:26 PM | 6:28 PM | +2 |
| 12-Jun | isha | 7:42 PM | 7:44 PM | +2 |
| 13-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 13-Jun | sunrise | 5:52 AM | 5:50 AM | -2 |
| 13-Jun | magrib | 6:27 PM | 6:28 PM | +1 |
| 13-Jun | isha | 7:42 PM | 7:44 PM | +2 |
| 14-Jun | fajr | 4:27 AM | 4:25 AM | -2 |
| 14-Jun | sunrise | 5:52 AM | 5:51 AM | -1 |
| 14-Jun | magrib | 6:27 PM | 6:28 PM | +1 |
| 14-Jun | isha | 7:43 PM | 7:44 PM | +1 |
| 15-Jun | fajr | 4:28 AM | 4:25 AM | -3 |
| 15-Jun | sunrise | 5:53 AM | 5:51 AM | -2 |
| 15-Jun | asr | 3:38 PM | 3:37 PM | -1 |
| 15-Jun | magrib | 6:27 PM | 6:29 PM | +2 |
| 15-Jun | isha | 7:43 PM | 7:45 PM | +2 |
| 16-Jun | fajr | 4:28 AM | 4:26 AM | -2 |
| 16-Jun | sunrise | 5:53 AM | 5:51 AM | -2 |
| 16-Jun | luhr | 12:11 PM | 12:10 PM | -1 |
| 16-Jun | magrib | 6:27 PM | 6:29 PM | +2 |
| 16-Jun | isha | 7:43 PM | 7:45 PM | +2 |
| 17-Jun | fajr | 4:28 AM | 4:26 AM | -2 |
| 17-Jun | sunrise | 5:53 AM | 5:51 AM | -2 |
| 17-Jun | magrib | 6:28 PM | 6:29 PM | +1 |
| 17-Jun | isha | 7:44 PM | 7:45 PM | +1 |
| 18-Jun | fajr | 4:28 AM | 4:26 AM | -2 |
| 18-Jun | sunrise | 5:53 AM | 5:51 AM | -2 |
| 18-Jun | magrib | 6:28 PM | 6:29 PM | +1 |
| 18-Jun | isha | 7:44 PM | 7:46 PM | +2 |
| 19-Jun | fajr | 4:28 AM | 4:26 AM | -2 |
| 19-Jun | sunrise | 5:53 AM | 5:52 AM | -1 |
| 19-Jun | asr | 3:39 PM | 3:38 PM | -1 |
| 19-Jun | magrib | 6:28 PM | 6:29 PM | +1 |
| 19-Jun | isha | 7:44 PM | 7:46 PM | +2 |
| 20-Jun | fajr | 4:28 AM | 4:26 AM | -2 |
| 20-Jun | sunrise | 5:54 AM | 5:52 AM | -2 |
| 20-Jun | asr | 3:39 PM | 3:38 PM | -1 |
| 20-Jun | magrib | 6:28 PM | 6:30 PM | +2 |
| 20-Jun | isha | 7:44 PM | 7:46 PM | +2 |
| 21-Jun | fajr | 4:29 AM | 4:27 AM | -2 |
| 21-Jun | sunrise | 5:54 AM | 5:52 AM | -2 |
| 21-Jun | luhr | 12:12 PM | 12:11 PM | -1 |
| 21-Jun | magrib | 6:29 PM | 6:30 PM | +1 |
| 21-Jun | isha | 7:45 PM | 7:46 PM | +1 |
| 22-Jun | fajr | 4:29 AM | 4:27 AM | -2 |
| 22-Jun | sunrise | 5:54 AM | 5:52 AM | -2 |
| 22-Jun | magrib | 6:29 PM | 6:30 PM | +1 |
| 22-Jun | isha | 7:45 PM | 7:46 PM | +1 |
| 23-Jun | fajr | 4:29 AM | 4:27 AM | -2 |
| 23-Jun | sunrise | 5:54 AM | 5:52 AM | -2 |
| 23-Jun | magrib | 6:29 PM | 6:30 PM | +1 |
| 23-Jun | isha | 7:45 PM | 7:47 PM | +2 |
| 24-Jun | fajr | 4:29 AM | 4:27 AM | -2 |
| 24-Jun | sunrise | 5:54 AM | 5:53 AM | -1 |
| 24-Jun | asr | 3:40 PM | 3:39 PM | -1 |
| 24-Jun | magrib | 6:29 PM | 6:31 PM | +2 |
| 24-Jun | isha | 7:45 PM | 7:47 PM | +2 |
| 25-Jun | fajr | 4:29 AM | 4:27 AM | -2 |
| 25-Jun | sunrise | 5:55 AM | 5:53 AM | -2 |
| 25-Jun | magrib | 6:29 PM | 6:31 PM | +2 |
| 25-Jun | isha | 7:45 PM | 7:47 PM | +2 |
| 26-Jun | fajr | 4:30 AM | 4:28 AM | -2 |
| 26-Jun | sunrise | 5:55 AM | 5:53 AM | -2 |
| 26-Jun | magrib | 6:30 PM | 6:31 PM | +1 |
| 26-Jun | isha | 7:46 PM | 7:47 PM | +1 |
| 27-Jun | fajr | 4:30 AM | 4:28 AM | -2 |
| 27-Jun | sunrise | 5:55 AM | 5:53 AM | -2 |
| 27-Jun | magrib | 6:30 PM | 6:31 PM | +1 |
| 27-Jun | isha | 7:46 PM | 7:47 PM | +1 |
| 28-Jun | fajr | 4:30 AM | 4:28 AM | -2 |
| 28-Jun | sunrise | 5:55 AM | 5:54 AM | -1 |
| 28-Jun | magrib | 6:30 PM | 6:31 PM | +1 |
| 28-Jun | isha | 7:46 PM | 7:47 PM | +1 |
| 29-Jun | fajr | 4:30 AM | 4:28 AM | -2 |
| 29-Jun | sunrise | 5:56 AM | 5:54 AM | -2 |
| 29-Jun | magrib | 6:30 PM | 6:31 PM | +1 |
| 29-Jun | isha | 7:46 PM | 7:48 PM | +2 |
| 30-Jun | fajr | 4:31 AM | 4:29 AM | -2 |
| 30-Jun | sunrise | 5:56 AM | 5:54 AM | -2 |
| 30-Jun | luhr | 12:14 PM | 12:13 PM | -1 |
| 30-Jun | asr | 3:41 PM | 3:40 PM | -1 |
| 30-Jun | magrib | 6:30 PM | 6:32 PM | +2 |
| 30-Jun | isha | 7:46 PM | 7:48 PM | +2 |

#### zone05-09.json (73 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 1-Sep | sunrise | 6:01 AM | 6:00 AM | -1 |
| 1-Sep | asr | 3:14 PM | 3:12 PM | -2 |
| 1-Sep | isha | 7:27 PM | 7:28 PM | +1 |
| 2-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 2-Sep | sunrise | 6:01 AM | 6:00 AM | -1 |
| 2-Sep | asr | 3:13 PM | 3:12 PM | -1 |
| 2-Sep | magrib | 6:17 PM | 6:18 PM | +1 |
| 3-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 3-Sep | sunrise | 6:01 AM | 6:00 AM | -1 |
| 3-Sep | isha | 7:26 PM | 7:27 PM | +1 |
| 4-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 4-Sep | sunrise | 6:01 AM | 6:00 AM | -1 |
| 4-Sep | asr | 3:10 PM | 3:12 PM | +2 |
| 4-Sep | magrib | 6:16 PM | 6:17 PM | +1 |
| 5-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 5-Sep | luhr | 12:09 PM | 12:08 PM | -1 |
| 5-Sep | asr | 3:11 PM | 3:12 PM | +1 |
| 5-Sep | isha | 7:25 PM | 7:26 PM | +1 |
| 6-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 6-Sep | asr | 3:11 PM | 3:13 PM | +2 |
| 6-Sep | isha | 7:24 PM | 7:25 PM | +1 |
| 7-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 7-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 7-Sep | asr | 3:11 PM | 3:13 PM | +2 |
| 8-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 8-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 8-Sep | asr | 3:11 PM | 3:13 PM | +2 |
| 9-Sep | fajr | 4:43 AM | 4:42 AM | -1 |
| 9-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 9-Sep | asr | 3:12 PM | 3:13 PM | +1 |
| 10-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 10-Sep | asr | 3:12 PM | 3:14 PM | +2 |
| 11-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 11-Sep | asr | 3:12 PM | 3:14 PM | +2 |
| 11-Sep | isha | 7:21 PM | 7:22 PM | +1 |
| 12-Sep | sunrise | 6:00 AM | 5:59 AM | -1 |
| 12-Sep | asr | 3:13 PM | 3:14 PM | +1 |
| 13-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 13-Sep | asr | 3:13 PM | 3:14 PM | +1 |
| 14-Sep | asr | 3:13 PM | 3:14 PM | +1 |
| 15-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 15-Sep | asr | 3:13 PM | 3:14 PM | +1 |
| 16-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 16-Sep | sunrise | 5:59 AM | 5:58 AM | -1 |
| 16-Sep | luhr | 12:05 PM | 12:04 PM | -1 |
| 16-Sep | asr | 3:13 PM | 3:15 PM | +2 |
| 16-Sep | magrib | 6:09 PM | 6:10 PM | +1 |
| 16-Sep | isha | 7:18 PM | 7:19 PM | +1 |
| 17-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 17-Sep | sunrise | 5:59 AM | 5:58 AM | -1 |
| 17-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 18-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 18-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 18-Sep | magrib | 6:09 PM | 6:08 PM | -1 |
| 19-Sep | fajr | 4:42 AM | 4:41 AM | -1 |
| 19-Sep | luhr | 12:04 PM | 12:03 PM | -1 |
| 19-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 20-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 21-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 22-Sep | sunrise | 5:58 AM | 5:57 AM | -1 |
| 22-Sep | asr | 3:14 PM | 3:15 PM | +1 |
| 23-Sep | asr | 3:15 PM | 3:16 PM | +1 |
| 25-Sep | sunrise | 5:58 AM | 5:57 AM | -1 |
| 25-Sep | luhr | 12:02 PM | 12:01 PM | -1 |
| 25-Sep | asr | 3:15 PM | 3:16 PM | +1 |
| 26-Sep | fajr | 4:41 AM | 4:40 AM | -1 |
| 27-Sep | fajr | 4:41 AM | 4:40 AM | -1 |
| 27-Sep | asr | 3:15 PM | 3:16 PM | +1 |
| 28-Sep | fajr | 4:41 AM | 4:40 AM | -1 |
| 28-Sep | asr | 3:15 PM | 3:16 PM | +1 |
| 29-Sep | asr | 3:15 PM | 3:16 PM | +1 |
| 30-Sep | magrib | 6:02 PM | 6:01 PM | -1 |

#### zone05-11.json (140 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 1-Nov | luhr | 11:54 AM | 11:53 AM | -1 |
| 1-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 1-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 2-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 2-Nov | asr | 3:15 PM | 3:14 PM | -1 |
| 2-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 2-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 3-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 3-Nov | sunrise | 5:57 AM | 5:58 AM | +1 |
| 3-Nov | asr | 3:15 PM | 3:14 PM | -1 |
| 3-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 3-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 4-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 4-Nov | sunrise | 5:57 AM | 5:58 AM | +1 |
| 4-Nov | luhr | 11:54 AM | 11:53 AM | -1 |
| 4-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 4-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 5-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 5-Nov | sunrise | 5:57 AM | 5:58 AM | +1 |
| 5-Nov | luhr | 11:54 AM | 11:53 AM | -1 |
| 5-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 5-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 6-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 6-Nov | sunrise | 5:58 AM | 5:59 AM | +1 |
| 6-Nov | luhr | 11:54 AM | 11:53 AM | -1 |
| 6-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 6-Nov | isha | 7:00 PM | 6:58 PM | -2 |
| 7-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 7-Nov | sunrise | 5:58 AM | 5:59 AM | +1 |
| 7-Nov | luhr | 11:54 AM | 11:53 AM | -1 |
| 7-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 7-Nov | isha | 7:00 PM | 6:58 PM | -2 |
| 8-Nov | fajr | 4:38 AM | 4:39 AM | +1 |
| 8-Nov | sunrise | 5:58 AM | 5:59 AM | +1 |
| 8-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 8-Nov | isha | 7:00 PM | 6:58 PM | -2 |
| 9-Nov | sunrise | 5:58 AM | 5:59 AM | +1 |
| 9-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 9-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 10-Nov | sunrise | 5:58 AM | 5:59 AM | +1 |
| 10-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 10-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 11-Nov | fajr | 4:39 AM | 4:40 AM | +1 |
| 11-Nov | sunrise | 5:59 AM | 6:00 AM | +1 |
| 11-Nov | asr | 3:16 PM | 3:15 PM | -1 |
| 11-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 11-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 12-Nov | fajr | 4:39 AM | 4:40 AM | +1 |
| 12-Nov | sunrise | 5:59 AM | 6:00 AM | +1 |
| 12-Nov | asr | 3:16 PM | 3:15 PM | -1 |
| 12-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 12-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 13-Nov | fajr | 4:39 AM | 4:40 AM | +1 |
| 13-Nov | sunrise | 5:59 AM | 6:00 AM | +1 |
| 13-Nov | asr | 3:16 PM | 3:15 PM | -1 |
| 13-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 13-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 14-Nov | fajr | 4:39 AM | 4:40 AM | +1 |
| 14-Nov | sunrise | 6:00 AM | 6:01 AM | +1 |
| 14-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 14-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 15-Nov | sunrise | 6:00 AM | 6:01 AM | +1 |
| 15-Nov | luhr | 11:55 AM | 11:54 AM | -1 |
| 15-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 15-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 16-Nov | fajr | 4:40 AM | 4:41 AM | +1 |
| 16-Nov | sunrise | 6:00 AM | 6:01 AM | +1 |
| 16-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 16-Nov | isha | 7:00 PM | 6:59 PM | -1 |
| 17-Nov | fajr | 4:40 AM | 4:41 AM | +1 |
| 17-Nov | sunrise | 6:00 AM | 6:02 AM | +2 |
| 17-Nov | asr | 3:17 PM | 3:16 PM | -1 |
| 17-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 17-Nov | isha | 7:01 PM | 6:59 PM | -2 |
| 18-Nov | fajr | 4:40 AM | 4:41 AM | +1 |
| 18-Nov | sunrise | 6:01 AM | 6:02 AM | +1 |
| 18-Nov | asr | 3:17 PM | 3:16 PM | -1 |
| 18-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 18-Nov | isha | 7:01 PM | 6:59 PM | -2 |
| 19-Nov | sunrise | 6:01 AM | 6:02 AM | +1 |
| 19-Nov | asr | 3:17 PM | 3:16 PM | -1 |
| 19-Nov | magrib | 5:48 PM | 5:47 PM | -1 |
| 19-Nov | isha | 7:01 PM | 7:00 PM | -1 |
| 20-Nov | fajr | 4:41 AM | 4:42 AM | +1 |
| 20-Nov | sunrise | 6:02 AM | 6:03 AM | +1 |
| 20-Nov | luhr | 11:56 AM | 11:55 AM | -1 |
| 20-Nov | asr | 3:17 PM | 3:16 PM | -1 |
| 20-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 20-Nov | isha | 7:01 PM | 7:00 PM | -1 |
| 21-Nov | fajr | 4:41 AM | 4:42 AM | +1 |
| 21-Nov | sunrise | 6:02 AM | 6:03 AM | +1 |
| 21-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 21-Nov | isha | 7:01 PM | 7:00 PM | -1 |
| 22-Nov | fajr | 4:41 AM | 4:42 AM | +1 |
| 22-Nov | sunrise | 6:02 AM | 6:04 AM | +2 |
| 22-Nov | asr | 3:18 PM | 3:17 PM | -1 |
| 22-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 22-Nov | isha | 7:02 PM | 7:00 PM | -2 |
| 23-Nov | fajr | 4:42 AM | 4:43 AM | +1 |
| 23-Nov | sunrise | 6:03 AM | 6:04 AM | +1 |
| 23-Nov | asr | 3:18 PM | 3:17 PM | -1 |
| 23-Nov | magrib | 5:49 PM | 5:47 PM | -2 |
| 23-Nov | isha | 7:02 PM | 7:00 PM | -2 |
| 24-Nov | fajr | 4:42 AM | 4:43 AM | +1 |
| 24-Nov | sunrise | 6:03 AM | 6:04 AM | +1 |
| 24-Nov | luhr | 11:57 AM | 11:56 AM | -1 |
| 24-Nov | asr | 3:18 PM | 3:17 PM | -1 |
| 24-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 24-Nov | isha | 7:02 PM | 7:01 PM | -1 |
| 25-Nov | fajr | 4:42 AM | 4:43 AM | +1 |
| 25-Nov | sunrise | 6:04 AM | 6:05 AM | +1 |
| 25-Nov | magrib | 5:49 PM | 5:48 PM | -1 |
| 25-Nov | isha | 7:02 PM | 7:01 PM | -1 |
| 26-Nov | fajr | 4:42 AM | 4:43 AM | +1 |
| 26-Nov | sunrise | 6:04 AM | 6:05 AM | +1 |
| 26-Nov | asr | 3:19 PM | 3:18 PM | -1 |
| 26-Nov | magrib | 5:50 PM | 5:48 PM | -2 |
| 26-Nov | isha | 7:02 PM | 7:01 PM | -1 |
| 27-Nov | fajr | 4:43 AM | 4:44 AM | +1 |
| 27-Nov | sunrise | 6:04 AM | 6:05 AM | +1 |
| 27-Nov | luhr | 11:58 AM | 11:57 AM | -1 |
| 27-Nov | asr | 3:19 PM | 3:18 PM | -1 |
| 27-Nov | magrib | 5:50 PM | 5:48 PM | -2 |
| 27-Nov | isha | 7:03 PM | 7:02 PM | -1 |
| 28-Nov | fajr | 4:43 AM | 4:44 AM | +1 |
| 28-Nov | sunrise | 6:05 AM | 6:06 AM | +1 |
| 28-Nov | magrib | 5:50 PM | 5:48 PM | -2 |
| 28-Nov | isha | 7:03 PM | 7:02 PM | -1 |
| 29-Nov | fajr | 4:43 AM | 4:45 AM | +2 |
| 29-Nov | sunrise | 6:05 AM | 6:07 AM | +2 |
| 29-Nov | asr | 3:20 PM | 3:19 PM | -1 |
| 29-Nov | magrib | 5:50 PM | 5:49 PM | -1 |
| 29-Nov | isha | 7:04 PM | 7:02 PM | -2 |
| 30-Nov | fajr | 4:44 AM | 4:45 AM | +1 |
| 30-Nov | sunrise | 6:06 AM | 6:07 AM | +1 |
| 30-Nov | luhr | 11:59 AM | 11:58 AM | -1 |
| 30-Nov | asr | 3:20 PM | 3:19 PM | -1 |
| 30-Nov | magrib | 5:51 PM | 5:49 PM | -2 |
| 30-Nov | isha | 7:04 PM | 7:02 PM | -2 |

#### zone10-05.json (43 cells)

| Date | Field | Ours | ACJU | Δ |
|---|---|---|---|---|
| 1-May | magrib | 6:14 PM | 6:15 PM | +1 |
| 2-May | magrib | 6:14 PM | 6:15 PM | +1 |
| 3-May | magrib | 6:14 PM | 6:15 PM | +1 |
| 4-May | asr | 3:21 PM | 3:22 PM | +1 |
| 4-May | magrib | 6:14 PM | 6:15 PM | +1 |
| 5-May | magrib | 6:14 PM | 6:15 PM | +1 |
| 6-May | magrib | 6:14 PM | 6:16 PM | +2 |
| 7-May | sunrise | 5:51 AM | 5:50 AM | -1 |
| 7-May | asr | 3:22 PM | 3:23 PM | +1 |
| 7-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 8-May | fajr | 4:30 AM | 4:29 AM | -1 |
| 8-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 9-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 10-May | asr | 3:23 PM | 3:24 PM | +1 |
| 10-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 10-May | isha | 7:28 PM | 7:29 PM | +1 |
| 11-May | fajr | 4:29 AM | 4:28 AM | -1 |
| 11-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 12-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 13-May | sunrise | 5:50 AM | 5:49 AM | -1 |
| 13-May | asr | 3:24 PM | 3:25 PM | +1 |
| 13-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 14-May | magrib | 6:15 PM | 6:16 PM | +1 |
| 15-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 16-May | asr | 3:25 PM | 3:26 PM | +1 |
| 16-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 17-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 18-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 19-May | asr | 3:26 PM | 3:27 PM | +1 |
| 19-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 20-May | magrib | 6:16 PM | 6:17 PM | +1 |
| 21-May | magrib | 6:17 PM | 6:18 PM | +1 |
| 22-May | magrib | 6:17 PM | 6:18 PM | +1 |
| 23-May | magrib | 6:17 PM | 6:18 PM | +1 |
| 24-May | magrib | 6:17 PM | 6:18 PM | +1 |
| 25-May | asr | 3:28 PM | 3:29 PM | +1 |
| 25-May | magrib | 6:17 PM | 6:18 PM | +1 |
| 26-May | magrib | 6:18 PM | 6:19 PM | +1 |
| 27-May | magrib | 6:18 PM | 6:19 PM | +1 |
| 28-May | magrib | 6:18 PM | 6:19 PM | +1 |
| 29-May | magrib | 6:18 PM | 6:19 PM | +1 |
| 30-May | magrib | 6:19 PM | 6:20 PM | +1 |
| 31-May | magrib | 6:19 PM | 6:20 PM | +1 |

