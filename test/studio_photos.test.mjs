// Studio photo plates (studio-photo.js): one visual slot per studio, a plate keyed by the data id,
// option logic painted on the photo, and the old drawing whenever the plate is missing or fails.
// Inventory: nails 407-444, lips 391-404, brow & kohl 281-295, skin clinic 365-375, ingredients 36-47/584-613/637-668.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import vm from 'node:vm';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const read = f => readFileSync(join(PUB, f), 'utf8');
const helper = read('studio-photo.js');

function load(photos) {
  const window = { STUDIO_PHOTOS: photos };
  const document = { readyState: 'complete', body: null, querySelectorAll: () => [], addEventListener() {} };
  vm.runInNewContext(helper, { window, document, Image: class {}, MutationObserver: class { observe() {} } });
  return window.StudioPhoto;
}

test('a missing plate returns the drawing unchanged (fallback)', () => {
  const SP = load({});
  assert.equal(SP.panel({ studio: 'nails', id: 'oval', fallback: '<svg>hand</svg>' }), '<svg>hand</svg>');
  assert.equal(SP.ingredientImg('argan_oil', 'Argan Oil'), '');
});

test('a present plate renders a canvas slot, keyed by the data id, captioned as generated', () => {
  const SP = load({ nails: { oval: { src: '/studio/nails/oval.webp', mask: '/studio/nails/oval.mask.webp' } } });
  const html = SP.panel({ studio: 'nails', id: 'oval', alt: 'Hand', fallback: '<svg/>', paint: { colour: '#7a1f2b' } });
  assert.match(html, /data-studio-photo="nails:oval"/);
  assert.match(html, /<canvas/);
  assert.doesNotMatch(html, /not a real person|gen-badge/);
});

test('recolour logic is applied on the photo: colour into the mask, sheen, glitter, duochrome, overlays', () => {
  assert.match(helper, /globalCompositeOperation = 'destination-in'/);
  assert.match(helper, /globalCompositeOperation = paint\.mode \?\? 'multiply'/);
  for (const k of ['paint.sheen', 'paint.glitter', 'paint.duochrome', 'paint.matte', 'paint.overlays']) assert.ok(helper.includes(k), k);
  assert.match(helper, /fig\.outerHTML = fallback/);
});

test('ingredient photos dedupe by name: hyphen and _oil variants share a file', () => {
  const SP = load({ ingredients: { argan: { src: '/studio/ingredients/argan.webp' }, shea_butter: { src: '/studio/ingredients/shea_butter.webp' } } });
  assert.match(SP.ingredientImg('argan_oil', 'Argan Oil'), /argan\.webp/);
  assert.match(SP.ingredientImg('argan-oil', 'Argan'), /argan\.webp/);
  assert.match(SP.ingredientImg('shea-butter', 'Shea'), /shea_butter\.webp/);
  assert.match(SP.ingredientImg('argan', 'Argan'), /onerror="this\.remove\(\)"/);
});

test('each wired studio passes its own option values to the slot and keeps its drawing as fallback', () => {
  const nails = read('nails.js');
  assert.match(nails, /studio: 'nails', id: n\.shape\.id, fallback: drawing/);
  assert.match(nails, /colour: polish\.hex, mode: 'multiply'/);
  const lips = read('colour-studio.js');
  assert.match(lips, /studio: 'lips', id: p\.choices\.look, fallback: drawing/);
  assert.match(lips, /colour: shade, mode: 'color'/);
  const brow = read('studio.js');
  assert.match(brow, /id: `eye-\$\{p\.eye\.look\}`, fallback: drawing/);
  assert.match(brow, /id: `brow-\$\{p\.brow\.style\}`/);
  const skin = read('skin.js');
  assert.match(skin, /id: `\$\{concern\}-\$\{stage\}`, fallback: drawn/);
  assert.match(read('mix.js'), /StudioPhoto\?\.ingredientImg\(i\.id/);
  assert.match(read('eco.js'), /StudioPhoto\?\.ingredientImg\(g\.slug/);
  assert.equal((read('index.html').match(/data-ing-photo="/g) ?? []).length, 12);
});

test('every manifest entry is a real WebP within its size budget', () => {
  const src = read('studio-photos.js');
  const m = JSON.parse(src.slice(src.indexOf('=') + 1).trim().replace(/;$/, ''));
  for (const [studio, ids] of Object.entries(m)) for (const [id, e] of Object.entries(ids)) {
    for (const f of [e.src, e.mask].filter(Boolean)) {
      const p = join(PUB, f);
      assert.ok(existsSync(p), f);
      assert.equal(readFileSync(p).subarray(8, 12).toString(), 'WEBP', f);
      assert.ok(statSync(p).size <= (studio === 'ingredients' || studio === 'hair' ? 60 : 120) * 1024, `${studio}/${id}`);
    }
  }
  const html = read('index.html');
  assert.ok(html.indexOf('studio-photos.js') < html.indexOf('studio-photo.js"') && html.indexOf('studio-photo.js"') < html.indexOf('nails.js'));
});

test('smile, hair colour, complexion, ageing, night, pregnancy, bridal, calm and hair removal slots are wired with fallbacks', () => {
  const smile = read('smile.js');
  assert.match(smile, /studio: 'smile', id: `smile-\$\{id\}`, fallback: drawing/);
  assert.match(smile, /studio: 'smile', id: `practice-\$\{p\.choices\.practice\}`, fallback: drawing/);
  const hair = read('hairlab.js');
  assert.match(hair, /photoPanel\(lvl, null, 0, 'Now'/);
  assert.match(hair, /mode: 'color', opacity: alpha, whole: true/);
  assert.match(hair, /if \(!SP\?\.photoFor\('hair', photoId\)\) return drawn;/);
  const cx = read('complexion.js');
  assert.match(cx, /studio: 'face', id: `face-\$\{p\.choices\.faceShape\}`, fallback: drawing/);
  assert.match(cx, /\$\{layers\(g, skin\)\}<\/g><\/svg>`;/); // the same corrector / sculpt zones go over the photo
  for (const [f, re] of [['ageing.js', /studio: 'face', id: `age-\$\{p\.choices\.decade\}`/], ['night.js', /studio: 'night', id: p\.choices\.method/],
    ['bump.js', /studio: 'bump', id: p\.choices\.stage/], ['bridal.js', /studio: 'bridal', id: p\.choices\.style/], ['calm.js', /studio: 'calm', id: p\.focus\.id/],
    ['hairremoval.js', /studio: 'body', id: `body-\$\{p\.choices\.area\}`/], ['hairremoval.js', /studio: 'body', id: `xsec-\$\{tex\}`/]]) {
    const src = read(f);
    assert.match(src, re, f);
    assert.match(src, /if \(!window\.StudioPhoto\) return drawing;/, f);
  }
  assert.match(read('calm.js'), /Need to talk to someone now\? \$\{esc\(line\.name\)\}/); // the support line stays on the photo slot
});

test('the svg zone overlay maps onto the plate face box and is revoked after drawing', () => {
  assert.match(helper, /const \[bx, by, bw, bh\] = ph\.face \?\? \[/);
  assert.match(helper, /URL\.revokeObjectURL\(url\)/);
});
