// R12 box-first geometry and injected runtime tests. No photos/models/network. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { BoxFirstDetector, YuNetRowsAdapter, prepareBoxes, cropPlan, cropImage, restoreMesh,
  validMesh, meshBox, overlap, associated, sizeSlice, yawSlice } from '../dist/js/vision/box-first.js';
import { MediaPipeRunners, facePipelineAvailability } from '../dist/js/vision/runners.js';

const makeImage = (data, width, height) => ({ data: new Uint8ClampedArray(data), width, height });
function image(width = 120, height = 100) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    data.set([x % 256, y % 256, (x + y) % 256, 255], (y * width + x) * 4);
  }
  return makeImage(data, width, height);
}
const faceBox = (x = 40, y = 30, width = 30, height = 40, score = 0.9) => ({ x, y, width, height, score });
const rawBox = (box) => [box.x, box.y, box.width, box.height, box.score];
const near = (a, b, epsilon = 1e-10) => assert.ok(Math.abs(a - b) <= epsilon, `${a} != ${b}`);
function globalMesh(box, width = 120, height = 100) {
  return Array.from({ length: 478 }, (_, k) => {
    const angle = k * 2 * Math.PI / 478;
    return { x: (box.x + box.width * (0.5 + 0.49 * Math.cos(angle))) / width,
      y: (box.y + box.height * (0.5 + 0.49 * Math.sin(angle))) / height, z: -0.1 };
  });
}
function inCrop(points, crop, width = 120, height = 100) {
  return points.map(({ x, y, z }) => ({ x: (x * width - crop.left) / crop.side,
    y: (y * height - crop.top) / crop.side, z: z * width / crop.side }));
}
const sourceFor = (rows) => ({ provider: 'yunet', detect: () => rows });
const batch = (faces, blendshapes = faces.map(() => ({}))) => ({ faces, blendshapes });

test('YuNet formats use the last score and exclude nonfinite or malformed rows', () => {
  const raw = [[2, 3, 10, 20], [40, 10, 20, 20, 0.85],
    [80, 40, 15, 20, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0.95],
    [0, 0, 1, 1, 0.99], [0, 0, 10, 10, 0.1], [0, 0, -10, 10, 0.9],
    [0, 0, 10, 10, 1.01], [0, 0, 10, 10, NaN], [0, 0, 10, 10, 0.9, 3]];
  const copy = structuredClone(raw);
  const boxes = prepareBoxes(raw, 120, 100);
  assert.equal(boxes.length, 3);
  assert.deepEqual(boxes.map((b) => b.score), [1, 0.95, 0.85]);
  assert.deepEqual(raw, copy);
});

test('Stable NMS clips off-frame boxes and retains distinct group faces', () => {
  const boxes = prepareBoxes([[-5, -5, 30, 30, 0.9], [0, 0, 25, 25, 0.8],
    [60, 20, 20, 20, 0.9], [200, 200, 10, 10, 0.95]], 100, 80);
  assert.deepEqual(boxes, [faceBox(0, 0, 25, 25, 0.9), faceBox(60, 20, 20, 20, 0.9)]);
  assert.equal(prepareBoxes(boxes.map(rawBox), 100, 80, 1).length, 1);
  near(overlap(boxes[0], boxes[0]), 1);
  near(overlap(boxes[0], boxes[1]), 0);
});

test('Box parser refuses invalid limits, dimensions and threshold configuration', () => {
  for (const limit of [0, 7, 1.1, true]) assert.throws(() => prepareBoxes([], 100, 100, limit), /limit/);
  for (const score of [-0.1, 1.1, NaN]) assert.throws(() => prepareBoxes([], 100, 100, 6, score), /threshold/);
  assert.throws(() => prepareBoxes([], 0, 100), /size/);
});

test('Square crop preserves the padded origin and bounded inference resolution', () => {
  const crop = cropPlan(faceBox(0, 0, 10, 20));
  assert.deepEqual(crop, { left: -11, top: -6, side: 32, outputSize: 256 });
  assert.equal(cropPlan(faceBox(300, 200, 700, 800)).outputSize, 512);
  assert.equal(cropPlan(faceBox(0, 0, 50, 50), 2).side, 100);
  for (const margin of [0.9, 3.1, NaN]) assert.throws(() => cropPlan(faceBox(), margin), /margin/);
  assert.throws(() => cropPlan(faceBox(), 1.6, 31, 512), /budget/);
  assert.throws(() => cropPlan(faceBox(), 1.6, 600, 512), /budget/);
  assert.throws(() => cropPlan(faceBox(0, 0, -1, 20)), /positive/);
});

