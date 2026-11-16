# Roadmap — Prayer-Time-Site (pray.gear.lk)

One line per item. Read the doc named above each phase before starting it. Full cards are in
`TASKS.md`; history and how the site works are in `README.md`.

| To do this | Read |
|---|---|
| Anything | `HANDOFF.md`, then `README.md` "Design principles" |
| Change the data or how it is shared | `decisions/0001-one-prayer-times-source-is-the-published-data-contract.md` |
| Touch the layout or colours | `decisions/0002-one-layout-and-one-palette-pair-ship.md` |
| See what waits on Shehan | `SHEHAN-TODO.md` |

## Shipped

v1 → v8.0.0: see the version history table in `README.md`.

## Phase 9 — the data contract (ADR 0001)

Makes this repo the one prayer-times source for the family (Salah-board, Brilliant).

| ID | What | Model | Status |
|---|---|---|---|
| PT-0 | Deploy an allowlisted `_site/`, not the repo root | Sonnet | ready |
| PT-1 | `data/manifest.json`, schema, generator, manifest test | Sonnet | ready |
| PT-2 | Validation suite over all 156 timetable files | Sonnet | ready |
| PT-3 | One zone list; versioned, configurable `pt-core.js` | Sonnet | ready |
| PT-5 | Nallur zone override | Sonnet | blocked on ACJU |

## Phase 10 — the redesign (ADR 0002)

| ID | What | Model | Status |
|---|---|---|---|
| PT-4 | Promote the picked layout and palette; archive the rest; v9.0.0 | Sonnet | blocked on Shehan's pick |

## Requests out

| ID | What | Where | Status |
|---|---|---|---|
| PT-R1 | Brilliant's prayer fetcher syncs from the manifest | brilliant-bar (S7) | after PT-1 is live |

## Later

Android and iOS wrappers · lifting Orbit dial and Qibla compass as shared components.
