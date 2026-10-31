// Relay fixes (Oct 30 judge pass): studio photos on first view, saved shade in the chain,
// no solid-rectangle image flash, nothing pre-selected at the chain's look step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const read = f => readFileSync(join(PUB, f), 'utf8');

function loadSP() {
  const ctx = { window: {}, document: { readyState: 'complete', body: null, addEventListener() {}, querySelectorAll: () => [] }, MutationObserver: class { observe() {} }, URL, Blob: class {}, Image: class {} };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('studio-photos.js'), ctx); vm.runInContext(read('studio-photo.js'), ctx);
  return ctx.window;
}

test('first view of Smile, Nails and Hair Colour renders real photos from the manifest, and every file exists', () => {
  const w = loadSP();
  for (const [file, studio, ids] of [['smile.js', 'smile', ['smile-healthy', 'smile-lips_care']], ['nails.js', 'nails-real', ['oval__mocha__creme', 'oval__bold_red__creme', 'oval__fuchsia__chrome', 'almond__mocha__creme']], ['hairlab.js', 'hair', ['level1', 'level4', 'caramel', 'burgundy']]]) {
    const js = read(file);
    assert.match(js, new RegExp(`function renderBase\\(\\) \\{[\\s\\S]*?put\\('Preview', window\\.StudioPhoto \\? window\\.StudioPhoto\\.gallery\\('${studio}'`), file);
    for (const id of ids) {
      assert.match(js, new RegExp(`id: '${id}'`), `${file} ${id}`);
      const ph = w.StudioPhoto.photoFor(studio, id); assert.ok(ph, `${studio}/${id} in manifest`);
      assert.ok(existsSync(join(PUB, ph.src)), ph.src);
    }
  }
});

test('gallery tiles are plain <img> with width/height, aspect-ratio, shimmer class and fade-in hook; missing ids are skipped', () => {
  const { StudioPhoto: SP } = loadSP();
  const html = SP.gallery('smile', [{ id: 'smile-healthy', title: 'A healthy smile' }, { id: 'nope', title: 'x' }]);
  assert.equal((html.match(/<img /g) || []).length, 1);
  assert.match(html, /class="sp-img"[^>]*width="960" height="720"/);
  assert.match(html, /aspect-ratio:960\/720/);
  assert.match(html, /onload="this\.classList\.add\('sp-loaded'\)"/);
  assert.equal(SP.gallery('smile', [{ id: 'nope', title: 'x' }]), '');
  assert.doesNotMatch(html, /generated/i);
});

test('the illustration disclaimers are gone from Smile, Nails and Hair Colour; no "generated" caption in those studios', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /The strands are an illustration/);
  assert.doesNotMatch(html, /The hand is an illustration/);
  assert.doesNotMatch(html, /The smile is an illustration/);
  assert.match(html, /The hands are photos of a model's manicure with the polish actually on/);
  for (const f of ['smile.js', 'nails.js', 'hairlab.js']) assert.doesNotMatch(read(f).replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''), /generated/i, f);
});

test('image loading state: shimmer + fade-in instead of a solid block, boxes keep their size', () => {
  const css = read('styles.css');
  assert.match(css, /@keyframes mirrrShimmer/);
  assert.match(css, /img\.ph-wait, \.sp-img:not\(\.sp-loaded\), \.studio-photo:not\(\.sp-ready\) canvas \{/);
  assert.match(css, /img\.ph-loaded, \.sp-img\.sp-loaded, \.studio-photo\.sp-ready canvas \{ animation: mirrrFadeIn/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('chain: the look step has nothing pre-selected and badges the top pick', () => {
  const js = read('sixty.js');
  assert.match(js, /lookIdx: null/);
  assert.match(js, /sx\.lookIdx = null; \/\/ nothing pre-selected/);
  assert.doesNotMatch(js, /sx\.lookIdx = sx\.outcome\.failed \? null : 0/);
  assert.match(js, /Qloo's top pick for your taste/);
  assert.match(js, /data-sx-toppick/);
});

test('chain: a saved shade is used, and a different finder top match is explained with a switch', () => {
  const js = read('sixty.js');
  assert.match(js, /function savedShade\(\)/);
  assert.match(js, /mirrr\.profile\.v1'\)\?\.face/);
  assert.match(js, /so the plan uses \$\{sv\.name\}\. Tap \$\{top\.name\} below to switch\./);
  assert.match(js, /data-sx-saved/);
  assert.match(js, /Planned in \$\{sh\.saved \? 'your saved shade' : 'your shade'\}/);
});
