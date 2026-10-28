/** R17B studio lifecycle and per-row acceptance. Author: John Khan. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CARDS, W_ROWS, card } from "../dist/js/ui/r17b/catalogue.js";
import { Client, Cancelled } from "../dist/js/ui/r17b/client.js";
import { fixture } from "../dist/js/ui/r17b/fixture.js";
import { renderJob } from "../dist/js/ui/r17b/render.js";
import { Session } from "../dist/js/ui/r17b/session.js";

function ready(id) {
  const session = new Session();
  session.load(fixture());
  session.select(id);
  session.style = card(id).styles[0] ?? "";
  return session;
}

assert.equal(W_ROWS.length, 42);
assert.equal(CARDS.length, 46);
assert.equal(new Set(CARDS.map(item => item.id)).size, CARDS.length);

for (const item of W_ROWS) {
  test(`${item.id}: studio reaches a local renderer`, () => {
    const session = ready(item.id);
    assert.deepEqual(session.reasons(), []);
    const job = session.job();
    const result = renderJob(job, (() => { let value = 0; return () => ++value; })());
    assert.ok(result.pixels.length > 0);
    assert.match(result.label, /local|simulation|workflow/i);
    assert.equal(session.complete(job, result), true);
  });

  test(`${item.id}: zero amount retains original where the row renders pixels`, () => {
    const session = ready(item.id);
    session.amount = 0;
    session.invalidate();
    const job = session.job();
    const result = renderJob(job, (() => { let value = 0; return () => ++value; })());
    if (result.width === session.fixture.photo.width && result.height === session.fixture.photo.height) {
      assert.deepEqual(result.pixels, session.fixture.photo.data);
    }
  });
}

test("upscale cards are present at 2x and 4x", () => {
  assert.equal(card("UPSCALE2").family, "upscale");
  assert.equal(card("UPSCALE4").family, "upscale");
});

test("2x studio upscale reports exact dimensions", () => {
  const session = ready("UPSCALE2");
  const result = renderJob(session.job());
  assert.equal(result.width, session.fixture.photo.width * 2);
  assert.equal(result.height, session.fixture.photo.height * 2);
});

test("4x studio upscale reports exact dimensions", () => {
  const session = ready("UPSCALE4");
  const result = renderJob(session.job());
  assert.equal(result.width, session.fixture.photo.width * 4);
  assert.equal(result.height, session.fixture.photo.height * 4);
});

test("gender studio keeps geometry declaration false", () => {
  const session = ready("GENDER");
  session.direction = "masculine";
  session.level = "hyper";
  const result = renderJob(session.job());
  assert.equal(result.metrics.identity_geometry_changed, false);
});

test("shave studio is explicitly an estimate", () => {
  const session = ready("SHAVE");
  const result = renderJob(session.job());
  assert.match(result.label, /estimate/i);
});

test("session rejects result after amount revision", () => {
  const session = ready("W19");
  const job = session.job();
  session.amount = 0.8;
  session.invalidate();
  const result = renderJob(job);
  assert.equal(session.complete(job, result), false);
});

test("session rejects result after feature change", () => {
  const session = ready("W19");
  const job = session.job();
  session.select("W20");
  const result = renderJob(job);
  assert.equal(session.complete(job, result), false);
});

test("session job contains copied pixel buffer", () => {
  const session = ready("W19");
  const job = session.job();
  assert.notEqual(job.fixture.photo.data, session.fixture.photo.data);
  const original = session.fixture.photo.data[0];
  job.fixture.photo.data[0] = original + 10;
  assert.equal(session.fixture.photo.data[0], original);
});

test("session job contains copied masks", () => {
  const session = ready("W19");
  const job = session.job();
  assert.notEqual(job.fixture.hair, session.fixture.hair);
  const original = session.fixture.hair[0];
  job.fixture.hair[0] = 1 - original;
  assert.equal(session.fixture.hair[0], original);
});

test("source alpha is rejected if renderer mutates it at same dimensions", () => {
  const session = ready("W19");
  const job = session.job();
  const result = renderJob(job);
  result.pixels[3] = 0;
  assert.throws(() => session.complete(job, result), /alpha/);
});

class FakeWorker {
  onmessage = null;
  onerror = null;
  terminated = 0;
  posted = [];
  postMessage(value) { this.posted.push(value); }
  terminate() { this.terminated++; }
  deliver(value) { this.onmessage?.({ data: value }); }
}

test("worker cancellation terminates worker and rejects promise", async () => {
  const workers = [];
  const client = new Client(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  }, 1000);
  const session = ready("W19");
  const promise = client.run(session.job());
  client.cancel();
  await assert.rejects(promise, Cancelled);
  assert.equal(workers[0].terminated, 1);
});

test("replacement worker cancels previous request", async () => {
  const workers = [];
  const client = new Client(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  }, 1000);
  const session = ready("W19");
  const firstJob = session.job();
  const first = client.run(firstJob);
  const secondJob = session.job();
  const second = client.run(secondJob);
  await assert.rejects(first, Cancelled);
  assert.equal(workers[0].terminated, 1);
  const result = renderJob(secondJob);
  workers[1].deliver({ id: secondJob.id, ok: true, result });
  assert.equal((await second).pixels.length, result.pixels.length);
});

test("late reply from cancelled worker cannot resolve replacement", async () => {
  const workers = [];
  const client = new Client(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  }, 1000);
  const session = ready("W19");
  const one = session.job();
  const first = client.run(one);
  const two = session.job();
  const second = client.run(two);
  await assert.rejects(first, Cancelled);
  workers[0].deliver({ id: one.id, ok: true, result: renderJob(one) });
  workers[1].deliver({ id: two.id, ok: true, result: renderJob(two) });
  assert.equal((await second).label, "Local hair simulation");
});

test("studio page has labelled local privacy copy and controls", () => {
  const html = readFileSync(new URL("../dist/r17b-studio.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../dist/js/ui/r17b/entry.js", import.meta.url), "utf8");
  assert.match(html, /r17b-root/);
  assert.match(entry, /Photos are not uploaded/);
  assert.match(entry, /Show original/);
  assert.match(entry, /Download labelled PNG/);
  assert.match(entry, /SIMULATION \/ ESTIMATE · LOCAL/);
});

test("studio entry has no direct network primitives", () => {
  const entry = readFileSync(new URL("../dist/js/ui/r17b/entry.js", import.meta.url), "utf8");
  assert.doesNotMatch(entry, /fetch\s*\(/);
  assert.doesNotMatch(entry, /XMLHttpRequest/);
  assert.doesNotMatch(entry, /WebSocket/);
  assert.doesNotMatch(entry, /sendBeacon/);
});

test("studio stylesheet collapses to one column on narrow screens", () => {
  const css = readFileSync(new URL("../dist/r17b-studio.css", import.meta.url), "utf8");
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /grid-template-columns:1fr/);
});

test("studio page contains no third-party filter or celebrity names", () => {
  const catalogue = readFileSync(new URL("../dist/js/ui/r17b/catalogue.js", import.meta.url), "utf8").toLowerCase();
  for (const forbidden of ["reference app", "kardash", "beyonce", "rihanna", "tiktok filter", "instagram filter"]) {
    assert.equal(catalogue.includes(forbidden), false, forbidden);
  }
});
