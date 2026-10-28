// Offline R10 salon consultation, original vector artwork, serialization and privacy.
// Every test is catalogue-based or synthetic; no network, faces or external assets.
// Author: John Khan.
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../dist/js/ui/studios/hair/model.js";
import * as V from "../dist/js/ui/studios/hair/variants.js";
import * as D from "../dist/js/ui/studios/hair/diagram.js";
import * as B from "../dist/js/ui/studios/hair/brief.js";

const select = (id = "tpl-bob") => M.defaultSelection(id);
const board = (ids = ["tpl-bob", "tpl-pixie", "tpl-waves", "tpl-low-fade"], count = 4) =>
  V.variants({ gridSize: count, selected: ids, strength: 30 });
const brief = (id = "tpl-bob") => B.buildSalonBrief(select(id), board(), { notes: "Keep current colour" });

for (const [title, id] of [
  ["short fade", "tpl-low-fade"], ["very short crop", "tpl-buzz"],
  ["pixie", "tpl-pixie"], ["bob", "tpl-bob"],
  ["layered long cut", "tpl-long-layers"], ["waves", "tpl-waves"],
  ["fringe", "tpl-curtain"], ["braids", "idea-052"], ["wedding updo", "idea-057"],
]) {
  test(`original schematic shows a ${title} without needing a face or provider`, () => {
    const row = M.styleById(id);
    assert.ok(row, `${id} is catalogue-backed`);
    const a = D.hairDiagramSvg(row), b = D.hairDiagramSvg(row);
    assert.equal(a, b, "diagram rendering is deterministic");
    assert.match(a, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(a, /Cut diagram; not a hair preview/);
    assert.match(a, /role="img"/);
    assert.ok(a.includes(row.name));
    assert.doesNotMatch(a, /https?:\/\/(?!www.w3.org)/);
    assert.ok(a.includes("<path ") && !a.includes("<foreignObject"));
    assert.ok(D.hairDiagramDataUri(row).startsWith("data:image/svg+xml;charset=utf-8,"));
  });
}

test("all authored diagrams are finite, bounded, explicit nonphotographic artworks", () => {
  const seen = new Set();
  for (const row of M.HAIR_STYLES) {
    const svg = D.hairDiagramSvg(row, { size: 240, tone: "neutral", guides: true });
    const metrics = D.diagramMeasurements(row);
    assert.equal(typeof metrics.hairLength, "number");
    assert.ok(metrics.hairLength >= 0.1 && metrics.hairLength <= 1);
    assert.ok(metrics.volume > 0 && metrics.volume <= 1);
    assert.ok(metrics.fringe >= 0 && metrics.fringe <= 1);
    assert.ok(metrics.fade >= 0 && metrics.fade <= 1);
    assert.ok(metrics.braidCount >= 0 && metrics.braidCount <= 7);
    assert.doesNotMatch(svg, /NaN|undefined|Infinity|<script|<image /);
    assert.ok(svg.includes('width="240"'));
    seen.add(svg);
  }
  assert.equal(M.HAIR_STYLES.length, JSON.parse(readFileSync("../api/plumb_api/styling/catalogue.json", "utf8")).styles.length);
  assert.equal(seen.size, M.HAIR_STYLES.length, "every style has its own diagram pattern or caption");
});

test("silhouette families differ rather than duplicating the same look", () => {
  const a = M.styleById("tpl-buzz"), b = M.styleById("tpl-bob"),
    c = M.styleById("idea-052"), d = M.styleById("idea-057");
  assert.ok(D.diagramDistance(a, b) > 0.5);
  assert.ok(D.diagramDistance(b, c) > 5);
  assert.ok(D.diagramDistance(c, d) > 1);
  assert.equal(D.diagramDistance(a, a), 0);
  assert.equal(D.diagramDistance(a, b), D.diagramDistance(b, a));
});

test("diagram size and theme are bounded; no untrusted markup or external assets", () => {
  const style = M.styleById("tpl-bob");
  for (const value of [0, -1, 63, 1601, Number.POSITIVE_INFINITY, NaN])
    assert.throws(() => D.hairDiagramSvg(style, { size: value }), RangeError);
  assert.throws(() => D.hairDiagramSvg(style, { tone: "unsafe" }), RangeError);
  assert.throws(() => D.hairDiagramSvg(style, { background: "url(https://elsewhere)" }), RangeError);
  assert.throws(() => D.hairDiagramSvg({ ...style, id: "unknown" }), RangeError);
  const without = D.hairDiagramSvg(style, { guides: false, background: "transparent", showCaption: false });
  assert.doesNotMatch(without, /<rect width="124"/);
  assert.doesNotMatch(without, /<text x="62"/);
  const full = D.hairDiagramSvg(style, { guides: true });
  assert.notEqual(full, without);
});

test("salon brief uses the approved catalogue, never a made-up provider ID", () => {
  const result = brief();
  assert.equal(result.format, B.SALON_FORMAT);
  assert.equal(result.primary.id, "tpl-bob");
  assert.equal(result.strength, 30);
  assert.equal(result.keepCurrentColour, true);
  assert.ok(result.alternatives.every((row) => M.styleById(row.id)));
  assert.ok(result.guidance.some((line) => line.includes("perimeter")));
  assert.ok(result.guidance.some((line) => line.includes("current colour")));
  assert.match(result.disclosure, /Not results on your face/);
});

test("consultation brief records optional hair tasks as preferences, not rendered results", () => {
  const model = { ...select(), keepColour: false, strength: 18,
    adjuncts: { bangs: 20, curl: 35, extension: 55, volume: 80 } };
  const result = B.buildSalonBrief(model, board(), { title: "A new haircut", notes: "Please discuss layers" });
  assert.deepEqual(result.modifiers, model.adjuncts);
  assert.equal(result.keepCurrentColour, false);
  assert.equal(result.guidance.filter((line) => line.includes("/100 preference")).length, 4);
  assert.equal(result.title, "A new haircut");
  assert.equal(result.personalNotes, "Please discuss layers");
  assert.doesNotMatch(B.salonBriefText(result), /verified photograph|reference app score|photoreal/);
});

test("long, curly, protective and event consultations offer distinct practical questions", () => {
  const ids = ["tpl-long-layers", "idea-040", "idea-052", "idea-057"];
  const phrases = ["length to retain", "natural curl or coil pattern", "sectioning and maintenance", "similar light"];
  for (let i = 0; i < ids.length; i++) {
    const output = B.buildSalonBrief(select(ids[i]), board());
    assert.ok(output.guidance.some((line) => line.includes(phrases[i])), ids[i]);
  }
});

test("cut brief text and editable JSON are useful fully offline", () => {
  const plan = brief();
  const text = B.salonBriefText(plan);
  assert.ok(text.startsWith("My haircut consultation\n"));
  assert.match(text, /stylist conversation:/i);
  assert.match(text, /Bangs: 0\/100/i);
  assert.match(text, /Keep current hair colour: yes/);
  assert.match(text, /Keep current colour/);
  assert.match(text, /not a photo preview/);
  const json = B.salonBriefJson(plan);
  assert.ok(json.endsWith("\n"));
  assert.deepEqual(B.parseSalonBrief(json), plan);
  assert.deepEqual(B.parseSalonBrief(B.salonBriefJson(B.parseSalonBrief(json))), plan);
});

test("reference rights are explicit, and exported briefs do not carry reference image bytes", () => {
  const reference = { fileName: "portrait-ref.jpg", mime: "image/jpeg", size: 439,
    localPreview: "blob:secret-do-not-export" };
  const selection = { ...select(), reference, referenceRights: true };
  const result = B.buildSalonBrief(selection, board());
  const serialized = B.salonBriefJson(result);
  assert.equal(result.referenceProvided, true);
  assert.equal(result.rightsAcknowledged, true);
  for (const sensitive of ["blob:secret", "image/jpeg", "portrait-ref", "localPreview", "photo_id", "data:image/", "face_landmarks", "token", "key"]) {
    assert.ok(!serialized.includes(sensitive), `brief should not include ${sensitive}`);
  }
  assert.equal(B.buildSalonBrief(selection, board(), { referenceRights: false }).rightsAcknowledged, false);
  assert.equal(B.buildSalonBrief({ ...selection, referenceRights: false }, board()).rightsAcknowledged, false);
  assert.throws(() => B.buildSalonBrief({ ...selection, reference: null }, board()), /Rights cannot exist/);
});

test("invalid notes, title and anatomy strings fail closed", () => {
  const original = select();
  assert.throws(() => B.buildSalonBrief(original, board(), { notes: "x".repeat(B.MAX_NOTES + 1) }), RangeError);
  assert.throws(() => B.buildSalonBrief(original, board(), { title: "t".repeat(B.MAX_TITLE + 1) }), RangeError);
  assert.throws(() => B.buildSalonBrief(original, board(), { title: "  " }), RangeError);
  assert.throws(() => B.buildSalonBrief({ ...original, styleId: "fake-new-youcam-id" }, board()), RangeError);
  assert.throws(() => B.buildSalonBrief(original, { ...board(), size: 7 }), RangeError);
  assert.equal(B.buildSalonBrief(original, board(), { notes: " x\u0000y  " }).personalNotes, "xy");
});

test("strict import rejects forged IDs, provider metadata, and malformed strengths", () => {
  const body = brief();
  for (const change of [
    { format: "beljour-salon-brief/2" },
    { strength: 101 }, { strength: 1.5 }, { strength: Infinity },
    { primary: { ...body.primary, id: "madeup-style" } },
    { primary: { ...body.primary, name: "Claimed live style" } },
    { modifiers: { ...body.modifiers, volume: 101 } },
    { modifiers: { ...body.modifiers, brand: 18 } },
    { referenceProvided: false, rightsAcknowledged: true },
    { title: " " }, { disclosure: "Passed reference app arena" },
    { alternatives: Array.from({ length: 12 }, () => body.primary) },
    { personalNotes: "z".repeat(B.MAX_NOTES + 1) },
  ]) {
    assert.throws(() => B.parseSalonBrief(JSON.stringify({ ...body, ...change })), Error,
      `forged data ${JSON.stringify(change).slice(0, 100)} must be rejected`);
  }
  assert.throws(() => B.parseSalonBrief("{"), SyntaxError);
  assert.throws(() => B.parseSalonBrief("x".repeat(40_001)), RangeError);
  assert.throws(() => B.parseSalonBrief(JSON.stringify({ ...body, injected_photo_id: "abc" })), /photo or secret data/);
});

test("4-tile board has one title per cut, with visible labels and no uploaded faces", () => {
  const plan = brief();
  const svg = B.salonBoardSvg(plan, 4);
  assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /role="img"|aria-label=/);
  assert.ok(svg.includes("Cut diagrams only"));
  assert.ok(svg.includes("not rendered") || svg.includes("live not verified"));
  for (const cut of [plan.primary, ...plan.alternatives]) assert.ok(svg.includes(cut.name));
  assert.ok(!svg.includes("localPreview") && !svg.includes("data:image"));
  assert.ok(!svg.includes("<foreignObject"));
  assert.ok((svg.match(/Cut diagram; not a hair preview/g) || []).length > 0);
});

