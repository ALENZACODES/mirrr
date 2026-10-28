/** Original ink illustrations and preview identity. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  HOUSE_ART_KINDS,
  HOUSE_BLUE,
  HOUSE_RED,
  HOUSE_WHITE,
  createHouseArt,
  houseArt,
  houseArtMarkup,
} from '../dist/js/layout/editorial/house-art.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const preview = name => readFileSync(new URL(`../public/editorial-review/${name}.svg`, import.meta.url), 'utf8');

test('palette uses the exact French colours without outside resources', () => {
  assert.equal(HOUSE_BLUE, '#000091');
  assert.equal(HOUSE_RED, '#E1000F');
  assert.equal(HOUSE_WHITE, '#FFFFFF');
  assert.deepEqual([...HOUSE_ART_KINDS], ['portrait', 'figure', 'trust']);
});

for (const kind of HOUSE_ART_KINDS) {
  test(`${kind}: original path set has a restrained blue/red grammar`, () => {
    const art = houseArt(kind);
    assert.equal(art.kind, kind);
    assert.ok(art.strokes.length >= 9);
    assert.ok(art.strokes.some(stroke => stroke.stroke === 'red'));
    assert.ok(art.strokes.some(stroke => stroke.fill === 'wash'));
    assert.ok(art.strokes.every(stroke => ['red', 'blue', 'none'].includes(stroke.stroke)));
    assert.ok(art.strokes.every(stroke => ['white', 'blue', 'red', 'wash', 'none'].includes(stroke.fill)));
    assert.ok(art.strokes.every(stroke => /^M\d/.test(stroke.d)));
    assert.ok(art.strokes.every(stroke => (stroke.weight ?? 1) <= 2.1));
  });

  test(`${kind}: reviewed vector equals canonical runtime artwork`, () => {
    const markup = houseArtMarkup(kind);
    assert.equal(preview(kind), markup);
    assert.match(markup, /role="img" aria-label="/);
    assert.match(markup, /viewBox="0 0 240 320"/);
    assert.doesNotMatch(markup, /<script\b|<image\b|<foreignObject\b|<use\b/i);
    assert.doesNotMatch(markup.replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"/, ""),
      /https?:\/\/|javascript:|onload=|onerror=/i);
    assert.ok(markup.length < 12_000);
  });

  test(`${kind}: accessible DOM paths are created without parsing markup`, () => {
    const page = sequencePage();
    try {
      const art = createHouseArt(page.document, kind);
      assert.equal(art.tagName, 'SVG');
      assert.equal(art.getAttribute('viewBox'), '0 0 240 320');
      assert.equal(art.getAttribute('role'), 'img');
      assert.match(art.getAttribute('aria-label'), /portrait|figure|hand/i);
      assert.equal(art.querySelectorAll('path').length, houseArt(kind).strokes.length);
      assert.equal(art.querySelectorAll('script').length, 0);
    } finally { page.cleanup(); }
  });
}

test('unknown artwork identity fails closed', () => {
  assert.throws(() => houseArt('unknown'), /Unknown house illustration/);
  assert.throws(() => houseArtMarkup('unknown'), /Unknown house illustration/);
});
