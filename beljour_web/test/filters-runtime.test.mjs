// FX1 filter runtime: the whole render, the tiled render (same bytes), worker jobs with
// progress and cancellation over a real MessageChannel, and the thumbnail cache.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../dist/js/filters/runtime/engine.js";
import * as T from "../dist/js/filters/runtime/tiles.js";
import { ThumbCache, thumbKey } from "../dist/js/filters/runtime/cache.js";
import { FilterJobs } from "../dist/js/filters/runtime/jobs.js";
import { defaultFilterParams, masksFor, faceCentreFor } from "../dist/js/filters/runtime/layer.js";
import * as W from "../dist/js/ui/shell/worker-protocol.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";

const portrait = makeSample("portrait");
const masks = masksFor(portrait);
const centre = faceCentreFor(masks);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

test("strength 0 returns the photo byte for byte, with no stage", () => {
  for (const r of catalogue().recipes) {
    const res = E.render(portrait.image, r, { strength: 0 }, masks, centre);
    assert.ok(res.plan.identity && res.plan.stages.length === 0, r.id);
    assert.ok(same(res.image.data, portrait.image.data), r.id);
  }
});

test("the portrait's mesh gives skin and face-oval masks; the centre light follows the face", () => {
  assert.equal(masks.source, "landmarks");
  assert.ok(masks.skin && masks.person);
  let inside = 0; for (const a of masks.skin.data) if (a >= 0.5) inside++;
  assert.ok(inside > 1000, "a real skin area");
  assert.ok(Math.abs(centre[0] - portrait.image.width / 2) < 2);
  assert.equal(masksFor(makeSample("low-light")).source, "none");
  assert.equal(masksFor(makeSample("body-front")).source, "segmenter", "a person outline alone gives no skin");
});

test("no skin outline: capped at 30, skin-hue steps left out, and said so", () => {
  const plain = makeSample("low-light");
  const res = E.render(plain.image, "C01", { strength: 90 }, masksFor(plain));
  assert.equal(res.plan.fallback, true);
  assert.equal(res.plan.strength, 30);
  assert.ok(!res.plan.stages.some((s) => s.op === "colour.splitTone"));
  assert.ok(res.notes.some((n) => /capped at 30/.test(n)));
  assert.throws(() => E.render(plain.image, "C28", {}, masksFor(plain)), E.FilterUnavailable);
  const off = E.render(plain.image, "C28", { backgroundOnly: false }, masksFor(plain));
  assert.equal(off.image.width, plain.image.width);
});

test("Protect skin keeps her skin pixels exactly; Background only keeps the face oval", () => {
  const prot = E.render(portrait.image, "C19", { strength: 100, protectSkin: true }, masks, centre);
  const bg = E.render(portrait.image, "C19", { strength: 100, backgroundOnly: true }, masks, centre);
  let changedOutside = 0;
  for (let p = 0; p < masks.skin.data.length; p++) {
    const i = p * 3;
    if (masks.skin.data[p] >= 0.5) for (let c = 0; c < 3; c++) assert.equal(prot.image.data[i + c], portrait.image.data[i + c]);
    if (masks.person.data[p] >= 0.5) for (let c = 0; c < 3; c++) assert.equal(bg.image.data[i + c], portrait.image.data[i + c]);
    else if (bg.image.data[i] !== portrait.image.data[i]) changedOutside++;
  }
  assert.ok(changedOutside > 1000, "the background takes the look");
});

test("the tiled render gives exactly the whole render's bytes, glow and guard included", () => {
  for (const [rid, settings] of [["C02", { strength: 100 }], ["C39", {}], ["C19", { strength: 80 }], ["C41", { strength: 100 }],
    ["M02", { strength: 60 }], ["C28", {}], ["C53", { strength: 100 }], ["C40", { strength: 70, preset: "Framed" }]]) {
    const whole = E.render(portrait.image, rid, settings, masks, centre);
    for (const size of [64, 100, 256]) {
      const job = new T.TiledRender(portrait.image, rid, settings, masks, centre, size);
      const out = job.runAll();
      assert.ok(same(out.image.data, whole.image.data), `${rid} at ${size} px tiles`);
      assert.ok(same(out.look.data, whole.look.data), `${rid} look at ${size} px tiles`);
      assert.equal(job.completed, job.total);
    }
  }
});

