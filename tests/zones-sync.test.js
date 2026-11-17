// data/zones.json is the only zone list; the copy inlined in pt-core.js must match it (PT-3).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPTCore } from './helpers/loadPTCore.js';

const ROOT = join(import.meta.dirname, '..');
const zones = JSON.parse(readFileSync(join(ROOT, 'data/zones.json'), 'utf8')).zones;

describe('inlined ZONES vs data/zones.json', () => {
  it('are identical (ids, names, districts, order)', () => {
    expect(loadPTCore().ZONES).toEqual(zones);
  });

  it('is detected when one district name is changed in the inlined copy', () => {
    const src = readFileSync(join(ROOT, 'assets/js/pt-core.js'), 'utf8');
    const tampered = src.replace("'Kurunegala'", "'Kurunagala'");
    expect(tampered).not.toBe(src);
    const fn = new Function('window', 'fetch', 'localStorage', 'navigator', tampered + '\nreturn window.PT;');
    expect(fn({}, () => {}, {}, {}).ZONES).not.toEqual(zones);
  });

  it('has the generated-block markers', () => {
    const src = readFileSync(join(ROOT, 'assets/js/pt-core.js'), 'utf8');
    expect(src).toContain('// <generated:zones>');
    expect(src).toContain('// </generated:zones>');
  });
});

describe('PT.VERSION and PT.configure', () => {
  it('exposes a semver VERSION matching the header line', () => {
    const PT = loadPTCore();
    expect(PT.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    const src = readFileSync(join(ROOT, 'assets/js/pt-core.js'), 'utf8');
    expect(src.split('\n').slice(0, 8).join('\n')).toContain(`VERSION ${PT.VERSION}`);
  });

  it('defaults DATA_BASE to ./data and lets a consumer override it', async () => {
    const urls = [];
    const PT = loadPTCore({ fetchImpl: async u => { urls.push(u); return { ok: true, json: async () => ({ days: [] }) }; } });
    expect(PT.DATA_BASE).toBe('./data');
    PT.configure({ dataBase: '/display/data/' });
    expect(PT.DATA_BASE).toBe('/display/data');
    await PT.loadMonth('01', 3);
    expect(urls).toEqual(['/display/data/zone01-03.json']);
  });
});
