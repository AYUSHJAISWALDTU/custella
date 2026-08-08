/**
 * The i18n layer's contract: Hindi has exactly the keys English has, no value is
 * empty, and no translation loses an interpolation placeholder. A missing key
 * silently renders a raw path like "home.addCustomer" to a shopkeeper.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

type Bundle = Record<string, unknown>;

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  if (typeof obj === 'string') return { [prefix]: obj };
  if (typeof obj !== 'object' || obj === null) return {};
  return Object.entries(obj as Bundle).reduce<Record<string, string>>(
    (acc, [k, v]) => Object.assign(acc, flatten(v, prefix ? `${prefix}.${k}` : k)),
    {}
  );
}

const placeholders = (v: string) => [...v.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!).sort();

const enFlat = flatten(en);
const hiFlat = flatten(hi);

test('hi has exactly the same keys as en', () => {
  assert.deepEqual(Object.keys(hiFlat).sort(), Object.keys(enFlat).sort());
});

test('no translation is empty', () => {
  for (const [locale, bundle] of Object.entries({ en: enFlat, hi: hiFlat })) {
    for (const [key, value] of Object.entries(bundle)) {
      assert.ok(value.trim().length > 0, `${locale}:${key} is empty`);
    }
  }
});

test('interpolation placeholders are identical across locales', () => {
  for (const [key, value] of Object.entries(enFlat)) {
    assert.deepEqual(placeholders(hiFlat[key] ?? ''), placeholders(value), `mismatch at ${key}`);
  }
});

test('Devanagari survived the file, not just the encoding', () => {
  assert.match(hiFlat['app.tagline'] ?? '', /[ऀ-ॿ]/);
});