test("tile grid, crop and paste helpers", () => {
  const grid = T.tileGrid(300, 130, 128);
  assert.equal(grid.length, 6);
  assert.deepEqual(grid[2], { x: 256, y: 0, w: 44, h: 128 });
  assert.deepEqual(grid[5], { x: 256, y: 128, w: 44, h: 2 });
  assert.throws(() => T.tileGrid(10, 10, 8), /tile size/);
  const data = Uint8Array.from({ length: 4 * 3 * 3 }, (_, i) => i);
  const r = { x: 1, y: 1, w: 2, h: 2 };
  const crop = T.cropBytes(data, 4, r);
  const back = new Uint8Array(data.length);
  T.pasteBytes(back, 4, r, crop);
  assert.deepEqual(Array.from(crop.slice(0, 6)), Array.from(data.slice(15, 21)));
  assert.deepEqual(Array.from(back.slice(15, 21)), Array.from(data.slice(15, 21)));
});

test("an unfinished tiled render can't be read, and an identity one needs no work", () => {
  const job = new T.TiledRender(portrait.image, "C08", {}, masks, centre, 64);
  assert.equal(job.current, "look");
  assert.throws(() => job.result(), /not finished/);
  job.step();
  assert.ok(job.completed === 1 && job.total === job.tiles.length * 2 + 1);
  const none = new T.TiledRender(portrait.image, "C08", { strength: 0 }, masks, centre);
  assert.equal(none.done, true);
  assert.equal(none.total, 0);
  assert.ok(same(none.result().image.data, portrait.image.data));
});

test("filter jobs report progress, finish, and stop within one tile when cancelled", async () => {
  const jobs = new FilterJobs(() => Promise.resolve(), 1);
  const progress = [];
  const done = await jobs.run(1, portrait, { parameters: defaultFilterParams("C02"), strength: 80, tile: 64 }, (p) => progress.push(p));
  assert.equal(done.ok, true);
  assert.ok(progress.length >= 3 && progress.at(-1).done === progress.at(-1).total);
  const whole = E.render(portrait.image, "C02", { strength: 80, guard: true, protectSkin: false, backgroundOnly: false, addons: { fade: 0 } }, masks, centre);
  assert.ok(same(done.result.image.data, whole.image.data));
  let steps = 0;
  const slow = new FilterJobs(async () => { steps++; if (steps === 2) slow.cancel(2); }, 1);
  const cancelled = await slow.run(2, portrait, { parameters: defaultFilterParams("C01"), strength: 50, tile: 64 });
  assert.deepEqual([cancelled.ok, cancelled.cancelled], [false, true]);
  assert.equal(slow.active, 0);
  assert.equal(slow.cancel(99), false, "cancelling an unknown job is a no-op");
  const broken = await jobs.run(3, portrait, { parameters: { recipe: "Z9" }, strength: 30 });
  assert.equal(broken.ok, false); assert.match(broken.error, /Pick a look/);
  assert.throws(() => new FilterJobs(undefined, 0), /steps per yield/);
});

function channel() {
  const { port1, port2 } = new MessageChannel();
  port2.onmessage = W.serveShell(port2, new FilterJobs(() => new Promise((r) => setTimeout(r, 0)), 1));
  const client = new W.ShellClient(port1, 60_000);
  port1.onmessage = (event) => client.receive(event.data);
  return { client, close: () => { port1.close(); port2.close(); } };
}

