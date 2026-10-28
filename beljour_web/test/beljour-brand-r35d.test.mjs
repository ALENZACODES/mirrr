/** Public brand system checks. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { proofGraphicSvg } from '../dist/js/layout/editorial/proof-graphic.js';
import { createEditorialCover } from '../dist/js/layout/editorial/cover.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const title = 'BELJOUR — FULL BEAUTY STUDIO';
const line = 'Your best day. Still you.';
const root = new URL('../', import.meta.url);
const publicPages = ['home.html', 'trust.html', 'studio.html', 'index.html'];

for (const name of publicPages) {
  test(`${name} carries the full public name without a retired mark`, () => {
    const content = readFileSync(new URL(name, root), 'utf8');
    assert.ok(content.includes(title));
    assert.ok(content.includes(line));
    assert.doesNotMatch(content, /LOOK\.GOOD|>LG<|>BJ</);
    assert.match(content, /<title>BELJOUR — FULL BEAUTY STUDIO/);
    assert.match(content, /#000091/);
  });
}

test('Home and Trust use the same serif wordmark with descriptor and tagline', () => {
  for (const page of ['home.html', 'trust.html']) {
    const content = readFileSync(new URL(page, root), 'utf8');
    assert.match(content, /<span class="lg-wordmark">BELJOUR<\/span>/);
    assert.match(content, /<span class="lg-brand-descriptor">FULL BEAUTY STUDIO<\/span>/);
    assert.match(content, /<span class="lg-brand-tagline">Your best day\. Still you\.<\/span>/);
    assert.doesNotMatch(content, /lg-monogram/);
  }
});

test('PWA keeps its internal asset route but publicly displays the new name', () => {
  const meta = JSON.parse(readFileSync(new URL('public/manifest.webmanifest', root), 'utf8'));
  assert.equal(meta.name, title);
  assert.equal(meta.short_name, title);
  assert.ok(meta.description.startsWith(line));
  assert.equal(meta.icons[0].src, '/icons/beljour.svg');
  const vector = readFileSync(new URL('public/icons/beljour.svg', root), 'utf8');
  assert.ok(vector.includes(title));
  assert.ok(vector.includes(line));
  assert.doesNotMatch(vector, />LG<|>BJ<|LOOK\.GOOD/);
  for (const colour of ['#000091', '#FFFFFF', '#E1000F']) {
    assert.ok(vector.includes(colour));
  }
});

test('editorial cover names the studio and preserves the actual canvas', () => {
  const fixture = sequencePage();
  try {
    const canvas = fixture.document.createElement('canvas');
    const frame = createEditorialCover(fixture.document, canvas, {
      origin: 'drawn', subject: 'main', step: 'compare', position: 7, total: 16,
    });
    assert.equal(frame.querySelector('canvas'), canvas);
    assert.match(frame.textContent, /BELJOUR/);
    assert.match(frame.textContent, /FULL BEAUTY STUDIO/);
    assert.match(frame.textContent, /Your best day\. Still you\./);
    assert.doesNotMatch(frame.textContent, /LOOK\.GOOD|\bLG\b/);
  } finally {
    fixture.cleanup();
  }
});

test('the current illustration, SVG and review note carry no retired mark', () => {
  const empty = {
    drawnLoaded: false, subjectChosen: false, localPermission: false,
    editCount: 0, requestedDownload: false, mockTryon: false, cacheFrames: 0,
  };
  const svg = proofGraphicSvg(empty);
  const staticSvg = readFileSync(new URL('public/editorial-review/proof-wall-sample.svg', root), 'utf8');
  assert.equal(svg, staticSvg);
  assert.match(svg, /BELJOUR/);
  assert.match(svg, /FULL BEAUTY STUDIO/);
  assert.match(svg, /Your best day\. Still you\./);
  assert.doesNotMatch(svg, /LOOK\.GOOD|>LG<|>BJ</);
  assert.doesNotMatch(svg, /<script\b|<image\b|<foreignObject\b/);
});

test('visible stylesheet never paints a two-letter wordmark and keeps 12px labels', () => {
  const css = readFileSync(new URL('layout.css', root), 'utf8');
  assert.match(css, /\.lg-demo-wordmark/);
  assert.match(css, /\.lg-editorial-brand-lockup/);
  assert.match(css, /\.lg-brand-descriptor/);
  assert.match(css, /font-size:\s*0\.75rem/);
  assert.doesNotMatch(css, /\.lg-monogram\s*\{/);
  assert.doesNotMatch(css, /Penn-inspired/);
});

test('technical data formats remain backward compatible', () => {
  const report = readFileSync(new URL('src/layout/editorial/proof-graphic.ts', root), 'utf8');
  const look = readFileSync(new URL('src/layout/my-looks.ts', root), 'utf8');
  assert.match(report, /beljour-proof-graphic\/1/);
  assert.match(look, /beljour-my-look\/1/);
});
