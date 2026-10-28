import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { auditPersonEdit } from "../dist/js/save/face-region-audit.js";
import { FaceSelectionSession } from "../dist/js/save/face-selection.js";

const parityPath = fileURLToPath(new URL("../../parity/face-region-audit.json", import.meta.url));
const parity = JSON.parse(readFileSync(parityPath, "utf8"));

function image(channels = 4, width = 6, height = 4) {
  const data = new Uint8ClampedArray(width * height * channels).fill(50);
  if (channels === 4) {
    for (let index = 0; index < width * height; index++) data[index * channels + 3] = 70;
  }
  return { data, width, height, channels };
}

function masks() {
  const selected = new Float32Array(6 * 4);
  const bystander = new Float32Array(6 * 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      if (y >= 1 && y < 3 && x >= 1 && x < 5) selected[y * 6 + x] = 1;
      if (x >= 4) bystander[y * 6 + x] = 1;
    }
  }
  return { selected, bystander };
}

function changed(before, changes) {
  const after = { ...before, data: new Uint8ClampedArray(before.data) };
  for (const edit of changes) {
    after.data[(edit.y * before.width + edit.x) * before.channels + edit.channel] = edit.value;
  }
  return after;
}

for (const scenario of parity.scenarios) {
  test(`Python/browser count-only parity: ${scenario.name}`, () => {
    const before = image(scenario.channels);
    const after = changed(before, scenario.edits);
    const { selected, bystander } = masks();
    const report = auditPersonEdit(before, after, selected, [bystander], scenario.require_change);
    assert.deepEqual(report, scenario.expected);
    assert.equal(typeof report.passed, "boolean");
  });
}

test("selected-person changes are real, but bystanders and alpha stay unchanged", () => {
  const before = image();
  const after = changed(before, [{ x: 2, y: 1, channel: 0, value: 210 }]);
  const { selected, bystander } = masks();
  const report = auditPersonEdit(before, after, selected, [bystander]);
  assert.equal(report.status, "isolated");
  assert.equal(report.selected_pixels, 6);
  assert.equal(report.protected_pixels, 8);
  assert.equal(report.changed_in_selection, 1);
  assert.equal(report.changed_outside_selection, 0);
  assert.equal(report.changed_bystanders, 0);
  assert.equal(report.changed_alpha, 0);
});

test("one altered hair/body bystander pixel rejects the entire assertion", () => {
  const before = image();
  const after = changed(before, [{ x: 4, y: 2, channel: 1, value: 210 }]);
  const { selected, bystander } = masks();
  const report = auditPersonEdit(before, after, selected, [bystander]);
  assert.equal(report.status, "isolation_failed");
  assert.equal(report.changed_bystanders, 1);
  assert.equal(report.changed_outside_selection, 1);
  assert.equal(report.passed, false);
});

test("alpha is immutable even inside the selected person", () => {
  const before = image();
  const after = changed(before, [{ x: 2, y: 1, channel: 3, value: 200 }]);
  const { selected, bystander } = masks();
  const report = auditPersonEdit(before, after, selected, [bystander]);
  assert.equal(report.changed_alpha, 1);
  assert.equal(report.changed_outside_selection, 0);
  assert.equal(report.passed, false);
});

test("a wholly protected selected mask is never a usable edit", () => {
  const before = image();
  const { bystander } = masks();
  const report = auditPersonEdit(before, before, bystander, [bystander]);
  assert.equal(report.status, "selection_fully_protected");
  assert.equal(report.selected_pixels, 0);
  assert.equal(report.passed, false);
});

test("no effect is distinct from photo isolation when a visible change is required", () => {
  const before = image();
  const { selected, bystander } = masks();
  const diagnostic = auditPersonEdit(before, before, selected, [bystander], true);
  const neutral = auditPersonEdit(before, before, selected, [bystander]);
  assert.equal(diagnostic.status, "no_measured_effect");
  assert.equal(diagnostic.passed, false);
  assert.equal(neutral.status, "isolated");
  assert.equal(neutral.passed, true);
});

test("a corrupt selected mask never produces a report", () => {
  const before = image();
  const { selected, bystander } = masks();
  for (const invalid of [NaN, Infinity, -0.01, 1.01]) {
    const broken = new Float32Array(selected);
    broken[8] = invalid;
    assert.throws(() => auditPersonEdit(before, before, broken, [bystander]));
  }
});

