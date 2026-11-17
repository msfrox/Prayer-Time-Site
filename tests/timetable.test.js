// Validates the timetable values themselves (PT-2). Known data problems are listed in
// tests/known-issues.json and in BUGS.md; the suite fails on anything NOT listed there.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectProblems, zoneFiles } from './helpers/timetable.js';

const known = JSON.parse(readFileSync(join(import.meta.dirname, 'known-issues.json'), 'utf8'));
const problems = collectProblems();
const key = p => `${p.file}|${p.date}|${p.rule}`;
const knownKeys = new Set(known.map(key));

describe('timetable data', () => {
  it('covers all 13 zones x 12 months', () => {
    expect(zoneFiles()).toHaveLength(156);
  });

  it('has no problems beyond the ones recorded in known-issues.json', () => {
    const fresh = problems.filter(p => !knownKeys.has(key(p)));
    expect(fresh, JSON.stringify(fresh, null, 1)).toEqual([]);
  });

  it('known-issues.json has no stale entries (fixed ones must be removed)', () => {
    const live = new Set(problems.map(key));
    expect(known.filter(k => !live.has(key(k)))).toEqual([]);
  });
});
