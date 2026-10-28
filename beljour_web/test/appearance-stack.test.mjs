// Gender appearance + age stack: age texture is painted before the gender warp whatever the
// stack order, the stack equals "paint age, then warp", contradictory stacks are refused with
// codes, and the joint check reads the actual pixels. Drawn portrait sample only.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { renderLayers } from '../dist/js/ui/shell/pipeline.js';
import { renderAge } from '../dist/js/engines/local/age.js';
import { genderTargets } from '../dist/js/engines/local/gender.js';
import { meshWarp } from '../dist/js/engines/warp/mesh.js';
import { apply } from '../dist/js/engines/warp/field.js';
import * as A from '../dist/js/ui/shell/appearance-stack.js';
import { heroAppearanceScreen, stackLine } from '../dist/js/screens/hero-appearance.js';

function stack(kinds) {
  const e = new Editor('portrait', new ShellGpuRenderer(null));
  for (const [kind, params, strength] of kinds) e.add(kind, params, strength);
  return e;
}
const OLDER = ['older', { stop: 4 }, 80], GENDER = ['gender', { slider: 66 }, 70];

test('age is painted before the gender warp whatever the stack order', () => {
  const a = stack([GENDER, OLDER]), b = stack([OLDER, GENDER]);
  try {
    const first = renderLayers(a.source, a.document.layers).image, second = renderLayers(b.source, b.document.layers).image;
    assert.deepEqual(first.data, second.data);
    assert.equal(A.appearanceOrder(a.document.layers).reordered, true);
    assert.equal(A.appearanceOrder(b.document.layers).reordered, false);
    assert.deepEqual(A.appearanceOrder(a.document.layers).layers.map((l) => l.kind), ['older', 'gender']);
  } finally { a.dispose(); b.dispose(); }
});

test('the stack equals painting age at the measured points, then warping from the aged points', () => {
  const e = stack([GENDER, OLDER]);
  try {
    const { image, face } = e.source;
    const age = renderAge(image, face, { stop: 4, strength: 0.8, seed: 1024, hairMask: undefined, layers: { hair: 0 } });
    // The warp starts where the age reshape left the face points.
    const warp = meshWarp(image.width, image.height, age.face, genderTargets(age.face, 66 * 70 / 100, { scope: 'face_only' }).points, { guard: true });
    const expected = apply(age.image, warp.result.field);
    const actual = renderLayers(e.source, e.document.layers).image;
    let differ = 0;
    for (let i = 0; i < actual.data.length; i++) if (Math.abs(actual.data[i] - expected.data[i]) > 1) differ++;
    assert.equal(differ, 0, 'stacked pixels match age-then-warp');
    const wrongWay = renderAge(apply(image, warp.result.field), age.face, { stop: 4, strength: 0.8, seed: 1024, layers: { hair: 0 } }).image;
    assert.notDeepEqual(wrongWay.data, actual.data, 'painting after the warp would misplace the texture');
  } finally { e.dispose(); }
});

test('the joint check passes on the real stack and states the order', () => {
  const e = stack([GENDER, OLDER]);
  try {
    const report = A.appearanceStackReport(e.source, e.document.layers, e.rendered().image);
    assert.equal(report.stacked, true); assert.equal(report.passed, true);
    assert.equal(report.changedOutside, 0); assert.ok(report.changedPixels > 0);
    assert.ok(report.guardScale > 0); assert.equal(report.lightened, false);
    assert.match(report.text, /^Stacked: Age texture first/); assert.match(report.text, /Joint check passed/);
    const tampered = { ...e.rendered().image, data: Uint8Array.from(e.rendered().image.data) };
    tampered.data[0] ^= 255; tampered.data[1] ^= 255;
    const caught = A.appearanceStackReport(e.source, e.document.layers, tampered);
    assert.equal(caught.passed, false); assert.ok(caught.changedOutside >= 1);
  } finally { e.dispose(); }
});

test('contradictory stacks are refused with codes; one appearance renders as before', () => {
  const both = stack([['older', { stop: 2 }, 50], ['younger', { stop: 1 }, 50]]);
  const twice = stack([GENDER, ['gender', { slider: -33 }, 40]]);
  try {
    for (const [e, code] of [[both, 'older_and_younger'], [twice, 'repeated_appearance']]) {
      assert.throws(() => A.appearanceOrder(e.document.layers), (err) => err instanceof A.StackError && err.code === code && err.message === A.STACK_REFUSALS[code]);
      assert.throws(() => renderLayers(e.source, e.document.layers), A.StackError);
    }
    const off = both.document.layers.map((l) => (l.kind === 'younger' ? { ...l, enabled: false } : l));
    assert.equal(A.appearanceOrder(off.filter((l) => l.enabled)).layers.length, 1);
  } finally { both.dispose(); twice.dispose(); }
  const single = stack([OLDER]);
  try { assert.equal(A.appearanceStackReport(single.source, single.document.layers, single.rendered().image).stacked, false); }
  finally { single.dispose(); }
});

test('the hero screen shows the joint check once both are on', async () => {
  const dom = installDOM(), e = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    e.selectStudio('older');
    assert.equal(stackLine(e), '');
    e.add(...GENDER);
    const ui = heroAppearanceScreen(e, () => {});
    await buttonNamed(ui, 'Older 3').click();
    assert.match(ui.textContent, /Stacked: Age texture first, then the appearance change/);
    assert.match(ui.textContent, /Joint check passed/);
  } finally { e.dispose(); dom.restore(); }
});
