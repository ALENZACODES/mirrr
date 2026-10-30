/** Homepage cards (audit 2026-10-30, Fix 8): the 5 Ritual Pillars, 9 Festivals and 12 Power
 * Ingredients were plain text styled as cards. Each card now opens a real destination: a view, a
 * Library guide, or a Library search, and every guide or search it points to exists and has text.
 * Run: node --test test/home_cards.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { GUIDES } from '../src/library/catalog.js';
import { LIBRARY_COMMUNITIES } from '../src/library/communities.js';
import { searchLibrary, readGuide } from '../src/library/index.js';

const html = fs.readFileSync('public/index.html', 'utf8');
const section = (id) => html.slice(html.indexOf(`id="${id}"`), html.indexOf('</section>', html.indexOf(`id="${id}"`)));
const cards = (id, cls) => [...section(id).matchAll(new RegExp(`<div class="${cls}(?: [^"]*)?"([^>]*)>`, 'g'))].map(m => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const views = new Set([...html.matchAll(/id="view-([\w-]+)"/g)].map(m => m[1]));
const guideIds = new Set(GUIDES.map(g => g.id));
const communityIds = new Set(LIBRARY_COMMUNITIES.map(c => c.id ?? c));

function checkCard(tag) {
  assert.match(tag, /home-link/, tag);
  assert.match(tag, /role="button"/, tag);
  assert.match(tag, /tabindex="0"/, tag);
  const view = attr(tag, 'data-goto-view');
  if (view) { assert.ok(views.has(view), `no view ${view}`); return 'view'; }
  assert.match(tag, /data-lib-link/, tag);
  const guide = attr(tag, 'data-lib-at-guide');
  const q = attr(tag, 'data-lib-at-q');
  const community = attr(tag, 'data-lib-at-community');
  assert.ok(guide || q, `card goes nowhere: ${tag}`);
  if (community) assert.ok(communityIds.has(community), `unknown community ${community}`);
  if (guide) {
    assert.ok(guideIds.has(guide), `no guide ${guide}`);
    const g = readGuide(guide, community ?? null);
    assert.ok(g && g.sections.length > 0, `${guide} has no sections`);
  }
  if (q) assert.ok(searchLibrary(q, community ? { community } : {}).total > 0, `search "${q}" finds nothing`);
  return guide ? 'guide' : 'search';
}

test('all 9 Ritual Pillars open something, including the 5 that were dead', () => {
  const pillars = cards('pillars-section', 'pillar-card');
  assert.equal(pillars.length, 9);
  for (const p of pillars) checkCard(p);
  for (const k of ['sleep', 'exercise', 'mental', 'eco', 'medicine']) assert.ok(pillars.some(p => p.includes(`data-pillar="${k}"`)), k);
  assert.doesNotMatch(section('pillars-section'), /onclick=/);
});

test('all 9 festival cards open the Festival Beauty guide for their community, searched for that festival', () => {
  const fest = cards('festivals-section', 'festival-card');
  assert.equal(fest.length, 9);
  for (const f of fest) {
    assert.equal(checkCard(f), 'guide');
    assert.equal(attr(f, 'data-lib-at-guide'), 'festival_beauty_ethnic_guide');
    assert.ok(attr(f, 'data-lib-at-community'));
    assert.ok(attr(f, 'data-lib-at-q'));
  }
});

test('all 12 Power Ingredients open a Library search that finds that ingredient', () => {
  const ing = cards('ingredients-section', 'ingredient-card');
  assert.equal(ing.length, 12);
  for (const i of ing) assert.equal(checkCard(i), 'search');
});

test('every home card says where it goes, and the marquee is plain text', () => {
  for (const id of ['pillars-section', 'festivals-section', 'ingredients-section']) {
    const s = section(id);
    const n = (s.match(/class="(pillar|festival|ingredient)-card[ "]/g) ?? []).length;
    const ctas = (s.match(/class="home-cta"/g) ?? []).length;
    assert.equal(ctas, n, `${id}: ${ctas} labels for ${n} cards`);
  }
  const bar = html.slice(html.indexOf('<div class="community-bar"'), html.indexOf('<!-- ─── NAV'));
  assert.doesNotMatch(bar, /<a |<button|onclick|data-lib-link|data-goto-view/);
  assert.match(html, /\.community-bar, \.community-bar \* \{ cursor: default;/);
});

test('the scripts handle the card attributes, by click and by keyboard', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  const lib = fs.readFileSync('public/library.js', 'utf8');
  assert.match(app, /closest\?\.\('\[data-goto-view\]'\)/);
  assert.match(app, /\.home-link\[role="button"\]/);
  assert.match(lib, /closest\('\[data-lib-link\]'\)/);
  assert.match(lib, /window\.mirrrOpenLibrary = /);
});
