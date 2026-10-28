/** Judge-path keyboard acceptance; executes the same public controller logic
 * that the actual studio calls. Node cannot prove screen-reader behaviour.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { audit, parseHtml, contrastRows, contrastFailures, readTokens } from "../../dist/js/ui/shell/a11y.js";
import { rovingIndex, trapIndex } from "../../dist/js/ui/shell/focus.js";
import { isPhone, panelVisibility, PanelTabs, PANELS } from "../../dist/js/ui/shell/panels.js";
import { CompareSession } from "../../dist/js/ui/shell/compare-session.js";
import { COMPARE_MODES } from "../../dist/js/ui/shell/compare.js";

const page = readFileSync(new URL("../../studio.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../../shell.css", import.meta.url), "utf8");
const theme = readFileSync(new URL("../../theme.css", import.meta.url), "utf8");
const tokens = readTokens(theme);

function rules(html) {
  return new Set(audit(parseHtml(html)).map((item) => item.rule));
}

test("editor's static skip link, control names, roles and labels survive an audit", () => {
  const issues = audit(parseHtml(page));
  assert.deepEqual(issues, [], `editor HTML has ${issues.length} structural findings`);
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-live/);
  assert.match(page, /role="img"/);
  assert.match(page, /href="#shell-editor"/);
});

test("a broken label, missing reference, duplicate ID or focus trap is detected", () => {
  assert.ok(rules(page.replace('lang="en"', '')).has("lang"));
  assert.ok(rules(page.replace(/<button([^>]*?)type="button"/, '<button$1type="button" tabindex="6"')).has("tabindex"));
  assert.ok(rules(page.replace(/aria-controls="[^"]+"/, 'aria-controls="missing-synthetic-panel"')).has("references"));
  assert.ok(rules(page.replace(/<main\b([^>]*)>/, '<main$1><main id="synthetic-main"></main>')).has("landmarks"));
  assert.ok(rules(page.replace(/<h1[^>]*>[^<]+<\/h1>/, '<h1></h1>')).has("headings"));
});

test("the editor's text colour tokens meet AA in both white and blue tool states", () => {
  const light = ["#FFFFFF", "#F5F7FA", "#F4F6F9", "#ECF2FA", "#EEF3F9"];
  const blue = /\.shell-mode\.is-active|\.shell-stop\.is-active|shell-primary|shell-skip/;
  const backgrounds = (selector) => blue.test(selector) ? ["#000091"] : light;
  const rows = contrastRows(css, tokens, backgrounds);
  assert.ok(rows.length > 150);
  assert.deepEqual(contrastFailures(rows), []);
  const mutation = ".synthetic-bad { color: #eeeeee; background: #ffffff; font-size: 14px; }";
  const broken = contrastRows(mutation, tokens, () => ["#ffffff"]);
  assert.equal(contrastFailures(broken).length, 1);
  assert.ok(broken[0].ratio < 4.5);
});

test("narrow editor shows exactly one panel with persistent preview", () => {
  const controller = new PanelTabs("tools");
  assert.equal(isPhone(390), true);
  for (const id of PANELS) {
    controller.select(id);
    const shown = panelVisibility(390, controller.active);
    assert.deepEqual(PANELS.filter((entry) => shown[entry]), [id]);
  }
  assert.equal(panelVisibility(390, "tools").tools, true);
  assert.equal(panelVisibility(1280, "tools").edit, true);
  assert.equal(PANELS.filter((id) => panelVisibility(1280, "history")[id]).length, 4);
});

test("panel focus follows the arrow key, Home, End and edit-after-tool action", () => {
  const controller = new PanelTabs("tools");
  const visited = [];
  const unsubscribe = controller.subscribe((id) => visited.push(id));
  assert.equal(controller.key("ArrowRight"), "edit");
  assert.equal(controller.key("End"), "history");
  assert.equal(controller.key("ArrowRight"), "tools");
  assert.equal(controller.key("Home"), "tools");
  assert.equal(controller.key("x"), null);
  controller.followTool();
  assert.equal(controller.active, "edit");
  assert.deepEqual(visited, ["edit", "history", "tools", "edit"]);
  unsubscribe();
  controller.select("layers");
  assert.equal(visited.length, 4);
  assert.throws(() => controller.select("synthetic-invalid"));
});

test("roving and trapped focus never escape or skip a valid tab", () => {
  for (const length of [1, 2, 4, 10]) {
    for (let at = 0; at < length; at++) {
      const next = rovingIndex(length, at, "ArrowRight");
      const previous = rovingIndex(length, next, "ArrowLeft");
      assert.equal(previous, at);
      assert.equal(rovingIndex(length, at, "Home"), 0);
      assert.equal(rovingIndex(length, at, "End"), length - 1);
      assert.equal(trapIndex(length, at, false), (at + 1) % length);
      assert.equal(trapIndex(length, at, true), (at - 1 + length) % length);
    }
  }
  assert.equal(rovingIndex(4, 2, "ArrowDown", "horizontal"), null);
  assert.equal(rovingIndex(4, 2, "ArrowDown", "vertical"), 3);
  assert.equal(trapIndex(3, -1, false), 0);
  assert.equal(trapIndex(3, -1, true), 2);
  assert.throws(() => trapIndex(0, 0, false));
});

test("compare keyboard split position is clamped and announced to a screen reader", () => {
  for (const mode of ["split-vertical", "split-horizontal", "split-diagonal"]) {
    const compare = new CompareSession({mode, position: 0.5});
    assert.equal(compare.key({key: "Home"}).handled, true);
    assert.equal(compare.state.position, 0);
    assert.equal(compare.key({key: "End"}).handled, true);
    assert.equal(compare.state.position, 1);
    assert.match(compare.describe(), /100%/);
    assert.equal(compare.key({key: mode === "split-horizontal" ? "ArrowUp" : "ArrowLeft"}).handled, true);
    assert.ok(compare.state.position < 1);
    assert.equal(compare.key({key: "x"}).handled, false);
  }
});

test("compare hold, escape, reduced-motion flicker and mode cycling are reversible", () => {
  const compare = new CompareSession({mode: "hold"}, true);
  assert.equal(compare.key({key: " "}).handled, true);
  assert.equal(compare.showing(), "before");
  assert.match(compare.describe(), /original/);
  assert.equal(compare.key({key: "Escape"}).handled, true);
  assert.equal(compare.showing(), "after");
  compare.setMode("flicker");
  assert.equal(compare.state.playing, false);
  assert.equal(compare.togglePlay(), false);
  assert.equal(compare.key({key: " "}).handled, true);
  assert.equal(compare.showing(), "after");
  for (const mode of COMPARE_MODES) {
    compare.setMode(mode);
    assert.equal(compare.mode, mode);
    assert.ok(compare.describe().length > 15);
    assert.equal(compare.state.playing, false, "reduced motion must stay respected");
  }
  compare.setMode(COMPARE_MODES[0]);
  assert.equal(compare.cycle(-1), COMPARE_MODES.at(-1));
  assert.throws(() => compare.setMode("unavailable-vendor-mode"));
});