test("corrupt or missing bystander masks cannot weaken the audit", () => {
  const before = image();
  const { selected, bystander } = masks();
  const broken = new Float32Array(bystander);
  broken[4] = Number.NaN;
  assert.throws(() => auditPersonEdit(before, before, selected, [broken]));
  assert.throws(() => auditPersonEdit(before, before, selected, [new Float32Array(6)]));
  assert.throws(() => auditPersonEdit(before, before, selected.subarray(0, 4), []));
});

test("images with mismatched size, channels or buffer reject", () => {
  const before = image();
  const { selected, bystander } = masks();
  assert.throws(() => auditPersonEdit(before, image(3), selected, [bystander]));
  assert.throws(() => auditPersonEdit(before, image(4, 8, 4), selected, [bystander]));
  assert.throws(() => auditPersonEdit(before, { ...before, data: new Uint8ClampedArray(5) }, selected));
  assert.throws(() => auditPersonEdit({ ...before, width: NaN }, before, selected));
  assert.throws(() => auditPersonEdit(before, before, selected, [], 1));
});

test("source, rendered image and protection masks stay unchanged by the audit", () => {
  const before = image();
  const after = changed(before, [{ x: 2, y: 2, channel: 2, value: 121 }]);
  const { selected, bystander } = masks();
  const copies = [before.data.slice(), after.data.slice(), selected.slice(), bystander.slice()];
  auditPersonEdit(before, after, selected, [bystander]);
  assert.deepEqual(before.data, copies[0]);
  assert.deepEqual(after.data, copies[1]);
  assert.deepEqual(selected, copies[2]);
  assert.deepEqual(bystander, copies[3]);
});

test("privacy-safe serialized report carries counts and no geometry or pixels", () => {
  const { selected, bystander } = masks();
  const report = auditPersonEdit(image(), image(), selected, [bystander]);
  assert.equal(Object.values(report).every((v) => ["boolean", "number", "string"].includes(typeof v)), true);
  for (const name of ["photo", "face_id", "landmark", "coordinate", "mask", "bytes"]) {
    assert.equal(JSON.stringify(report).includes(name), false);
  }
});

test("selected-face session exposes audit counts but forgets them on photo replacement", () => {
  const session = new FaceSelectionSession();
  const revision = session.newPhoto([{ x: 1, y: 1, width: 3, height: 2, score: .95 }], 6, 4).revision;
  const { selected, bystander } = masks();
  session.provideMasks(revision, selected, [bystander]);
  assert.equal(session.auditCounts(), null);
  const before = image();
  const after = changed(before, [{ x: 2, y: 1, channel: 0, value: 210 }]);
  session.apply(revision, before.data, after.data, before.width, before.height, 4);
  const counts = session.auditCounts();
  assert.equal(counts?.passed, true);
  assert.equal(counts?.changed_bystanders, 0);
  session.newPhoto([], 6, 4);
  assert.equal(session.auditCounts(), null);
});

test("selected-face session rejects a completely protected edit", () => {
  const session = new FaceSelectionSession();
  const revision = session.newPhoto([{ x: 1, y: 1, width: 3, height: 2, score: .95 }], 6, 4).revision;
  const { bystander } = masks();
  session.provideMasks(revision, bystander, [bystander]);
  const before = image();
  assert.throws(() => session.apply(revision, before.data, before.data, 6, 4, 4), /selection_fully_protected/);
  assert.equal(session.auditCounts(), null);
});

test("session rejects malformed masks before signalling verified readiness", () => {
  const session = new FaceSelectionSession();
  const revision = session.newPhoto([{x: 1,y: 1,width: 2,height: 2,score: .95}], 6, 4).revision;
  const { selected, bystander } = masks();
  const bad = selected.slice();
  bad[8] = Number.NaN;
  const corruptBystander = bystander.slice();
  corruptBystander[5] = Number.POSITIVE_INFINITY;
  for (const invalid of [new Float32Array(3), new Float32Array(24), bad]) {
    assert.throws(() => session.provideMasks(revision, invalid, [bystander]));
    assert.equal(session.state().verifiedRegion, false);
  }
  assert.throws(() => session.provideMasks(revision, selected, [corruptBystander]));
  assert.equal(session.state().verifiedRegion, false);
  assert.equal(session.auditCounts(), null);
});
