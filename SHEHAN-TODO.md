# Waiting on Shehan — Prayer-Time-Site

The project is done (26 Nov 2026): the site as it is now is final. Only these remain, all yours.

# 🟡 ANSWER HERE

- [ ] **Check one value:** zone 05, 1 Apr, asr `3:20 PM` against the ACJU PDF (details in `BUGS.md`).
- [ ] **Which edition of the ACJU PDF** were the tables typed from (year or date on the PDF)? It goes in the manifest's `source.edition`.
- [ ] **Email ACJU about Nallur** (info@acju.lk). Their answer would unblock PT-5. Draft:
  > Assalamu alaikum. In the ACJU prayer timetable, Zone 02 lists "Jaffna, Nallur". Could you
  > confirm whether this Nallur is the Nallur Grama Niladhari division in Poonakary DS
  > (Kilinochchi district), or Nallur in Jaffna town? We publish your timetable at
  > pray.sakina.lk and want the zone boundary to match yours exactly. Jazakallahu khairan.
- [ ] **Deploy the Worker once** so the repointed text is live (needs your Cloudflare login):
  `bash build/make-site.sh _site && npx wrangler deploy`

## Closed 26 Nov (your calls)

PT-4 layout and palette picks, the previews, and the data source: closed with "close everything on prayer time".
Ambient stays at `/labs/ambient.html`, the classic page stays home, `build/pt-0-3` is not merged.

## Optional (later, or never)

- [ ] **Deploy on push** (card PT-6, step 2 · optional): create a Cloudflare API token (template "Edit Cloudflare Workers"), add it as repo secret `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID`, then ask for a `deploy-worker` job (see card PT-6).
  *Optional (26 Nov): the Worker is deployed by hand today and that works; skipping this only means one manual command per release.*
