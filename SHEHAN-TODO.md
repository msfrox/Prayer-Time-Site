# Waiting on Shehan — Prayer-Time-Site

# 🟡 ANSWER HERE

**0. Try Ambient on your phone (live now):** https://pray.sakina.lk/labs/ambient.html
(also the first card on https://pray.sakina.lk/labs.html). The home page is unchanged. Tell me
"keep it" (it becomes `/`, old page stays as classic) or what to change.


The full question sheet for the faith-apps plan is `fable-sprint/S15-PLAN.md`. These are the
ones that belong to this repo. A blank answer means the default stands.

1. **Layout (S15 Q12).** Open `https://pray.sakina.lk/labs.html` on your phone. Pick one:
   Orbit, Journey, Stories, Bento, Ambient, or keep the current page.
   Recommended: **Journey** on top, with the current monthly table, sharing and high-rise
   sections kept below it. Unblocks card PT-4.
   → i like to see a version of ambiant with the current features in the pull up.
2. **Palette (S15 Q13).** Open `https://pray.sakina.lk/designs.html`. Pick one: Daylight,
   Midnight, Heritage, Dawn, Bold. Recommended: **Daylight** as light, with a matching dark.
   Unblocks card PT-4.
   → do that.
3. **The previews you did not pick (S15 Q14).** Default: moved to `archive/`, not deployed,
   nothing deleted.
   → move to archive
4. **One source for prayer times (S15 Q10, Q11).** Default: the published files with a
   manifest; ACJU only; no API. ADR 0001. Say "ok" to accept it.
   → ok

## Steps only you can do

- [ ] **Email ACJU about Nallur** (info@acju.lk). Draft:
  > Assalamu alaikum. In the ACJU prayer timetable, Zone 02 lists "Jaffna, Nallur". Could you
  > confirm whether this Nallur is the Nallur Grama Niladhari division in Poonakary DS
  > (Kilinochchi district), or Nallur in Jaffna town? We publish your timetable at
  > pray.sakina.lk and want the zone boundary to match yours exactly. Jazakallahu khairan.
  Their answer unblocks card PT-5.
- [ ] **Which edition of the ACJU PDF** were the tables typed from (year or date on the PDF)?
  It goes in the manifest's `source.edition`.
- [ ] **Merge to `main`** when a build branch is ready. That is the deploy.
- [ ] PT-2 ran: check the one value in `BUGS.md` (zone 05, 1 Apr, asr `3:20 PM`) against the ACJU PDF.
