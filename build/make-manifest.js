#!/usr/bin/env node
// Writes data/manifest.json: the entry point of the published data contract (ADR 0001).
// Node standard library only. Output is stable: files sorted, 2-space JSON, trailing newline.
//
//   node build/make-manifest.js                       refresh checksums, keep revision
//   node build/make-manifest.js --revision 2026-12-01.1 --revised 2026-12-01
//        bump the revision (do this whenever a table value changes)
//   node build/make-manifest.js --edition "ACJU 2026 timetable"
//        record which PDF edition the tables were typed from
const { readFileSync, writeFileSync, readdirSync, statSync, existsSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(DATA, 'manifest.json');

const DEFAULTS = {
  contract: 1,
  revision: '2026-11-16.1',
  revised: '2026-11-16',
  source: { name: 'ACJU', url: 'https://www.acju.lk', edition: 'unknown — confirm with Shehan' },
};

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function walk(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const rel = base ? base + '/' + name : name;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs, rel));
    else if (rel !== 'manifest.json') out.push(rel);
  }
  return out;
}

function buildManifest(prev = {}) {
  const head = { ...DEFAULTS, ...prev };
  head.source = { ...DEFAULTS.source, ...(prev.source || {}) };
  if (arg('revision')) head.revision = arg('revision');
  if (arg('revised')) head.revised = arg('revised');
  if (arg('edition')) head.source.edition = arg('edition');
  const files = walk(DATA)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map(rel => {
      const buf = readFileSync(join(DATA, rel));
      return { path: rel, sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
    });
  return { contract: head.contract, revision: head.revision, revised: head.revised, source: head.source, files };
}

if (require.main === module) {
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const m = buildManifest(prev);
  writeFileSync(OUT, JSON.stringify(m, null, 2) + '\n');
  console.log(`manifest: ${m.files.length} files, revision ${m.revision}`);
}

module.exports = { buildManifest };
