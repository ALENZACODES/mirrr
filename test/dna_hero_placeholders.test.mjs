// DNA Quiz result hero shows the community's portrait photo, not its icon or swatch (inventory line 277),
// and photo cards never flash black: palette placeholders, fixed boxes, first row eager (inventory footer).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import vm from 'node:vm';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const app = readFileSync(join(PUB, 'app.js'), 'utf8');
const block = app.match(/const COMMUNITY_PORTRAITS = \{([\s\S]*?)\};/)[1];
const portraits = Object.fromEntries([...block.matchAll(/'([a-z-]+)':\s*'([^']+)'/g)].map(m => [m[1], m[2]]));

test('every quiz community has a portrait photo file, reused from its signature look', () => {
  const icons = app.match(/const COMMUNITY_IMAGES = \{([\s\S]*?)\};/)[1];
  const slugs = [...icons.matchAll(/'([a-z-]+)':/g)].map(m => m[1]);
  assert.equal(slugs.length, 15);
  for (const s of slugs) {
    assert.ok(portraits[s], `${s} has a portrait`);
    assert.ok(existsSync(join(PUB, portraits[s])), portraits[s]);
    assert.doesNotMatch(portraits[s], /^community-/, `${s} is a photo, not the icon`);
  }
});

test('hero uses the portrait, labels it generated, and falls back to the icon if the photo fails', () => {
  assert.match(app, /topPortrait\s*\n?\s*\? `<figure class="dna-hero-figure"/);
  assert.match(app, /class="dna-big-photo"[^>]*loading="eager"/);
  assert.match(app, /onerror="this\.onerror=null;this\.nextElementSibling\?\.remove\(\);\$\{topComImg \? `this\.src='\$\{topComImg\}'`/);
  assert.match(app, /dna-hero-figure[\s\S]{0,600}Generated photo, not a real person/);
});

test('placeholders: every shipped photo has a palette colour; first row loads eagerly', () => {
  const src = readFileSync(join(PUB, 'photo-placeholders.js'), 'utf8');
  const html = readFileSync(join(PUB, 'index.html'), 'utf8');
  assert.ok(html.indexOf('photo-placeholders.js') > -1 && html.indexOf('photo-placeholders.js') < html.indexOf('app.js'));
  const pal = JSON.parse(src.match(/const PALETTE = (\{.*?\});/)[1]);
  for (const f of Object.values(portraits)) assert.match(pal[f], /^#[0-9a-f]{6}$/, f);
  assert.ok(pal['wigs/pixie_cut.webp']);
  // Run it on a fake DOM: the 1st card's lazy photo turns eager and gets its colour, the 6th stays lazy.
  const mk = (i, grid) => {
    const img = { tagName: 'IMG', dataset: {}, style: {}, loading: 'lazy', complete: false, naturalWidth: 0, classList: { add() {}, remove() {} },
      getAttribute: k => (k === 'src' ? '/wigs/pixie_cut.webp' : null), setAttribute(k, v) { this[k] = v; }, addEventListener() {} };
    const card = { parentElement: grid }; img.parentElement = { classList: { contains: () => false }, style: {} };
    img.closest = () => card; grid.children.push(card); return img;
  };
  const grid = { children: [] }; const imgs = Array.from({ length: 6 }, (_, i) => mk(i, grid));
  const ctx = { location: { href: 'https://x.test/' }, URL, document: { body: null, addEventListener() {} }, window: {} };
  vm.runInNewContext(src, ctx);
  imgs.forEach(i => ctx.window.mirrrPhotoPlaceholder(i));
  assert.equal(imgs[0].loading, 'eager');
  assert.equal(imgs[0].style.backgroundColor, pal['wigs/pixie_cut.webp']);
  assert.equal(imgs[5].loading, 'lazy');
});

test('the near-black Style Match box no longer shows while photos load', () => {
  const css = readFileSync(join(PUB, 'styles.css'), 'utf8');
  assert.match(css, /\.sm-photo img\.ph-loaded \{ opacity: 1; \}/);
});
