// R14 pass definition: cleared pins, same-origin execution, byte-exact refusal.
// Every byte fixture below is synthetic and never executed. Author: John Khan.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { BrowserModelRegistry, fetchVerifiedModel, modelAssetPath } from '../dist/js/vision/model-registry.js';
import { MODEL_CATALOG } from '../dist/js/vision/generated/model-catalog.js';
import { MODEL_RUNTIME } from '../dist/js/vision/generated/model-runtime.js';
import { copyStagedModels } from '../scripts/copy-models.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = new TextEncoder().encode('Synthetic R14 browser model bytes; not an executable model.');
const model = (change = {}) => ({
  id: 'synthetic-model', task: 'face-detection', filename: 'synthetic.tflite',
  url: 'https://storage.googleapis.com/mediapipe-models/synthetic/1/synthetic.tflite',
  sha256: digest(raw), bytes: raw.length, licenceName: 'Synthetic model fixture',
  licence: 'MIT', status: 'allowed', runsOn: 'browser', note: 'Synthetic bytes only', ...change,
});
const catalogue = entry => ({ format: 'beljour-models/1', version: 1, models: [entry] });
const licences = entry => ({ [entry.licenceName]: { licence: entry.licence, status: entry.status, urls: [entry.url] } });
const registry = (entry = model()) => new BrowserModelRegistry(catalogue(entry), licences(entry));

test('each cleared production artifact has both exact pins and a same-origin execution path', () => {
  const actual = new BrowserModelRegistry();
  const cleared = [...actual.items.values()].filter(item => actual.ready(item.id));
  assert.deepEqual(cleared.map(item => item.id).sort(), ['face-detector-short', 'face-landmarker-478', 'hair-segmenter', 'selfie-multiclass']);
  for (const item of cleared) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0);
    const path = modelAssetPath(item);
    const base = 'https://beljour.example/';
    assert.equal(new URL(path, base).origin, new URL(base).origin);
    assert.equal(path, `/models/${item.sha256}/${item.filename}`);
    assert.equal(item.licence, 'Apache-2.0');
    assert.match(item.url, /^https:\/\/storage\.googleapis\.com\//, 'upstream provenance is retained');
  }
  assert.match(MODEL_RUNTIME.baseUrl, /^\/models\/runtime\/[a-f0-9]{64}$/);
  assert.equal(MODEL_RUNTIME.files.length, 5);
  for (const file of MODEL_RUNTIME.files) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.bytes > 0);
  }
});

test('pinning a bundle does not turn partial rights evidence into permission', async () => {
  const actual = new BrowserModelRegistry();
  let requests = 0;
  for (const id of ['pose-landmarker-lite']) {
    assert.match(actual.get(id).sha256, /^[a-f0-9]{64}$/);
    assert.ok(actual.get(id).bytes > 0);
    assert.equal(actual.ready(id), false);
    await assert.rejects(fetchVerifiedModel(id, actual, async () => { requests++; throw Error('network forbidden'); }), /pending/);
  }
  const migan = actual.get('migan-512-places2');
  assert.equal(migan.status, 'pending');
  assert.equal(migan.sha256, null);
  assert.equal(migan.bytes, null);
  assert.equal(requests, 0);
});

