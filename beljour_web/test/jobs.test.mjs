// R3: engine jobs over a message port (the Web Worker protocol), tested with Node's MessageChannel.
// Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import * as B from "../dist/js/engines/core/buffer.js";
import * as J from "../dist/js/engines/core/jobs.js";
import * as M from "../dist/js/engines/core/mask.js";
import { defaultRegistry } from "../dist/js/engines/core/worker.js";

const photo = () => { const img = B.byteImage(8, 6, 3); img.data.forEach((_, i) => (img.data[i] = (i * 29) % 256)); return img; };

function connect(registry = defaultRegistry(), timeoutMs) {
  const { port1, port2 } = new MessageChannel();
  port2.on("message", (data) => J.serve(registry, port2)({ data }));
  const client = new J.EngineClient(port1, timeoutMs);
  port1.on("message", (data) => client.receive(data));
  return { client, close: () => { port1.close(); port2.close(); } };
}

test("pack and unpack keep size and data", () => {
  const img = photo();
  const packed = J.packBytes(img);
  assert.deepEqual(Array.from(J.unpackBytes(packed).data), Array.from(img.data));
  const mask = M.ellipse(8, 6, 4, 3, 3, 2, 0.5);
  assert.deepEqual(Array.from(J.unpackMask(J.packMask(mask)).data), Array.from(mask.data));
  assert.throws(() => J.unpackBytes({ ...packed, width: 9 }), /does not match/);
  assert.throws(() => J.unpackMask(packed), /packed f32/);
  const moved = J.packBytes(img, false);
  assert.equal(moved.buffer, img.data.buffer, "copy: false hands over the same buffer");
  assert.equal(J.transferList(moved, moved).length, 1);
});

test("registry names and errors", () => {
  const reg = defaultRegistry();
  assert.deepEqual(reg.names(), ["exposure", "fill", "shape", "tint", "warp"]);
  assert.throws(() => reg.register("tint", () => null), /already registered/);
  assert.throws(() => reg.register("Bad Name", () => null), /lowercase/);
  assert.throws(() => reg.create("glow"), /no engine/);
});

test("runJob reports failures instead of throwing", () => {
  const reg = defaultRegistry();
  const img = photo();
  const job = { kind: "run", id: 7, engine: "tint", image: J.packBytes(img), masks: {}, params: { rgb: [1, 2, 3] }, seed: "0" };
  const { result } = J.runJob(reg, job);
  assert.deepEqual([result.ok, result.id], [false, 7]);
  assert.match(result.error, /selection mask required/);
  assert.match(J.runJob(reg, { ...job, seed: "-1" }).result.error, /seed/);
  assert.match(J.runJob(reg, { ...job, engine: "nope" }).result.error, /no engine/);
  assert.equal(J.runJob(reg, null).result.ok, false);
});

test("a job round-trips through a message port and matches a direct run", async () => {
  const { client, close } = connect();
  try {
    const img = photo(), sel = M.rectangle(8, 6, 0, 0, 4, 6);
    const out = await client.run({ engine: "exposure", image: img, masks: { selection: sel }, params: { stops: 0.6 } });
    assert.equal(out.pipelineVersion, "1.0.0");
    assert.equal(out.metrics.exposure_stops, 0.6);
    assert.ok(out.ms >= 0);
    const { result } = J.runJob(defaultRegistry(), { kind: "run", id: 1, engine: "exposure", image: J.packBytes(img),
      masks: { selection: J.packMask(sel) }, params: { stops: 0.6 }, seed: "0" });
    assert.deepEqual(Array.from(out.image.data), Array.from(J.unpackBytes(result.image).data));
    assert.equal(img.data.length, 8 * 6 * 3, "the caller's image is copied by default");
    const tint = client.run({ engine: "tint", image: img, masks: { selection: sel }, params: { rgb: [10, 20, 30], strength: 1 } });
    const broken = client.run({ engine: "tint", image: img, params: { rgb: [10, 20, 30] } });
    assert.equal(client.inFlight, 2);
    assert.equal((await tint).image.data[0], 10);
    await assert.rejects(broken, /selection mask required/);
    assert.equal(client.inFlight, 0);
  } finally {
    close();
  }
});

test("transfer moves the caller's buffer; timeouts and close reject", async () => {
  const { client, close } = connect();
  try {
    const img = photo();
    const out = await client.run({ engine: "exposure", image: img, params: { stops: -0.5 }, transfer: true });
    assert.equal(img.data.byteLength, 0, "moved into the worker");
    assert.equal(out.image.data.length, 8 * 6 * 3);
  } finally {
    close();
  }
  const silent = new J.EngineClient({ postMessage() {} }, 20);
  await assert.rejects(silent.run({ engine: "exposure", image: photo() }), /did not answer within 20 ms/);
  const waiting = new J.EngineClient({ postMessage() {} }, 10_000);
  const pending = waiting.run({ engine: "exposure", image: photo() });
  waiting.close("terminated");
  await assert.rejects(pending, /terminated/);
  const failing = new J.EngineClient({ postMessage() { throw new Error("port closed"); } });
  await assert.rejects(failing.run({ engine: "exposure", image: photo() }), /port closed/);
  waiting.receive({ kind: "result", id: 999, ok: true });
  waiting.receive("noise");
});
