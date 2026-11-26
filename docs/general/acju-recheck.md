# ACJU timetable recheck (26 Nov 2026)

Raw report with every difference: [`docs/research-raw/acju-recheck-2026-11-26.md`](../research-raw/acju-recheck-2026-11-26.md).

**Question:** is our data from an older ACJU edition, and should it all be replaced?

**Answer: no, not all of it.** ACJU's current PDFs (acju.lk/prayer-times, 156 files, made
15 Sep 2026, uploaded Oct 2026, no year or edition printed) have the same Shafi'i times as 150 of
our 156 files, value for value. The new edition adds an `ASR-HANAFI` column and corrects one table
(zone 10 May). Our data was typed from ACJU's 2025 edition (made May–Dec 2025, found on disk afterwards),
which matches 151 files exactly. The 6 files that differed:

| Files | What was wrong | Cells |
|---|---|---|
| `zone05-02`, `-04`, `-06`, `-09`, `-11` | Held zone 06's (Kurunegala) table, since the first commit. ACJU's 2025 Kurunegala pages for these months were misprinted `Zone: 05`, and they were filed by that label | 580 |
| `zone10-05` | ACJU's 2025 values; the 2026 edition corrects them (magrib 1 min later all month, plus 12 other 1-min changes) | 43 |

The zone 05 copy is also what BUGS.md #1 flagged (1 Apr asr): the real value is `3:22 PM`.

**How sure:** every table of the 2026 set was read three independent ways (poppler text layer,
pdfminer.six character boxes, tesseract OCR of each of the 33,306 rendered cells) and all three agree.

**Source PDFs:** kept outside the repo, on RUBY2 and Sapphire; `sources/README.md` says where and holds their checksums.

**What changed in the data (branch `claude/heuristic-kilby-26722e`, not merged):** the 6 files
now carry ACJU's values; `manifest.json` revision `2026-11-26.2`, `source.edition` recorded; every
day in all 156 files gained an optional `asrHanafi` (contract stays 1: the field is additive and
every reader picks the six prayer keys by name).
