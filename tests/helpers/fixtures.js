// Pulls fixtures from the repo's existing "oracles" instead of hand-inventing
// them, per the task brief: build/validate.js already encodes known
// town -> zone expectations used to sanity-check zones.geojson after each
// rebuild; build/accuracy-sweep.js documents the geometry's own tolerance.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// Extracts `const <name> = [ ... ];` out of a source file without executing
// the rest of the script (build/validate.js ends in a bare process.exit()).
function extractArrayLiteral(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp(`const ${varName} = (\\[[\\s\\S]*?\\n\\]);`);
  const m = src.match(re);
  if (!m) throw new Error(`Could not find ${varName} in ${filePath}`);
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return ${m[1]};`)();
}

// [name, lng, lat, expectedZone][]
export function loadValidateCases() {
  return extractArrayLiteral(path.join(ROOT, 'build/validate.js'), 'CASES');
}

export function loadZonesGeojson() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/zones.geojson'), 'utf8'));
}

export function loadMonthFixture(zone, month) {
  const file = path.join(ROOT, `data/zone${String(zone).padStart(2, '0')}-${String(month).padStart(2, '0')}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
