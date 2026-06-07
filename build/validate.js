'use strict';
const fs = require('fs');
const turf = require('@turf/turf');
const file = process.argv[2] || (__dirname + '/../data/zones.geojson');
const fc = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('Validating:', file, '\n');

// [name, lng, lat, expectedZone]
const CASES = [
  ['Colombo',          79.86, 6.93, '01'],
  ['Gampaha',          80.00, 7.09, '01'],
  ['Kalutara',         79.96, 6.58, '01'],
  ['Jaffna town',      80.02, 9.66, '02'],
  ['Vavuniya',         80.50, 8.75, '03'],
  ['Kilinochchi',      80.40, 9.39, '03'],
  ['Mullaitivu',       80.81, 9.27, '03'],
  ['Mannar',           79.91, 8.98, '04'],
  ['Puttalam',         79.83, 8.03, '04'],
  ['Anuradhapura',     80.40, 8.31, '05'],
  ['Polonnaruwa',      81.00, 7.94, '05'],
  ['Kurunegala',       80.36, 7.49, '06'],
  ['Kandy',            80.63, 7.29, '07'],
  ['Matale',           80.62, 7.47, '07'],
  ['Nuwara Eliya',     80.78, 6.97, '07'],
  ['Ampara town',      81.67, 7.30, '08'],
  ['Batticaloa',       81.69, 7.72, '08'],
  ['Kalmunai(Ampara)', 81.83, 7.41, '08'],
  ['Trincomalee',      81.20, 8.61, '09'],
  ['Badulla',          81.06, 6.99, '10'],
  ['Monaragala',       81.35, 6.87, '10'],
  ['Padiyathalawa',    81.30, 7.27, '10'],   // CRITICAL carve-out
  ['Dehiattakandiya',  81.00, 7.62, '10'],   // CRITICAL carve-out
  ['Ratnapura',        80.40, 6.69, '11'],
  ['Kegalle',          80.35, 7.25, '11'],
  ['Galle',            80.22, 6.06, '12'],
  ['Matara',           80.55, 5.97, '12'],
  ['Hambantota',       81.10, 6.14, '13'],
];

function zoneAt(lng, lat) {
  const pt = turf.point([lng, lat]);
  for (const f of fc.features) {
    if (turf.booleanPointInPolygon(pt, f)) return f.properties.zone;
  }
  return null;
}

let pass = 0, fail = 0;
for (const [name, lng, lat, exp] of CASES) {
  const got = zoneAt(lng, lat);
  const ok = got === exp;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(18)} expected ${exp}  got ${got}`);
}
console.log(`\n${pass}/${CASES.length} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
