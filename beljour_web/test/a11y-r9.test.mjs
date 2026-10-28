// R9 accessibility baseline: studio.html structure, shell.css contrast against theme.css, the
// keyboard map, roving focus and dialog trap arithmetic, phone panels and the announcer.
// The live page runs the same audit with studio.html?audit=1 (see test/browser/shell-r9.py).
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as A from "../dist/js/ui/shell/a11y.js";
import * as K from "../dist/js/ui/shell/keymap.js";
import * as F from "../dist/js/ui/shell/focus.js";
import * as P from "../dist/js/ui/shell/panels.js";
import { Announcer } from "../dist/js/ui/shell/announcer.js";
import { CATALOGUE } from "../dist/js/ui/shell/catalogue.js";
import { COMPARE_MODES, MODE_INFO } from "../dist/js/ui/shell/compare.js";

const page = readFileSync(new URL("../studio.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../shell.css", import.meta.url), "utf8");
const tokens = A.readTokens(readFileSync(new URL("../theme.css", import.meta.url), "utf8"));

test("studio.html passes the baseline rules: names, labels, ids, headings, landmarks, live regions, skip link", () => {
  const issues = A.audit(A.parseHtml(page));
  assert.deepEqual(issues, []);
});

test("the audit catches the mistakes it is meant to catch", () => {
  const bad = `<!doctype html><html><head></head><body>
    <a href="#nowhere">Skip</a>
    <main></main><main></main>
    <h1>Title</h1><h3>Skipped</h3><h2></h2>
    <button></button><button type="button" aria-label="Ok">x</button>
    <input id="a"><input id="a" type="text">
    <label for="ghost">Ghost</label>
    <div tabindex="3">x</div>
    <img src="x.png"><canvas></canvas>
    <div role="dialog">no label</div>
    <div role="radiogroup"><button type="button" role="radio">1</button></div>
    <div role="tablist"><button type="button" role="tab" aria-controls="missing">t</button></div>
  </body></html>`;
  const rules = new Set(A.audit(A.parseHtml(bad)).map((i) => i.rule));
  for (const rule of ["lang", "title", "landmarks", "headings", "names", "unique-ids", "references", "tabindex", "images",
    "dialogs", "tabs", "live", "skip-link", "button-type"]) assert.ok(rules.has(rule), `expected a ${rule} issue`);
});

test("the HTML reader handles attributes, entities, void elements, comments and raw text", () => {
  const root = A.parseHtml(`<!-- c --><div id="x" data-a='1' hidden><p>a &amp; b &rarr; c</p><br><input value=3 disabled>
    <script>if (a < b) { "<p>" }</script><span>t</span></div>`);
  const nodes = A.walk(root);
  const div = nodes.find((n) => n.attrs.id === "x");
  assert.equal(div.attrs["data-a"], "1");
  assert.equal("hidden" in div.attrs, true);
  assert.equal(A.textOf(nodes.find((n) => n.tag === "p")), "a & b → c");
  assert.deepEqual(div.children.map((c) => c.tag), ["p", "br", "input", "script", "span"]);
  assert.equal(nodes.find((n) => n.tag === "input").attrs.value, "3");
  assert.equal(A.textOf(div).includes("<p>"), false, "script text isn't page text");
});

test("accessible names come from aria-labelledby, aria-label, labels, wrapping labels and text", () => {
  const root = A.parseHtml(`<html lang="en"><body><span id="n">Named</span>
    <button type="button" aria-labelledby="n"></button><button type="button" aria-label="Lab"></button>
    <label for="i1">Field</label><input id="i1"><label>Wrapped <select></select></label><button type="button"><span>Text</span></button></body></html>`);
  const all = A.walk(root), ids = new Map(all.filter((n) => n.attrs.id).map((n) => [n.attrs.id, n]));
  const names = all.filter((n) => ["button", "input", "select"].includes(n.tag)).map((n) => A.accessibleName(n, ids));
  assert.deepEqual(names, ["Named", "Lab", "Field", "Wrapped", "Text"]);
});

// layout v1 made the studio top bar white, so header selectors now sit on the white surfaces
const ON_BLUE = /\.shell-mode\.is-active|\.shell-stop\.is-active|shell-primary|shell-skip/;
const SURFACES = ["#FFFFFF", "#F5F7FA", "#F4F6F9", "#ECF2FA", "#EEF3F9"];
const surfacesFor = (selector) => ON_BLUE.test(selector) ? ["#000091"] : SURFACES;

