/** French clinic UI rules; no institutional logos or decorative red text. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { TOUR_THEME } from '../dist/js/layout/continuous/contract.js';

const css = readFileSync(new URL('../layout.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/layout/continuous/mount.ts', import.meta.url), 'utf8');
const cassette = readFileSync(new URL('../src/ui/shell/continuous-cassette-panel.ts', import.meta.url), 'utf8');

test('the four canonical French clinic colours are exact', () => {
  assert.deepEqual(TOUR_THEME, { blue: '#000091', red: '#E1000F', white: '#FFFFFF' });
  assert.match(css, /--lg-demo-blue:\s*#000091/);
  assert.match(css, /--lg-demo-red:\s*var\(--lg-french-rouge\)/);
});

test('the storybook style uses serif headings and clinic-thin rules', () => {
  assert.match(css, /\.lg-cont-header[\s\S]*?border-block-start:\s*2px solid #000091/);
  assert.match(css, /\.lg-cassette-heading[\s\S]*?font-family:\s*Georgia/);
  assert.match(css, /\.lg-cassette-panel[\s\S]*?border:\s*1px solid #DCDCE6/);
});

test('the retired two-letter mark is replaced with a full Editorial Ivy wordmark', () => {
  assert.match(css, /\.lg-demo-monogram/);
  assert.match(css, /\.lg-cassette-monogram/);
  assert.match(css, /\.lg-demo-wordmark/);
  assert.match(css, /\.lg-demo-brand-description/);
  assert.match(css, /\.lg-demo-brand-tagline/);
  assert.match(css, /border-block-end:\s*1px solid var\(--lg-french-rouge\)/);
  assert.match(source, /BELJOUR/);
  assert.match(cassette, /FULL BEAUTY STUDIO/);
  assert.match(cassette, /Your best day\. Still you\./);
  assert.doesNotMatch(cassette, /\"LG\"|\"BJ\"/);
  assert.doesNotMatch(css, /\.lg-cassette-(?:card|caption|status)\s*\{[^}]*color:\s*#E1000F/i);
});

test('there are no Penn references in the authored tour and presentation', () => {
  assert.doesNotMatch(source, /penn/i);
  assert.doesNotMatch(cassette, /penn/i);
  assert.doesNotMatch(css.slice(css.indexOf('Lane D: French clinic')), /penn/i);
});

test('small caps apply to provenance, not a fake verified-provider badge', () => {
  assert.match(css, /\.lg-cassette-provenance\s*\{\s*font-variant-caps:\s*all-small-caps/);
  assert.doesNotMatch(cassette, /verified by YouCam|official provider result/i);
});

test('interactive elements use keyboard-visible focus and 44px targets', () => {
  assert.match(css, /\.lg-cassette-button,\s*\.lg-cassette-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.lg-cassette-button:focus-visible/);
  assert.match(css, /\.lg-cassette-acknowledge:focus-within/);
});

test('mobile cards use one column and reduced motion is respected', () => {
  assert.match(css, /@media \(max-width:\s*600px\)/);
  assert.match(css, /\.lg-cassette-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
});
