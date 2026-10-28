/** R23G keyboard and announcement contract for the shipped public editor shell.
 *
 * No browser is simulated here: these are bounded, deterministic controller tests.
 * Real focus/screen-reader performance remains a separate device claim.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { COMPARE_MODES, MODE_INFO } from "../../dist/js/ui/shell/compare.js";
import { CompareSession, LOUPE_ZOOMS, normaliseCompareState } from "../../dist/js/ui/shell/compare-session.js";
import { rovingIndex, trapIndex } from "../../dist/js/ui/shell/focus.js";
import { resolveKey, SHORTCUTS, shortcutCollisions } from "../../dist/js/ui/shell/keymap.js";
import { isPhone, PANELS, panelVisibility, PanelTabs } from "../../dist/js/ui/shell/panels.js";

const enabled = { singleKeys: true, demoActive: false };
const disabled = { singleKeys: false, demoActive: false };

function press(key, extra = {}) {
  return { type: "keydown", key, ...extra };
}

function release(key, extra = {}) {
  return { type: "keyup", key, ...extra };
}

function action(key, extra = {}, settings = enabled) {
  return resolveKey(press(key, extra), settings);
}

function assertUnit(number) {
  assert.ok(Number.isFinite(number));
  assert.ok(number >= 0);
  assert.ok(number <= 1);
}

test("shortcut legend covers the ten distinct compare keys", () => {
  assert.equal(COMPARE_MODES.length, 10);
  assert.deepEqual(shortcutCollisions(), []);
  const legend = SHORTCUTS.filter((item) => item.group === "Compare");
  for (const mode of COMPARE_MODES) {
    const details = MODE_INFO[mode];
    assert.ok(legend.some((item) => item.keys === details.key));
    assert.ok(details.title.length > 0);
    assert.ok(details.summary.length > 12);
    assert.deepEqual(action(details.key), { type: "compare", mode });
  }
});

test("single-character opt-out suppresses every compare shortcut", () => {
  for (const mode of COMPARE_MODES) {
    const shortcut = MODE_INFO[mode].key;
    assert.equal(action(shortcut, {}, disabled), null);
    assert.equal(action(shortcut, { ctrlKey: true }), null);
    assert.equal(action(shortcut, { metaKey: true }), null);
    assert.equal(action(shortcut, { altKey: true }), null);
    assert.equal(action(shortcut, { repeat: true }), null);
  }
});

test("text entry and dialogs never swallow native editing shortcuts", () => {
  const keystrokes = ["0", "1", "[", "]", "?", "+", "=", "-", "_", "\\", ".", ",", "h"];
  for (const key of keystrokes) {
    assert.equal(action(key, { editable: true }), null);
    assert.equal(action(key, { inDialog: true }), null);
    assert.equal(action(key, { editable: true, ctrlKey: true }), null);
    assert.equal(action(key, { inDialog: true, metaKey: true }), null);
  }
  assert.equal(action("z", { ctrlKey: true, editable: true }), null);
  assert.equal(action("z", { ctrlKey: true, inDialog: true }), null);
  assert.deepEqual(action("Escape", { editable: true }), { type: "escape" });
  assert.deepEqual(action("Escape", { inDialog: true }), { type: "escape" });
  assert.equal(resolveKey(release("Escape"), enabled), null);
});

test("Ctrl and Command undo/redo remain enabled after single-key opt-out", () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    assert.deepEqual(action("z", modifier, disabled), { type: "undo" });
    assert.deepEqual(action("Z", modifier, disabled), { type: "undo" });
    assert.deepEqual(action("z", { ...modifier, shiftKey: true }, disabled), { type: "redo" });
    assert.deepEqual(action("y", modifier, disabled), { type: "redo" });
    assert.equal(action("x", modifier, disabled), null);
    assert.equal(action("z", { ...modifier, altKey: true }, disabled), null);
  }
  assert.equal(action("y", { ctrlKey: true, shiftKey: true }), null);
  assert.equal(resolveKey(release("z", { ctrlKey: true }), disabled), null);
});

test("original-hold releases on keyup and ignores keyboard autorepeat", () => {
  assert.deepEqual(action("\\"), { type: "hold", on: true });
  assert.deepEqual(resolveKey(release("\\"), enabled), { type: "hold", on: false });
  assert.equal(action("\\", { repeat: true }), null);
  assert.equal(resolveKey(release("\\", { altKey: true }), enabled), null);
  assert.equal(resolveKey(release("\\", { metaKey: true }), enabled), null);
  assert.equal(resolveKey(release("\\"), disabled), null);
});

test("compare cycling and zoom have only the documented directions", () => {
  assert.deepEqual(action("["), { type: "compare-step", step: -1 });
  assert.deepEqual(action("]"), { type: "compare-step", step: 1 });
  for (const key of ["+", "="]) {
    assert.deepEqual(action(key), { type: "zoom", direction: 1 });
  }
  for (const key of ["-", "_"]) {
    assert.deepEqual(action(key), { type: "zoom", direction: -1 });
  }
  assert.deepEqual(action("?"), { type: "help" });
  assert.equal(action("!"), null);
  assert.equal(action("~"), null);
});

test("demo scene actions work only while demo is active", () => {
  const active = { singleKeys: true, demoActive: true };
  assert.equal(action("."), null);
  assert.equal(action(","), null);
  assert.deepEqual(action(".", {}, active), { type: "demo-step", step: 1 });
  assert.deepEqual(action(",", {}, active), { type: "demo-step", step: -1 });
  assert.equal(action(".", {}, { singleKeys: false, demoActive: true }), null);
  assert.equal(action(",", { editable: true }, active), null);
  assert.equal(action(".", { repeat: true }, active), null);
});

test("focus traversal wraps correctly for one to twelve synthetic controls", () => {
  for (let count = 1; count <= 12; count++) {
    for (let index = 0; index < count; index++) {
      assert.equal(rovingIndex(count, index, "Home"), 0);
      assert.equal(rovingIndex(count, index, "End"), count - 1);
      const next = rovingIndex(count, index, "ArrowRight");
      const previous = rovingIndex(count, index, "ArrowLeft");
      assert.equal(next, (index + 1) % count);
      assert.equal(previous, (index + count - 1) % count);
      assert.equal(rovingIndex(count, next, "ArrowLeft"), index);
      assert.equal(rovingIndex(count, previous, "ArrowRight"), index);
      assert.equal(rovingIndex(count, index, "Tab"), null);
    }
  }
});

test("horizontal and vertical focus keys cannot move along the other axis", () => {
  for (const orientation of ["horizontal", "vertical", "both"]) {
    for (let index = 0; index < 4; index++) {
      const right = rovingIndex(4, index, "ArrowRight", orientation);
      const down = rovingIndex(4, index, "ArrowDown", orientation);
      assert.equal(right === null, orientation === "vertical");
      assert.equal(down === null, orientation === "horizontal");
    }
  }
  assert.equal(rovingIndex(3, 0, "ArrowLeft", "horizontal", false), 0);
  assert.equal(rovingIndex(3, 2, "ArrowRight", "horizontal", false), 2);
  assert.equal(rovingIndex(0, 0, "Home"), null);
  assert.equal(rovingIndex(4, -200, "Home"), 0);
});

test("dialog focus loops without leaking to the outside document", () => {
  for (let count = 1; count <= 12; count++) {
    for (let index = 0; index < count; index++) {
      assert.equal(trapIndex(count, index, false), (index + 1) % count);
      assert.equal(trapIndex(count, index, true), (index + count - 1) % count);
    }
    assert.equal(trapIndex(count, -1, false), 0);
    assert.equal(trapIndex(count, count, true), count - 1);
  }
  for (const count of [0, -1, 0.5, Infinity]) {
    assert.throws(() => trapIndex(count, 0, false), RangeError);
  }
});

test("panel state shows one narrow control surface or all wide panels", () => {
  assert.equal(PANELS.length, 4);
  for (const width of [320, 360, 390, 480]) {
    assert.equal(isPhone(width), true);
    for (const id of PANELS) {
      const shown = panelVisibility(width, id);
      assert.deepEqual(PANELS.filter((candidate) => shown[candidate]), [id]);
    }
  }
  for (const width of [1024, 1280, 1920]) {
    assert.equal(isPhone(width), false);
    for (const id of PANELS) {
      assert.deepEqual(PANELS.filter((candidate) => panelVisibility(width, id)[candidate]), [...PANELS]);
    }
  }
  for (const invalid of [-1, 0, Number.NaN, Infinity]) {
    assert.throws(() => panelVisibility(invalid, "tools"), RangeError);
  }
});

test("panel subscription, arrow activation and unsubscription are deterministic", () => {
  const tabs = new PanelTabs("edit");
  const messages = [];
  const remove = tabs.subscribe((value) => messages.push(value));
  tabs.select("edit");
  assert.deepEqual(messages, []);
  assert.equal(tabs.key("ArrowRight"), "layers");
  assert.equal(tabs.key("ArrowRight"), "history");
  assert.equal(tabs.key("ArrowRight"), "tools");
  assert.equal(tabs.key("Home"), "tools");
  assert.equal(tabs.key("End"), "history");
  tabs.followTool();
  assert.equal(tabs.active, "edit");
  assert.deepEqual(messages, ["layers", "history", "tools", "history", "edit"]);
  remove();
  tabs.select("tools");
  assert.equal(messages.length, 5);
  assert.equal(tabs.key("Tab"), null);
  assert.throws(() => tabs.select("synthetic-invalid"), RangeError);
});

test("mode switching cannot leave an original photo stuck in hold", () => {
  const compare = new CompareSession();
  compare.hold(true);
  assert.equal(compare.showing(), "before");
  for (const mode of COMPARE_MODES) {
    compare.setMode("hold");
    compare.hold(true);
    compare.setMode(mode);
    assert.equal(compare.state.held, false);
    assert.equal(compare.mode, mode);
    assert.ok(compare.describe().length > 12);
  }
  compare.setMode("hold");
  assert.equal(compare.showing(), "after");
});

test("all compare modes cycle in each direction and do not mutate inputs", () => {
  const initial = { mode: "split-vertical", position: 0.31, loupe: { x: 0.3, y: 0.6, zoom: 4 } };
  const snapshot = JSON.stringify(initial);
  const compare = new CompareSession(initial);
  const sequence = [];
  for (let index = 0; index < COMPARE_MODES.length; index++) {
    sequence.push(compare.mode);
    compare.cycle(1);
  }
  assert.equal(new Set(sequence).size, COMPARE_MODES.length);
  assert.equal(compare.mode, "split-vertical");
  for (let index = 0; index < COMPARE_MODES.length; index++) {
    compare.cycle(-1);
  }
  assert.equal(compare.mode, "split-vertical");
  assert.equal(JSON.stringify(initial), snapshot);
  const returned = compare.state;
  returned.loupe.x = 0;
  assert.equal(compare.state.loupe.x, 0.3);
});

test("compare subscription fires only for actual changes and then detaches", () => {
  const session = new CompareSession();
  const notices = [];
  const remove = session.subscribe((value) => notices.push(value.mode));
  session.setPosition(0.5);
  assert.deepEqual(notices, []);
  session.setPosition(0.6);
  session.setPosition(0.6);
  session.setMode("difference");
  assert.deepEqual(notices, ["hold", "difference"]);
  remove();
  session.setMode("loupe");
  assert.deepEqual(notices, ["hold", "difference"]);
});

test("split keyboard instructions announce the line at clamped endpoints", () => {
  const cases = [
    { mode: "split-vertical", back: "ArrowLeft", forward: "ArrowRight" },
    { mode: "split-horizontal", back: "ArrowUp", forward: "ArrowDown" },
    { mode: "split-diagonal", back: "ArrowLeft", forward: "ArrowRight" },
  ];
  for (const row of cases) {
    const compare = new CompareSession({ mode: row.mode, position: 0.5 });
    assert.match(compare.key({ key: "Home" }).announce, /edit/);
    assert.equal(compare.state.position, 0);
    for (let index = 0; index < 50; index++) {
      compare.key({ key: row.forward });
    }
    assert.equal(compare.state.position, 1);
    assert.match(compare.key({ key: "End" }).announce, /original/);
    assert.match(compare.describe(), /100%/);
    const finer = compare.key({ key: row.back, shiftKey: true });
    assert.equal(finer.handled, true);
    assert.match(finer.announce, /Line at 99%/);
    assertUnit(compare.state.position);
    assert.equal(compare.key({ key: "Escape" }).handled, false);
    assert.equal(compare.key({ key: "Tab" }).handled, false);
  }
});

test("loupe keyboard movement respects borders and announced zoom", () => {
  const compare = new CompareSession({ mode: "loupe" });
  for (let index = 0; index < 120; index++) {
    compare.key({ key: "ArrowLeft", shiftKey: true });
    compare.key({ key: "ArrowUp", shiftKey: true });
  }
  assert.equal(compare.state.loupe.x, 0);
  assert.equal(compare.state.loupe.y, 0);
  const move = compare.key({ key: "ArrowRight" });
  assert.match(move.announce, /2% across/);
  for (let index = 0; index < 100; index++) {
    compare.key({ key: "+" });
  }
  assert.equal(compare.state.loupe.zoom, LOUPE_ZOOMS.at(-1));
  assert.match(compare.describe(), /8×/);
  for (let index = 0; index < 100; index++) {
    compare.key({ key: "-" });
  }
  assert.equal(compare.state.loupe.zoom, LOUPE_ZOOMS[0]);
  for (let index = 0; index < 120; index++) {
    compare.key({ key: "ArrowRight", shiftKey: true });
    compare.key({ key: "ArrowDown", shiftKey: true });
  }
  assert.equal(compare.state.loupe.x, 1);
  assert.equal(compare.state.loupe.y, 1);
  assert.equal(compare.key({ key: " " }).handled, false);
});

test("reduced-motion flicker remains paused after every mode change", () => {
  const compare = new CompareSession({ mode: "flicker", playing: true }, true);
  assert.equal(compare.state.playing, false);
  compare.setPlaying(true);
  assert.equal(compare.state.playing, false);
  for (let index = 0; index < 4; index++) {
    assert.equal(compare.togglePlay(), false);
    assert.equal(compare.state.playing, false);
  }
  compare.setMode("hold");
  compare.setMode("flicker");
  assert.equal(compare.state.playing, false);
  assert.match(compare.describe(), /paused/);
  assert.equal(compare.key({ key: "p" }).handled, false);
  assert.equal(compare.key({ key: " " }).handled, true);
  assert.equal(compare.state.playing, false);
});

test("compare state rejects malformed interactive control data", () => {
  const invalid = [
    { mode: "unknown-mode" },
    { manual: "middle" },
    { differenceGain: -1 },
    { differenceGain: 0 },
    { differenceGain: 65 },
    { differenceGain: Number.NaN },
    { loupe: { zoom: 5 } },
  ];
  for (const value of invalid) {
    assert.throws(() => normaliseCompareState(value), RangeError);
  }
  const positions = [-100, -0.3, 0, 0.4, 1, 1.4, 100];
  for (const position of positions) {
    const state = normaliseCompareState({ position, loupe: { x: position, y: position, zoom: 3 } });
    assertUnit(state.position);
    assertUnit(state.loupe.x);
    assertUnit(state.loupe.y);
  }
});
