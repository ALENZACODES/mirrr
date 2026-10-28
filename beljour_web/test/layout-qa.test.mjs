// Layout v1 (plan/layout-reference-app-vs-beljour.md §5): the two required tests, plus the tokens,
// My Looks, Rescue, Trust Centre deletion and the editor chrome's pure parts.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as E from "../dist/js/layout/effects.js";
import * as L from "../dist/js/layout/my-looks.js";
import * as R from "../dist/js/layout/rescue.js";
import * as T from "../dist/js/layout/trust.js";
import * as B from "../dist/js/layout/topbar.js";
import * as C from "../dist/js/layout/editor-chrome.js";
import { CATALOGUE } from "../dist/js/ui/shell/catalogue.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { DEFAULT_STRENGTH } from "../dist/js/ui/shell/thumbnails.js";
import { layer } from "../dist/js/ui/shell/layers.js";
import { MemoryStore } from "../dist/js/session.js";
import { readTokens } from "../dist/js/ui/contrast.js";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const presets = JSON.parse(readFileSync(new URL("../../api/plumb_api/arena/default_presets.json", import.meta.url), "utf8"));

// --- spec §5 test 1 ---------------------------------------------------------------------------
test("every effect exposes a 0-100 control with a default at or below the gentle level", () => {
  assert.equal(E.GENTLE_DEFAULT, presets.gentle_default, "web and the women-first preset check agree on the gentle default");
  assert.ok(E.GENTLE_DEFAULT <= E.GENTLE_MAX);
  assert.deepEqual(E.STRENGTH_TICKS.map((t) => [t.name, t.value]), [["Subtle", 33], ["Normal", 66], ["Strong", 100]]);
  for (const fx of E.EFFECTS) {
    const c = E.control(fx);
    assert.equal(c.min, 0, fx.id); assert.equal(c.max, 100, fx.id); assert.equal(c.step, 1, fx.id);
    assert.ok(c.value >= 0 && c.value <= E.GENTLE_MAX, `${fx.id} starts at ${c.value}`);
    if (fx.optIn) assert.equal(c.value, 0, `${fx.id} is opt-in, so it starts off`);
  }
  // the studio's own tools start gentle too: a new layer, a layer built by hand, and the previews
  const editor = new Editor("low-light");
  assert.ok(editor.add("enhance").strength <= E.GENTLE_MAX);
  assert.ok(layer("x-1", "beard", "Beard").strength <= E.GENTLE_MAX);
  assert.ok(DEFAULT_STRENGTH <= E.GENTLE_MAX, "thumbnails preview what one tap gives");
  for (const tool of CATALOGUE) assert.ok(E.EFFECTS.some((fx) => fx.studio === tool.id), `${tool.id} has an effect row`);
  for (const p of presets.presets) for (const s of p.steps) assert.ok(s.strength <= E.GENTLE_MAX, p.id);
  // reshaping is opt-in
  for (const id of ["face-shape"]) assert.equal(E.effect(id).optIn, true);
});

// --- spec §5 test 2 ---------------------------------------------------------------------------
test("every top bar has Trust, and every tool top bar has Save", () => {
  const appPages = ["index.html", "home.html", "studio.html", "trust.html", "arena.html"];
  for (const page of appPages) {
    const html = read(page);
    assert.deepEqual(B.auditTopbars(page, html), [], page);
    const headers = (html.match(/<header\b/gi) || []).length;
    assert.equal(B.topbars(html).length, headers, `${page}: every header is a top bar`);
  }
  assert.equal(B.topbars(read("studio.html"))[0].tool, true);
  assert.equal(B.topbars(read("arena.html"))[0].tool, true);
  // the audit really catches a missing Save or Trust
  assert.equal(B.auditTopbars("x", '<header class="lg-topbar" data-tool><a class="lg-trust-pill" href="trust.html">Trust</a></header>')[0].problem,
    "tool top bar has no Save button");
  assert.equal(B.auditTopbars("x", '<header class="lg-topbar"><button data-save>Save</button></header>')[0].problem,
    "top bar has no Trust pill linking to trust.html");
  assert.equal(B.auditTopbars("x", "<main></main>")[0].problem, "no lg-topbar header");
});

