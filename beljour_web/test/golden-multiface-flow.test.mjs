import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { GoldenCache, renderPreview } from "../dist/js/engines/proportions/golden.js";
import { FaceSelectionSession } from "../dist/js/save/face-selection.js";
import { auditPersonEdit } from "../dist/js/save/face-region-audit.js";

const vectors = JSON.parse(readFileSync(new URL("../../parity/warp-fill-r5.json", import.meta.url), "utf8"));
const mesh = vectors.vectors.find((row) => row.kernel === "proportions.symmetry").args.points;
const WIDTH = 96;
const HEIGHT = 96;
const FACES = [
  { x: 10, y: 17, width: 55, height: 62, score: .94 },
  { x: 73, y: 20, width: 18, height: 30, score: .99 },
];

function photo(tone = 5) {
  const image = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const p = (y * WIDTH + x) * 4;
      image[p] = x + tone * 11;
      image[p + 1] = y + tone * 7;
      image[p + 2] = ((x + y) >> 1) + tone * 9;
      image[p + 3] = 191;
    }
  }
  return image;
}

function masks(first = true) {
  const selected = new Float32Array(WIDTH * HEIGHT);
  const protectedPerson = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const i = y * WIDTH + x;
    if (first) {
      if (x >= 5 && x < 75 && y >= 6 && y < 90) selected[i] = 1;
      if (x >= 70) protectedPerson[i] = 1;
    } else {
      if (x >= 67 && x < 96 && y >= 8 && y < 90) selected[i] = 1;
      if (x < 73) protectedPerson[i] = 1;
    }
  }
  return { selected, protectedPerson };
}

function geometry() {
  return mesh.map(([x, y]) => [x * WIDTH / 400, y * HEIGHT / 500]);
}

for (const tone of [1, 5, 10]) {
  for (const level of [1, 2, 3, 5]) {
    test(`full face selection, golden level ${level} and independent audit at drawn tone ${tone}`, () => {
      const before = photo(tone);
      const session = new FaceSelectionSession();
      const selection = session.newPhoto(FACES, WIDTH, HEIGHT);
      assert.equal(selection.faceCount, 2);
      assert.equal(selection.chosen, 0);
      assert.equal(selection.verifiedRegion, false);
      const { selected, protectedPerson } = masks();
      session.provideMasks(selection.revision, selected, [protectedPerson]);
      const cache = new GoldenCache();
      const plan = cache.get(geometry(), `synthetic-${tone}`);
      assert.equal("refused" in plan, false);
      const rendered = renderPreview(before, WIDTH, HEIGHT, 4, plan, level, selected, [protectedPerson]);
      assert.equal("refused" in rendered, false);
      assert.equal(rendered.data.identityLock, true);
      assert.ok(rendered.data.maxMoveIOD <= .0200001);
      const output = session.apply(selection.revision, before, rendered.image, WIDTH, HEIGHT);
      const proof = auditPersonEdit({data: before, width: WIDTH, height: HEIGHT, channels: 4},
        {data: output, width: WIDTH, height: HEIGHT, channels: 4}, selected, [protectedPerson]);
      assert.equal(proof.passed, true);
      assert.equal(proof.changed_bystanders, 0);
      assert.equal(proof.changed_outside_selection, 0);
      assert.equal(proof.changed_alpha, 0);
      assert.deepEqual(session.auditCounts(), proof);
      for (let y = 0; y < HEIGHT; y++) for (let x = 70; x < WIDTH; x++) {
        const p = (y * WIDTH + x) * 4;
        assert.deepEqual(output.subarray(p, p + 4), before.subarray(p, p + 4));
      }
      if (level === 1) assert.deepEqual(output, before);
      else assert.ok(rendered.data.targetDistance <= rendered.data.beforeDistance);
      assert.deepEqual(before, photo(tone));
    });
  }
}

test("switching a person clears old semantic permissions and count receipts", () => {
  const s = new FaceSelectionSession();
  const initial = s.newPhoto(FACES, WIDTH, HEIGHT);
  const { selected, protectedPerson } = masks();
  s.provideMasks(initial.revision, selected, [protectedPerson]);
  const before = photo();
  const plan = new GoldenCache().get(geometry(), "source");
  const rendered = renderPreview(before, WIDTH, HEIGHT, 4, plan, 3, selected, [protectedPerson]);
  s.apply(initial.revision, before, rendered.image, WIDTH, HEIGHT);
  assert.equal(s.auditCounts()?.passed, true);
  assert.equal(s.tap(.85, .4).chosen, 1);
  assert.equal(s.auditCounts(), null);
  assert.throws(() => s.apply(initial.revision, before, rendered.image, WIDTH, HEIGHT));
  const next = masks(false);
  s.provideMasks(initial.revision, next.selected, [next.protectedPerson]);
  const output = s.apply(initial.revision, before, rendered.image, WIDTH, HEIGHT);
  assert.equal(s.auditCounts()?.changed_bystanders, 0);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < 73; x++) {
    const p = (y * WIDTH + x) * 4;
    assert.deepEqual(output.subarray(p, p + 4), before.subarray(p, p + 4));
  }
});

test("photo replacement invalidates the cached editor permission", () => {
  const s = new FaceSelectionSession();
  const first = s.newPhoto(FACES, WIDTH, HEIGHT);
  const { selected, protectedPerson } = masks();
  s.provideMasks(first.revision, selected, [protectedPerson]);
  const second = s.newPhoto([], WIDTH, HEIGHT);
  assert.equal(second.code, "no_face_found");
  assert.equal(s.auditCounts(), null);
  assert.throws(() => s.provideMasks(first.revision, selected, [protectedPerson]));
  assert.throws(() => s.apply(first.revision, photo(), photo(), WIDTH, HEIGHT));
});
