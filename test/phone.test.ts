/**
 * If these fail, the product is a lie: the same person would be saved twice.
 *
 * The cases marked "brief" come straight from the specification and must never be
 * weakened. The rest are ways Indians actually write their numbers, collected from
 * how the number appears on a visiting card, in a WhatsApp contact, and typed by
 * someone in a hurry.
 *
 * Run:  npm test
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  digitsRemaining,
  formatPhone,
  isValidIndianMobile,
  normalisePhone,
  toCustomerIdentity,
  toE164,
} from '../src/lib/phone.ts';

const CANONICAL = '9876543210';

test('the three forms from the brief are one customer', () => {
  assert.equal(normalisePhone('9876543210'), CANONICAL);
  assert.equal(normalisePhone('+91 98765 43210'), CANONICAL);
  assert.equal(normalisePhone('098765-43210'), CANONICAL);

  const identities = new Set(
    ['9876543210', '+91 98765 43210', '098765-43210'].map(normalisePhone)
  );
  assert.equal(identities.size, 1, 'these must be one customer, not three');
});

test('other ways the same number gets written', () => {
  for (const input of [
    '+919876543210',
    '0091 98765 43210',
    '  98765 43210  ',
    '98765-43210',
    '(98765) 43210',
    '91-98765-43210',
    '+91-98765 43210',
    '98765.43210',
    '9 8 7 6 5 4 3 2 1 0',
  ]) {
    assert.equal(normalisePhone(input), CANONICAL, `failed on ${JSON.stringify(input)}`);
  }
});

test('a real number that starts 91 is not eaten by the country-code rule', () => {
  // The naive "strip a leading 91" implementation destroys this number.
  assert.equal(normalisePhone('9198765432'), '9198765432');
  assert.ok(isValidIndianMobile('9198765432'));
});

test('every prefix India actually issues survives', () => {
  for (const first of ['6', '7', '8', '9']) {
    const n = `${first}012345678`;
    assert.equal(normalisePhone(n), n);
    assert.ok(isValidIndianMobile(n), `${n} should be valid`);
  }
});

test('normalisation is idempotent', () => {
  for (const input of ['+91 98765 43210', '098765-43210', '9876543210']) {
    const once = normalisePhone(input);
    assert.equal(normalisePhone(once), once, `not idempotent for ${input}`);
  }
});

test('toCustomerIdentity refuses what normalisePhone would happily mangle', () => {
  // A foreign number is left at full length rather than truncated to something
  // that would pass for Indian, so the validator can see it for what it is.
  assert.equal(normalisePhone('+971 50 123 4567'), '971501234567');
  assert.equal(toCustomerIdentity('+971 50 123 4567'), null);

  for (const bad of ['5551234567', '1234567890', '0000000000', '12345', '', null, undefined]) {
    assert.equal(toCustomerIdentity(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
  assert.equal(toCustomerIdentity('+91 98765 43210'), CANONICAL);
});

test('landlines and short codes are not customers', () => {
  for (const bad of ['011-2345-6789', '1800 123 4567', '100', '112']) {
    assert.equal(toCustomerIdentity(bad), null, `should reject ${bad}`);
  }
});

test('display and dialling formats', () => {
  assert.equal(formatPhone('9876543210'), '98765 43210');
  assert.equal(formatPhone('+91 98765 43210'), '98765 43210');
  assert.equal(toE164('098765-43210'), '+919876543210');
  assert.equal(toE164('+971 50 123 4567'), null);
});

test('digitsRemaining drives the duplicate check', () => {
  assert.equal(digitsRemaining(''), 10);
  assert.equal(digitsRemaining('98765'), 5);
  assert.equal(digitsRemaining('9876543210'), 0);
  // Already complete via the country code — the check should fire, not wait.
  assert.equal(digitsRemaining('+91 98765 43210'), 0);
});

test('null and rubbish never throw', () => {
  for (const input of [null, undefined, '', '   ', 'abc', '+++']) {
    assert.equal(normalisePhone(input), '');
    assert.equal(isValidIndianMobile(input), false);
  }
});