const provenance = JSON.parse(readFileSync(new URL('../../api/plumb_api/models/provenance.json', import.meta.url), 'utf8'));
const faceEvidence = () => structuredClone(provenance.models.find(item => item.id === 'face-landmarker-478'));
function requireFaceEvidence(record) {
  const actual = MODEL_CATALOG.models.find(item => item.id === record.id);
  assert.equal(actual.status, 'allowed');
  assert.equal(record.status, 'allowed');
  assert.equal(record.cardLicence, 'Apache-2.0');
  assert.equal(record.blocker, null);
  assert.equal(record.sourceGuide, 'https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker');
  assert.equal(record.guideArtifactUrl, actual.url.replace('/1/', '/latest/'));
  assert.equal(record.guideArtifactMatchesPin, true);
  assert.equal(record.guideArtifactSha256, actual.sha256);
  assert.equal(record.guideArtifactBytes, actual.bytes);
  assert.equal(actual.sha256, '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff');
  assert.equal(actual.bytes, 3758596);
  assert.deepEqual(record.modelCards, [
    'https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20%28Short%20Range%29.pdf',
    'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf',
    'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf',
  ]);
  assert.deepEqual(record.components.map(item => item.filename).sort(), [
    'face_blendshapes.tflite', 'face_detector.tflite', 'face_landmarks_detector.tflite',
    'geometry_pipeline_metadata_landmarks.binarypb',
  ]);
  const geometry = record.geometryMetadata;
  assert.equal(geometry.licence, 'Apache-2.0');
  assert.equal(geometry.sourceCommit, 'fd288e22e1b9fa5c2639dcd01129c15677630057');
  assert.equal(geometry.source.sha256, '55ca7c4c7bf195673b9d12a1b5d49d4b9c82b5ade8fed4b565496590866e359d');
  assert.equal(geometry.source.bytes, 117675);
  const base = `https://raw.githubusercontent.com/google-ai-edge/mediapipe/${geometry.sourceCommit}/`;
  assert.equal(geometry.source.url, base + 'mediapipe/modules/face_geometry/data/geometry_pipeline_metadata_landmarks.pbtxt');
  assert.equal(geometry.comparison.exactByteMatch, true);
  assert.equal(geometry.comparison.bytes, 19376);
  assert.equal(geometry.comparison.sha256, 'bdbcda96dfcb7da883da124aaa2c55dee49770d934f0fcc71747f8c21bdc75b4');
  assert.equal(geometry.offlineVerifier, 'scripts/audit_face_metadata.py');
  assert.deepEqual(geometry.schemaFiles.map(item => item.name).sort(), ['geometry_pipeline_metadata.proto', 'mesh_3d.proto']);
  for (const source of [...geometry.schemaFiles, geometry.build, geometry.encoderRule, geometry.licenceFile]) {
    assert.ok(source.url.startsWith(base), 'evidence source must use the immutable official commit');
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(source.bytes) && source.bytes > 0);
  }
  const mappedSources = {
    'face_detector.tflite': record.modelCards[0],
    'face_landmarks_detector.tflite': record.modelCards[1],
    'face_blendshapes.tflite': record.modelCards[2],
    'geometry_pipeline_metadata_landmarks.binarypb': geometry.source.url,
  };
  for (const component of record.components) {
    assert.equal(component.licence, 'Apache-2.0');
    assert.equal(component.rightsSource, mappedSources[component.filename]);
    assert.match(component.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(component.bytes) && component.bytes > 0);
  }
  const metadata = record.components.find(item => item.filename.endsWith('.binarypb'));
  assert.equal(metadata.sha256, geometry.comparison.sha256);
  assert.equal(metadata.bytes, geometry.comparison.bytes);
}

test('Face Landmarker clearance requires exact guide, component and reproducible metadata evidence', () => {
  requireFaceEvidence(faceEvidence());
});

test('missing or inconsistent bundle evidence fails even when the catalogue remains cleared', () => {
  for (const breakEvidence of [
    record => { record.guideArtifactMatchesPin = false; },
    record => { record.guideArtifactSha256 = 'f'.repeat(64); },
    record => { record.components.pop(); },
    record => { delete record.components[0].rightsSource; },
    record => { record.components[1].rightsSource = record.modelCards[0]; },
    record => { record.geometryMetadata.sourceCommit = 'master'; },
    record => { record.geometryMetadata.comparison.exactByteMatch = false; },
    record => { record.geometryMetadata.source.sha256 = '0'.repeat(64); },
    record => { delete record.geometryMetadata; },
  ]) {
    const record = faceEvidence(); breakEvidence(record);
    assert.throws(() => requireFaceEvidence(record));
  }
});

test('upstream URLs never enter fetch and every received byte is verified', async () => {
  const reg = registry();
  const calls = [];
  const loaded = await fetchVerifiedModel('synthetic-model', reg, async (url, init) => {
    calls.push({ url, init });
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(raw.subarray(0, 9));
      controller.enqueue(raw.subarray(9));
      controller.close();
    } }));
  });
  assert.deepEqual(loaded, raw);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, modelAssetPath(model()));
  assert.equal(calls[0].init.mode, 'same-origin');
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.redirect, 'error');
  const wrong = raw.slice(); wrong[0] ^= 1;
  await assert.rejects(fetchVerifiedModel('synthetic-model', reg, async () => new Response(wrong)), /sha256 mismatch/);
});

test('missing deployment assets are an explicit failure and never trigger a CDN fallback', async () => {
  const paths = [];
  await assert.rejects(fetchVerifiedModel('synthetic-model', registry(), async url => {
    paths.push(url); return new Response('missing', { status: 404 });
  }), /assets are not staged on this origin/);
  assert.deepEqual(paths, [modelAssetPath(model())]);
});

test('cancelled requests do not fetch and the stored manifest cannot mutate after validation', async () => {
  const reg = registry();
  assert.throws(() => { reg.get('synthetic-model').sha256 = '0'.repeat(64); }, TypeError);
  const cancellation = new AbortController(); cancellation.abort();
  let calls = 0;
  await assert.rejects(fetchVerifiedModel('synthetic-model', reg, async () => { calls++; return new Response(raw); }, cancellation.signal), /abort/i);
  assert.equal(calls, 0);
});

for (const filename of ['%2fsynthetic.tflite', '%2esynthetic.tflite', '..synthetic.tflite', 'a\\b.tflite']) {
  test(`unsafe filename cannot become a public model path: ${filename}`, () => {
    const entry = model({ filename, url: `https://storage.googleapis.com/mediapipe-models/1/${filename}` });
    assert.throws(() => registry(entry), /unapproved/);
    assert.throws(() => modelAssetPath(entry), /asset pin/);
  });
}