test('Crop samples edge replication without allocating a padded source image', () => {
  const source = image(4, 4), original = new Uint8ClampedArray(source.data);
  const crop = { left: -1, top: -1, side: 4, outputSize: 32 };
  const out = cropImage(source, crop, makeImage);
  assert.deepEqual([...out.data.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepEqual([...out.data.slice(-4)], [2, 2, 4, 255]);
  assert.deepEqual(source.data, original);
  assert.notEqual(out.data, source.data);
  const enlarged = cropImage(source, { left: 0, top: 0, side: 4, outputSize: 32 }, makeImage);
  assert.deepEqual([...enlarged.data.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepEqual([...enlarged.data.slice(-4)], [3, 3, 6, 255]);
});

test('Crop allocation rejects oversized or malformed buffers and plans', () => {
  assert.throws(() => cropImage({ width: 2, height: 2, data: new Uint8ClampedArray(3) },
    { left: 0, top: 0, side: 2, outputSize: 2 }, makeImage), /RGBA/);
  for (const crop of [
    { left: 0, top: 0, side: 50000, outputSize: 256 },
    { left: 0, top: 0, side: 2, outputSize: 1025 },
    { left: NaN, top: 0, side: 2, outputSize: 256 },
  ]) assert.throws(() => cropImage(image(), crop, makeImage), /crop plan/);
});

test('Crop rounds half levels to even, matching the Python image contract', () => {
  const source = image(2, 2);
  const cropped = cropImage(source, { left: 0, top: 0, side: 2, outputSize: 33 }, makeImage);
  assert.equal(cropped.data[16 * 4], 0, 'half of byte levels 0 and 1 must round to 0');
  assert.equal(cropped.data[(16 * 33 + 16) * 4 + 2], 1, 'a full level stays 1');
});

test('Normalized XYZ restores depth by crop width and Y by full image height', () => {
  const box = faceBox(0, 5, 20, 30), crop = cropPlan(box), global = globalMesh(box, 200, 100);
  const normalized = inCrop(global, crop, 200, 100);
  const restored = restoreMesh(normalized, crop, 200, 100);
  restored.forEach((p, i) => { near(p.x, global[i].x); near(p.y, global[i].y); near(p.z, global[i].z); });
  assert.ok(crop.left < 0);
  const translated = restoreMesh(normalized, { ...crop, left: crop.left + 10 }, 200, 100);
  near(translated[0].x - restored[0].x, 0.05);
  near(translated[0].z, restored[0].z);
  assert.throws(() => restoreMesh(normalized, { ...crop, side: NaN }, 200, 100), /crop plan/);
  assert.throws(() => restoreMesh(normalized, crop, 0, 100), /image size/);
});

test('Mesh validation rejects wrong count, nonfinite values and zero-area output', () => {
  const valid = globalMesh(faceBox());
  assert.notEqual(validMesh(valid), valid);
  assert.throws(() => validMesh(valid.slice(1)), /478/);
  assert.throws(() => validMesh(valid.map((p, i) => i ? p : { ...p, z: NaN })), /finite/);
  assert.throws(() => validMesh(Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }))), /area/);
});

test('Association selects the intended face and rejects a distant secondary person', () => {
  const target = faceBox(), matching = globalMesh(target), neighbour = globalMesh(faceBox(5, 5, 20, 20));
  assert.ok(associated(matching, target, 120, 100) > 0.9);
  assert.equal(associated(neighbour, target, 120, 100), 0);
  const measured = meshBox(matching, 120, 100);
  assert.ok(measured.x > target.x && measured.x < target.x + 1);
});

test('Coordinator invokes the box detector before crop mesh, preserving selected blendshapes', async () => {
  const target = faceBox(), plan = cropPlan(target), world = globalMesh(target), events = [];
  const source = { provider: 'yunet', detect: (photo) => { events.push(['box', photo.width]); return [rawBox(target)]; } };
  const detector = new BoxFirstDetector(source, (photo) => {
    events.push(['mesh', photo.width]);
    return batch([inCrop(globalMesh(faceBox(0, 0, 15, 15)), plan), inCrop(world, plan)], [{ wrong: 1 }, { smile: 0.4 }]);
  }, 6, makeImage);
  const result = await detector.detect(image());
  assert.deepEqual(events, [['box', 120], ['mesh', 256]]);
  assert.equal(result.faces.length, 1);
  assert.deepEqual(result.blendshapes[0], { smile: 0.4 });
  result.faces[0].forEach((p, i) => near(p.x, world[i].x));
  assert.equal(result.detector, 'yunet');
  assert.equal(result.usedFallback, false);
  assert.equal(result.attempts[0].matched, true);
});

test('Only an unresolved face receives the wider retry', async () => {
  const target = faceBox(), world = globalMesh(target);
  let calls = 0;
  const detector = new BoxFirstDetector(sourceFor([rawBox(target)]), () => {
    calls++;
    return calls === 1 ? batch([]) : batch([inCrop(world, cropPlan(target, 2))]);
  }, 6, makeImage);
  const result = await detector.detect(image());
  assert.equal(calls, 2);
  assert.deepEqual(result.attempts.map((a) => a.margin), [1.6, 2]);
  assert.equal(result.faces.length, 1);
  assert.equal(result.usedFallback, false);
});

test('Unmatched crops get one explicit full-image fallback without accepting the wrong face', async () => {
  const target = faceBox(), world = globalMesh(target), wrong = globalMesh(faceBox(0, 0, 10, 10));
  let calls = 0;
  const detector = new BoxFirstDetector(sourceFor([rawBox(target)]), (photo) => {
    calls++;
    return photo.width === 120 ? batch([wrong, world]) : batch([]);
  }, 6, makeImage);
  const result = await detector.detect(image());
  assert.equal(calls, 3);
  assert.equal(result.usedFallback, true);
  assert.equal(result.faces.length, 1);
  assert.deepEqual(result.faces[0], world);
  assert.equal(result.attempts.at(-1).stage, 'full_image_fallback');
});

test('No boxes falls back once, deduplicates meshes and respects the requested limit', async () => {
  const a = globalMesh(faceBox(10, 10, 20, 25)), b = globalMesh(faceBox(70, 10, 20, 25));
  let calls = 0;
  const detector = new BoxFirstDetector(sourceFor([]), () => { calls++; return batch([a, a, b]); }, 1, makeImage);
  const result = await detector.detect(image());
  assert.equal(calls, 1);
  assert.equal(result.faces.length, 1);
  assert.equal(result.usedFallback, true);
  assert.equal(result.boxes.length, 0);
});

test('Corrupt candidates are counted and cannot manufacture a successful crop', async () => {
  const target = faceBox();
  const detector = new BoxFirstDetector(sourceFor([rawBox(target)]), () => batch([[{ x: 0, y: 0, z: NaN }]]), 6, makeImage);
  const result = await detector.detect(image());
  assert.equal(result.faces.length, 0);
  assert.equal(result.attempts.length, 3);
  assert.equal(result.attempts[0].invalidMeshes, 1);
  assert.equal(result.attempts.every((a) => !a.matched), true);
});

test('YuNet row adapter has an explicit provider, validates input and disposes its runtime', async () => {
  let closed = 0;
  const row = [10, 10, 20, 30, 12, 15, 18, 15, 15, 20, 13, 25, 17, 25, 0.9];
  const source = new YuNetRowsAdapter(() => [row], () => { closed++; });
  assert.equal(source.provider, 'yunet');
  assert.deepEqual(await source.detect(image()), [row]);
  await source.close(); assert.equal(closed, 1);
  assert.throws(() => new BoxFirstDetector({ provider: 'mediapipe', detect: () => [] }, () => batch([])), /YuNet/);
  assert.throws(() => new BoxFirstDetector(source, () => batch([]), 0), /limit/);
});

test('Size and yaw buckets keep small/side/unknown observations separate from frontal', () => {
  assert.deepEqual([null, NaN, 0, 63.9, 64, 127.9, 128].map(sizeSlice),
    ['unknown', 'unknown', 'unknown', 'small_lt64', 'medium_64_127', 'medium_64_127', 'large_ge128']);
  assert.deepEqual([null, NaN, 0, -15, 15.1, 44.9, 45, -75].map(yawSlice),
    ['unknown', 'unknown', 'frontal', 'frontal', 'angled', 'angled', 'side', 'profile']);
});

function fakeSdk(onMesh) {
  const factory = (fn) => ({ createFromOptions: async () => ({ detect: fn, close() {} }) });
  return { FilesetResolver: { forVisionTasks: async () => ({}) },
    FaceLandmarker: factory(onMesh), FaceDetector: factory(() => ({ detections: [] })),
    PoseLandmarker: factory(() => ({})), ImageSegmenter: factory(() => ({})) };
}

test('MediaPipeRunners wires the injected YuNet crop pipeline and restores pose coordinates', async () => {
  const data = JSON.parse(readFileSync(new URL('../../parity/face-spikes-r6.json', import.meta.url)));
  const original = data.faces[0].xyz.map(([x, y, z]) => ({ x: x / 180, y: y / 200, z: z / 180 }));
  const target = meshBox(original, 180, 200), plan = cropPlan(target);
  const widths = [], loaded = [];
  const sdk = fakeSdk((photo) => {
    widths.push(photo.width);
    return { faceLandmarks: [inCrop(original, plan, 180, 200)],
      faceBlendshapes: [{ categories: [{ categoryName: 'mouthSmileLeft', score: 0.6 }] }] };
  });
  const runner = new MediaPipeRunners(sdk, 'synthetic', async (id) => { loaded.push(id); return new Uint8Array([1]); },
    { boxSource: sourceFor([rawBox(target)]), createImage: makeImage, requireBoxFirst: true });
  assert.equal(runner.boxFirstReady, true);
  const result = await runner.run('face-landmarks', image(180, 200));
  assert.equal(result.detectionPipeline.pipeline, 'box-crop-mesh');
  assert.equal(result.detectionPipeline.detector, 'yunet');
  assert.equal(result.detectionPipeline.usedFullImageFallback, false);
  assert.equal(result.faces.length, 1);
  assert.equal(result.faces[0].blendshapes.mouthSmileLeft, 0.6);
  result.faces[0].landmarks.forEach((p, i) => { near(p.x, original[i].x); near(p.z, original[i].z); });
  assert.deepEqual(widths, [256]);
  assert.deepEqual(loaded, ['face-landmarker-478']);
  await runner.dispose();
});

test('Injected box-only detection does not create or load a MediaPipe model', async () => {
  let loaded = 0, closed = 0;
  const source = { provider: 'yunet', detect: () => [[12, 20, 30, 40, 0.9]], close: () => { closed++; } };
  const runner = new MediaPipeRunners(fakeSdk(() => ({})), 'synthetic', async () => { loaded++; return new Uint8Array([1]); },
    { boxSource: source, createImage: makeImage });
  const result = await runner.run('face-detection', image());
  assert.deepEqual(result.detections, [{ x: 0.1, y: 0.2, width: 0.25, height: 0.4, score: 0.9 }]);
  assert.equal(result.detectionPipeline.pipeline, 'box-only');
  assert.equal(loaded, 0);
  await runner.dispose(); assert.equal(closed, 1);
});

test('An unconfigured browser path stays honestly labelled as full-image MediaPipe', async () => {
  const runner = new MediaPipeRunners(fakeSdk(() => ({ faceLandmarks: [] })), 'synthetic', async () => new Uint8Array([1]));
  assert.equal(runner.boxFirstReady, false);
  const result = await runner.run('face-landmarks', image());
  assert.equal(result.detectionPipeline.pipeline, 'full-image');
  assert.equal(result.detectionPipeline.detector, 'mediapipe');
  assert.equal(result.detectionPipeline.sourceConfigured, false);
  assert.equal(result.detectionPipeline.usedFullImageFallback, true);
  assert.match(result.detectionPipeline.reason, /not configured/);
  await runner.dispose();
});

test('Box-first readiness reports a missing adapter independently from model clearance', () => {
  const absent = facePipelineAvailability();
  assert.equal(absent.available, false);
  assert.equal(absent.required, false);
  assert.match(absent.reason, /not configured/);
  assert.deepEqual(facePipelineAvailability({ boxSource: sourceFor([]), requireBoxFirst: true }),
    { available: true, required: true, reason: null });
  assert.throws(() => facePipelineAvailability({ requireBoxFirst: 'true' }), /boolean/);
  assert.throws(() => facePipelineAvailability({ boxSource: { provider: 'yunet' } }), /detect/);
});

test('Required box-first refuses both face tasks before weights, WASM or task creation', async () => {
  let loaded = 0, resolved = 0, created = 0;
  const sdk = fakeSdk(() => { created++; return {}; });
  sdk.FilesetResolver.forVisionTasks = async () => { resolved++; return {}; };
  sdk.FaceLandmarker.createFromOptions = async () => { created++; return {}; };
  sdk.FaceDetector.createFromOptions = async () => { created++; return {}; };
  const runner = new MediaPipeRunners(sdk, 'synthetic', async () => { loaded++; return new Uint8Array([1]); },
    { requireBoxFirst: true });
  for (const operation of ['face-detection', 'face-landmarks']) {
    await assert.rejects(runner.run(operation, image()), /YuNet.*not configured/);
  }
  assert.equal(runner.boxFirstReady, false);
  assert.equal(loaded, 0);
  assert.equal(resolved, 0);
  assert.equal(created, 0);
  // The face requirement must not disable independently cleared non-face tasks.
  const pose = await runner.run('pose', image());
  assert.deepEqual(pose.poses, []);
  assert.equal(loaded, 1);
  await runner.dispose();
});

test('Legacy box detection remains usable and cannot claim YuNet or P0 readiness', async () => {
  const sdk = fakeSdk(() => ({}));
  sdk.FaceDetector.createFromOptions = async () => ({ detect: () => ({ detections: [
    { boundingBox: { originX: 12, originY: 20, width: 30, height: 40 }, categories: [{ score: 0.9 }] },
  ] }) });
  const runner = new MediaPipeRunners(sdk, 'synthetic', async () => new Uint8Array([1]));
  const result = await runner.run('face-detection', image());
  assert.deepEqual(result.detections, [{ x: 0.1, y: 0.2, width: 0.25, height: 0.4, score: 0.9 }]);
  assert.equal(result.detectionPipeline.pipeline, 'full-image');
  assert.equal(result.detectionPipeline.detector, 'mediapipe');
  assert.equal(result.detectionPipeline.sourceConfigured, false);
  assert.equal(result.detectionPipeline.boxes, 1);
  assert.match(result.detectionPipeline.reason, /not configured/);
  await runner.dispose();
});

test('Default worker refuses the pending pose bundle before any network', async () => {
  const savedSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
  const savedFetch = globalThis.fetch;
  let handler, network = 0;
  const messages = [];
  Object.defineProperty(globalThis, 'self', { configurable: true, value: {
    addEventListener: (kind, callback) => { assert.equal(kind, 'message'); handler = callback; },
    postMessage: (message) => { messages.push(message); },
  } });
  globalThis.fetch = async () => { network++; throw new Error('Network is disabled in synthetic tests'); };
  try {
    await import('../dist/js/vision/media-worker.js?r12-pending');
    for (const [index, operation] of ['pose'].entries()) {
      handler({ data: { kind: 'detect', id: index + 1, operation,
        image: { width: 2, height: 2, rgba: new ArrayBuffer(16) } } });
    }
    assert.equal(messages.length, 1);
    for (const message of messages) {
      assert.equal(message.ok, false);
      assert.equal(message.status, 'pending');
      assert.match(message.error, /not cleared/);
    }
    assert.doesNotMatch(messages[0].error, /YuNet/);
    assert.equal(network, 0);
  } finally {
    globalThis.fetch = savedFetch;
    if (savedSelf) Object.defineProperty(globalThis, 'self', savedSelf);
    else delete globalThis.self;
  }
});

test('Cleared face boxes and landmarks refuse missing staged bytes before importing any SDK', async () => {
  const savedSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
  const savedFetch = globalThis.fetch;
  let handler;
  const messages = [], requested = [];
  Object.defineProperty(globalThis, 'self', { configurable: true, value: {
    addEventListener: (kind, callback) => { assert.equal(kind, 'message'); handler = callback; },
    postMessage: message => messages.push(message),
  } });
  globalThis.fetch = async url => { requested.push(url); return new Response('not staged', { status: 404 }); };
  try {
    await import('../dist/js/vision/media-worker.js?r14-unstaged');
    for (const [index, operation] of ['face-detection', 'face-landmarks'].entries()) {
      handler({ data: { kind: 'detect', id: 44 + index, operation,
        image: { width: 2, height: 2, rgba: new ArrayBuffer(16) } } });
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(messages.length, 2);
    for (const message of messages) {
      assert.equal(message.ok, false);
      assert.equal(message.status, 'failed');
      assert.match(message.error, /assets are not staged on this origin/);
    }
    assert.equal(requested.length, 2);
    assert.match(requested[0], /^\/models\/[a-f0-9]{64}\/blaze_face_short_range\.tflite$/);
    assert.match(requested[1], /^\/models\/[a-f0-9]{64}\/face_landmarker\.task$/);
  } finally {
    globalThis.fetch = savedFetch;
    if (savedSelf) Object.defineProperty(globalThis, 'self', savedSelf);
    else delete globalThis.self;
  }
});
