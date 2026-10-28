import assert from "node:assert/strict";
import test from "node:test";

import { ProgressivePreview, planResolution } from "../../../dist/js/pro/index.js";

const photoOne = "a".repeat(64);
const photoTwo = "b".repeat(64);

test("drag preview bounds the long edge; release selects full source pixels", () => {
  const drag = planResolution(3000, 4000, "drag");
  assert.deepEqual(drag, { width: 384, height: 512 });
  const release = planResolution(3000, 4000, "release");
  assert.deepEqual(release, { width: 3000, height: 4000 });
  assert.deepEqual(planResolution(40, 30, "drag"), { width: 40, height: 30 });
  assert.throws(() => planResolution(4500, 4000, "release"));
});

test("dragging five levels retains only the newest publish token", async () => {
  const preview = new ProgressivePreview();
  const jobs = [];
  for (const level of [1, 2, 3, 4, 5]) {
    jobs.push(preview.request(photoOne, 3000, 4000, level, "drag"));
  }
  const published = [];
  for (const job of jobs) {
    await preview.run(job, ({ level }) => level, (value) => published.push(value));
  }
  assert.deepEqual(published, [5]);
  const released = preview.request(photoOne, 3000, 4000, 5, "release");
  assert.ok(released.fullResolution);
  assert.ok(preview.isCurrent(released));
});

test("new-photo revisions invalidate old callbacks and cancelled render results", async () => {
  const preview = new ProgressivePreview();
  const first = preview.request(photoOne, 512, 512, 2.5, "drag");
  const next = preview.request(photoTwo, 512, 512, 2.5, "drag");
  assert.ok(!preview.isCurrent(first));
  const used = [];
  await preview.run(next, async () => {
    preview.cancel();
    return 5;
  }, (value) => used.push(value));
  assert.deepEqual(used, []);
  assert.ok(!preview.isCurrent(next));
});