test("a filter job over the shell worker channel matches the direct render and can be cancelled", async () => {
  const { client, close } = channel();
  try {
    const layer = { parameters: defaultFilterParams("C30"), strength: 70 };
    const seen = [];
    const run = client.filter(portrait, layer, { tile: 96, onProgress: (d, t) => seen.push([d, t]) });
    const out = await run.done;
    const direct = E.render(portrait.image, "C30", { strength: 70, guard: true, protectSkin: false, backgroundOnly: false, addons: { fade: 0 } }, masks, centre);
    assert.ok(same(out.image.data, direct.image.data));
    assert.equal(out.tiles, Math.ceil(portrait.image.width / 96) * Math.ceil(portrait.image.height / 96));
    assert.ok(seen.length > 0);
    const second = client.filter(portrait, { parameters: defaultFilterParams("C01"), strength: 60 }, { tile: 64 });
    second.cancel();
    await assert.rejects(second.done, /Cancelled/);
    assert.equal(client.waiting, 0);
  } finally { close(); }
});

test("the inline port runs filter jobs too, and the sync handler refuses them", async () => {
  const { client, terminate } = W.createShellClient(null);
  try {
    const out = await client.filter(portrait, { parameters: defaultFilterParams("C08"), strength: 30 }).done;
    assert.equal(out.image.width, portrait.image.width);
    assert.equal(out.fallback, false);
  } finally { terminate(); }
  const { result } = W.handleShellJob({ kind: "filter", id: 4, source: W.packSource(portrait), parameters: {}, strength: 30 });
  assert.equal(result.ok, false); assert.match(result.error, /asynchronously/);
});

test("the thumbnail cache keeps tiles within its byte budget, least recently used out first", () => {
  const cache = new ThumbCache(3 * 100);
  const img = (n) => ({ width: 10, height: 10, channels: 1, data: new Uint8Array(100).fill(n) });
  const key = (r) => thumbKey({ source: "s", recipe: r, strength: 30, side: 128, params: { b: 1, a: true } });
  assert.equal(key("C01"), "s|128|C01|30|a=true&b=1");
  cache.set(key("A"), img(1)); cache.set(key("B"), img(2)); cache.set(key("C"), img(3));
  assert.ok(cache.get(key("A")));
  cache.set(key("D"), img(4));
  assert.equal(cache.get(key("B")), undefined, "B was least recently used");
  assert.ok(cache.get(key("A")) && cache.get(key("D")));
  assert.equal(cache.stats.evictions, 1);
  assert.equal(cache.stats.bytes, 300);
  assert.equal(cache.dropSource("s"), 3);
  assert.equal(cache.stats.size, 0);
  cache.set("big", { width: 1, height: 1, channels: 1, data: new Uint8Array(1000) });
  assert.equal(cache.stats.size, 0, "a tile larger than the budget is not kept");
  assert.throws(() => new ThumbCache(0), /budget/);
});

test("the LUT cache bakes once per plan and evicts the oldest", () => {
  const cache = new E.LutCache(2);
  for (let i = 0; i < 3; i++) E.render(portrait.image, "C14", { guard: false }, masks, centre, cache);
  assert.equal(cache.bakes, 1);
  E.render(portrait.image, "C14", { strength: 31, guard: false }, masks, centre, cache);
  E.render(portrait.image, "C02", { guard: false }, masks, centre, cache);
  assert.equal(cache.bakes, 3);
  assert.equal(cache.size, 2);
  const a = E.plan(catalogue().get("C14"), {}, true), b = E.plan(catalogue().get("C14"), {}, true);
  assert.equal(E.planKey(a), E.planKey(b));
  assert.notEqual(E.planKey(a), E.planKey(E.plan(catalogue().get("C14"), { strength: 50 }, true)));
  assert.equal(E.planKey(E.plan(catalogue().get("C14"), { strength: 50 })), E.planKey(a), "no skin outline caps 50 at 30: same LUT");
});
