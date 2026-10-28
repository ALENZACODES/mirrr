/** Local Proof Wall SVG is a review artifact, never gate evidence. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  PROOF_GRAPHIC_SIZE,
  breakProofText,
  proofGraphicSummary,
  proofGraphicSvg,
  xmlText,
} from '../dist/js/layout/editorial/proof-graphic.js';

const empty = {
  drawnLoaded: false, subjectChosen: false, localPermission: false,
  editCount: 0, requestedDownload: false, mockTryon: false, cacheFrames: 0,
};
const active = {
  drawnLoaded: true, subjectChosen: true, localPermission: true,
  editCount: 7, requestedDownload: true, mockTryon: true, cacheFrames: 3,
};

test('SVG size is fixed to portrait social review dimensions', () => {
  assert.deepEqual(PROOF_GRAPHIC_SIZE, { width: 1080, height: 1350 });
  const document = proofGraphicSvg(empty);
  assert.match(document, /width="1080" height="1350" viewBox="0 0 1080 1350"/);
  assert.match(document, /The Proof Wall/);
  assert.match(document, /BELJOUR/);
  assert.match(document, /FULL BEAUTY STUDIO/);
  assert.match(document, /Your best day\. Still you\./);
  assert.doesNotMatch(document, />LG<|LOOK\.GOOD/);
  assert.match(document, /NOT RELEASE CERTIFICATION/);
  assert.ok(document.length < 24_000);
});

test('unobserved example contains no fabricated outcomes', () => {
  const result = proofGraphicSummary(empty);
  assert.deepEqual(result, {
    format: 'beljour-proof-graphic/1',
    observed: 0, mock: 0, pending: 8,
    readyForRelease: false,
    source: 'local-demo-observations',
  });
  const svg = proofGraphicSvg(empty);
  assert.match(svg, /0 local observations/);
  assert.match(svg, /8 not verified/);
  assert.match(svg, /Live YouCam, real-face and 100,000-face gates need separate evidence/);
  assert.doesNotMatch(svg, /verified on live users|96%|100,000\+ faces/i);
});

test('only locally observed and mock branches move the displayed counters', () => {
  const summary = proofGraphicSummary(active);
  assert.equal(summary.observed, 4);
  assert.equal(summary.mock, 1);
  assert.equal(summary.pending, 3);
  assert.equal(summary.readyForRelease, false);
  const svg = proofGraphicSvg(active);
  assert.match(svg, /4 local observations/);
  assert.match(svg, /1 mock/);
  assert.match(svg, /3 not verified/);
  assert.match(svg, /Download requested; saved file not/);
  assert.match(svg, /NOT VERIFIED/);
});

test('exported SVG is self-contained and has no running code or external media', () => {
  const svg = proofGraphicSvg(active);
  assert.match(svg, /stroke="#DCDCE6"/);
  assert.match(svg, /fill="#000091"/);
  assert.match(svg, /stroke="#E1000F"/);
  assert.doesNotMatch(svg, /<script\b|<image\b|<foreignObject\b|<use\b/i);
  assert.doesNotMatch(svg.replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"/, ''),
    /https?:\/\/|javascript:|onload=|onerror=/i);
  assert.doesNotMatch(svg, /<iframe|<style|@import|font-face/);
});

test('the review SVG is a fully unverified baseline', () => {
  const preview = readFileSync(new URL('../public/editorial-review/proof-wall-sample.svg', import.meta.url), 'utf8');
  assert.equal(preview, proofGraphicSvg(empty));
});

for (const value of ['<unsafe>&"\'', '<script>alert(1)</script>', 'a & b']) {
  test('XML encoder does not let words become markup', () => {
    const result = xmlText(value);
    assert.doesNotMatch(result, /<script|<unsafe>|&(?!(?:amp|lt|gt|quot|apos);)/);
  });
}

test('text line wrapper keeps every word while respecting the width', () => {
  const phrase = 'Existing demonstration evidence cannot prove independently verified product results';
  const lines = breakProofText(phrase, 38);
  assert.equal(lines.join(' '), phrase);
  assert.ok(lines.length <= 3);
  assert.ok(lines.every(line => line.length <= 38));
});

for (const limit of [2, 11, 49, Number.NaN, 2.7]) {
  test(`unsafe line widths are rejected: ${String(limit)}`, () => {
    assert.throws(() => breakProofText('text', limit));
  });
}

test('a single unbreakable long token is refused', () => {
  assert.throws(() => breakProofText('x'.repeat(55), 38));
});
