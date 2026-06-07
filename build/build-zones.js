/* ============================================================
   build-zones.js — generate data/zones.geojson for geofencing
   ------------------------------------------------------------
   Sources (geoBoundaries gbOpen, LKA):
     adm2.geojson  — 25 districts
     adm3.geojson  — 330 DS divisions (used ONLY to cut Ampara)

   Output: a FeatureCollection where every feature carries a `zone`
   id (01..13) per the verified ACJU mapping. Ampara is split:
   Padiyathalawa + Dehiattakandiya DS divisions -> zone 10, the rest
   of Ampara -> zone 08. mapshaper then dissolves by `zone`.

   Nallur GN pocket is intentionally NOT cut yet (stays in zone 03);
   add it later via the OVERRIDES note below.
   ============================================================ */
'use strict';
const fs = require('fs');
const turf = require('@turf/turf');

const adm2 = JSON.parse(fs.readFileSync(__dirname + '/adm2.geojson', 'utf8'));
const adm3 = JSON.parse(fs.readFileSync(__dirname + '/adm3.geojson', 'utf8'));

// District (ADM2 shapeName, minus " District") -> ACJU zone id
const DISTRICT_ZONE = {
  'Colombo': '01', 'Gampaha': '01', 'Kalutara': '01',
  'Jaffna': '02',
  'Mullaitivu': '03', 'Kilinochchi': '03', 'Vavuniya': '03',
  'Mannar': '04', 'Puttalam': '04',
  'Anuradhapura': '05', 'Polonnaruwa': '05',
  'Kurunegala': '06',
  'Kandy': '07', 'Matale': '07', 'Nuwara Eliya': '07',
  'Batticaloa': '08', 'Ampara': '08',          // Ampara cut below
  'Trincomalee': '09',
  'Badulla': '10', 'Monaragala': '10',          // + Ampara DS carve-outs
  'Ratnapura': '11', 'Kegalle': '11',
  'Galle': '12', 'Matara': '12',
  'Hambantota': '13',
};

// DS divisions (ADM3 shapeName) carved out of Ampara into zone 10.
const AMPARA_TO_Z10 = ['Padiyathalawa', 'Dehiattakandiya'];

const clean = s => s.replace(/\s+District$/i, '').trim();

const out = [];           // resulting features, each with properties.zone
let amparaFeat = null;
const cutPieces = [];

for (const f of adm2.features) {
  const name = clean(f.properties.shapeName);
  const zone = DISTRICT_ZONE[name];
  if (!zone) { console.warn('UNMAPPED district:', f.properties.shapeName); continue; }
  if (name === 'Ampara') { amparaFeat = f; continue; }  // handle separately
  out.push(turf.feature(f.geometry, { zone }));
}

// Pull the two Ampara DS divisions from ADM3
for (const f of adm3.features) {
  if (AMPARA_TO_Z10.includes(f.properties.shapeName)) {
    cutPieces.push(f);
    out.push(turf.feature(f.geometry, { zone: '10' }));   // carve-out -> zone 10
  }
}
if (cutPieces.length !== AMPARA_TO_Z10.length) {
  throw new Error('Expected ' + AMPARA_TO_Z10.length + ' Ampara DS pieces, found ' + cutPieces.length);
}

// Ampara remainder (zone 08) = Ampara district MINUS the two carve-out DS divisions
// turf v7 API: union/difference take a FeatureCollection
const cutUnion = turf.union(turf.featureCollection(cutPieces));
const amparaRemainder = turf.difference(turf.featureCollection([amparaFeat, cutUnion]));
if (!amparaRemainder) throw new Error('Ampara difference produced empty geometry');
amparaRemainder.properties = { zone: '08' };
out.push(amparaRemainder);

fs.writeFileSync(__dirname + '/zones_zoned.geojson', JSON.stringify(turf.featureCollection(out)));
console.log('Wrote zones_zoned.geojson with', out.length, 'zoned features');

// ── Dissolve by zone in turf (mapshaper's dissolve mishandles the Ampara
//    donut holes). Union each zone group into one (Multi)Polygon. ──
const byZone = {};
for (const f of out) (byZone[f.properties.zone] ||= []).push(f);

const dissolved = [];
for (const zone of Object.keys(byZone).sort()) {
  const group = byZone[zone];
  let merged = group[0];
  for (let i = 1; i < group.length; i++) {
    merged = turf.union(turf.featureCollection([merged, group[i]]));
  }
  merged.properties = { zone };
  dissolved.push(merged);
}

fs.writeFileSync(__dirname + '/zones_full.geojson', JSON.stringify(turf.featureCollection(dissolved)));
console.log('Wrote zones_full.geojson with', dissolved.length, 'dissolved zones:',
  dissolved.map(f => f.properties.zone).join(', '));