test("every text colour in shell.css meets WCAG AA on the surfaces it sits on", () => {
  const rows = A.contrastRows(css, tokens, surfacesFor);
  assert.ok(rows.length > 150, `checked ${rows.length} colour pairs`);
  const fails = A.contrastFailures(rows).map((r) => `${r.selector} ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.needed}`);
  assert.deepEqual(fails, []);
});

test("the contrast reader resolves tokens, short hex and named colours, and sizes the AA bar", () => {
  assert.equal(A.solidColour("var(--bleu)", tokens), "#000091");
  assert.equal(A.solidColour("#fff", tokens), "#FFFFFF");
  assert.equal(A.solidColour("1px solid white", tokens), "#FFFFFF");
  assert.equal(A.solidColour("linear-gradient(red, blue)", tokens), null);
  const rules = A.cssRules("/* x */ a, b { color: #000; } @media (max-width: 9px) { c { color: #111 } } @keyframes k { from { color: red } }");
  assert.deepEqual(rules.map((r) => r.selector), ["a", "b", "c"]);
  const big = A.contrastRows(".h { color: #767676; font: 400 26px serif; }", tokens, () => ["#FFFFFF"]);
  assert.equal(big[0].needed, 3);
  const small = A.contrastRows(".h { color: #767676; font-size: 12px; }", tokens, () => ["#FFFFFF"]);
  assert.equal(small[0].needed, 4.5);
});

test("touch targets: phone rules give the main controls at least 40 px", () => {
  const phone = A.cssRules(css.slice(css.lastIndexOf("@media (max-width: 660px)")));
  const sized = (sel) => phone.find((r) => r.selector === sel && /min-height:\s*(4\d)px/.test(`min-height: ${r.declarations["min-height"] ?? ""}`));
  for (const sel of [".shell-mode", ".shell-button", ".shell-tabs [role=\"tab\"]"]) assert.ok(sized(sel), `${sel} has a 40 px+ min-height on phones`);
});

test("keyboard map: undo/redo chords, tool letters, compare digits, hold, and nothing while typing", () => {
  const opts = { singleKeys: true };
  const down = (key, extra = {}) => K.resolveKey({ type: "keydown", key, ...extra }, opts);
  assert.deepEqual(down("z", { ctrlKey: true }), { type: "undo" });
  assert.deepEqual(down("Z", { metaKey: true, shiftKey: true }), { type: "redo" });
  assert.deepEqual(down("y", { ctrlKey: true }), { type: "redo" });
  for (const mode of COMPARE_MODES) assert.deepEqual(down(MODE_INFO[mode].key), { type: "compare", mode });
  for (const tool of CATALOGUE.filter((t) => t.shortcut)) assert.deepEqual(down(tool.shortcut.toLowerCase()), { type: "studio", id: tool.id });
  assert.deepEqual(down("]"), { type: "compare-step", step: 1 });
  assert.deepEqual(down("\\"), { type: "hold", on: true });
  assert.equal(down("\\", { repeat: true }), null, "auto-repeat doesn't re-trigger hold");
  assert.deepEqual(K.resolveKey({ type: "keyup", key: "\\" }, opts), { type: "hold", on: false });
  assert.deepEqual(down("?"), { type: "help" });
  assert.equal(down("."), null, "demo keys only work while the tour is open");
  assert.deepEqual(K.resolveKey({ type: "keydown", key: "." }, { singleKeys: true, demoActive: true }), { type: "demo-step", step: 1 });
  assert.equal(down("e", { editable: true }), null, "typing in a field is never hijacked");
  assert.equal(down("z", { ctrlKey: true, editable: true }), null, "native text undo stays in fields");
  assert.deepEqual(down("Escape", { editable: true }), { type: "escape" });
  assert.equal(down("2", { inDialog: true }), null);
  assert.equal(down("e", { altKey: true }), null);
  assert.equal(down("e", { ctrlKey: true }), null);
  assert.equal(down("E", { shiftKey: true }), null);
});

