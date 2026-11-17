// The manifest must describe exactly the files on disk (ADR 0001, PT-1).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DATA = join(import.meta.dirname, '..', 'data');
const manifest = JSON.parse(readFileSync(join(DATA, 'manifest.json'), 'utf8'));
const { buildManifest } = require('../build/make-manifest.js');

describe('data/manifest.json', () => {
  it('has the contract header', () => {
    expect(manifest.contract).toBe(1);
    expect(manifest.revision).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(manifest.revised).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(manifest.source.name).toBe('ACJU');
  });

  it('lists 156 zone-months + zones.json + zones.geojson (plus the schema docs)', () => {
    expect(manifest.files.filter(f => !f.path.startsWith('schema/') && f.path !== 'SCHEMA.md')).toHaveLength(158);
    const zm = manifest.files.filter(f => /^zone\d\d-\d\d\.json$/.test(f.path));
    expect(zm).toHaveLength(156);
  });

  it('lists every file on disk (except itself) and nothing else', () => {
    const onDisk = readdirSync(DATA, { recursive: true, withFileTypes: true })
      .filter(e => e.isFile())
      .map(e => join(e.parentPath, e.name).slice(DATA.length + 1))
      .filter(p => p !== 'manifest.json')
      .sort();
    const listed = manifest.files.map(f => f.path);
    expect(listed).toEqual(onDisk);
  });

  it('has the right sha256 and size for every file', () => {
    for (const f of manifest.files) {
      const buf = readFileSync(join(DATA, f.path));
      expect(createHash('sha256').update(buf).digest('hex'), f.path).toBe(f.sha256);
      expect(buf.length, f.path).toBe(f.bytes);
    }
  });

  it('is exactly what make-manifest would write now (stable, sorted)', () => {
    expect(buildManifest(manifest)).toEqual(manifest);
    const paths = manifest.files.map(f => f.path);
    expect(paths).toEqual([...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });
});

describe('sw.js', () => {
  it('routes everything under /data/ (including manifest.json) as data, not shell', () => {
    const sw = readFileSync(join(import.meta.dirname, '..', 'sw.js'), 'utf8');
    expect(sw).toMatch(/pathname\.startsWith\('\/data\/'\)[\s\S]{0,80}staleWhileRevalidate/);
    expect(sw).not.toMatch(/SHELL_ASSETS[\s\S]*?'\/data\/manifest\.json'[\s\S]*?\];/);
  });
});
