'use strict';
const fs = require('fs');
const turf = require('@turf/turf');

const full = JSON.parse(fs.readFileSync(__dirname + '/zones_full.geojson', 'utf8'));
const simp = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

function classify(fc, pt) {
  for (const f of fc.features) if (turf.booleanPointInPolygon(pt, f)) return f.properties.zone;
  return null;
}
// distance (km) from a point to the nearest border of the full-res zones
const BORDER_LINES = [];
for (const f of full.features) {
  const ls = turf.polygonToLine(f);
  const feats = ls.type === 'FeatureCollection' ? ls.features : [ls];
  for (const lf of feats) turf.flatten(lf).features.forEach(x => BORDER_LINES.push(x));
}
function distToAnyBorderKm(pt) {
  let min = Infinity;
  for (const line of BORDER_LINES) {
    const d = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
    if (d < min) min = d;
  }
  return min;
}

// Sri Lanka bbox
const [W, S, E, N] = [79.6, 5.9, 81.9, 9.9];
const TRIALS = +(process.argv[3] || 20000);
let inside = 0, mismatch = 0;
const mism = [];
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

for (let i = 0; i < TRIALS; i++) {
  const lng = W + rnd() * (E - W);
  const lat = S + rnd() * (N - S);
  const pt = turf.point([lng, lat]);
  const zf = classify(full, pt);
  if (!zf) continue;            // only score on-land points
  inside++;
  const zs = classify(simp, pt);
  if (zs !== zf) { mismatch++; mism.push({ lng, lat, zf, zs }); }
}

console.log(`file: ${process.argv[2]}`);
console.log(`on-land samples: ${inside}, mismatches vs full-res: ${mismatch} (${(100*mismatch/inside).toFixed(3)}%)`);
// How far are mismatches from a real border? (should be tiny — within simplification tolerance)
const dists = mism.map(m => distToAnyBorderKm(turf.point([m.lng, m.lat]))).sort((a,b)=>a-b);
if (dists.length) {
  const q = p => dists[Math.min(dists.length-1, Math.floor(p*dists.length))].toFixed(3);
  console.log(`mismatch dist-to-border km:  median ${q(.5)}  p90 ${q(.9)}  max ${dists[dists.length-1].toFixed(3)}`);
  const far = mism.filter((m,i)=>distToAnyBorderKm(turf.point([m.lng,m.lat]))>1.0);
  if (far.length) { console.log(`  ${far.length} mismatch(es) >1km from any border:`); far.slice(0,8).forEach(m=>console.log('   ',m)); }
}
