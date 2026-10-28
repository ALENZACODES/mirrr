import assert from "node:assert/strict";
import test from "node:test";
import { drawSplitView, planSplitView } from "../../../dist/js/pro/index.js";

function fakeContext() {
  const calls = [];
  const context = {
    save() { calls.push("save"); },
    restore() { calls.push("restore"); },
    clearRect(...args) { calls.push(["clear", ...args]); },
    drawImage(...args) { calls.push(["image", ...args]); },
    beginPath() { calls.push("path"); },
    rect(...args) { calls.push(["rect", ...args]); },
    clip() { calls.push("clip"); },
    moveTo(...args) { calls.push(["move", ...args]); },
    lineTo(...args) { calls.push(["line", ...args]); },
    stroke() { calls.push("stroke"); },
  };
  return { calls, context };
}

test("split plan supports vertical, horizontal and extreme fractions", () => {
  assert.deepEqual(planSplitView(200, 100).beforeRect, [0, 0, 100, 100]);
  assert.deepEqual(planSplitView(200, 100, 0.25, "horizontal").beforeRect, [0, 0, 200, 25]);
  assert.deepEqual(planSplitView(200, 100, 0).beforeRect, [0, 0, 0, 100]);
  assert.deepEqual(planSplitView(200, 100, 1).beforeRect, [0, 0, 200, 100]);
  assert.throws(() => planSplitView(0, 100), /dimensions/);
  assert.throws(() => planSplitView(100, 100, 1.2), /fraction/);
  assert.throws(() => planSplitView(100, 100, NaN), /fraction/);
  assert.throws(() => planSplitView(100, 100, 0.5, "diagonal"), /vertical or horizontal/);
});

test("split draws after first, clips before, and restores canvas state", () => {
  const { calls, context } = fakeContext();
  const before = { marker: "before" };
  const after = { marker: "after" };
  drawSplitView(context, before, after, planSplitView(200, 100, 0.4));
  assert.deepEqual(calls[0], "save");
  assert.deepEqual(calls[1], ["clear", 0, 0, 200, 100]);
  assert.deepEqual(calls[2], ["image", after, 0, 0, 200, 100]);
  assert.deepEqual(calls[4], ["rect", 0, 0, 80, 100]);
  assert.deepEqual(calls[6], ["image", before, 0, 0, 200, 100]);
  assert.ok(calls.includes("stroke"));
  assert.equal(calls.filter((call) => call === "save").length,
    calls.filter((call) => call === "restore").length);
});

test("split at either end does not draw divider", () => {
  for (const fraction of [0, 1]) {
    const { calls, context } = fakeContext();
    drawSplitView(context, {}, {}, planSplitView(100, 100, fraction));
    assert.equal(calls.includes("stroke"), false);
  }
  const { context } = fakeContext();
  assert.throws(() => drawSplitView(context, null, {}, planSplitView(100, 100)), /required/);
});
