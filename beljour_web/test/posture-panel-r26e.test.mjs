/** R26E seven-fix panel: readiness rules, decimal sliders, warning copy and no network.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { SIMULATION_LABEL } from "../dist/js/engines/local/posture.js";
import { PosturePanelState } from "../dist/js/body/posture-panel-state.js";
import { BLOCK_MESSAGES, mountPosturePanel } from "../dist/js/body/posture-panel.js";
import { withFakeDocument } from "./posture-dom-fake.mjs";

const PHOTO = { digest: "a".repeat(64), width: 160, height: 200, view: "side", personMask: true, headMask: true };

test("readiness: view, both masks and a guard for face-adjacent fixes", () => {
  const state = new PosturePanelState();
  assert.ok(state.snapshot().fixes.every((item) => item.reason === "photo_required"));
  state.setPhoto({ ...PHOTO, view: null });
  assert.ok(state.snapshot().fixes.every((item) => item.reason === "view_required"));
  state.setPhoto({ ...PHOTO, headMask: false });
  assert.equal(state.availability("slouch").reason, "head_mask_required");
  state.setPhoto(PHOTO);
  assert.equal(state.availability("lean").reason, "wrong_view");
  assert.equal(state.availability("forward_head").reason, "identity_guard_required");
  assert.equal(state.availability("slouch").enabled, true);
  state.setGuardAvailable(true);
  assert.equal(state.availability("forward_head").enabled, true);
  assert.throws(() => state.setPhoto({ ...PHOTO, digest: "XYZ" }), /digest/);
  assert.throws(() => state.setPhoto({ ...PHOTO, personMask: 1 }), /booleans/);
});

test("levels are remembered per fix and a new photo clears the selection", () => {
  const state = new PosturePanelState();
  state.setPhoto(PHOTO);
  state.select("slouch");
  state.setLevel(4.2);
  state.select("swayback");
  assert.equal(state.level, 3.5);
  state.select("slouch");
  assert.equal(state.level, 4.2);
  assert.throws(() => state.setLevel(4.25), /0.1 steps/);
  state.setPhoto({ ...PHOTO, digest: "b".repeat(64) });
  assert.equal(state.selected, null);
  assert.equal(state.lockLevel, 5);
});

test("the DOM panel shows the warning and drives preview and release", () => withFakeDocument(async (document, requests) => {
  const host = document.createElement("div");
  const calls = [];
  const panel = mountPosturePanel(host, {
    onPreview: (...args) => calls.push(["preview", ...args]),
    onRelease: (...args) => calls.push(["release", ...args]),
  });
  assert.ok(panel.element.textContent.includes(SIMULATION_LABEL));
  assert.equal(panel.element.byTag("button").length, 7);
  assert.ok(panel.element.byTag("button").every((button) => button.disabled));
  panel.setPhoto(PHOTO);
  const slouch = panel.element.button("J14");
  assert.equal(slouch.disabled, false);
  assert.equal(panel.element.button("J13").disabled, true);
  assert.equal(panel.element.button("J13").title, BLOCK_MESSAGES.identity_guard_required);
  slouch.click();
  assert.equal(slouch.getAttribute("aria-pressed"), "true");
  const [level, lock] = panel.element.byTag("input");
  assert.deepEqual([level.min, level.max, level.step], ["1", "5", "0.1"]);
  level.input("2.7");
  level.input("2.7", "change");
  lock.input("4.1", "change");
  assert.deepEqual(calls, [["preview", "slouch", 3.5, 5], ["preview", "slouch", 2.7, 5],
    ["release", "slouch", 2.7, 5], ["release", "slouch", 2.7, 4.1]]);
  const status = panel.element.find((node) => node.getAttribute?.("role") === "status");
  assert.equal(status.getAttribute("aria-live"), "polite");
  panel.element.button("J13").click();
  assert.equal(calls.length, 4, "a disabled fix must not preview");
  panel.dispose();
  assert.equal(panel.element.removed, true);
  assert.equal(requests.length, 0);
}));
