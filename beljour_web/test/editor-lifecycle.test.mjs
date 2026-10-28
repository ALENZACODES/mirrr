// Free-library plan §6 P0 step 5: render revisions, AbortController per render, stale
// results never displayed, and flat resource counts across 100 edits. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EditorSession, recipeKey } from "../dist/js/state/editor.js";
import * as P from "../dist/js/engines/gpu/pipeline.js";
import * as O from "../dist/js/engines/gpu/shaders/ops.js";

/** A renderer whose renders finish when the test says so, in any order. */
function controllable() {
  const pending = [];
  const renderer = (photo, recipe, { signal, revision }) => new Promise((resolve, reject) => {
    const entry = { photo, recipe, revision, signal, resolve: () => resolve({ photo, recipe, id: revision.id }), reject };
    signal.addEventListener("abort", () => { entry.aborted = true; });
    pending.push(entry);
  });
  return { pending, renderer };
}

function hooks() {
  const shown = [], released = [], errors = [];
  return { shown, released, errors, display: (r, rev) => shown.push([r.id, rev.id]), release: (r) => released.push(r.id), error: (e) => errors.push(e) };
}

test("recipe keys are stable across key order and change with any value", () => {
  assert.equal(recipeKey({ a: 1, b: [1, 2] }), recipeKey({ b: [1, 2], a: 1 }));
  assert.notEqual(recipeKey({ a: 1 }), recipeKey({ a: 2 }));
  assert.notEqual(recipeKey([1, 2]), recipeKey([2, 1]));
});

test("a slow older render can never be displayed over a newer edit", async () => {
  const c = controllable(), h = hooks();
  const s = new EditorSession(c.renderer, h);
  s.setPhoto("photo-A", "A");
  const first = s.edit({ exposure: 0.1 });
  const second = s.edit({ exposure: 0.2 });
  assert.equal(c.pending[0].aborted, true, "the first render was told to stop");
  c.pending[1].resolve();
  assert.equal(await second, "shown");
  c.pending[0].resolve(); // it finished anyway, late
  assert.equal(await first, "stale");
  assert.deepEqual(h.shown, [[2, 2]]);
  assert.deepEqual(h.released, [1], "the stale result was released at once");
  assert.equal(s.displayed.id, 2);
});

test("changing the photo invalidates renders of the old photo", async () => {
  const c = controllable(), h = hooks();
  const s = new EditorSession(c.renderer, h);
  s.setPhoto("photo-A", "A");
  const old = s.edit({ contrast: 0.3 });
  s.setPhoto("photo-B", "B");
  c.pending[0].resolve();
  assert.equal(await old, "stale");
  assert.equal(h.shown.length, 0);
  const fresh = s.edit({ contrast: 0.3 });
  assert.equal(c.pending[1].revision.photoKey, "B");
  assert.equal(c.pending[1].revision.photoRevision, 2);
  c.pending[1].resolve();
  assert.equal(await fresh, "shown");
  assert.equal(h.shown[0][0], 2);
});

test("aborted renders are counted, failures reach the error hook only when current", async () => {
  const h = hooks();
  let n = 0;
  const s = new EditorSession(async (_p, _r, { signal }) => {
    n++;
    if (n === 1) { await new Promise((r) => setTimeout(r, 5)); if (signal.aborted) throw new P.RenderAborted(); }
    if (n === 2) throw new Error("engine failed");
    return { id: n };
  }, h);
  s.setPhoto({}, "A");
  const a = s.edit(1);
  const b = s.edit(2);
  assert.equal(await b, "failed");
  assert.equal(await a, "aborted");
  assert.equal(h.errors.length, 1);
  assert.equal(await s.edit(3), "shown");
  const stats = s.stats();
  assert.equal(stats.aborted, 1); assert.equal(stats.failed, 1); assert.equal(stats.displayed, 1);
});

test("100 rapid edits on the real pipeline: one displayed result alive, everything else released", async () => {
  const backend = new P.CpuBackend();
  const pipe = new P.Pipeline(backend);
  const bytes = new Uint8ClampedArray(32 * 32 * 4).map((_, i) => (i * 37) % 256);
  const image = O.fromBytes(32, 32, bytes);
  const live = new Set();
  const h = { display() {}, release: (r) => { assert.ok(live.delete(r), "released exactly once"); } };
  const s = new EditorSession(async (photo, recipe, { signal, revision }) => {
    await Promise.resolve();
    const res = pipe.render(photo, recipe, { signal, revision: revision.id });
    live.add(res);
    return res;
  }, h);
  s.setPhoto(image, "synthetic-32");
  const outcomes = [];
  for (let i = 0; i < 100; i++) outcomes.push(s.edit([{ op: "exposure", params: { stops: (i % 10) / 10 } }]));
  const results = await Promise.all(outcomes);
  assert.equal(results.filter((r) => r === "shown").length, 1, "only the last edit is shown");
  assert.equal(results.at(-1), "shown");
  assert.equal(live.size, 1, "one result alive: the displayed one");
  assert.equal(s.stats().liveResults, 1);
  assert.equal(backend.pool.counts().live, 3, "pipeline holds only its three reusable targets");
  for (let i = 0; i < 100; i++) await s.edit([{ op: "contrast", params: { amount: (i % 5) / 10 } }]);
  assert.equal(live.size, 1);
  assert.equal(s.stats().displayed, 101);
  s.dispose();
  assert.equal(live.size, 0, "dispose releases the shown result");
  pipe.dispose();
  assert.equal(backend.pool.counts().live, 0);
  assert.throws(() => s.edit([]), /closed/);
});

test("editing before a photo is open, or with an empty key, is refused", () => {
  const s = new EditorSession(async () => ({}), hooks());
  assert.throws(() => s.edit({}), /open a photo/);
  assert.throws(() => s.setPhoto({}, ""), /non-empty key/);
});
