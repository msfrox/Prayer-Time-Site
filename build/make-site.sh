#!/usr/bin/env bash
# Assemble the deployable site into _site/ from an explicit allowlist.
# An allowlist, not a blocklist: a new file in the repo is private until it is listed here.
# Used by .github/workflows/pages.yml and runnable locally: bash build/make-site.sh [outdir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-_site}"

ALLOW=(
  index.html manifest.json sw.js CNAME
  labs.html designs.html
  ui-ambient.html ui-bento.html ui-journey.html ui-orbit.html ui-stories.html
  design-1.html design-2.html design-3.html design-4.html design-5.html
  assets data
)

rm -rf "$OUT"
mkdir -p "$OUT"
for p in "${ALLOW[@]}"; do
  [ -e "$p" ] || { echo "make-site: missing allowlisted path: $p" >&2; exit 1; }
  cp -R "$p" "$OUT/"
done
# cp -R keeps the read-only mode of assets/ folders; make the copy writable so it can be cleaned up
chmod -R u+w "$OUT"
# Docs that live beside allowlisted code (assets/js/PT-CORE.md, data/SCHEMA.md) stay in the repo only
find "$OUT" -name '*.md' -delete

# Bust the service-worker shell cache on every deploy
SHA="${GIT_SHA:-$(git rev-parse --short HEAD)}"
sed -i "s/__GIT_SHA__/$SHA/g" "$OUT/sw.js"
echo "make-site: $OUT built at $SHA"
