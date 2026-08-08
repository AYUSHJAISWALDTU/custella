/**
 * Phone normalisation. This file is the product.
 *
 * "9876543210", "+91 98765 43210" and "098765-43210" must all resolve to one
 * customer, because the phone number is the customer's identity. If this breaks,
 * the app silently starts saving the same person twice and nobody notices until
 * the data is already wrong.
 *
 * The logic is deliberately identical to `norm_phone()` in Postgres, so a number
 * typed offline on a phone and a number submitted through the QR form land on the
 * same row. Change one and you must change the other — `test/phone.test.ts` and
 * the SQL sanity checks both exist to catch that.
 */

/** Ten digits, first digit 6-9. That is every mobile number issued in India. */
const INDIAN_MOBILE = /^[6-9][0-9]{9}$/;

/**
 * Reduce anything a human might type to the 10 digits that identify them.
 *
 * Order matters: strip a country code before a trunk prefix, because "0091..."
 * carries both, and a bare "91..." might be a real number rather than a prefix.
 */
export function normalisePhone(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  // Peel only the prefixes that legally sit in front of an Indian mobile: trunk
  // zeros, then the country code, then any zero it was hiding.
  while (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  while (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  // Deliberately NOT `.slice(-10)`. Blindly keeping the last ten digits turns a
  // toll-free 1800 number into "8001234567" and a UAE number into "1501234567",
  // both of which look like perfectly valid Indian mobiles. Anything that is not
  // exactly ten digits after peeling is left long, so the validator can reject it.
  return d;
}

/** Is this a number we are willing to treat as a customer's identity? */
export function isValidIndianMobile(raw: string | null | undefined): boolean {
  return INDIAN_MOBILE.test(normalisePhone(raw));
}

/**
 * Normalise only if the result is a real Indian mobile, otherwise null.
 *
 * The distinction matters. `normalisePhone` will happily return the last ten digits
 * of a UAE number, which then looks exactly like a valid Indian one — that is how
 * a foreign number gets silently stored as somebody else's identity. Callers that
 * are about to write to the database should use this, never the raw normaliser.
 */
export function toCustomerIdentity(raw: string | null | undefined): string | null {
  const p = normalisePhone(raw);
  return INDIAN_MOBILE.test(p) ? p : null;
}

/** "98765 43210" — how an Indian reads their own number back. */
export function formatPhone(phone: string): string {
  const p = normalisePhone(phone);
  return p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : phone;
}

/** E.164 for dialling and for anything that leaves the country. */
export function toE164(phone: string): string | null {
  const p = toCustomerIdentity(phone);
  return p ? `+91${p}` : null;
}

/**
 * How many digits are still missing. Drives the live duplicate check: the lookup
 * fires the moment this hits zero, not on every keystroke.
 */
export function digitsRemaining(raw: string | null | undefined): number {
  return Math.max(0, 10 - normalisePhone(raw).length);
}