test("9-tile printable vector board is scaled and leaves empty choices empty", () => {
  const ids = M.HAIR_STYLES.slice(0, 9).map((row) => row.id);
  const plan = B.buildSalonBrief(select(ids[0]), board(ids, 9));
  assert.equal(plan.alternatives.length, 8);
  const wide = B.salonBoardSvg(plan, 9, "white");
  const small = B.salonBoardSvg(plan, 4, "light");
  assert.ok(wide.length > small.length);
  assert.ok(ids.every((id) => wide.includes(M.styleById(id).name)));
  assert.ok(wide.includes('width="795"') || wide.includes('viewBox="0 0 '));
  assert.throws(() => B.salonBoardSvg(plan, 8), RangeError);
  assert.throws(() => B.salonBoardSvg(plan, 9, "remote"), RangeError);
});

test("SVG output escapes user text and cannot contain executable markup from the brief title", () => {
  const source = brief();
  const hostile = { ...source, title: `<script>alert('test')</script> & BELJOUR` };
  const svg = B.salonBoardSvg(hostile, 4);
  assert.doesNotMatch(svg, /<script>/);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("&amp; BELJOUR"));
  assert.ok(svg.includes('font-family="Georgia,serif"'));
});

test("salon choice board does not manufacture nine real results from the single S2 fixture", () => {
  const rendered = B.salonBoardSvg(brief(), 9);
  assert.doesNotMatch(rendered, /YouCam styling result|photo before|live render finished|pass score/);
  assert.ok((rendered.match(/Choose another cut/g) || []).length >= 5);
  assert.match(rendered, /YouCam results need a separate request and consent/);
});

test("cut board choices stay unique, in user-selected order, and separate from provider outputs", () => {
  const choices = V.variants({ gridSize: 9, selected: ["tpl-bob", "tpl-bob", "idea-052", "tpl-pixie", "idea-052"] });
  const output = B.buildSalonBrief(select("tpl-bob"), choices);
  assert.deepEqual(output.alternatives.map((r) => r.id), ["idea-052", "tpl-pixie"]);
  assert.ok(output.alternatives.every((r) => r.source === "inspiration" || r.source === "synthetic-s1"));
  assert.ok(output.guidance.every((line) => !/your attractiveness|ethnicity|sex appeal|skin bleaching/i.test(line)));
});
