/** R23G out-of-order render regression at the shipped EditorSession entry point.
 * Synthetic pixel buffers and controlled promises; no GPU service or network.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession, recipeKey } from "../../dist/js/state/editor.js";
import { CpuBackend, Pipeline, RenderAborted } from "../../dist/js/engines/gpu/pipeline.js";
import { fromBytes } from "../../dist/js/engines/gpu/shaders/ops.js";

function latch() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function harness() {
  const jobs = [];
  const shown = [];
  const released = [];
  const errors = [];
  const renderer = (_photo, _recipe, context) => {
    const gate = latch();
    jobs.push({ ...gate, context, photo: _photo, recipe: _recipe });
    return gate.promise;
  };
  const hooks = {
    display(result, revision) { shown.push({ result, revision }); },
    release(result) { released.push(result); },
    error(error, revision) { errors.push({ error, revision }); },
  };
  const session = new EditorSession(renderer, hooks);
  return { session, jobs, shown, released, errors };
}

function pixels(width = 20, height = 20, seed = 33) {
  const bytes = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < bytes.length; i += 4) {
    bytes[i] = (i + seed * 3) % 256;
    bytes[i + 1] = (i * 7 + seed) % 256;
    bytes[i + 2] = (i * 11 + seed) % 256;
    bytes[i + 3] = 255;
  }
  return fromBytes(width, height, bytes);
}

test("thirty completions in reverse order show only the most recent recipe", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-1");
  const pending = [];
  for (let n = 0; n < 30; n++) {
    pending.push(h.session.edit({ filter: "exposure", strength: n }));
  }
  assert.equal(h.jobs.length, 30);
  assert.equal(h.jobs.filter((job) => job.context.signal.aborted).length, 29);
  for (let n = 29; n >= 0; n--) {
    h.jobs[n].resolve({ id: n, buffer: new Uint8Array([n]) });
  }
  const statuses = await Promise.all(pending);
  assert.deepEqual(statuses.slice(0, -1), Array(29).fill("stale"));
  assert.equal(statuses.at(-1), "shown");
  assert.equal(h.shown.length, 1);
  assert.equal(h.shown[0].result.id, 29);
  assert.equal(h.shown[0].revision.id, 30);
  assert.equal(h.released.length, 29);
  assert.equal(new Set(h.released).size, 29);
  assert.equal(h.errors.length, 0);
  assert.equal(h.session.stats().liveResults, 1);
  assert.equal(h.session.stats().inFlight, 0);
  h.session.dispose();
  assert.equal(h.released.length, 30);
  assert.equal(h.session.stats().liveResults, 0);
});

test("photo replacement invalidates every outstanding result from the old source", async () => {
  const h = harness();
  h.session.setPhoto(pixels(20, 20, 1), "drawn-one");
  const old1 = h.session.edit({ strength: 10 });
  const old2 = h.session.edit({ strength: 20 });
  h.session.setPhoto(pixels(24, 24, 2), "drawn-two");
  const newer = h.session.edit({ strength: 30 });
  h.jobs[0].resolve({ id: "from-old-A" });
  h.jobs[1].resolve({ id: "from-old-B" });
  assert.deepEqual(await Promise.all([old1, old2]), ["stale", "stale"]);
  assert.equal(h.shown.length, 0);
  h.jobs[2].resolve({ id: "from-new" });
  assert.equal(await newer, "shown");
  assert.deepEqual(h.shown.map((entry) => entry.result.id), ["from-new"]);
  assert.deepEqual(h.released.map((entry) => entry.id).sort(), ["from-old-A", "from-old-B"]);
  assert.equal(h.shown[0].revision.photoRevision, 2);
  assert.equal(h.shown[0].revision.photoKey, "drawn-two");
  h.session.dispose();
});

test("dispose while a renderer ignores its abort still releases its later result", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-dispose");
  const result = h.session.edit({ effect: "colour" });
  h.session.dispose();
  h.jobs[0].resolve({ id: "released-late" });
  assert.equal(await result, "stale");
  assert.equal(h.shown.length, 0);
  assert.deepEqual(h.released, [{ id: "released-late" }]);
  assert.equal(h.session.stats().liveResults, 0);
  h.session.dispose();
  assert.equal(h.released.length, 1);
  assert.throws(() => h.session.edit({}), /closed/);
});

test("a stale failure never replaces an editor's newly displayed success", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-error");
  const old = h.session.edit({ strength: 5 });
  const current = h.session.edit({ strength: 60 });
  h.jobs[1].resolve({ id: "working" });
  assert.equal(await current, "shown");
  h.jobs[0].reject(new Error("Old synthetic renderer failed"));
  assert.equal(await old, "aborted");
  assert.equal(h.errors.length, 0, "stale errors must not displace the newer editor");
  assert.equal(h.session.displayed.id, 2);
  assert.equal(h.session.stats().liveResults, 1);
  h.session.dispose();
});

test("current render failure records an error without retaining a ghost result", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-fail");
  const current = h.session.edit({ strength: 40 });
  h.jobs[0].reject(new Error("Synthetic GPU context failure"));
  assert.equal(await current, "failed");
  assert.equal(h.errors.length, 1);
  assert.equal(h.errors[0].revision.id, 1);
  assert.equal(h.session.stats().failed, 1);
  assert.equal(h.session.stats().inFlight, 0);
  assert.equal(h.session.stats().liveResults, 0);
  h.session.dispose();
});

test("renderer honoring AbortError cannot be counted as a successful stale preview", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-abort");
  const original = h.session.edit({ strength: 1 });
  const later = h.session.edit({ strength: 2 });
  const reason = new RenderAborted();
  h.jobs[0].reject(reason);
  h.jobs[1].resolve({ id: "current" });
  assert.deepEqual(await Promise.all([original, later]), ["aborted", "shown"]);
  assert.equal(h.shown.length, 1);
  assert.equal(h.session.stats().aborted, 1);
  assert.equal(h.session.stats().failed, 0);
  h.session.dispose();
});

test("recipe fingerprint ignores key insertion order but preserves array order", () => {
  const a = { layers: [{ kind: "recolour", strength: 25 }, { kind: "posture", strength: 40 }],
    source: { width: 20, height: 30 } };
  const b = { source: { height: 30, width: 20 }, layers: [
    { strength: 25, kind: "recolour" }, { strength: 40, kind: "posture" },
  ] };
  const changed = { ...a, layers: [...a.layers].reverse() };
  assert.equal(recipeKey(a), recipeKey(b));
  assert.notEqual(recipeKey(a), recipeKey(changed));
  assert.notEqual(recipeKey(a), recipeKey({ ...a, source: { width: 21, height: 30 } }));
  assert.notEqual(recipeKey([0, 25, 50]), recipeKey([0, 50, 25]));
});

test("each revision has its own abort controller and stable photo identity", async () => {
  const h = harness();
  h.session.setPhoto(pixels(), "drawn-stable");
  const first = h.session.edit({ a: 1 });
  const second = h.session.edit({ a: 2 });
  const third = h.session.edit({ a: 3 });
  assert.ok(h.jobs[0].context.signal !== h.jobs[1].context.signal);
  assert.ok(h.jobs[1].context.signal !== h.jobs[2].context.signal);
  assert.ok(h.jobs[0].context.signal.aborted);
  assert.ok(h.jobs[1].context.signal.aborted);
  assert.ok(!h.jobs[2].context.signal.aborted);
  assert.deepEqual(h.jobs.map((job) => job.context.revision.id), [1, 2, 3]);
  assert.ok(h.jobs.every((job) => job.context.revision.photoKey === "drawn-stable"));
  h.jobs[2].resolve({ id: 3 });
  h.jobs[0].resolve({ id: 1 });
  h.jobs[1].resolve({ id: 2 });
  assert.deepEqual(await Promise.all([first, second, third]), ["stale", "stale", "shown"]);
  h.session.dispose();
});

test("CPU pipeline edits are deterministic and source pixel bytes remain unchanged", () => {
  const backend = new CpuBackend();
  const pipeline = new Pipeline(backend);
  const image = pixels(24, 24, 51);
  const original = Buffer.from(image.data);
  const recipe = [{ op: "exposure", params: { stops: 0.25 } }];
  const first = pipeline.render(image, recipe, { revision: 1 });
  const second = pipeline.render(image, recipe, { revision: 2 });
  assert.equal(first.image.width, image.width);
  assert.equal(first.image.height, image.height);
  assert.deepEqual(Buffer.from(first.image.data), Buffer.from(second.image.data));
  assert.deepEqual(Buffer.from(image.data), original);
  assert.ok([...first.image.data].every(Number.isFinite));
  pipeline.dispose();
  assert.equal(backend.pool.counts().live, 0);
});

test("no local render session makes a fetch or XHR request", async () => {
  const beforeFetch = globalThis.fetch;
  const beforeXHR = globalThis.XMLHttpRequest;
  let sent = 0;
  globalThis.fetch = () => {
    sent++;
    throw Error("unexpected network");
  };
  globalThis.XMLHttpRequest = class {
    constructor() {
      sent++;
      throw Error("unexpected XHR");
    }
  };
  try {
    const h = harness();
    h.session.setPhoto(pixels(), "no-network");
    const task = h.session.edit({ a: 1 });
    h.jobs[0].resolve({ id: 1 });
    assert.equal(await task, "shown");
    h.session.dispose();
    assert.equal(sent, 0);
  } finally {
    globalThis.fetch = beforeFetch;
    globalThis.XMLHttpRequest = beforeXHR;
  }
});
