#!/usr/bin/env node
// Rewrites the generated ZONES block in assets/js/pt-core.js from data/zones.json.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const zones = JSON.parse(fs.readFileSync(path.join(root, 'data/zones.json'), 'utf8')).zones;
const file = path.join(root, 'assets/js/pt-core.js');
const src = fs.readFileSync(file, 'utf8');
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const body = zones
  .map(z => `    { id:${q(z.id)}, name:${q(z.name)}, districts:[${z.districts.map(q).join(',')}] },`)
  .join('\n');
const out = src.replace(
  /(\/\/ <generated:zones>\n  const ZONES = \[\n)[\s\S]*?(\n  \];\n  \/\/ <\/generated:zones>)/,
  (_, a, b) => a + body + b
);
if (out === src) console.log('sync-zones: already in sync');
else { fs.writeFileSync(file, out); console.log('sync-zones: pt-core.js updated'); }
