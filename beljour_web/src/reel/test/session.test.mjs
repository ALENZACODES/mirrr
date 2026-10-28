import assert from "node:assert/strict";
import test from "node:test";
import {
  ReelJobScope,
  ReelScopeError,
  withReelJobScope,
} from "../../../dist/js/reel/index.js";

class Scheduler {
  next = 0;
  active = new Map();
  cancelled = [];
  request(callback) {
    const id = ++this.next;
    this.active.set(id, callback);
    return id;
  }
  cancel(id) {
    this.cancelled.push(id);
    this.active.delete(id);
  }
  tick(now = 100) {
    const calls = Array.from(this.active);
    this.active.clear();
    for (const [, callback] of calls) callback(now);
  }
}

class Video extends EventTarget {
  paused = false;
  ended = false;
  pauses = 0;
  handles = new Map();
  frameIndex = 0;
  pause() {
    this.pauses++;
    this.paused = true;
  }
  requestVideoFrameCallback(callback) {
    const id = ++this.frameIndex;
    this.handles.set(id, callback);
    return id;
  }
  cancelVideoFrameCallback(id) {
    this.handles.delete(id);
  }
  nextFrame(now = 222) {
    const callbacks = [...this.handles.values()];
    this.handles.clear();
    callbacks.forEach((callback) => callback(now, {}));
  }
}

test("scope: one video frame at a time, stop leaves other loops running", async () => {
  const clock = new Scheduler();
  const video = new Video();
  const scope = new ReelJobScope(undefined, clock);
  const rendered = [];
  const stopLeft = scope.startFrameLoop(video, (now) => rendered.push(`left:${now}`));
  scope.startFrameLoop(video, (now) => rendered.push(`right:${now}`));
  assert.equal(scope.stats.pendingFrames, 2);
  stopLeft();
  assert.equal(scope.stats.pendingFrames, 1);
  video.nextFrame(333);
  assert.deepEqual(rendered, ["right:333"]);
  assert.equal(scope.stats.pendingFrames, 1);
  assert.equal(scope.stats.frameCalls, 1);
  await scope.dispose();
  assert.equal(scope.stats.pendingFrames, 0);
  assert.equal(video.handles.size, 0);
  assert.equal(video.pauses, 1);
  video.nextFrame();
  assert.equal(rendered.length, 1);
});

test("scope: RAF fallback cancels queued callbacks at disposal", async () => {
  const scheduler = new Scheduler();
  const scope = new ReelJobScope(undefined, scheduler);
  const video = new Video();
  video.requestVideoFrameCallback = undefined;
  video.cancelVideoFrameCallback = undefined;
  const received = [];
  scope.startFrameLoop(video, (now) => received.push(now));
  assert.equal(scheduler.active.size, 1);
  scheduler.tick(10);
  assert.deepEqual(received, [10]);
  assert.equal(scheduler.active.size, 1);
  const stale = Array.from(scheduler.active.values())[0];
  await scope.dispose();
  assert.equal(scheduler.active.size, 0);
  stale(11);
  assert.deepEqual(received, [10]);
  assert.equal(scope.stats.resourceCount, 0);
});

test("scope: frame drawing error aborts safely and is surfaced to owner", async () => {
  const scope = new ReelJobScope();
  const video = new Video();
  const seen = [];
  const error = new Error("decode failed");
  scope.startFrameLoop(video, () => { throw error; }, (caught) => seen.push(caught));
  video.nextFrame();
  assert.deepEqual(seen, [error]);
  assert.equal(scope.signal.aborted, true);
  await scope.dispose();
  assert.equal(scope.stats.pendingFrames, 0);
});

test("scope: waitForEnd removes listener after playback ended", async () => {
  const scope = new ReelJobScope();
  const video = new Video();
  const waiting = scope.waitForEnd(video);
  video.ended = true;
  video.dispatchEvent(new Event("ended"));
  await waiting;
  assert.equal(scope.signal.aborted, false);
  await scope.dispose();
  assert.equal(scope.stats.state, "disposed");
});

test("scope: playback error rejects and later frames are stopped", async () => {
  const scope = new ReelJobScope();
  const video = new Video();
  const waiting = scope.waitForEnd(video);
  video.dispatchEvent(new Event("error"));
  await assert.rejects(waiting,
    (error) => error instanceof ReelScopeError && error.code === "REEL_PLAYBACK_FAILED");
  await scope.dispose();
});

