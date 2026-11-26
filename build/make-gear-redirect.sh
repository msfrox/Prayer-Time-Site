#!/usr/bin/env bash
# pray.gear.lk only (GitHub Pages): turn an assembled site folder into "pages redirect to pray.sakina.lk,
# data stays". GitHub Pages cannot send a 301, so every .html becomes a small redirect page.
# Not used for the Cloudflare Worker (pray.sakina.lk), which keeps serving the real site.
# Usage: bash build/make-gear-redirect.sh [dir]   (default _site; run after make-site.sh)
set -euo pipefail
DIR="${1:-_site}"
TARGET="https://pray.sakina.lk"

while IFS= read -r html; do
  rel="${html#"$DIR"/}"
  case "$rel" in index.html) path="/" ;; */index.html) path="/${rel%index.html}" ;; *) path="/$rel" ;; esac
  cat > "$html" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved to pray.sakina.lk</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="$TARGET$path">
<meta http-equiv="refresh" content="2;url=$TARGET$path">
<script>location.replace("$TARGET" + location.pathname + location.search + location.hash);</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#1A1A1A;color:#eee;padding:2rem">
<p>Prayer Times has moved to <a href="$TARGET$path" style="color:#9fd">pray.sakina.lk</a>.</p>
</body>
</html>
HTML
done < <(find "$DIR" -name '*.html' -not -path "$DIR/data/*")

# Retire the installed app's service worker: same path, so existing installs pick it up as an update.
cat > "$DIR/sw.js" <<'JS'
// pray.gear.lk has moved to pray.sakina.lk. This worker replaces the old one, clears every cache,
// unregisters itself and reloads open pages so they hit the redirect. It has no fetch handler.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.clients.claim();
    await self.registration.unregister();
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of open) { try { c.navigate(c.url); } catch (e) {} }
  })());
});
JS
echo "make-gear-redirect: $DIR now redirects pages to $TARGET"
