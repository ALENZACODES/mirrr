/** R26E revision-bound workflow: coalesced drags, full release and stale-photo invalidation.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PostureWorkflow } from "../dist/js/body/posture-workflow.js";

function manualQueue() {
  const tasks = [];
  return { schedule: (task) => tasks.push(task), flush: () => { while (tasks.length) tasks.shift()(); } };
}

test("only the newest pending drag renders; earlier drags resolve stale", async () => {
  const queue = manualQueue();
  const seen = [];
  const flow = new PostureWorkflow((request) => { seen.push(request.level); return request.level; }, queue.schedule);
  const first = flow.drag("lean", 2.0, 5);
  const second = flow.drag("lean", 2.4, 5);
  const third = flow.drag("lean", 3.1, 5);
  queue.flush();
  assert.equal((await first).status, "stale");
  assert.equal((await second).status, "stale");
  const done = await third;
  assert.equal(done.status, "done");
  assert.equal(done.value, 3.1);
  assert.deepEqual(seen, [3.1]);
});

test("release always renders at release stage and supersedes a pending drag", async () => {
  const queue = manualQueue();
  const flow = new PostureWorkflow((request) => request.stage, queue.schedule);
  const drag = flow.drag("slouch", 4.0, 5);
  const release = flow.release("slouch", 4.0, 5);
  queue.flush();
  assert.equal((await drag).status, "stale");
  const outcome = await release;
  assert.equal(outcome.status, "done");
  assert.equal(outcome.value, "release");
});

test("a new photo invalidates an in-flight asynchronous render", async () => {
  let finish;
  const flow = new PostureWorkflow(() => new Promise((resolve) => { finish = resolve; }));
  const pending = flow.release("lean", 5, 5);
  await new Promise((resolve) => setImmediate(resolve));
  const revision = flow.setPhoto();
  finish("old photo result");
  const outcome = await pending;
  assert.equal(outcome.status, "stale");
  assert.equal(outcome.request.revision, revision - 1);
});

test("failures are reported only for current requests", async () => {
  const queue = manualQueue();
  const flow = new PostureWorkflow(() => { throw new Error("boom"); }, queue.schedule);
  const current = flow.release("lean", 5, 5);
  queue.flush();
  assert.equal((await current).status, "failed");
});

test("levels are validated before anything is queued", () => {
  const flow = new PostureWorkflow(() => 1);
  assert.throws(() => flow.drag("lean", 4.05, 5), /0.1 steps/);
  assert.throws(() => flow.release("lean", 3, 0), /1.0 to 5.0/);
});

test("dispose resolves pending work stale and refuses new work", async () => {
  const queue = manualQueue();
  const flow = new PostureWorkflow(() => 1, queue.schedule);
  const pending = flow.drag("lean", 2, 5);
  flow.dispose();
  queue.flush();
  assert.equal((await pending).status, "stale");
  assert.throws(() => flow.drag("lean", 2, 5), /disposed/);
  assert.equal(flow.isDisposed, true);
});