test("theme tokens are the exact flag colours and neutrals, with a system serif stack", () => {
  const tokens = readTokens(read("theme.css"));
  assert.equal(tokens.bleu, "#000091");
  assert.equal(tokens.blanc, "#FFFFFF");
  assert.equal(tokens.rouge, "#E1000F");
  assert.equal(tokens.ink, "#1B1B35");
  assert.equal(tokens.muted, "#5A5A70");
  assert.equal(tokens.rule, "#DCDCE6");
  assert.equal(tokens.panel, "#F5F5FA");
  const css = read("theme.css");
  assert.match(css, /--font-serif: Georgia, "Times New Roman", Times, serif;/);
  assert.doesNotMatch(css, /Didot|Bodoni|@font-face/i);
  for (const page of ["theme.css", "home.html", "trust.html", "studio.html", "arena.html", "layout.css"]) {
    const text = read(page).replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");  // comments may cite sources
    assert.doesNotMatch(text, /font-family[^;]*marianne|--font[^;]*marianne/i, `${page}: no Marianne typeface`);
    assert.doesNotMatch(text, /\bdsfr\b|class="fr-|République/i, `${page}: colour values only, no DSFR components or wording`);
  }
});

test("Home puts Rescue first and has My Looks, Fix everyone, recent photos, the tool grid and four tabs", () => {
  const html = read("home.html");
  const order = ["lg-rescue", "lg-looks", "Fix everyone", "lg-recent", "lg-tools", "lg-tabs"].map((k) => html.indexOf(k));
  assert.ok(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), `order ${order}`);
  assert.match(html, /href="studio\.html#rescue"/);
  const tabs = html.slice(html.indexOf('class="lg-tabs"'));
  assert.deepEqual([...tabs.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]), ["Home", "Edit", "My Looks", "Trust"]);
});

test("Editor has the strength slider, split compare, tags, face picker, category bar and Save as My Look", () => {
  const html = read("studio.html");
  for (const id of ["lg-strength", "lg-split", "lg-sim-tag", "lg-still-tag", "lg-faces", "lg-categories", "lg-save-look", "lg-look-name"]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /<input id="lg-strength" type="range" min="1" max="5" step="0\.1"/);
  assert.match(html, /Simulation, edited photo/);
  assert.doesNotMatch(html, /check passed/, "the Still you tag never shows a made-up pass");
});

// --- My Looks ---------------------------------------------------------------------------------
test("My Looks save, list, export, import and survive broken storage", () => {
  const store = new MemoryStore();
  const looks = new L.LookStore(store, () => new Date("2026-10-23T06:00:00Z"));
  const saved = looks.save("Office day", [{ kind: "enhance", strength: 30, params: { mode: "natural" } }]);
  assert.match(saved.id, /^look-[0-9a-f]{8}$/);
  assert.equal(new L.LookStore(store).list().length, 1, "stored and read back");
  assert.equal(L.describe(saved), "Enhance 30");
  const text = L.exportText(saved);
  assert.doesNotMatch(text, /data:image|landmark|face/i, "a look file holds settings only");
  const copy = looks.importText(text);
  assert.equal(copy.name, "Office day");
  assert.throws(() => looks.importText("{}"), L.LookError);
  assert.throws(() => looks.importText(JSON.stringify({ ...saved, steps: [{ kind: "makeup", strength: 10 }] })), /tool this app/);
  assert.throws(() => looks.save("", []), L.LookError);
  assert.equal(looks.remove(saved.id), true);
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const quiet = new L.LookStore(broken);
  assert.equal(quiet.save("Page only", [{ kind: "beard", strength: 20, params: {} }]).name, "Page only");
  assert.equal(quiet.list().length, 1);
  const steps = L.stepsFromLayers([{ kind: "enhance", strength: 40, enabled: true, parameters: { mode: "vivid" } },
    { kind: "beard", strength: 50, enabled: false, parameters: {} }, { kind: "styling", strength: 50, enabled: true, parameters: {} }]);
  assert.deepEqual(steps, [{ kind: "enhance", strength: 40, params: { mode: "vivid" } }]);
});

test("Rescue mirrors the checked preset and says what isn't built", () => {
  const rescue = presets.presets.find((p) => p.id === "rescue");
  assert.deepEqual(R.rescueSteps().map((s) => [s.kind, s.strength, s.params.mode]),
    rescue.steps.map((s) => [s.engine, s.strength, s.mode]));
  assert.deepEqual([...R.RESCUE_NOT_BUILT], rescue.not_built);
  assert.match(R.rescueLine(), /under-eye brightening matched to your own cheek\. Not in Rescue yet: dull skin glow, flyaway hair \(Glow is in the Skin tools\)\./);
  const copy = R.rescueSteps(); copy[0].strength = 99;
  assert.equal(R.rescueSteps()[0].strength, 30, "the recipe can't be changed from outside");
});

// --- Trust Centre -----------------------------------------------------------------------------
function fakeConsent() {
  return { localOnly: false, hasVisit: true, withdrawn: 0,
    setLocalOnly(on) { this.localOnly = on; }, withdraw() { this.withdrawn++; this.hasVisit = false; } };
}

