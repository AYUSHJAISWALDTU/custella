/**
 * The phone-identity rule is the backbone of Custella: one number is one customer,
 * per shop, forever. If normalisation breaks, the product silently starts saving the
 * same person twice and nobody notices until the data is already wrong.
 *
 * These tests read normPhone() out of index.html rather than duplicating it, so they
 * test the code that actually ships. If someone edits the function, this fails.
 *
 * Run:  node --test test/
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Pull the shipping implementation straight out of the page.
const src = html.match(/function normPhone\(raw\)\{[\s\S]*?\n\}/);
assert.ok(src, 'normPhone() not found in index.html — did it get renamed?');
const normPhone = new Function(`${src[0]}; return normPhone;`)();

// The database enforces this same shape in submit_lead. Keep the two in step.
const isIndianMobile = (p) => /^[6-9][0-9]{9}$/.test(p);

test('the three formats from the brief are the same person', () => {
  const want = '9876543210';
  assert.equal(normPhone('9876543210'), want);
  assert.equal(normPhone('+91 98765 43210'), want);
  assert.equal(normPhone('098765-43210'), want);
});

test('other ways Indians write their number', () => {
  const want = '9876543210';
  for (const input of [
    '+919876543210',
    '0091 98765 43210',
    '  98765 43210  ',
    '98765-43210',
    '(98765) 43210',
    '91-98765-43210',
    '+91-98765 43210',
  ]) {
    assert.equal(normPhone(input), want, `failed on ${JSON.stringify(input)}`);
  }
});

test('a real 10-digit number starting 91 is not mangled', () => {
  // The naive "strip a leading 91" rule eats this one. It must not.
  assert.equal(normPhone('9198765432'), '9198765432');
  assert.ok(isIndianMobile(normPhone('9198765432')));
});

test('every valid Indian prefix survives', () => {
  for (const first of ['6', '7', '8', '9']) {
    const n = first + '012345678';
    assert.equal(normPhone(n), n);
    assert.ok(isIndianMobile(normPhone(n)), `${n} should be valid`);
  }
});

test('normalisation is idempotent', () => {
  for (const input of ['+91 98765 43210', '098765-43210', '9876543210']) {
    const once = normPhone(input);
    assert.equal(normPhone(once), once, `not idempotent for ${input}`);
  }
});

test('rubbish is rejected by the validator, not silently accepted', () => {
  // normPhone() only normalises; submit_lead's regex is what refuses these.
  // Before Phase 2 the UAE number below was stored as a plausible Indian one.
  const rejected = [
    ['+971 50 123 4567', 'UAE number, no longer truncated into a valid-looking Indian one'],
    ['1800 123 4567', 'toll-free, used to become 8001234567 and pass as a mobile'],
    ['011-2345-6789', 'landline'],
    ['5551234567', 'starts with 5 — not an Indian mobile'],
    ['12345', 'too short'],
    ['0000000000', 'all zeroes'],
    ['', 'empty'],
  ];
  for (const [input, why] of rejected) {
    assert.ok(!isIndianMobile(normPhone(input)), `should have been rejected: ${why}`);
  }
});

test('the same person typed three ways collapses to one identity', () => {
  const typed = ['9876543210', '+91 98765 43210', '098765-43210'];
  const identities = new Set(typed.map(normPhone));
  assert.equal(identities.size, 1, 'these must be one customer, not three');
});
