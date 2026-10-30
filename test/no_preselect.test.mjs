// John's rule: nothing is pre-selected in any options step. Every studio dropdown opens on a disabled
// "Choose…", and until the first pick the studio shows its neutral base instead of a plan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const read = f => readFileSync(join(PUB, f), 'utf8');
const STUDIOS = ['ageing', 'bridal', 'bump', 'calm', 'colour-studio', 'complexion', 'eco', 'hairlab', 'hairremoval', 'journeys', 'leap', 'looks', 'mix', 'nails', 'night', 'routine', 'skin', 'smile'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Pull the studio's own select() out of its source and run it.
function selectOf(src) {
  const m = src.match(/ {2}function select\(id, (?:text|label), values, current\) \{\n([\s\S]*?)\n {2}\}/);
  assert.ok(m, 'select() found');
  const PICKED = new Set(); const OWN = new Set();
  const fn = new Function('esc', 'PICKED', 'OWN', `return function select(id, text, values, current) { const label = text; ${m[1]} }`)(esc, PICKED, OWN);
  return { fn, PICKED, OWN };
}

for (const f of STUDIOS) {
  test(`${f}: dropdowns open on a disabled "Choose…" and show a value only once picked`, () => {
    const src = read(`${f}.js`);
    const { fn, PICKED, OWN } = selectOf(src);
    const vals = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const before = fn('xId', 'X', vals, 'b');
    assert.match(before, /<option value="" disabled selected>Choose…<\/option>/);
    assert.equal((before.match(/ selected/g) || []).length, 1, 'only the placeholder is selected');
    assert.ok(OWN.has('xId'));
    PICKED.add('xId');
    const after = fn('xId', 'X', vals, 'b');
    assert.match(after, /<option value="" disabled>Choose…<\/option>/);
    assert.match(after, /<option value="b" selected>B<\/option>/);
    // undefined current must not crash or select anything
    assert.doesNotThrow(() => fn('yId', 'Y', vals, undefined));
    // first open renders the neutral base; the change listener records picks before replanning
    assert.match(src, /if \(anyPicked\(\)(?: \|\| lp\.choices\.lookId)?\) await replan\(\); else renderBase\(\);/);
    assert.match(src, /document\.addEventListener\('change', e => \{\n {4}if \(OWN\.has\(e\.target\.id\) && e\.target\.value !== ''\) PICKED\.add\(e\.target\.id\);/);
    assert.match(src, /function renderBase\(\) \{[\s\S]*?put\('Summary', '<p class="lib-note choose-first">Choose your options above/);
  });
}

test('nails and lips show the bare base plate (no paint) before the first pick', () => {
  assert.match(read('nails.js'), /put\('Preview', window\.StudioPhoto \? window\.StudioPhoto\.panel\(\{ studio: 'nails', id: 'oval', fallback: '', w: 960, h: 720, alt: 'Hand with bare nails' \}\)/);
  assert.match(read('colour-studio.js'), /put\('Preview', window\.StudioPhoto \? window\.StudioPhoto\.panel\(\{ studio: 'lips', id: 'nude', fallback: '', w: 960, h: 720, alt: 'Lips, no colour chosen yet' \}\)/);
});

test('brow & kohl: "Choose…" placeholder, "Recommended for me" is a real pick, base state until the first pick', () => {
  const js = read('studio.js');
  assert.match(js, /<option value="" disabled\$\{on \? '' : ' selected'\}>Choose…<\/option>/);
  assert.match(js, /<option value="auto"\$\{on && !current \? ' selected' : ''\}>Recommended for me<\/option>/);
  assert.match(js, /e\.target\.value === 'auto' \? '' : e\.target\.value/);
  assert.match(js, /if \(stAnyPicked\(\)\) \{ await replan\(\); renderControls\(\); \} else renderStudioBase\(\);/);
});

test('hair colour: the target colour also opens on "Choose…", and "Recommended for me" is a real technique pick', () => {
  const js = read('hairlab.js');
  assert.match(js, /<select id="hlTarget"><option value="" disabled\$\{PICKED\.has\('hlTarget'\) \? '' : ' selected'\}>Choose…<\/option>/);
  assert.match(js, /PICKED\.has\('hlTarget'\) && t\.id === c\.target/);
  assert.match(js, /\{ id: 'auto', label: 'Recommended for me' \}/);
  assert.match(js, /k === 'technique' && e\.target\.value === 'auto' \? ''/);
});
