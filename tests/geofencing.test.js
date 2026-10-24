import { describe, it, expect, beforeAll } from 'vitest';
import { loadPTCore } from './helpers/loadPTCore.js';
import { loadValidateCases, loadZonesGeojson } from './helpers/fixtures.js';

describe('geofencing (PT.resolveZone via real data/zones.geojson)', () => {
  let PT;
  const cases = loadValidateCases(); // mined from build/validate.js — [name, lng, lat, expectedZone]

  beforeAll(async () => {
    const geo = loadZonesGeojson();
    PT = loadPTCore({
      fetchImpl: async (url) => {
        if (String(url).includes('zones.geojson')) return { ok: true, json: async () => geo };
        throw new Error(`unexpected fetch in this test: ${url}`);
      },
    });
    await PT.loadGeo();
  });

  for (const [name, lng, lat, expected] of cases) {
    it(`${name} (${lng}, ${lat}) resolves to zone ${expected}`, () => {
      const r = PT.resolveZone(lat, lng);
      expect(r.zone).toBe(expected);
      expect(r.status).toBe('exact');
    });
  }

  it('classifies every mined case with a resolvable zone (sanity: cases file itself is non-empty)', () => {
    expect(cases.length).toBeGreaterThan(20);
  });

  describe('near-boundary carve-outs (explicitly flagged CRITICAL in build/validate.js)', () => {
    it('Padiyathalawa resolves to zone 10, not the surrounding zone', () => {
      const r = PT.resolveZone(7.27, 81.30);
      expect(r.zone).toBe('10');
    });
    it('Dehiattakandiya resolves to zone 10, not the surrounding zone', () => {
      const r = PT.resolveZone(7.62, 81.00);
      expect(r.zone).toBe('10');
    });
  });

  describe('sea buffer (points off the coastline, not inside any polygon)', () => {
    it('a point ~2km off the Colombo coast (zone 01) snaps to zone 01 as "nearshore"', () => {
      const r = PT.resolveZone(6.93, 79.81);
      expect(r.status).toBe('nearshore');
      expect(r.zone).toBe('01');
    });

    it('a point ~9.6km off the Colombo coast is past the 8km buffer and resolves to nothing', () => {
      const r = PT.resolveZone(6.93, 79.74);
      expect(r.status).toBe('outside');
      expect(r.zone).toBeNull();
    });

    it('a point far out in the open ocean resolves to nothing', () => {
      const r = PT.resolveZone(0, 70);
      expect(r.status).toBe('outside');
      expect(r.zone).toBeNull();
    });

    it('a point well inland of a neighbouring country resolves to nothing (not the nearest SL zone)', () => {
      // Roughly mid Palk Strait toward India, well outside the 8km buffer.
      const r = PT.resolveZone(9.0, 79.3);
      expect(r.status).toBe('outside');
      expect(r.zone).toBeNull();
    });
  });
});
