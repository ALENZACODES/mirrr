/** Restrained French editorial CSS, not a copied publication design. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../layout.css', import.meta.url), 'utf8');
const block = css.slice(css.indexOf('Lane D: editorial finish'));
const mount = readFileSync(new URL('../src/layout/continuous/mount.ts', import.meta.url), 'utf8');

test('editorial finish uses exact blue and neutral white, not decorative red', () => {
  assert.ok(block.length > 2000);
  assert.match(block, /--lg-ivy-ink:\s*#000091/);
  assert.match(block, /--lg-ivy-paper:\s*#FFFFFF/);
  assert.doesNotMatch(block, /color:\s*(?:#E1000F|var\(--rouge\))/i);
});

test('serif hierarchy, small caps and hairline rules stay in our own identity', () => {
  assert.match(block, /--lg-ivy-display:\s*Georgia/);
  assert.match(block, /font-variant-caps:\s*all-small-caps/);
  assert.match(block, /border-block-start:\s*1px solid var\(--lg-ivy-ink\)/);
  assert.match(block, /\.lg-editorial-cover-brand/);
  assert.doesNotMatch(block, /fashion-magazine|\bVogue\b|\bElle\b|\bPenn\b/i);
});

test('animation is limited to transform and opacity with reduced-motion opt-out', () => {
  const frame = /@keyframes lg-ivy-page\s*\{([\s\S]*?)\n\}/.exec(block);
  assert.ok(frame);
  assert.match(frame[1], /opacity:/);
  assert.match(frame[1], /transform:\s*translate3d/);
  assert.doesNotMatch(frame[1], /left:|top:|width:|height:|margin:|padding:/);
  assert.match(block, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(block, /bounce|spring|elastic/i);
});

test('proof wall is readable at narrow viewports and does not use fake scorecards', () => {
  assert.match(block, /table-layout:\s*fixed/);
  assert.match(block, /@media \(max-width:\s*680px\)/);
  assert.match(block, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(block, /100,000\+|96%|best-selling|official award/i);
});

test('continuous view only uses its own new modules without network boundary creep', () => {
  assert.match(mount, /createEditorialCover\(/);
  assert.match(mount, /renderProofExperience\(/);
  assert.match(mount, /applyEditorialMotion\(/);
  assert.doesNotMatch(mount, /\bfetch\s*\(|new WebSocket|XMLHttpRequest/);
});