test("Trust Centre lines are wired or say Not built", () => {
  const consent = fakeConsent();
  const session = new MemoryStore();
  const pref = T.simulationLabelPref(session);
  const deps = { consent, simulationLabel: pref };
  const items = T.trustItems(deps);
  assert.deepEqual(items.map((i) => i.id), ["on-device", "never-train", "neutral-defaults", "simulation-label", "swap-mark", "no-sexualised", "delete"]);
  assert.equal(items.find((i) => i.id === "swap-mark").state, "not built");
  assert.equal(items.find((i) => i.id === "simulation-label").state, "on", "label on by default");
  T.setToggle(deps, "on-device", true);
  assert.equal(consent.localOnly, true);
  T.setToggle(deps, "simulation-label", false);
  assert.equal(pref.get(), false);
  assert.throws(() => T.setToggle(deps, "never-train", true), RangeError);
});

test("Delete my face data runs every step, keeps going after a failure and returns a receipt", async () => {
  const session = new MemoryStore();
  for (const k of ["beljour.consent", "beljour.session", "beljour.pending"]) session.setItem(k, "x");
  T.rememberPhotoId(session, "abc123def");
  T.rememberPhotoId(session, "bad id!");
  assert.deepEqual(T.knownPhotoIds(session), ["abc123def"]);
  const deleted = [];
  const looks = new L.LookStore(new MemoryStore());
  looks.save("Keep me", [{ kind: "enhance", strength: 30, params: {} }]);
  const receipt = await T.deleteFaceData({
    consent: fakeConsent(), session, sessionKeys: ["beljour.consent", "beljour.session", "beljour.pending", T.PHOTO_IDS_KEY],
    clearHistory: async () => { throw new Error("IndexedDB blocked"); }, photoIds: T.knownPhotoIds(session),
    deletePhoto: async (id) => { deleted.push(id); return { deleted: true }; }, looks, alsoLooks: false,
    clock: () => new Date("2026-10-23T06:30:00Z") });
  assert.deepEqual(deleted, ["abc123def"]);
  assert.equal(session.getItem("beljour.session"), null);
  assert.equal(T.knownPhotoIds(session).length, 0);
  const results = Object.fromEntries(receipt.lines.map((l) => [l.what, l.result]));
  assert.equal(results["Consent"], "deleted");
  assert.equal(results["This tab's session"], "deleted");
  assert.equal(results["Skin and body history on this device"], "failed");
  assert.equal(results["Uploaded photo"], "deleted");
  assert.equal(results["My Looks"], "kept");
  assert.equal(looks.list().length, 1);
  assert.match(receipt.id, /^R-[0-9A-F]{8}$/);
  assert.match(T.receiptText(receipt), /Deletion receipt R-/);
  const second = await T.deleteFaceData({ consent: { withdraw() {}, hasVisit: false }, session, sessionKeys: ["beljour.session"],
    clearHistory: async () => {}, photoIds: [], deletePhoto: null, looks, alsoLooks: true, clock: () => new Date() });
  assert.equal(second.lines.find((l) => l.what === "My Looks").result, "deleted");
  assert.equal(second.lines.find((l) => l.what === "Uploaded photos on our server").result, "nothing to delete");
});

// --- editor chrome ----------------------------------------------------------------------------
test("editor chrome: hash actions, category targets and applying looks to the real editor", () => {
  assert.deepEqual(C.parseHash("#rescue"), { kind: "rescue" });
  assert.deepEqual(C.parseHash("#look=look-0a1b2c3d"), { kind: "look", id: "look-0a1b2c3d" });
  assert.deepEqual(C.parseHash("#cat=Hair"), { kind: "category", category: "Hair" });
  assert.deepEqual(C.parseHash("#cat=Nope"), { kind: "none" });
  assert.deepEqual(C.parseHash("#look=../../x"), { kind: "none" });
  assert.equal(C.categoryTarget("Photo").studio, "enhance");
  assert.equal(C.categoryTarget("Body").studio, "posture");
  assert.deepEqual(C.categoryTarget("Skin"), { studio: "skin", note: "" });
  assert.deepEqual(C.categoryTarget("Grey"), { studio: "grey", note: "" });
  const shape = C.categoryTarget("Shape");
  assert.equal(shape.studio, null);
  assert.match(shape.note, /Previews screen/);
  const editor = new Editor("low-light");
  const res = C.applySteps(editor, R.rescueSteps());
  assert.equal(res.added, 1);
  assert.equal(editor.document.layers[0].strength, 30);
  assert.equal(editor.document.layers[0].parameters.mode, "natural");
  assert.equal(C.showsSimulation(editor.document.layers), false, "enhance alone is not a simulation");
  assert.equal(C.editTag(editor.document.layers), "Edited photo");
  assert.equal(C.editTag([]), null);
  assert.equal(C.editTag([{ ...editor.document.layers[0], simulation: true }]), "Simulation, edited photo");
  const beard = C.applySteps(editor, [{ kind: "beard", strength: 20, params: {} }]);
  assert.equal(beard.added, 0, "beard needs a recorded face on this sample");
  assert.match(beard.skipped[0], /beard/);
  assert.equal(C.faceCount(editor), 0);
});
