/** Python/TypeScript parity for 1.0..5.0 and the original movement caps. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as Po from "../dist/js/engines/local/posture.js";

const P = JSON.parse(readFileSync(new URL("../../parity/posture-levels-r25e.json", import.meta.url), "utf8"));
const close = (a, b, where, tolerance = 1 / 255) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${where}: ${a} vs ${b}`);

test("old named stops and new decimal anchors have identical meaning", () => {
  assert.deepEqual(P.anchor_levels, [1, 2, 3.5, 5]);
  assert.equal(Po.postureLevelStrength(1), 0);
  assert.equal(Po.postureLevelStrength(2), 0.33);
  assert.equal(Po.postureLevelStrength(3.5), 0.66);
  assert.equal(Po.postureLevelStrength(5), 1);
  for (const [stop, number] of [["subtle", 2], ["normal", 3.5], ["full", 5]]) {
    assert.equal(Po.legacyStopLevel(stop), number);
  }
});

test("all 0.1 steps from 1.0 to 5.0 accepted without integer coercion", () => {
  for (let tick = 10; tick <= 50; tick++) {
    const level = tick / 10;
    assert.equal(Po.checkedPostureLevel(level), level);
  }
});

test("off-step, out-of-range, NaN and infinities fail instead of silently clamping", () => {
  for (const bad of [0.95, 5.1, 2.25, -1, 9, NaN, Infinity, -Infinity]) {
    assert.throws(() => Po.checkedPostureLevel(bad), /level/);
  }
});

test("Python synthetic control vectors preserve measure, cap, reduction and moved points", () => {
  assert.equal(P.format, "beljour-posture-levels-r25e/1");
  assert.equal(P.synthetic_only, true);
  assert.equal(P.cases.length, 7);
  for (const example of P.cases) {
    const c = example.controls;
    const controls = Po.makeControls(c.view, c.points, c.width, c.height, c.facing,
      c.estimated, c.manual);
    for (const expected of example.plans) {
      const got = Po.postureLevelPlan(controls, example.fix, expected.level);
      for (const [key, actual, wanted] of [
        ["ratio", got.strength, expected.ratio],
        ["before", got.measureBefore, expected.before],
        ["after", got.measureAfter, expected.after],
        ["reduction", got.reduction, expected.reduction],
        ["cap", got.capPx, expected.cap_px],
        ["movement", got.requestedPx * got.capScale, expected.largest_move_px],
      ]) close(actual, wanted, `${example.fix}/${expected.level}/${key}`);
      for (const [name, xy] of Object.entries(expected.points)) {
        close(got.after.points[name][0], xy[0], `${example.fix}/${name}/x`);
        close(got.after.points[name][1], xy[1], `${example.fix}/${name}/y`);
      }
      assert.equal(got.label, Po.SIMULATION_LABEL);
      assert.ok(got.requestedPx * got.capScale <= got.capPx + 1e-6);
    }
  }
});

test("level 1.0 never changes any control point", () => {
  for (const example of P.cases) {
    const c = example.controls;
    const controls = Po.makeControls(c.view, c.points, c.width, c.height, c.facing,
      c.estimated, c.manual);
    const p = Po.postureLevelPlan(controls, example.fix, 1);
    assert.deepEqual(p.after.points, p.before.points);
    assert.equal(p.reduction, 0);
  }
});

test("every drawn fix is monotone and never goes past neutral", () => {
  for (const example of P.cases) {
    const c = example.controls;
    const controls = Po.makeControls(c.view, c.points, c.width, c.height, c.facing,
      c.estimated, c.manual);
    let previous = -1;
    for (let tick = 10; tick <= 50; tick++) {
      const p = Po.postureLevelPlan(controls, example.fix, tick / 10);
      assert.ok(p.reduction + 1e-7 >= previous, `${example.fix} level ${tick / 10}`);
      assert.ok(p.reduction <= 1 + 1e-7);
      previous = p.reduction;
    }
  }
});

test("last-used level is per-effect, with bounded nudge and no image persistence", () => {
  const m = new Po.PostureLevelMemory();
  assert.equal(m.get("lean"), 3.5);
  assert.equal(m.set("lean", 4.2), 4.2);
  assert.equal(m.nudge("lean", +1), 4.3);
  assert.equal(m.nudge("lean", -1), 4.2);
  assert.equal(m.get("pelvic_tilt"), 3.5);
  assert.equal(m.set("lean", 5), 5);
  assert.equal(m.nudge("lean", +1), 5);
  assert.equal(m.set("lean", 1), 1);
  assert.equal(m.nudge("lean", -1), 1);
  assert.equal(Po.FACE_MOVING_FIXES.size, 3);
});
