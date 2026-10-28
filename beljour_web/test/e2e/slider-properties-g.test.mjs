/** Exhaustive slider-grid and colour-stage neutral properties on compiled public APIs.
 * Results are engineering checks only, not appearance or identity certification.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { clampStrength, nearestStop, strengthLabel } from "../../dist/js/ui/shell/stops.js";
import { fullParams, isNeutral, op, scaleFraction, scaleParams } from "../../dist/js/filters/colour/ops.js";
import { fromRGBA, toRGBA } from "../../dist/js/engines/core/buffer.js";

const exposure = op("colour.exposure");
const tint = op("colour.tint");
const stages = [exposure, tint];

function ratio(level) {
  const tenth = Math.round(level * 10);
  assert.ok(tenth >= 10 && tenth <= 50);
  assert.ok(Math.abs(level * 10 - tenth) < 1e-9);
  return (tenth - 10) / 40;
}

function pseudoRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

test("all 41 decimal stops resolve to bounded, deterministic stage weights", () => {
  let last = -1;
  for (let tenth = 10; tenth <= 50; tenth++) {
    const level = tenth / 10;
    const portion = ratio(level);
    assert.ok(portion >= last && portion <= 1);
    assert.equal(scaleFraction("linear", portion), portion);
    assert.ok(scaleFraction("easeIn", portion) >= 0);
    assert.ok(scaleFraction("easeOut", portion) <= 1);
    assert.equal(clampStrength(portion * 100), Math.round(portion * 10000) / 100);
    last = portion;
  }
  assert.equal(last, 1);
});

test("zero or neutral stage remains identity regardless of slider destination", () => {
  for (const stage of stages) {
    assert.ok(isNeutral(stage.name, fullParams(stage, {})));
    for (let tenth = 10; tenth <= 50; tenth++) {
      const level = tenth / 10;
      const fraction = ratio(level);
      const zeroStrength = scaleParams(stage, {}, fraction);
      assert.ok(isNeutral(stage.name, zeroStrength));
    }
  }
});

test("randomized 1000-level probes stay bounded and keep unclipped bytes", () => {
  const next = pseudoRandom(9831);
  const source = { width: 1, height: 1, channels: 4,
    data: new Uint8ClampedArray([21, 93, 145, 177]) };
  const before = Array.from(source.data);
  for (let i = 0; i < 1000; i++) {
    const level = (10 + next() % 41) / 10;
    const fraction = ratio(level);
    assert.ok(Number.isFinite(fraction));
    assert.ok(fraction >= 0 && fraction <= 1);
    assert.ok(Number.isFinite(nearestStop("enhance", fraction * 100).value));
    assert.ok(strengthLabel("enhance", fraction * 100).length > 0);
    const result = fromRGBA({ width: 1, height: 1, data: source.data });
    assert.deepEqual(Array.from(toRGBA(result)), before);
  }
  assert.deepEqual(Array.from(source.data), before);
});

test("a non-neutral stage cannot be mislabeled as neutral", () => {
  const target = fullParams(exposure, { ev: 0.8 });
  assert.equal(isNeutral("colour.exposure", target), false);
  const zero = scaleParams(exposure, target, 0);
  assert.ok(isNeutral("colour.exposure", zero));
  const complete = scaleParams(exposure, target, 1);
  assert.equal(isNeutral("colour.exposure", complete), false);
});
