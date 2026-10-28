// R9 shell worker protocol over a real MessageChannel (structured clone and buffer transfer),
// plus the inline fallback used when a browser has no module workers. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as W from "../dist/js/ui/shell/worker-protocol.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { precheck } from "../dist/js/ui/shell/precheck.js";
import { renderStrip } from "../dist/js/ui/shell/thumbnails.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { packBytes } from "../dist/js/engines/core/jobs.js";

const hash = (img) => Buffer.from(img.data).toString("base64");

function channel(timeout = 60_000) {
  // The web MessageChannel global: onmessage gets an event with .data, as in a browser worker.
  const { port1, port2 } = new MessageChannel();
  port2.onmessage = W.serveShell(port2);
  const client = new W.ShellClient(port1, timeout);
  port1.onmessage = (event) => client.receive(event.data);
  return { client, close: () => { port1.close(); port2.close(); } };
}

test("packing a source keeps masks, face points and body controls, and the original stays usable", () => {
  for (const id of ["crown", "portrait", "body-front", "body-side", "low-light"]) {
    const s = makeSample(id);
    const back = W.unpackSource(structuredClone(W.packSource(s)));
    assert.equal(hash(back.image), hash(s.image), id);
    assert.equal(Boolean(back.crown), Boolean(s.crown));
    assert.equal(Boolean(back.person), Boolean(s.person));
    assert.equal(back.face?.length ?? 0, s.face?.length ?? 0);
    assert.deepEqual(back.body?.points ?? null, s.body?.points ?? null);
    if (s.crown) assert.deepEqual(Array.from(back.crown.data), Array.from(s.crown.data));
    assert.ok(s.image.data.length > 0, "packing copies, so the editor's photo is still there");
  }
});

test("unpacking rejects sizes and shapes that don't belong together", () => {
  const s = makeSample("crown"), packed = W.packSource(s);
  assert.throws(() => W.unpackSource({ ...packed, kind: "remote" }), /kind/);
  assert.throws(() => W.unpackSource({ ...packed, crown: W.packSource(makeSample("low-light")).image }), /f32|mask/i);
  const body = W.packSource(makeSample("body-front"));
  assert.throws(() => W.unpackSource({ ...body, body: { ...body.body, width: 10 } }), /Body points/);
  assert.throws(() => W.unpackSource({ ...W.packSource(makeSample("portrait")), face: [1, 2, 3] }), /Face points/);
  assert.throws(() => W.unpackSource(null), /packed photo source/);
});

test("pre-check over the channel matches the direct result", async () => {
  const { client, close } = channel();
  try {
    const s = makeSample("portrait");
    const report = await client.precheck(s.image, { face: s.face });
    const direct = precheck(s.image, { face: s.face });
    assert.deepEqual(report.checks, direct.checks);
    assert.equal(report.verdict, direct.verdict);
    assert.equal(client.waiting, 0);
  } finally { close(); }
});

test("thumbnails over the channel are byte-identical to rendering on this thread", async () => {
  const { client, close } = channel();
  try {
    const s = makeSample("crown");
    const strip = await client.thumbnails(s, "hair-fibre", { side: 96 });
    assert.deepEqual([strip.page, strip.pages, strip.total, strip.more], [0, 1, 3, false]);
    const remote = strip.tiles;
    const local = renderStrip("hair-fibre", s, { side: 96 });
    assert.equal(remote.length, 3);
    assert.deepEqual(remote.map((t) => t.label), local.map((t) => t.label));
    for (let i = 0; i < remote.length; i++) assert.equal(hash(remote[i].image), hash(local[i].image));
    assert.ok(remote.every((t) => Math.max(t.image.width, t.image.height) === 96));
  } finally { close(); }
});

test("compare frames over the channel equal the editor's own frames", async () => {
  const { client, close } = channel();
  try {
    const editor = new Editor("portrait");
    editor.add("beard");
    const remote = await client.frames(editor.source, editor.document.layers, editor.document.selected, "grid-2x2");
    const local = editor.frames("grid-2x2");
    assert.deepEqual(remote.map((f) => f.caption), local.map((f) => f.caption));
    for (let i = 0; i < 4; i++) assert.equal(hash(remote[i].image), hash(local[i].image));
  } finally { close(); }
});

test("bad jobs come back as errors, never as a thrown exception across the port", async () => {
  const { client, close } = channel();
  try {
    await assert.rejects(client.thumbnails(makeSample("crown"), "hair-fibre", { side: 999 }), /32–256/);
    await assert.rejects(client.thumbnails(makeSample("crown"), "hair-fibre", { page: 4 }), /Page must be/);
    const editor = new Editor("portrait");
    await assert.rejects(client.frames(editor.source, [{ id: "x", kind: "enhance" }], null, "grid-2x2"), /strength|Layer/);
    await assert.rejects(client.frames(editor.source, [], null, "swipe"), /Unknown compare mode/);
  } finally { close(); }
  const raw = W.handleShellJob({ kind: "launch", id: 3 });
  assert.equal(raw.result.ok, false); assert.equal(raw.result.kind, "unknown");
  assert.equal(W.handleShellJob(null).result.id, -1);
  const pre = W.handleShellJob({ kind: "precheck", id: 4, image: { width: 2, height: 2, channels: 3, type: "u8", buffer: new ArrayBuffer(3) }, options: {} });
  assert.equal(pre.result.ok, false); assert.match(pre.result.error, /does not match/);
});

test("results move their pixel buffers instead of copying them", () => {
  const s = makeSample("low-light");
  const { result, transfer } = W.handleShellJob({ kind: "thumbnails", id: 9, source: W.packSource(s), studio: "enhance", side: 64 });
  assert.equal(result.ok, true);
  assert.equal(transfer.length, result.tiles.length);
  assert.ok(transfer.every((b) => b instanceof ArrayBuffer));
});

test("the inline port answers asynchronously when there is no Worker", async () => {
  const { client, threaded, terminate } = W.createShellClient(null);
  assert.equal(threaded, false);
  const report = await client.precheck(makeSample("low-light").image);
  assert.ok(report.checks.length >= 6);
  terminate();
});

test("a silent worker times out, and cancelAll rejects what is still waiting", async () => {
  const silent = { postMessage() {} };
  const client = new W.ShellClient(silent, 30);
  await assert.rejects(client.precheck(makeSample("low-light").image), /did not finish/);
  const slow = new W.ShellClient(silent, 60_000);
  const pending = slow.precheck(makeSample("low-light").image);
  assert.equal(slow.waiting, 1);
  slow.cancelAll("Photo changed");
  await assert.rejects(pending, /Photo changed/);
  assert.equal(slow.waiting, 0);
  slow.receive({ kind: "precheck", id: 1, ok: true, report: {} });
  slow.receive("noise");
  assert.throws(() => new W.ShellClient(silent, 1), /10 ms/);
  assert.ok(packBytes(makeSample("low-light").image).buffer.byteLength > 0);
});
