// Loads assets/js/pt-core.js into the *current* JS realm (not a vm sandbox),
// so vitest's fake timers — which patch the ambient `Date` on globalThis —
// still apply inside pt-core's own `new Date()` calls. pt-core.js is written
// as a browser global (`(function (global) {...})(window)`), so `window`,
// `fetch`, `localStorage` and `navigator` are injected as named parameters
// of the wrapping Function; pt-core references them as bare identifiers,
// so the parameters shadow (or stand in for) the real browser globals that
// don't exist in Node.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(
  path.resolve(__dirname, '../../assets/js/pt-core.js'),
  'utf8'
);

export function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

export function loadPTCore({ fetchImpl, localStorageImpl, navigatorImpl } = {}) {
  const windowObj = {};
  const fetchFn = fetchImpl || (() => Promise.reject(new Error('fetch not mocked in this test')));
  const localStorageObj = localStorageImpl || makeLocalStorage();
  const navigatorObj = navigatorImpl || {};
  // eslint-disable-next-line no-new-func
  const factory = new Function(
    'window', 'fetch', 'localStorage', 'navigator',
    `${SRC}\nreturn window.PT;`
  );
  return factory(windowObj, fetchFn, localStorageObj, navigatorObj);
}
