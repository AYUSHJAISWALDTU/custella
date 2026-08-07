import en from '../src/i18n/locales/en.json';
import hi from '../src/i18n/locales/hi.json';

/** Flattens nested translation objects to dotted key paths. */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

/** Extracts {{placeholders}} from a translation string. */
function placeholders(value: string): string[] {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!).sort();
}

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  if (typeof obj === 'string') return { [prefix]: obj };
  if (typeof obj !== 'object' || obj === null) return {};
  return Object.entries(obj).reduce<Record<string, string>>(
    (acc, [k, v]) => Object.assign(acc, flatten(v, prefix ? `${prefix}.${k}` : k)),
    {}
  );
}

describe('i18n locale files', () => {
  const enKeys = keyPaths(en).sort();

  it('hi has exactly the same keys as en', () => {
    expect(keyPaths(hi).sort()).toEqual(enKeys);
  });

  it('has no empty translation values', () => {
    for (const [locale, bundle] of Object.entries({ en, hi })) {
      for (const [key, value] of Object.entries(flatten(bundle))) {
        expect(`${locale}:${key}:${value.trim()}`).not.toMatch(/:$/);
      }
    }
  });

  it('keeps interpolation placeholders identical across locales', () => {
    const enFlat = flatten(en);
    const hiFlat = flatten(hi);
    for (const [key, value] of Object.entries(enFlat)) {
      expect({ key, vars: placeholders(hiFlat[key] ?? '') }).toEqual({
        key,
        vars: placeholders(value),
      });
    }
  });
});