test("single-key shortcuts can be turned off (WCAG 2.1.4) while chords keep working", () => {
  const off = { singleKeys: false };
  for (const key of ["1", "e", "[", "\\", "+", "?"]) assert.equal(K.resolveKey({ type: "keydown", key }, off), null, key);
  assert.deepEqual(K.resolveKey({ type: "keydown", key: "z", ctrlKey: true }, off), { type: "undo" });
  assert.deepEqual(K.shortcutCollisions(), []);
  assert.ok(K.SHORTCUTS.every((s) => s.keys && s.does));
  assert.equal(K.SHORTCUTS.filter((s) => s.group === "Compare" && /^\d$/.test(s.keys)).length, 10);
});

test("roving focus and the dialog trap move the way the WAI-ARIA patterns describe", () => {
  assert.equal(F.rovingIndex(5, 0, "ArrowRight"), 1);
  assert.equal(F.rovingIndex(5, 4, "ArrowRight"), 0, "wraps");
  assert.equal(F.rovingIndex(5, 4, "ArrowRight", "horizontal", false), 4);
  assert.equal(F.rovingIndex(5, 0, "ArrowLeft"), 4);
  assert.equal(F.rovingIndex(5, 2, "ArrowDown"), null, "a horizontal group ignores up/down");
  assert.equal(F.rovingIndex(5, 2, "ArrowDown", "vertical"), 3);
  assert.equal(F.rovingIndex(5, 2, "ArrowUp", "both"), 1);
  assert.equal(F.rovingIndex(5, 2, "Home"), 0);
  assert.equal(F.rovingIndex(5, 2, "End"), 4);
  assert.equal(F.rovingIndex(5, 2, "a"), null);
  assert.equal(F.rovingIndex(0, 0, "ArrowRight"), null);
  assert.equal(F.trapIndex(3, 2, false), 0);
  assert.equal(F.trapIndex(3, 0, true), 2);
  assert.equal(F.trapIndex(3, 1, false), 2);
  assert.equal(F.trapIndex(3, -1, false), 0, "focus outside the dialog comes back to the first control");
  assert.equal(F.trapIndex(3, -1, true), 2);
  assert.throws(() => F.trapIndex(0, 0, false), /at least one/);
});

test("phone panels: one panel at a time at 390 px, all panels at 1280 px, keyboard tabs", () => {
  assert.deepEqual(P.panelVisibility(390, "layers"), { tools: false, edit: false, layers: true, history: false });
  assert.deepEqual(P.panelVisibility(1280, "layers"), { tools: true, edit: true, layers: true, history: true });
  assert.equal(P.isPhone(660), true); assert.equal(P.isPhone(661), false);
  const tabs = new P.PanelTabs();
  const seen = []; tabs.subscribe((id) => seen.push(id));
  assert.equal(tabs.key("ArrowRight"), "layers");
  assert.equal(tabs.key("End"), "history");
  assert.equal(tabs.key("ArrowRight"), "tools", "wraps");
  tabs.followTool();
  assert.equal(tabs.active, "edit");
  assert.equal(tabs.key("x"), null);
  assert.deepEqual(seen, ["layers", "history", "tools", "edit"]);
  assert.throws(() => tabs.select("map"), /Unknown/);
  assert.throws(() => P.isPhone(0), /positive/);
});

test("the page's panel ids and tabs match the panel list", () => {
  for (const id of P.PANELS) {
    assert.match(page, new RegExp(`id="shell-tab-${id}"[^>]*aria-controls="shell-panel-${id}"`));
    assert.match(page, new RegExp(`id="shell-panel-${id}"[^>]*data-panel-id="${id}"`));
  }
});

test("announcements settle, drop quick repeats, and let urgent messages through at once", async () => {
  const said = []; let now = 0;
  const a = new Announcer((t, p) => said.push([t, p]), () => now, 5, 1000);
  a.say("Line at 50%"); a.say("Line at 55%"); a.say("Line at 60%");
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(said, [["Line at 60%", "polite"]], "a burst collapses to its last message");
  a.say("Line at 60%"); a.flush();
  assert.equal(said.length, 1, "the same text within a second is dropped");
  now = 2000; a.say("Line at 60%"); a.flush();
  assert.equal(said.length, 2);
  a.say("Can't use this photo", "assertive");
  assert.deepEqual(said.at(-1), ["Can't use this photo", "assertive"]);
  a.say("   "); a.flush();
  assert.equal(said.length, 3);
});
