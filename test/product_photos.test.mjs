// Product dialogs: one unbranded WebP per product type, 60 KB or less, labelled as a product type
// (never a brand), and the basis label stays exactly as it was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const app = readFileSync(join(PUB, 'app.js'), 'utf8');
const FILES = ['foundation', 'concealer', 'eyeshadow', 'lip', 'mascara', 'lash', 'blush', 'highlight', 'liner', 'setting', 'brow', 'serum'];

test('every product-type photo is a WebP of 60 KB or less', () => {
  for (const f of FILES) {
    const p = join(PUB, 'products', `${f}.webp`); const b = readFileSync(p);
    assert.equal(b.subarray(8, 12).toString(), 'WEBP', f); assert.ok(statSync(p).size <= 60 * 1024, f);
  }
});

test('the dialog maps categories to photos, says they are unbranded, and keeps the basis labels', () => {
  for (const f of FILES) assert.match(app, new RegExp(`: '${f}'`));
  assert.match(app, /unbranded product type, blank packaging/);
  assert.match(app, /generated pictures, not any brand\\'s product/);
  assert.match(app, /Curated formula for this look\./);
  assert.match(app, /Product types, not named brands\./);
  assert.match(app, /productPhoto\(p\.category\)/);
});
