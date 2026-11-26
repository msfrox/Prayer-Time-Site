#!/usr/bin/env bash
# Check an assembled site folder before it is published: the custom-domain and data files are
# there, every local href/src in the HTML resolves, every file data/manifest.json lists exists,
# and no repo-only file leaked in. Usage: bash build/verify-site.sh [dir]  (default _site)
set -euo pipefail
DIR="${1:-_site}"
fail=0
bad() { echo "verify-site: $*" >&2; fail=1; }

for f in index.html manifest.json sw.js CNAME data/manifest.json data/zones.json data/SCHEMA.md; do
  [ -f "$DIR/$f" ] || bad "missing $f"
done
grep -q '__GIT_SHA__' "$DIR/sw.js" && bad "sw.js still has the __GIT_SHA__ placeholder"

# Local references in every published HTML page (root-relative or page-relative)
missing=""
while IFS= read -r html; do
  base="$(dirname "$html")"
  while IFS= read -r ref; do
    case "$ref" in /|./|"") continue ;; /*) p="$DIR$ref" ;; *) p="$base/$ref" ;; esac
    [ -e "$p" ] || missing="$missing\n  $html -> $ref"
  done < <(grep -oE '(href|src)="[^"#?:]+"' "$html" | sed -E 's/^(href|src)="//; s/"$//' | sort -u)
done < <(find "$DIR" -name '*.html')
[ -z "$missing" ] || bad "pages refer to files that are not published:$(printf '%b' "$missing")"

# Everything the data manifest lists must be published
while IFS= read -r name; do
  [ -f "$DIR/data/$name" ] || bad "data/manifest.json lists $name but it is not published"
done < <(grep -oE '"[A-Za-z0-9_./-]+\.(json|geojson|md)"' "$DIR/data/manifest.json" | tr -d '"' | grep -v '^data/' | sort -u)

# Nothing private
for leak in HANDOFF.md TASKS.md ROADMAP.md BUGS.md BACKLOG.md build .github .git .claude wrangler.jsonc; do
  [ -e "$DIR/$leak" ] && bad "private path published: $leak"
done
extra_md="$(find "$DIR" -name '*.md' -not -path "$DIR/data/SCHEMA.md")"
[ -z "$extra_md" ] || bad "stray markdown published: $extra_md"

[ "$fail" = 0 ] && echo "verify-site: $DIR ok ($(find "$DIR" -type f | wc -l) files)"
exit "$fail"
