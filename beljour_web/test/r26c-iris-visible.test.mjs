/** Observed two-eye iris behaviour and Python byte-reference parity. Author: John Khan. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { recolourVisible } from "../dist/js/engines/eyes/visible-iris.js";
import { IrisTrialEngine } from "../dist/js/engines/eyes/iris-trial.js";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const WIDTH = 80;
const HEIGHT = 48;

function scene(background = 98, hidden = null, soft = false) {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 3);
  const right = new Float64Array(WIDTH * HEIGHT);
  const left = new Float64Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      const r = (x - 21) ** 2 + (y - 20) ** 2 < 7 ** 2;
      const l = (x - 59) ** 2 + (y - 20) ** 2 < 7 ** 2;
      const colour = r ? [43, 36, 32] : l ? [68, 58, 49]
        : [background, Math.max(0, background - 8), Math.min(255, background + 4)];
      for (let c = 0; c < 3; c++) data[i * 3 + c] = colour[c];
      if (r) right[i] = soft && x % 5 === 0 ? 0.49 : 1;
      if (l) left[i] = soft && x % 5 === 0 ? 0.49 : 1;
    }
  }
  const first = (17 * WIDTH + 20) * 3;
  const second = (17 * WIDTH + 58) * 3;
  for (let c = 0; c < 3; c++) {
    data[first + c] = 252;
    data[second + c] = 252;
  }
  const states = { right_iris: "visible", left_iris: "visible" };
  if (hidden === "right") {
    right.fill(0);
    states.right_iris = "not_visible:hidden_by_turn";
  }
  if (hidden === "left") {
    left.fill(0);
    states.left_iris = "not_visible:closed";
  }
  return {
    photo: { width: WIDTH, height: HEIGHT, channels: 3, data },
    observed: { masks: { right_iris: right, left_iris: left }, states,
      source: "manual_or_measured" },
  };
}

function spyGuard() {
  let calls = 0;
  return {
    get calls() { return calls; },
    guard(_before, after) {
      calls++;
      return { image: Uint8ClampedArray.from(after), similarity: 0.98, blendedBack: false };
    },
  };
}

const pythonVectors = JSON.parse(execFileSync("python3", ["api/tests/r26c_iris_cases.py"], {
  cwd: ROOT,
  env: { ...process.env, PYTHONPATH: "api" },
  encoding: "utf8",
  maxBuffer: 2_000_000,
}));

test("Reference vector generator covers measured and declared one-eye cases", () => {
  assert.equal(pythonVectors.cases.length, 36);
  assert.equal(pythonVectors.width, WIDTH);
  assert.equal(pythonVectors.height, HEIGHT);
});

test("Python/TypeScript iris trial pixels match to one colour level", () => {
  let worst = 0;
  for (const vector of pythonVectors.cases) {
    const { photo, observed } = scene(vector.background, vector.hidden, Boolean(vector.hidden));
    const spy = spyGuard();
    const engine = new IrisTrialEngine({ observe() { return observed; } }, spy);
    const result = engine.render(photo, "drawn_case", {
      primaryBox: [0.02, 0.04, 0.98, 0.97], level: vector.level,
    });
    assert.equal(result.status, vector.status);
    assert.equal(result.visibleIrises, vector.visible);
    assert.equal(result.guardCalled, vector.guard_called);
    assert.equal(spy.calls, 1);
    for (const [x, y, r, g, b] of vector.samples) {
      const at = (y * WIDTH + x) * 3;
      const values = [r, g, b];
      for (let c = 0; c < 3; c++) {
        worst = Math.max(worst, Math.abs(result.image[at + c] - values[c]));
      }
    }
    assert.ok(Math.abs(result.changedPixels - vector.changed) <= 2,
      `changed-pixel count mismatch for ${vector.hidden} ${vector.level}`);
  }
  assert.ok(worst <= 1, `Python/TypeScript maximum pixel delta was ${worst}`);
});

for (const side of ["left", "right"]) {
  for (const hiddenReason of ["closed", "hidden_by_turn"]) {
    test(`Only ${side} missing as ${hiddenReason} retains the other measured iris`, () => {
      const { photo, observed } = scene(100);
      observed.masks[`${side}_iris`].fill(0);
      observed.states[`${side}_iris`] = `not_visible:${hiddenReason}`;
      const before = Uint8ClampedArray.from(photo.data);
      const result = recolourVisible(photo, observed.masks, observed.states, "hazel", 75);
      assert.equal(result.eligible, true);
      assert.equal(result.visibleIrises, 1);
      assert.ok(result.changed > 0);
      assert.deepEqual(photo.data, before);
      for (let i = 0; i < WIDTH * HEIGHT; i++) {
        if (observed.masks.left_iris[i] < 0.5 && observed.masks.right_iris[i] < 0.5) {
          for (let c = 0; c < 3; c++) {
            assert.equal(result.image[i * 3 + c], before[i * 3 + c]);
          }
        }
      }
    });
  }
}

test("An overlapping pair refuses atomically with original pixels", () => {
  const { photo, observed } = scene();
  observed.masks.left_iris[20 * WIDTH + 21] = 1;
  const response = recolourVisible(photo, observed.masks, observed.states);
  assert.equal(response.eligible, false);
  assert.equal(response.changed, 0);
  assert.deepEqual(response.undeclaredMissing, ["iris_masks_overlap"]);
  assert.deepEqual(response.image, photo.data);
});

test("Unexplained missing support refuses instead of inventing the iris", () => {
  const { photo, observed } = scene();
  observed.masks.right_iris.fill(0);
  const result = recolourVisible(photo, observed.masks, observed.states);
  assert.equal(result.eligible, false);
  assert.equal(result.changed, 0);
  assert.deepEqual(result.image, photo.data);
});

test("A declared hidden eye cannot retain contradictory mask support", () => {
  const { photo, observed } = scene();
  observed.states.right_iris = "not_visible:hidden_by_turn";
  const result = recolourVisible(photo, observed.masks, observed.states);
  assert.equal(result.eligible, false);
  assert.deepEqual(result.image, photo.data);
});
