# Research index

> **Read this file before starting any research.** Settled = the answer exists, go read it.
> Dead end = already investigated, the answer was no, re-investigating returns the same no.
> Open = nothing has settled it; research is warranted.

## Settled — do not re-research
| Question | Answer | Verified | Where |
|---|---|---|---|
| Is `data/` from an older ACJU edition; does it all need replacing? | No. ACJU's current PDFs (made 2026-09-15, no edition printed) match 150/156 files exactly; the new edition only adds Hanafi asr. Ours was typed from the 2025 edition (151/156 exact). Zone 05 Feb/Apr/Jun/Sep/Nov held zone 06's table (ACJU's 2025 Kurunegala pages were labelled `Zone: 05`); zone 10 May ACJU corrected in 2026. All 6 fixed from the 2026 PDFs. | 2026-11-26 | [acju-recheck](acju-recheck.md), [raw](../research-raw/acju-recheck-2026-11-26.md) |
| Where are ACJU's official timetables? | https://www.acju.lk/prayer-times/ links 156 PDFs (`wp-content/uploads/2026/10/`); clean text layer, one page each. Zones 03/09/12 use a different file-name pattern. | 2026-11-26 | [raw](../research-raw/acju-recheck-2026-11-26.md#source-and-edition) |
| Can a day carry an extra key (e.g. `asrHanafi`) without breaking readers? | Yes. Schema allows extra properties; the site's and Salah-board's `pt-core.js`, Salah-board `datarefresh.py` and brilliant-bar's `brilliant-prayer-fetch` all read the six keys by name. | 2026-11-26 | [acju-recheck](acju-recheck.md) |
| Do we have ACJU's older PDFs? | Yes: the 2025 edition (156 PDFs, made 2025-05-28 to 2025-12-02) was at `~/office/Brands/Gear.lk/Site/Prayer Time Website/PDF/`; copies and checksums: `sources/README.md`. No edition before 2025 is on disk. | 2026-11-26 | [raw](../research-raw/acju-recheck-2026-11-26.md#the-2025-edition-found-on-disk-afterwards) |

## Dead ends — already investigated, the answer was no
| Question | Why it's a dead end | Verified | Where |
|---|---|---|---|
| Whole-page OCR to check the PDFs | tesseract `--psm 6` on the full page drops colons and loses the table layout on some zones; per-cell OCR works. | 2026-11-26 | [raw](../research-raw/acju-recheck-2026-11-26.md#method-three-independent-reads-all-must-agree) |

## Open — research is warranted
| Question | Why it matters | Blocking |
|---|---|---|
| Which Nallur does Zone 02 mean? | Zone boundary | PT-5 (asked ACJU, SHEHAN-TODO) |
