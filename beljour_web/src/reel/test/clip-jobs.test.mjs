import assert from "node:assert/strict";
import test from "node:test";
import { ClipJob, ClipJobError, createClipJob } from "../../../dist/js/reel/index.js";

class MockRecorder extends EventTarget {
  state = "inactive";
  started = 0;
  stopped = 0;

  start(timeslice) {
    this.started++;
    this.timeslice = timeslice;
    this.state = "recording";
  }

  stop() {
    if (this.state === "inactive") throw new Error("Already stopped");
    this.stopped++;
    this.state = "inactive";
    queueMicrotask(() => this.dispatchEvent(new Event("stop")));
  }

  chunk(size) {
    const event = new Event("dataavailable");
    event.data = new Blob([new Uint8Array(size)]);
    this.dispatchEvent(event);
  }

  recorderError() {
    this.dispatchEvent(new Event("error"));
  }
}

function fixture(options = {}) {
  const stopped = [0, 0];
  const tracks = stopped.map((_, index) => ({
    stop() { stopped[index]++; },
  }));
  const stream = { getTracks: () => tracks };
  const recorder = new MockRecorder();
  const base = { mimeType: "video/webm", videoBitsPerSecond: 2_500_000,
    makeRecorder: () => recorder, ...options };
  return { recorder, stopped, stream, job: createClipJob(stream, base) };
}

test("clip job validates mime, bitrate, byte cap and lifecycle misuse", async () => {
  assert.throws(() => new ClipJob({}, { mimeType: "video/webm",
    videoBitsPerSecond: 1_000_000 }), /stream/);
  assert.throws(() => fixture({ mimeType: "video/ogg" }), /container/);
  assert.throws(() => fixture({ videoBitsPerSecond: -1 }), /bitrate/);
  assert.throws(() => fixture({ maxBufferedBytes: 100 }), /byte budget/);
  const { job } = fixture();
  await assert.rejects(job.finish(), (error) => error.code === "CLIP_BAD_STATE");
  job.start();
  assert.throws(() => job.start(), /already started/);
  job.cancel();
  await assert.rejects(job.finish(), (error) => error.code === "CLIP_ABORTED");
});

test("completed clip returns bytes, does not retain chunks and stops tracks once", async () => {
  const { recorder, stopped, job } = fixture();
  job.start();
  recorder.chunk(256);
  recorder.chunk(128);
  recorder.chunk(0);
  assert.equal(job.state.bufferedBytes, 384);
  assert.equal(job.state.retainedChunks, 2);
  const file = await job.finish();
  assert.equal(file.type, "video/webm");
  assert.equal(file.size, 384);
  assert.equal(job.state.status, "finished");
  assert.equal(job.state.bufferedBytes, 0);
  assert.equal(job.state.retainedChunks, 0);
  assert.equal(job.completion, null);
  assert.equal(job.state.releasedTracks, 2);
  assert.deepEqual(stopped, [1, 1]);
  job.dispose();
  assert.deepEqual(stopped, [1, 1]);
});

test("AbortSignal cancels promptly and disconnects listeners and tracks", async () => {
  const controller = new AbortController();
  const { job, recorder, stopped } = fixture({ signal: controller.signal });
  job.start();
  recorder.chunk(300);
  controller.abort();
  await assert.rejects(job.finish(), (error) => error.code === "CLIP_ABORTED");
  assert.deepEqual(stopped, [1, 1]);
  assert.equal(job.state.bufferedBytes, 0);
  assert.equal(job.state.retainedChunks, 0);
  recorder.chunk(400);
  assert.equal(job.state.bufferedBytes, 0);
});

test("already aborted signal never starts recorder but still disposes stream", () => {
  const controller = new AbortController();
  controller.abort();
  const { job, recorder, stopped } = fixture({ signal: controller.signal });
  assert.throws(() => job.start(), (error) => error.code === "CLIP_ABORTED");
  assert.equal(recorder.started, 0);
  assert.deepEqual(stopped, [1, 1]);
  assert.equal(job.state.status, "disposed");
});

test("recording errors and explicit disposal fail closed without leaked tracks", async () => {
  for (const action of ["recorderError", "dispose"]) {
    const { job, recorder, stopped } = fixture();
    job.start();
    if (action === "dispose") job.dispose();
    else recorder.recorderError();
    await assert.rejects(job.finish(), (error) =>
      error instanceof ClipJobError && error.code === (action === "dispose"
        ? "CLIP_DISPOSED" : "CLIP_RECORDER_ERROR"));
    assert.deepEqual(stopped, [1, 1]);
    assert.equal(job.state.retainedChunks, 0);
  }
});

test("hard memory cap aborts before storing overflowing blob", async () => {
  const { job, recorder, stopped } = fixture({ maxBufferedBytes: 1024 });
  job.start();
  recorder.chunk(900);
  recorder.chunk(125);
  await assert.rejects(job.finish(), (error) => error.code === "CLIP_MEMORY_LIMIT");
  assert.deepEqual(stopped, [1, 1]);
  assert.equal(job.state.bufferedBytes, 0);
});

test("20 consecutive clip jobs have bounded references and dispose each track", async () => {
  const returned = [];
  let tracksStopped = 0;
  for (let i = 0; i < 20; i++) {
    const { job, recorder, stopped } = fixture({ maxBufferedBytes: 1024 });
    job.start();
    recorder.chunk(1000);
    const blob = await job.finish();
    assert.equal(blob.size, 1000);
    assert.equal(job.state.bufferedBytes, 0);
    assert.equal(job.state.retainedChunks, 0);
    assert.equal(job.completion, null);
    assert.equal(job.state.releasedTracks, 2);
    assert.deepEqual(stopped, [1, 1]);
    tracksStopped += stopped[0] + stopped[1];
    returned.push(job);
  }
  assert.equal(tracksStopped, 40);
  assert.equal(returned.reduce((sum, job) => sum + job.state.bufferedBytes, 0), 0);
  assert.equal(returned.reduce((sum, job) => sum + job.state.retainedChunks, 0), 0);
  // The test counts retained Blob references and stopped tracks, not process RSS.
});

test("20 consecutive aborted jobs clear all bounded buffers", async () => {
  const retained = [];
  for (let i = 0; i < 20; i++) {
    const controller = new AbortController();
    const { job, recorder, stopped } = fixture({ signal: controller.signal });
    job.start();
    recorder.chunk(512);
    controller.abort();
    await assert.rejects(job.finish(), (error) => error.code === "CLIP_ABORTED");
    assert.deepEqual(stopped, [1, 1]);
    retained.push(job);
  }
  assert.ok(retained.every((job) => job.state.retainedChunks === 0));
  assert.ok(retained.every((job) => job.state.releasedTracks === 2));
});
