/** R19c one-source Python/TS sample shortlist parity; no vendor requests or images. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expandCatalogue } from '../dist/js/commerce/catalogue.js';
import { buildShortlist, normalizeOptions } from '../dist/js/commerce/shortlist.js';

const root = resolve(new URL('../..', import.meta.url).pathname);
const py = process.env.BELJOUR_PYTHON || (existsSync(resolve(root,'api/.venv/bin/python')) ?
  resolve(root,'api/.venv/bin/python') : 'python3');
const run = spawnSync(py, [resolve(root,'api/tests/test_commerce_r19c_shortlist.py'),'--emit-vectors'], {
  cwd:root, encoding:'utf8', maxBuffer:12*1024*1024,
  env:{...process.env,PYTHONPATH:resolve(root,'api')},
});
assert.equal(run.status,0,run.stderr || String(run.error));
const data = JSON.parse(run.stdout);
const source = JSON.parse(readFileSync(resolve(root,'api/plumb_api/commerce/catalogue.json'),'utf8'));
const catalogue = expandCatalogue(source);

test('sample catalogues stay local, deterministic and bound all scoring inputs', () => {
  assert.equal(data.format,'beljour-commerce-shortlist-r19c/1');
  assert.equal(data.synthetic_only,true);
  assert.equal(data.provider_calls,0);
  assert.equal(data.scenarios.length,18);
  for (const invalid of [
    {budget_cents:-1},{budget_cents:100_001},{budget_cents:true},{max_items:0},
    {max_items:18},{max_items:2.5},{visual_only:1},{category:'other'},
    {goal:'checkout'},{coverage:'medical'},{preferred_concern:'disease'},
  ]) assert.throws(()=>normalizeOptions(invalid,source.concerns));
});

test('every budget, shade preference, try-on and category yields byte-equivalent contract', () => {
  for (const row of data.scenarios) {
    const actual=buildShortlist(catalogue,row.ranked,row.options,source.concerns);
    assert.deepEqual(actual,row.outcome,JSON.stringify(row.options));
    assert.equal(actual.provider_calls,0);
    assert.equal(actual.checkout_enabled,false);
    for (const entry of actual.items) {
      assert.ok(entry.product.sample);
      assert.ok(entry.product.price_cents<=row.options.budget_cents);
      assert.equal(entry.product.currency,'CAD');
      assert.ok(catalogue.some(p=>p.id===entry.product.id && p.name===entry.product.name));
    }
    if (actual.three_piece) {
      assert.equal(actual.three_piece.products.length,3);
      assert.equal(actual.three_piece.checkout_enabled,false);
      assert.ok(actual.three_piece.subtotal_cents<=row.options.budget_cents);
    }
  }
});

test('forged catalogue metadata is discarded before presentation in both runtimes', () => {
  for (const row of data.malformed) {
    const result=buildShortlist(catalogue,row.ranked,row.options,source.concerns);
    assert.deepEqual(result,row.outcome);
    assert.equal(result.discarded_untrusted_rows,1);
    assert.equal(result.items.length,1);
  }
  const original=data.scenarios[3].ranked[0];
  for (const field of ['name','price_cents','swatch','depth','undertone','category']) {
    const forged={...original,product:{...original.product,[field]:field==='price_cents'?1:'forged'}};
    const result=buildShortlist(catalogue,[forged],{},source.concerns);
    assert.equal(result.items.length,0);
    assert.equal(result.discarded_untrusted_rows,1);
  }
  for (const score of [true,'100',-1,1001,NaN]) {
    const result=buildShortlist(catalogue,[{...original,score}],{},source.concerns);
    assert.equal(result.items.length,0);
  }
  assert.throws(()=>buildShortlist(catalogue,new Array(33).fill(original),{},source.concerns));
});

test('no independent network/provider or checkout is introduced by the shortlist', () => {
  const src=readFileSync(resolve(root,'web/src/commerce/shortlist.ts'),'utf8');
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|\bcheckout\s*\(/.test(src));
  assert.match(src,/simulated:true,checkout_enabled:false/);
  const page=readFileSync(resolve(root,'web/src/commerce/page.ts'),'utf8');
  assert.match(page,/buildShortlist\(catalogue, controller\.state\.results/);
  assert.match(page,/currentShopping\?\.three_piece/);
});
