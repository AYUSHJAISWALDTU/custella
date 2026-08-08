/**
 * The scan card's PDF is a physical artefact — it gets printed and taped to a
 * counter, and a customer points a camera at it. A malformed file or a QR with no
 * quiet zone fails in the one place nobody is watching.
 *
 * These tests pull the generator out of index.html (so they test what ships), run it
 * against a stubbed browser, and assert the bytes are a structurally valid PDF. The
 * companion check in package.json renders the result with macOS Quick Look — if the
 * OS can rasterise it, a print shop can print it.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function grab(name) {
  const re = new RegExp(`\\nfunction ${name}\\([\\s\\S]*?\\n\\}`);
  const m = html.match(re);
  assert.ok(m, `${name}() not found in index.html — renamed?`);
  return m[0];
}

// A 1x1 white JPEG, so the non-Latin path can be exercised without a real canvas.
const TINY_JPEG =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

function makeSandbox() {
  const ctx = {
    font: '',
    fillStyle: '',
    textBaseline: '',
    measureText: (t) => ({ width: t.length * 8 }),
    fillRect: () => {},
    fillText: () => {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: () => `data:image/jpeg;base64,${TINY_JPEG}`,
  };
  return {
    document: { createElement: () => canvas },
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
    // A deterministic 25x25 module grid — same size as a real version-2 QR.
    QRCode: class {
      constructor() {
        const n = 25;
        this._oQRCode = {
          getModuleCount: () => n,
          isDark: (r, c) => (r * 7 + c * 3) % 5 < 2,
        };
      }
      static CorrectLevel = { M: 0 };
    },
    cardLink: (code) => `https://ayushjaiswaldtu.github.io/custella/#/s/${code}`,
  };
}

/** The Helvetica width tables are `var` declarations, not functions. */
function grabVar(name) {
  const m = html.match(new RegExp(`\\nvar ${name} = \\[[\\s\\S]*?\\];`));
  assert.ok(m, `${name} not found in index.html — renamed?`);
  return m[0];
}

function loadGenerator() {
  const src = [
    ['HELV_W', 'HELV_B_W'].map(grabVar).join('\n'),
    [
      'pdfEsc', 'isLatin1', 'helvWidth', 'qrModules', 'textToJpeg',
      'b64ToBytes', 'concatBytes', 'buildCardPdf',
    ].map(grab).join('\n'),
  ].join('\n');
  const s = makeSandbox();
  const fn = new Function(
    'document', 'atob', 'QRCode', 'cardLink',
    `${src}; return { buildCardPdf, qrModules, isLatin1 };`
  );
  return fn(s.document, s.atob, s.QRCode, s.cardLink);
}

const { buildCardPdf, isLatin1 } = loadGenerator();
const CARD = { name: 'Banarasi dupattas', location: 'Delhi Exhibition · Stall 12', code: 'B06422B4' };

function asText(bytes) {
  return Buffer.from(bytes).toString('latin1');
}

test('produces a structurally valid PDF', () => {
  const pdf = asText(buildCardPdf(CARD, 'Odhni Sarees'));
  assert.ok(pdf.startsWith('%PDF-1.4'), 'missing PDF header');
  assert.ok(pdf.includes('/Type /Catalog'), 'missing catalog');
  assert.ok(pdf.includes('/Type /Page'), 'missing page');
  assert.ok(pdf.includes('/MediaBox [0 0 595.28 841.89]'), 'not A4');
  assert.ok(pdf.includes('xref'), 'missing xref table');
  assert.ok(pdf.includes('trailer'), 'missing trailer');
  assert.ok(pdf.trimEnd().endsWith('%%EOF'), 'missing EOF marker');
});

test('xref offsets point at real object headers', () => {
  const bytes = buildCardPdf(CARD, 'Odhni Sarees');
  const pdf = asText(bytes);
  const xrefAt = pdf.lastIndexOf('\nxref\n') + 1;
  // Row 0 of an xref table is always the free-list head (…65535 f), so skip it.
  const rows = pdf.slice(xrefAt).split('\n').slice(3);
  let checked = 0;
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i].match(/^(\d{10}) 00000 n/);
    if (!m) break;
    const off = parseInt(m[1], 10);
    // Every offset must land exactly on "<n> 0 obj".
    assert.match(pdf.slice(off, off + 12), /^\d+ 0 obj/, `offset ${off} is not an object header`);
    checked++;
  }
  assert.ok(checked >= 6, `expected at least 6 objects, checked ${checked}`);
});

test('the QR carries its quiet zone', () => {
  // Without ~4 modules of white margin many scanners never lock on. The drawing
  // divides the 300pt box by (modules + 8), so the dark area must be smaller.
  const pdf = asText(buildCardPdf(CARD, 'Odhni Sarees'));
  const squares = [...pdf.matchAll(/^(\d+\.\d\d) (\d+\.\d\d) (\d+\.\d\d) \3 re f$/gm)];
  assert.ok(squares.length > 50, `expected many QR squares, got ${squares.length}`);
  const xs = squares.map((s) => parseFloat(s[1]));
  const qx = (595.28 - 300) / 2;
  assert.ok(Math.min(...xs) > qx, 'QR modules start before the box — no quiet zone');
  assert.ok(Math.max(...xs) < qx + 300, 'QR modules run past the box');
});

test('Latin text is drawn as text, not pictures of text', () => {
  const pdf = asText(buildCardPdf(CARD, 'Odhni Sarees'));
  assert.ok(pdf.includes('(Odhni Sarees) Tj'), 'shop name should be selectable text');
  assert.ok(pdf.includes('(Banarasi dupattas) Tj'), 'card name should be selectable text');
  assert.ok(!pdf.includes('/DCTDecode'), 'no images should be needed for Latin text');
});

test('Devanagari falls back to an embedded image instead of mojibake', () => {
  // Helvetica physically cannot encode these glyphs. Emitting them as text would
  // print garbage on a real shop's card.
  assert.equal(isLatin1('ओढ़नी साड़ी'), false);
  const pdf = asText(buildCardPdf(CARD, 'ओढ़नी साड़ी'));
  assert.ok(pdf.includes('/DCTDecode'), 'expected an embedded image for Devanagari');
  assert.ok(pdf.includes('/Subtype /Image'), 'expected an image XObject');
  assert.ok(pdf.includes('/XObject <<'), 'image not registered in page resources');
  assert.ok(!pdf.includes('(ओढ़नी'), 'raw Devanagari must not be emitted as Helvetica text');
});

test('parentheses and backslashes in a shop name cannot corrupt the file', () => {
  // Unescaped, these end the PDF string early and produce an unopenable file.
  const pdf = asText(buildCardPdf(CARD, 'Sharma (and) Sons \\ Co'));
  assert.ok(pdf.includes('(Sharma \\(and\\) Sons \\\\ Co) Tj'), 'string not escaped');
  assert.ok(pdf.trimEnd().endsWith('%%EOF'));
});

test('the QR encodes the live card URL, not a local path', () => {
  const pdf = asText(buildCardPdf(CARD, 'Odhni Sarees'));
  assert.ok(pdf.includes('ayushjaiswaldtu.github.io/custella/#/s/B06422B4'),
    'footer should show the real card link');
});

// Written for the render check in package.json.
if (process.env.WRITE_PDF) {
  fs.writeFileSync(process.env.WRITE_PDF, Buffer.from(buildCardPdf(CARD, 'Odhni Sarees')));
}
