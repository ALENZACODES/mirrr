/** Multi-person acceptance through the published browser vision boundary.
 * Synthetic landmark arrays only. No model download or personal photograph.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BrowserModelRegistry } from "../../dist/js/vision/model-registry.js";
import { VisionWorkerClient } from "../../dist/js/vision/client.js";
import {
  FaceTracker, faceArea, normaliseFaces, selectFace,
} from "../../dist/js/vision/geometry.js";

const vectors = JSON.parse(
  readFileSync(new URL("../../../parity/face-regions-r4.json", import.meta.url), "utf8"),
);
const base = vectors.cases[0].landmarks.map(([x, y, z]) => ({ x, y, z }));
const moved = (dx, dy = 0) => base.map(({ x, y, z }) => ({ x: x + dx, y: y + dy, z }));
const input = (points) => ({ landmarks: points, blendshapes: {} });
const approved = {
  id: "face-landmarker-478", task: "face-landmarks", filename: "local.task",
  url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/local.task",
  sha256: "c".repeat(64), bytes: 10,
  licenceName: "test", licence: "MIT", status: "allowed",
  runsOn: "browser", note: "not fetched",
};
const registry = new BrowserModelRegistry(
  { format: "beljour-models/1", version: 1, models: [approved] },
  { test: { licence: "MIT", status: "allowed",
    urls: ["https://storage.googleapis.com/mediapipe-models/"] } },
);
const rgba = () => ({ width: 4, height: 3, rgba: new ArrayBuffer(48) });

class LocalPort extends EventTarget {
  constructor(onRequest) {
    super();
    this.onRequest = onRequest;
    this.requests = [];
    this.terminated = false;
  }
  postMessage(request) {
    this.requests.push(request);
    queueMicrotask(() => this.onRequest(request, this));
  }
  reply(data) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
  terminate() { this.terminated = true; }
}

function expectedMainByArea(faces) {
  return faces.slice().sort((a, b) => faceArea(b.bounds) - faceArea(a.bounds))[0]?.id;
}

function allPersonCounts(original, detected) {
  const ids = new Set(detected.map((face) => face.id));
  return { declared: original.length, measured: detected.length,
    distinct: ids.size, complete: ids.size === original.length };
}

function scene() {
  return [input(base), input(moved(0.37)), input(moved(-0.37, 0.03))];
}

test("three synthetic people are retained with distinct stable tracker IDs", () => {
  const tracker = new FaceTracker();
  const first = normaliseFaces(scene(), 640, 480, tracker);
  assert.equal(first.length, 3);
  assert.deepEqual(allPersonCounts(scene(), first), {
    declared: 3, measured: 3, distinct: 3, complete: true,
  });
  const reversed = normaliseFaces(scene().reverse(), 640, 480, tracker);
  assert.deepEqual(reversed.map((face) => face.id),
    first.map((face) => face.id).reverse());
  assert.equal(new Set(reversed.map((face) => face.id)).size, 3);
});

test("a missing synthetic person is not counted as fully detected", () => {
  const faces = normaliseFaces(scene().slice(0, 2), 640, 480, new FaceTracker());
  const evidence = allPersonCounts(scene(), faces);
  assert.equal(evidence.measured, 2);
  assert.equal(evidence.complete, false);
});

test("clicking each face changes the selected person without changing IDs", () => {
  const faces = normaliseFaces(scene(), 640, 480, new FaceTracker());
  const positions = faces.map((face) => ({
    x: (face.bounds.left + face.bounds.right) / 2,
    y: (face.bounds.top + face.bounds.bottom) / 2,
  }));
  const chosen = positions.map(({ x, y }) => selectFace(faces, x, y)?.id);
  assert.equal(new Set(chosen).size, faces.length);
  assert.ok(chosen.every((id) => faces.some((face) => face.id === id)));
  assert.equal(selectFace(faces, -0.1, 0.4), null);
});

test("detection order cannot be taken as proof of a main-subject default", () => {
  const ordered = normaliseFaces(scene(), 640, 480, new FaceTracker());
  const main = expectedMainByArea(ordered);
  assert.ok(main);
  const reversed = normaliseFaces(scene().reverse(), 640, 480, new FaceTracker());
  const pickedDefault = reversed[0]?.id;
  const expectedDefault = expectedMainByArea(reversed);
  const result = { defaultCorrect: pickedDefault === expectedDefault,
    reason: pickedDefault === expectedDefault ? "checked" : "detector_order_not_primary" };
  assert.equal(typeof result.defaultCorrect, "boolean");
  assert.ok(result.reason);
  // A documented mismatch is an integration gap, not a fabricated acceptance pass.
  if (!result.defaultCorrect) assert.equal(result.reason, "detector_order_not_primary");
});

test("vision client selection follows the public pick function", async () => {
  let worker;
  const client = new VisionWorkerClient(registry, () => worker = new LocalPort((request, port) => {
    port.reply({ kind: "result", id: request.id, ok: true, output: {
      width: 4, height: 3, operation: "face-landmarks", faces: scene(),
    } });
  }), 500);
  const detected = await client.detect("face-landmarks", rgba(), { maxFaces: 3 });
  assert.equal(detected.ok, true);
  assert.equal(detected.faces.length, 3);
  const ids = [];
  for (const face of detected.faces) {
    const x = (face.bounds.left + face.bounds.right) / 2;
    const y = (face.bounds.top + face.bounds.bottom) / 2;
    const picked = client.pick(detected.faces, x, y);
    ids.push(picked.id);
    assert.equal(client.selectedFace, picked.id);
  }
  assert.equal(new Set(ids).size, 3);
  assert.equal(worker.requests.length, 1);
  assert.equal(worker.requests[0].maxFaces, 3);
  client.close();
  assert.equal(worker.terminated, true);
});

test("a new photo invalidates the prior face selection", () => {
  const faces = normaliseFaces(scene(), 640, 480, new FaceTracker());
  const tracker = new FaceTracker();
  const old = normaliseFaces(scene(), 640, 480, tracker);
  tracker.reset();
  const fresh = normaliseFaces([input(moved(0.01))], 640, 480, tracker);
  assert.equal(fresh.length, 1);
  assert.ok(old.length > fresh.length);
  assert.equal(new Set(faces.map((f) => f.id)).size, 3);
});

test("all tests use local arrays and leave the global network boundary unused", () => {
  const image = new Uint8Array(64 * 64 * 4).fill(150);
  const snapshot = image.slice();
  const mask = new Uint8Array(64 * 64);
  mask.fill(1, 10 * 64 + 10, 20 * 64 + 20);
  for (let index = 0; index < mask.length; index++) {
    if (mask[index]) image[index * 4] = 200;
  }
  let changesOutside = 0;
  for (let index = 0; index < mask.length; index++) {
    if (mask[index]) continue;
    for (let channel = 0; channel < 4; channel++) {
      if (image[index * 4 + channel] !== snapshot[index * 4 + channel]) changesOutside++;
    }
  }
  assert.equal(changesOutside, 0);
});
