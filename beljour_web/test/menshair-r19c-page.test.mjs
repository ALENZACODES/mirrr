/** R19 Lane C's preference-only gallery is a real, rendered page without data upload. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('commerce.html','utf8');
const styling=readFileSync('commerce.css','utf8');
const setup=readFileSync('src/commerce/hair-demo.ts','utf8');
const main=readFileSync('src/commerce/page.ts','utf8');
const consultation=readFileSync('src/engines/menshair/consultation.ts','utf8');
const ids=[...html.matchAll(/\bid="([a-z][\w-]+)"/g)].map(x=>x[1]);

test('all preference controls have unique identifiers and visible labels',()=>{
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ['hair-texture','hair-length-preference','hair-fade-preference',
    'hair-shape-preference','hair-scalp-preference','hair-maintenance-preference',
    'hair-short-sides-only','hair-volume-preference','hair-recommend',
    'hair-clear-recommendations','hair-consult-list','hair-consult-status']) {
    assert.ok(ids.includes(id),id);
    if(!id.includes('list')&&!id.includes('status')) assert.match(html,new RegExp(`(?:for|id)="${id}"`));
  }
  assert.match(html,/hair-consult-status" role="status" aria-live="polite"/);
});

test('local renderer and consultation have live page listeners and safe text rendering',()=>{
  assert.ok(main.includes('setupHairDemo()'));
  assert.ok(setup.includes('findConcepts(subset, p'));
  assert.ok(setup.includes('consult.addEventListener("click"'));
  assert.ok(setup.includes('clearConsult.addEventListener("click"'));
  assert.ok(setup.includes('pick.addEventListener("click"'));
  assert.ok(setup.includes('pick.textContent'));
  assert.ok(!setup.includes('.innerHTML ='));
  assert.match(html,/not a verified haircut|not automatic hairstyle generation/i);
});

test('preferences are explicitly user chosen, not inferred or sent to a server',()=>{
  assert.ok(setup.includes('parseConsultation(raw)'));
  assert.ok(setup.includes('element<HTMLSelectElement>("hair-texture").value'));
  assert.ok(setup.includes('element<HTMLInputElement>("hair-short-sides-only").checked'));
  assert.doesNotMatch(setup.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,''),/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon|\.upload\s*\(/);
  assert.doesNotMatch(consultation,/import.+api\.js|fetch\s*\(|FormData/);
  assert.match(html,/not your gender/);
});

test('styling controls are touch sized, readable, focusable and work on small screens',()=>{
  assert.match(styling,/\.hair-consultation select, \.hair-consultation input\[type="number"\]/);
  assert.match(styling,/min-height: 2\.75rem/);
  assert.match(styling,/@media \(max-width: 560px\)/);
  assert.match(setup,/select\.focus\(\)/);
  assert.match(html,/aria-describedby="hair-preference-explainer"/);
});

test('script data is nonexecuting JSON and matches the original source',()=>{
  const found=html.match(/<script id="menshair-presets-data" type="application\/json">([^<]*)<\/script>/);
  assert.ok(found);
  const actual=JSON.parse(found[1]);
  const source=JSON.parse(readFileSync('../api/plumb_api/engines/menshair/presets.json','utf8'));
  assert.deepEqual(actual,source);
  assert.ok(actual.styles.length>=350);
  assert.ok(actual.styles.some(s=>s.presentation==='feminine' && s.fade_shape==='temple'));
  assert.ok(actual.styles.some(s=>s.presentation==='masculine' && s.fade_shape==='skin'));
});
