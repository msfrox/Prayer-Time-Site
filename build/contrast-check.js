#!/usr/bin/env node
// WCAG contrast for the shipped text/background token pairs (ADR 0002). Prints a table; exit 1 if any < 4.5.
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const T = {
  light: { bg: '#FBFAF7', card: '#FFFFFF', subtle: '#F5F3EE', ink900: '#181613', ink600: '#46423B', ink400: '#6E6A62', green: '#1F5F4E', terracotta: '#B34A22', gold100: '#F7E3D9', gold700: '#7A2F10' },
  dark:  { bg: '#14120F', card: '#1E1B17', subtle: '#181612', ink900: '#F4F0E8', ink600: '#D6D1C7', ink400: '#A8A298', green: '#6FB59F', terracotta: '#E8845C' },
};
const pairs = [];
for (const [th, t] of Object.entries(T)) {
  for (const [fg, bg] of [['ink900', 'bg'], ['ink900', 'card'], ['ink600', 'bg'], ['ink600', 'card'], ['ink400', 'bg'], ['ink400', 'card'], ['ink400', 'subtle'], ['green', 'card'], ['green', 'bg'], ['terracotta', 'card'], ['terracotta', 'bg']])
    pairs.push([th, `${fg} on ${bg}`, t[fg], t[bg]]);
}
pairs.push(['light', 'white on green (Locate / chips)', '#FFFFFF', T.light.green]);
pairs.push(['dark', 'white on green (Locate / chips)', '#FFFFFF', '#1F5F4E']);
pairs.push(['light', 'gold700 on gold100 (note callout)', T.light.gold700, T.light.gold100]);
// sky: white text over each phase's gradient stops (night/dawn/dusk are darkest at the stops under the text)
const SKY = { night: ['#070C1F', '#0E1638', '#1A2350'], dawn: ['#243056', '#5b4570', '#a24f4a'], morning: ['#1d4f93', '#2a5f9f', '#3b6fa8'],
  noon: ['#1a4a8c', '#25589a', '#34679f'], afternoon: ['#244b7e', '#3a5f8c', '#5a6a80'], dusk: ['#2a2350', '#6a2f55', '#9c3b30'] };
for (const [ph, s] of Object.entries(SKY)) s.forEach((c, i) => pairs.push(['sky', `white on ${ph} stop ${'abc'[i]}`, '#FFFFFF', c]));
let bad = 0;
for (const [th, name, fg, bg] of pairs) { const r = ratio(fg, bg); if (r < 4.5) bad++; console.log(`${th.padEnd(6)} ${name.padEnd(36)} ${fg} / ${bg}  ${r.toFixed(2)}${r < 4.5 ? '  FAIL' : ''}`); }
process.exit(bad ? 1 : 0);
