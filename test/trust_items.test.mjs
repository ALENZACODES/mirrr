/** Small trust items (audit 2026-10-30, Fix 9): START OVER asks first; quick picks and trending say
 * they replace the taste; the plan's "Because you love ..." names the taste that picked the look;
 * the share card shows the current top look; the logo goes home.
 * Run: node --test test/trust_items.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildTransform } from '../src/pipeline/transform.js';

const app = fs.readFileSync('public/app.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');

test('START OVER confirms before deleting anything', () => {
  const fn = app.slice(app.indexOf('function resetEverything()'), app.indexOf('function showReturnBanner()'));
  assert.ok(fn.indexOf('confirm(') > -1 && fn.indexOf('confirm(') < fn.indexOf('clearProfile()'));
  assert.match(fn, /if \(!ok\) return false;/);
  assert.doesNotMatch(app, /confirm\('Clear all MIRRR data saved in this browser\?'\)\) resetEverything/);
});

test('quick picks and trending artists say they start a new taste profile', () => {
  assert.doesNotMatch(app, /Add \$\{artist\.name\} to your taste profile/);
  assert.match(app, /Starts a new taste profile with just \$\{artist\.name\}/);
  assert.match(html, /Each pick starts a new taste profile with that one artist/);
  assert.match(html, /Tapping one starts a new taste profile with that artist/);
});

test('the plan uses the taste that produced the look, not later chips', () => {
  assert.match(app, /state\.resultTasteChips = inputs;/);
  assert.match(app, /tasteChips: planChips,/);
  assert.match(app, /return Array\.isArray\(t\?\.tasteChips\) \? t\.tasteChips : \[\.\.\.state\.tasteChips\];/);
});

test('a Burna Boy plan never says "Because you love Rema"', async () => {
  const plan = await buildTransform({ face: { shadeId: 'MD30', depth: 'medium-deep', undertone: 'warm' }, targetLookId: 'afrobeats_concert', tasteChips: ['Burna Boy'] });
  assert.ok(plan.because.length > 0);
  for (const line of plan.because) {
    assert.match(line, /Burna Boy/);
    assert.doesNotMatch(line, /Rema/);
  }
});

test('the share card features the current top look after re-ranking', () => {
  const fn = app.slice(app.indexOf('function getTopLookId('), app.indexOf('function getTopLookId(') + 400);
  assert.match(fn, /\(ids \?\? \[\]\)\.find\(id => LOOK_IMAGES\[id\]\)/);
  assert.match(app, /openShare\(getTopLookId\(state\.stylistPageLookIds\)\)/);
  assert.match(app, /Top look: \$\{lookName\}/);
});

test('the logo resets the open view', () => {
  assert.match(app, /querySelector\('\.nav-logo'\)\?\.addEventListener\('click'/);
  const fn = app.slice(app.indexOf('function goHome()'), app.indexOf('function showView('));
  assert.match(fn, /showView\('hero'\)/);
  assert.match(fn, /scrollTo\(\{ top: 0/);
});

test('selfie buttons open the picker and say so', () => {
  for (const id of ['tryonPickerMsg', 'photoPickerMsg', 'facePhotoMsg']) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(app, new RegExp(`pickerHint\\('${id}'\\)`));
  }
});