test("scope: cancelling aborts pending waits, urls, frame loop, GPU and audio", async () => {
  const external = new AbortController();
  const scope = new ReelJobScope(external.signal);
  const video = new Video();
  const disposed = [];
  const urls = [];
  const closed = [];
  scope.ownVideo(video);
  scope.ownObjectUrl("blob:first", (url) => urls.push(url));
  scope.ownObjectUrl("blob:second", (url) => urls.push(url));
  scope.ownResource({ dispose() { disposed.push(1); } });
  scope.ownAudio({ async close() { closed.push(1); } });
  scope.startFrameLoop(video, () => disposed.push("frame"));
  const ended = scope.waitForEnd(video);
  external.abort();
  await assert.rejects(ended, (error) => error.code === "REEL_ABORTED");
  await scope.dispose();
  assert.deepEqual(disposed, [1]);
  assert.deepEqual(urls, ["blob:first", "blob:second"]);
  assert.deepEqual(closed, [1]);
  assert.equal(video.pauses, 1);
  assert.deepEqual(scope.stats, {
    state: "disposed", urlCount: 0, resourceCount: 0, pendingFrames: 0, frameCalls: 0,
  });
  assert.throws(() => scope.ownResource({ dispose() {} }), ReelScopeError);
});

test("scope: abort before construction forbids any work", async () => {
  const controller = new AbortController();
  controller.abort();
  const scope = new ReelJobScope(controller.signal);
  assert.equal(scope.signal.aborted, true);
  assert.throws(() => scope.ownObjectUrl("blob:x", () => {}), /cancelled/);
  await scope.dispose();
  assert.equal(scope.stats.resourceCount, 0);
});

test("scope: invalid and duplicated object URLs are rejected without retention", async () => {
  const scope = new ReelJobScope();
  const sink = [];
  assert.throws(() => scope.ownObjectUrl("https://elsewhere.example/clip"), /complete/);
  assert.throws(() => scope.ownObjectUrl("x"), ReelScopeError);
  scope.ownObjectUrl("blob:existing", (url) => sink.push(url));
  assert.throws(() => scope.ownObjectUrl("blob:existing"), ReelScopeError);
  assert.equal(scope.stats.urlCount, 1);
  await scope.dispose();
  assert.deepEqual(sink, ["blob:existing"]);
});

test("scope: thrown or rejected cleanup does not block remaining disposals", async () => {
  const scope = new ReelJobScope();
  let ran = 0;
  scope.ownResource({ dispose() { throw new Error("released"); } });
  scope.ownResource({ dispose() { ran++; } });
  scope.ownAudio({ close() { throw new Error("no audio context"); } });
  scope.ownAudio({ async close() { throw new Error("closed"); } });
  scope.ownAudio({ async close() { ran++; } });
  scope.ownObjectUrl("blob:x", () => { throw new Error("already gone"); });
  scope.ownObjectUrl("blob:y", () => { ran++; });
  await scope.dispose();
  await scope.dispose();
  assert.equal(ran, 3);
  assert.equal(scope.stats.resourceCount, 0);
});

test("scope: withReelJobScope always cleans on failure and success", async () => {
  let calls = 0;
  const rejected = withReelJobScope(async (scope) => {
    scope.ownResource({ dispose() { calls++; } });
    throw new Error("record failure");
  });
  await assert.rejects(rejected, /record failure/);
  assert.equal(calls, 1);
  const value = await withReelJobScope(async (scope) => {
    scope.ownResource({ dispose() { calls++; } });
    return "finished";
  });
  assert.equal(value, "finished");
  assert.equal(calls, 2);
});

test("scope: 20 jobs retain no URLs, frames, GPU or audio references", async () => {
  let disposed = 0;
  let revoked = 0;
  let audioClosed = 0;
  const retired = [];
  for (let i = 0; i < 20; i++) {
    const scope = new ReelJobScope();
    const video = new Video();
    scope.ownResource({ dispose() { disposed++; } });
    scope.ownAudio({ async close() { audioClosed++; } });
    scope.ownObjectUrl(`blob:${i}`, () => { revoked++; });
    scope.startFrameLoop(video, () => {});
    await scope.dispose();
    assert.equal(video.handles.size, 0);
    assert.equal(scope.stats.pendingFrames, 0);
    retired.push(scope);
  }
  assert.equal(disposed, 20);
  assert.equal(audioClosed, 20);
  assert.equal(revoked, 20);
  assert.ok(retired.every((scope) => scope.stats.state === "disposed"));
  assert.equal(retired.reduce((sum, scope) => sum + scope.stats.resourceCount, 0), 0);
});
