// UI strength is 1.0–5.0; pixel engines remain unchanged at 0–100.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VISIBLE_STRENGTH,
  PreviewDebouncer,
  previewKey,
  hasVisibleStrengthContract,
  parseVisibleStrength,
  visibleToEngine,
  engineToVisible,
  setStrengthRange,
  strengthText,
  validVisibleStrength,
} from "../dist/js/layout/strength-scale.js";
import { JudgeSession } from "../dist/js/layout/judge-session.js";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function field() {
  const attrs = new Map();
  return {
    type: "text", min: "", max: "", step: "", value: "", dataset: {},
    setAttribute: (key, value) => attrs.set(key, value),
    getAttribute: (key) => attrs.get(key),
  };
}

test("visible strength has exactly 41 steps, from 1.0 through 5.0", () => {
  assert.deepEqual(VISIBLE_STRENGTH, { min: 1, max: 5, step: 0.1 });
  for (let tenth = 10; tenth <= 50; tenth += 1) {
    const visible = tenth / 10;
    assert.ok(validVisibleStrength(visible), String(visible));
    assert.equal(parseVisibleStrength(visible.toFixed(1)), visible);
  }
  assert.equal(validVisibleStrength(1.05), false);
  assert.equal(validVisibleStrength(0), false);
  assert.equal(validVisibleStrength(5.1), false);
});

test("bad values are rejected rather than silently rounded or wrapped", () => {
  for (const item of [null, undefined, "", "not a number", NaN, Infinity, -Infinity, 0.9, 5.1, 3.14, [], {}]) {
    assert.throws(() => parseVisibleStrength(item), RangeError, String(item));
  }
  for (const value of [-1, 101, Infinity, NaN]) {
    assert.throws(() => engineToVisible(value), RangeError);
  }
});

test("legacy engine strengths map monotonically without changing their contract", () => {
  assert.equal(visibleToEngine(1.0), 0);
  assert.equal(visibleToEngine(5.0), 100);
  assert.equal(visibleToEngine(3.0), 50);
  assert.equal(engineToVisible(0), 1);
  assert.equal(engineToVisible(100), 5);
  assert.equal(engineToVisible(50), 3);
  let previous = -1;
  for (let tenth = 10; tenth <= 50; tenth += 1) {
    const value = visibleToEngine(tenth / 10);
    assert.ok(value >= previous);
    assert.ok(value <= 100);
    previous = value;
  }
  for (const value of [0, 3, 25, 33, 50, 66, 80, 100]) {
    assert.ok(Math.abs(visibleToEngine(engineToVisible(value)) - value) <= 1.25);
  }
});

test("native strength control exposes 1/5/0.1 and an accessible live value", () => {
  const slider = field();
  setStrengthRange(slider, 2.3);
  assert.equal(slider.type, "range");
  assert.equal(slider.value, "2.3");
  assert.equal(slider.dataset.editStrength, "true");
  assert.equal(slider.getAttribute("aria-valuetext"), "2.3 of 5.0");
  assert.ok(hasVisibleStrengthContract(slider));
  assert.equal(strengthText(1.0), "1.0 of 5.0");
  assert.throws(() => setStrengthRange(slider, 9), RangeError);
});

test("Studio HTML and both owned UI modules use the visible contract", () => {
  const html = read("../studio.html");
  assert.match(html, /id="lg-strength"[^>]*min="1" max="5" step="0.1"/);
  assert.match(html, /data-edit-strength="true"/);
  assert.match(read("../src/layout/editor-chrome.ts"), /visibleToEngine/);
  assert.match(read("../src/ui/shell/view.ts"), /effectStrengthControl\(/);
  assert.match(read("../src/ui/shell/identity-controls.ts"), /setStrengthRange\(/);
});

test("Judge Mode strength changes are isolated and validate exact tenths", () => {
  const session = new JudgeSession();
  assert.equal(session.snapshot.strength, 5);
  assert.equal(session.setStrength(1.1), true);
  assert.equal(session.snapshot.strength, 1.1);
  assert.equal(session.setStrength(1.18), false);
  assert.equal(session.snapshot.strength, 1.1);
  session.selectSource("sample");
  assert.equal(session.snapshot.strength, 5);
  session.setStrength(2.9);
  session.reset();
  assert.equal(session.snapshot.strength, 5);
});

test("cache keys bind photo, edit, strength and lock tuning", () => {
  const base = { photo: "rev1", edit: "hair", strength: 3.0, tuning: 1.0 };
  const first = previewKey(base);
  assert.notEqual(first, previewKey({ ...base, photo: "rev2" }));
  assert.notEqual(first, previewKey({ ...base, edit: "face" }));
  assert.notEqual(first, previewKey({ ...base, strength: 3.1 }));
  assert.notEqual(first, previewKey({ ...base, tuning: 1.1 }));
  assert.throws(() => previewKey({ ...base, photo: "" }), RangeError);
  assert.throws(() => previewKey({ ...base, strength: 4.52 }), RangeError);
});

test("debounce cancels stale preview work and allows explicit flush", async () => {
  const scheduler = new PreviewDebouncer(10);
  const performed = [];
  scheduler.schedule("photo:edit:1", () => performed.push("old"));
  scheduler.schedule("photo:edit:2", () => performed.push("latest"));
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.deepEqual(performed, ["latest"]);
  scheduler.schedule("photo:edit:3", () => performed.push("third"));
  scheduler.flush("photo:edit:3", () => performed.push("flushed"));
  assert.deepEqual(performed, ["latest", "flushed"]);
  scheduler.flush("photo:edit:3", () => performed.push("duplicate"));
  assert.deepEqual(performed, ["latest", "flushed"]);
  scheduler.dispose();
  scheduler.schedule("new", () => performed.push("disposed"));
  assert.deepEqual(performed, ["latest", "flushed"]);
});

test("debouncer resets when selecting another source", async () => {
  const scheduler = new PreviewDebouncer(8);
  const calls = [];
  scheduler.schedule("one", () => calls.push(1));
  scheduler.reset();
  await new Promise((resolve) => setTimeout(resolve, 22));
  assert.deepEqual(calls, []);
  scheduler.flush("one", () => calls.push(1));
  scheduler.reset();
  scheduler.flush("one", () => calls.push(2));
  assert.deepEqual(calls, [1, 2]);
  scheduler.dispose();
  assert.throws(() => new PreviewDebouncer(-1), RangeError);
});
