/** Manual observation editing, history and privacy. Author: John Khan. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { annotateBrows, validateMarks, observationDocument, parseObservations, exportObservations,
  simplifyMark, BrowObservationEditor, browFrames } from "../dist/js/engines/brows/index.js";

const corpus = JSON.parse(readFileSync(new URL("../../parity/brows-r15b.json", import.meta.url), "utf8"));
const source = corpus.cases[0];
const image = { width: source.width, height: source.height, channels: source.channels,
  data: new Uint8Array(Buffer.from(source.image, "base64")) };
const face = source.landmarks;
const mark = (mode = "hair", opacity = 1) => ({ mode, opacity, radius: 0.006, points: [[0.28, 0.31], [0.33, 0.31]] });

test("manual corrections stay inside the current brow masks", () => {
  const before = image.data.slice(), marks = [mark(), mark("grey", 0.5)];
  const snapshot = structuredClone(marks), result = annotateBrows(image, face, marks, undefined, true);
  const frames = browFrames(face, image.width, image.height);
  assert.ok(result.coverage.some(value => value > 0));
  assert.ok(result.grey.some(value => value > 0));
  for (let i = 0; i < result.coverage.length; i++) {
    if (frames.every(frame => frame.mask[i] === 0)) assert.equal(result.coverage[i], 0);
    assert.ok(result.grey[i] <= result.coverage[i]);
  }
  assert.deepEqual(image.data, before);
  assert.deepEqual(marks, snapshot);
  assert.equal(result.origin, "manual");
  assert.equal(result.confidence, 1);
});

test("an unreviewed drawing stays explicitly incomplete", () => {
  const result = annotateBrows(image, face, [mark()]);
  assert.equal(result.confidence, 0);
  assert.equal(result.origin, "contrast");
  assert.match(result.notes.join(" "), /incomplete/);
});

test("erase reduces coverage and grey without modifying base evidence", () => {
  const base = annotateBrows(image, face, [mark("grey")], undefined, true);
  const original = base.coverage.slice();
  const result = annotateBrows(image, face, [mark("erase", 0.5)], base, true);
  assert.ok(result.coverage.reduce((a, b) => a + b, 0) < base.coverage.reduce((a, b) => a + b, 0));
  assert.ok(result.grey.reduce((a, b) => a + b, 0) < base.grey.reduce((a, b) => a + b, 0));
  assert.deepEqual(base.coverage, original);
  assert.notEqual(result.coverage.buffer, base.coverage.buffer);
});

test("zero opacity, single-point and outside-contour dabs behave explicitly", () => {
  const dab = { ...mark(), points: [[0.3, 0.31]] };
  assert.ok(annotateBrows(image, face, [dab]).coverage.some(value => value > 0));
  assert.equal(annotateBrows(image, face, [{ ...dab, opacity: 0 }]).coverage.some(value => value > 0), false);
  assert.equal(annotateBrows(image, face, [{ ...dab, points: [[0.95, 0.95]] }]).coverage.some(value => value > 0), false);
});

test("observation documents are limited and contain no photo or person fields", () => {
  const document = observationDocument(96, 96, [mark()], true);
  assert.deepEqual(parseObservations(exportObservations(document), [96, 96]), document);
  assert.equal(document.author, "John Khan");
  for (const field of ["photo", "name", "landmarks", "notes"]) assert.throws(() => parseObservations({ ...document, [field]: "private" }), /fields/);
  assert.throws(() => parseObservations(document, [128, 128]), /dimensions/);
  assert.throws(() => parseObservations(" ".repeat(1048577)), /1 MiB/);
  assert.throws(() => parseObservations("{"), /JSON/);
  assert.throws(() => parseObservations({ ...document, format: "unknown" }), /format/);
});

test("invalid annotation shapes and resource counts are rejected", () => {
  for (const bad of [{ radius: 0 }, { radius: 0.1 }, { opacity: NaN }, { mode: "fill" },
    { points: [] }, { points: [[-1, 0.5]] }, { points: [[0.5, Infinity]] }, { points: [[0.5, 0.5, 0.2]] }]) {
    assert.throws(() => validateMarks([{ ...mark(), ...bad }]));
  }
  assert.throws(() => validateMarks(Array(257).fill(mark())), /256/);
  assert.throws(() => validateMarks([{ ...mark(), points: Array(513).fill([0.5, 0.5]) }]), /512/);
});

test("stroke simplification retains exact first and last anchors", () => {
  const points = [[0.2, 0.3], [0.2001, 0.3], [0.21, 0.3], [0.2101, 0.3], [0.25, 0.3]];
  assert.deepEqual(simplifyMark(points, 0.002), [points[0], points[2], points[4]]);
  assert.deepEqual(simplifyMark([points[0]]), [points[0]]);
  assert.deepEqual(simplifyMark([points[0], points[0]]), [points[0]]);
});

test("editor undo and redo preserve reviewed status and branch correctly", () => {
  const editor = new BrowObservationEditor(96, 96);
  assert.equal(editor.undo(), false);
  editor.add(mark());
  editor.confirmReview();
  assert.equal(editor.state().document.reviewed, true);
  editor.add(mark("grey"));
  assert.equal(editor.state().document.reviewed, false);
  assert.equal(editor.undo(), true);
  assert.equal(editor.state().document.reviewed, true);
  assert.equal(editor.redo(), true);
  assert.equal(editor.state().document.marks.length, 2);
  editor.undo();
  editor.add(mark("erase"));
  assert.equal(editor.redo(), false);
  assert.equal(editor.state().document.marks[1].mode, "erase");
});

test("editor snapshots, inputs and listeners have independent ownership", () => {
  const editor = new BrowObservationEditor(96, 96), original = mark();
  editor.add(original);
  original.points[0][0] = 0.9;
  const snapshot = editor.state();
  snapshot.document.marks[0].points[0][0] = 0.8;
  assert.equal(editor.state().document.marks[0].points[0][0], 0.28);
  let events = 0;
  const unsubscribe = editor.subscribe(state => { events++; state.document.marks.length = 0; });
  editor.confirmReview();
  assert.equal(editor.state().document.marks.length, 1);
  unsubscribe();
  const count = events;
  editor.clear();
  assert.equal(events, count);
});

test("editor history is bounded and preserves future edits after view errors", () => {
  const editor = new BrowObservationEditor(96, 96, 2);
  editor.add(mark()); editor.add(mark("grey")); editor.add(mark("erase"));
  assert.equal(editor.undo(), true);
  assert.equal(editor.undo(), true);
  assert.equal(editor.undo(), false);
  let calls = 0;
  editor.subscribe(() => { calls++; if (calls > 1) throw new Error("view failure"); });
  assert.doesNotThrow(() => editor.add(mark()));
  assert.ok(editor.state().dirty);
});

test("explicit export marks a saved revision and import checks current dimensions", () => {
  const editor = new BrowObservationEditor(96, 96);
  editor.add(mark());
  assert.equal(editor.state().dirty, true);
  const text = editor.exportText();
  assert.equal(editor.state().dirty, false);
  editor.clear();
  editor.importText(text);
  assert.equal(editor.state().document.marks.length, 1);
  const other = exportObservations(observationDocument(128, 128, [mark()]));
  const previous = editor.state();
  assert.throws(() => editor.importText(other), /dimensions/);
  assert.deepEqual(editor.state(), previous);
});

test("edit replacement and removal validate indices and clear review", () => {
  const editor = new BrowObservationEditor(96, 96);
  editor.add(mark()); editor.confirmReview();
  editor.replace(0, mark("grey"));
  assert.equal(editor.state().document.reviewed, false);
  assert.equal(editor.state().document.marks[0].mode, "grey");
  assert.throws(() => editor.replace(1, mark()), /index/);
  assert.throws(() => editor.remove(-1), /index/);
  editor.remove(0);
  assert.equal(editor.state().document.marks.length, 0);
});

test("dispose clears current marks and every history reference", () => {
  const editor = new BrowObservationEditor(96, 96);
  editor.add(mark()); editor.add(mark("grey")); editor.undo();
  editor.dispose(); editor.dispose();
  const state = editor.state();
  assert.equal(state.disposed, true);
  assert.equal(state.document.marks.length, 0);
  assert.equal(state.canUndo, false);
  assert.equal(state.canRedo, false);
  assert.throws(() => editor.add(mark()), /disposed/);
  assert.throws(() => editor.exportText(), /disposed/);
  assert.throws(() => editor.undo(), /disposed/);
});

test("measurement diary interchange is explicit, bounded and noncausal", async () => {
  const { diaryDocument, parseDiary, exportDiary, summarizeDiary } = await import("../dist/js/engines/brows/index.js");
  const entries = corpus.diary;
  const document = diaryDocument(entries);
  assert.deepEqual(parseDiary(exportDiary(entries)), document);
  const summary = summarizeDiary(entries);
  assert.equal(summary.count, 2);
  assert.equal(summary.brows.status, "observed");
  assert.equal(summary.lashes.status, "insufficient");
  assert.equal(summary.attribution, false);
  assert.equal(summary.photos_stored, false);
  assert.equal(summarizeDiary([]).first_date, null);
  for (const [field, value] of [["attribution", true], ["contains_photos", true], ["format", "v2"], ["photo", "private"]]) {
    assert.throws(() => parseDiary({ ...document, [field]: value }));
  }
  assert.throws(() => parseDiary(" ".repeat(32769)), /32 KiB/);
  assert.throws(() => parseDiary("{"), /JSON/);
});

test("total point budget bounds every annotation history snapshot", () => {
  const longMark = { ...mark(), points: Array(512).fill([0.3, 0.31]) };
  assert.equal(validateMarks(Array(8).fill(longMark)).length, 8);
  assert.throws(() => validateMarks(Array(9).fill(longMark)), /4096 total/);
});
