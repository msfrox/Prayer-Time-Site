# HANDOFF — Prayer-Time-Site

_Replace this file at the end of every session; git history keeps the old versions._

## Current state (2026-11-16 — planned, nothing built)

- Live: **v8.0.0** at pray.gear.lk (GitHub Pages; a push to `main` deploys).
- A planning session (fable-sprint S15) wrote the plan into `ROADMAP.md`, `TASKS.md` and two
  ADRs in `decisions/`, on branch `away/2026-11/s15-plan`. **Both ADRs are "proposed":**
  they were written on defaults while Shehan was away. No site file was changed.
- The plan makes this repo the single source of prayer-time data for Salah-board and
  Brilliant (ADR 0001), and sets out how the layout and palette pick is promoted (ADR 0002).

## Resume

**Model: Sonnet 5.5. Effort: medium.**
First card: **PT-0**, then PT-1, PT-2, PT-3 in order (`TASKS.md`). All four are ready and
independent of Shehan's answers. Work on a branch from `main`; do not merge.
PT-4 and PT-5 are blocked: check `SHEHAN-TODO.md` for answers before starting either.

Continue prompt:

```text
Continue Prayer-Time-Site according to /project-playbook — read ROADMAP.md and HANDOFF.md in ~/Projects/Prayer-Time-Site, then do
cards PT-0 to PT-3 from TASKS.md in order. Check SHEHAN-TODO.md first for answers that unblock PT-4.
Delegate implementation from task cards to Sonnet agents and sweeps to Haiku Explore agents.
Model: sonnet · Effort: medium — set both before sending.

Context you won't get from the files: a push to main deploys the live site, so stay on a branch; Salah-board holds byte-identical copies of data/, so do not reformat any data file.
```

## In flight

Nothing.

## Waiting on Shehan

See `SHEHAN-TODO.md`: the layout pick, the palette pick, what happens to the unpicked
previews, the email to ACJU about Nallur, and confirming ADR 0001.

## Gotchas

- **The Pages workflow publishes the whole repo root.** Until PT-0 lands, every Markdown file
  merged to `main` is public at pray.gear.lk. PT-0 goes first for that reason.
- `tests/` is vitest and dev-only; the site itself has no build step and must stay that way.
- `.github/workflows/sync-docs.yml` mirrors selected docs to `msfrox/public-docs` on `main`.
- This box cannot show a page. Anything visual is "not seen, needs Shehan's look".
