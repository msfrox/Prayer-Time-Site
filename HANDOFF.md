# HANDOFF — Prayer-Time-Site

_Replace this file at the end of every session; git history keeps the old versions._

## Current state (2026-11-26)

- **PROJECT DONE (Shehan, 26 Nov):** PT-4 closed as his call (Ambient stays Labs, classic stays home, `build/pt-0-3` not merged). Open for him only: the 3 checks in SHEHAN-TODO, the one Worker deploy, optional deploy-on-push token.

- **Hosts:** https://pray.sakina.lk is the site (Cloudflare Worker, `wrangler.jsonc`, deployed **by hand**:
  `bash build/make-site.sh _site && npx wrangler deploy`; not on push). pray.gear.lk (GitHub Pages) redirects every
  page to the same path on sakina.lk (`build/make-gear-redirect.sh`, `pages.yml`, checked by `verify-site.sh --gear`);
  its `/data/` keeps answering for the Salah-board until every reader moves, then it retires.
- **Docs repointed (PT-6 remainder):** README, SCHEMA.md, ROADMAP, TASKS, SHEHAN-TODO and the Labs/designs text now say
  pray.sakina.lk. ADR 0001 is unchanged (history). The Labs/designs text is live on sakina.lk only after a Worker deploy.
- **Decided on default (26 Nov), not seen by Shehan:** no deploy-on-push for the Worker; steps for adding it are in card PT-6.
- `/` is still the classic v8 page; Ambient v9 is at `/labs/ambient.html`. `npm test` and `build/validate.js` green at last run.
- Branch `build/pt-0-3` (pushed) still has the full PT-4 swap (Ambient as `/`); port the `labs` fixes if approved.

## Resume

Waiting on Shehan: deploy the Worker once; optionally add Cloudflare secrets for deploy-on-push (PT-6 card); ACJU's Nallur answer for PT-5. Then PT-R1 readers move to sakina.lk and gear.lk retires.

## Gotchas

- `data/`, `assets/`, `.github` may be mode 555: `chmod -R u+w` before switching branches.
- Labs page unseen on a real phone / iOS Safari. `build/contrast-check.js` lives only on `build/pt-0-3`.