function fixture(t, pending = false) {
  const root = mkdtempSync(join(tmpdir(), 'beljour-model-stage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const entry = model(pending ? { status: 'pending' } : {});
  const runtimeBytes = [new TextEncoder().encode('synthetic SDK bytes'), new Uint8Array([11, 22, 33, 44])];
  const runtime = {
    format: 'beljour-model-runtime/1', name: 'Synthetic runtime fixture', version: 'test', licence: 'MIT', status: 'allowed',
    package: { url: 'https://registry.npmjs.org/synthetic-fixture/-/synthetic-fixture-1.tgz', sha256: 'a'.repeat(64), bytes: 100 },
    files: runtimeBytes.map((bytes, index) => ({ path: index ? 'wasm/test.wasm' : 'test.mjs', sha256: digest(bytes), bytes: bytes.length })),
  };
  const ledger = { policy: { allowed: ['MIT'] }, runtime: [
    { name: entry.licenceName, ...licences(entry)[entry.licenceName] },
    { name: runtime.name, licence: 'MIT', status: 'allowed', urls: [runtime.package.url], sha256: runtime.package.sha256, bytes: 100 },
  ] };
  const options = { sourceRoot: join(root, 'cache'), outputRoot: join(root, 'site'), catalogue: catalogue(entry), ledger, runtime };
  function write(path, data) { const file = join(options.sourceRoot, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, data); return file; }
  function stage() {
    const path = modelAssetPath(entry).slice('/models/'.length);
    write(path, raw);
    runtime.files.forEach((file, index) => write(`runtime/${runtime.package.sha256}/${file.path}`, runtimeBytes[index]));
    return path;
  }
  return { ...options, write, stage, entry };
}

test('an unstaged build publishes an honest empty availability manifest', t => {
  const options = fixture(t);
  const result = copyStagedModels(options);
  assert.deepEqual(result.models, []);
  assert.equal(result.runtime, null);
  assert.deepEqual(JSON.parse(readFileSync(join(options.outputRoot, 'availability.json'), 'utf8')), result);
});

test('staged synthetic model and complete runtime are verified before copying', t => {
  const options = fixture(t), path = options.stage();
  const result = copyStagedModels(options);
  assert.deepEqual(result.models, ['synthetic-model']);
  assert.equal(result.runtime, 'test');
  assert.deepEqual(new Uint8Array(readFileSync(join(options.outputRoot, path))), raw);
});

for (const corruption of ['model', 'runtime', 'size']) {
  test(`build rejects ${corruption} alteration before producing any output`, t => {
    const options = fixture(t), path = options.stage();
    if (corruption === 'runtime') options.write(`runtime/${options.runtime.package.sha256}/test.mjs`, new TextEncoder().encode('synthetic SDK bytex'));
    else { const changed = raw.slice(); changed[0] ^= 1; options.write(path, corruption === 'size' ? changed.subarray(1) : changed); }
    assert.throws(() => copyStagedModels(options), /mismatch/);
    assert.equal(existsSync(options.outputRoot), false);
  });
}

test('partial runtime and unknown staged files fail before any public copy', t => {
  const options = fixture(t);
  options.write(modelAssetPath(options.entry).slice('/models/'.length), raw);
  assert.throws(() => copyStagedModels(options), /Staging is incomplete/);
  options.write('unknown.tflite', raw);
  assert.throws(() => copyStagedModels(options), /Uncleared or unregistered/);
  assert.equal(existsSync(options.outputRoot), false);
});

test('even exact pending bytes cannot enter the deploy output', t => {
  const options = fixture(t, true); options.stage();
  assert.throws(() => copyStagedModels(options), /Uncleared or unregistered/);
  assert.equal(existsSync(options.outputRoot), false);
});

test('symbolic links cannot smuggle an unchecked staging path into the build', t => {
  const options = fixture(t), path = options.stage();
  const target = join(options.sourceRoot, path);
  const other = options.write('linked-source.bin', raw);
  rmSync(target); symlinkSync(other, target);
  assert.throws(() => copyStagedModels(options), /Linked/);
});

test('catalogue bytes and runtime paths do not claim operational detection without assets', () => {
  const availability = JSON.parse(readFileSync(new URL('../dist/models/availability.json', import.meta.url), 'utf8'));
  assert.equal(availability.format, 'beljour-staged-models/1');
  for (const id of availability.models) assert.equal(MODEL_CATALOG.models.find(model => model.id === id)?.status, 'allowed');
  const csp = readFileSync(new URL('../dist/_headers', import.meta.url), 'utf8');
  assert.doesNotMatch(csp, /cdn\.jsdelivr\.net|storage\.googleapis\.com/);
  assert.match(readFileSync(new URL('../dist/Apache-2.0.txt', import.meta.url), 'utf8'), /Apache License/);
});
