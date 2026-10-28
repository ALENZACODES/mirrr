/** Repeat model/runtime integrity checks at the final browser distribution boundary.
 * No downloads, model imports, or execution. Missing staging keeps manual mode.
 * Author: John Khan.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { BrowserModelRegistry, modelAssetPath } from '../dist/js/vision/model-registry.js';

const DIGEST = /^[a-f0-9]{64}$/;
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const LIMIT = 120 * 1024 * 1024;

function safePath(value) {
  if (typeof value !== 'string' || !value || value.split('/').some(part => !SEGMENT.test(part) || part === '.' || part === '..')) {
    throw new Error('Staged asset has an unsafe path');
  }
  return value;
}

function checkPin(pin) {
  if (!DIGEST.test(pin.sha256) || !Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || pin.bytes > LIMIT) {
    throw new Error('Staged asset needs an exact digest and byte size');
  }
}

function listFiles(root, directory = root) {
  if (lstatSync(directory).isSymbolicLink()) throw new Error('Linked staged asset directory is forbidden');
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Linked staged asset is forbidden');
    if (entry.isDirectory()) files.push(...listFiles(root, path));
    else if (entry.isFile()) files.push(relative(root, path).split(sep).join('/'));
    else throw new Error('Staged assets must be ordinary files');
  }
  return files;
}

/** Only pinned allowed files are copied; optional assets may remain unstaged.
 * If any MediaPipe asset is present, its complete SDK/WASM release is required.
 * All checks finish before the first destination file is created.
 */
export function copyStagedModels({ sourceRoot, outputRoot, catalogue, ledger, runtime }) {
  const licences = Object.fromEntries(ledger.runtime.map(entry => [entry.name, entry]));
  const registry = new BrowserModelRegistry(catalogue, licences);
  const runtimeLedger = licences[runtime.name];
  if (runtime.format !== 'beljour-model-runtime/1' || runtime.status !== 'allowed' ||
      runtimeLedger?.status !== 'allowed' || runtimeLedger.licence !== runtime.licence ||
      !ledger.policy.allowed.includes(runtime.licence) || runtimeLedger.sha256 !== runtime.package.sha256 ||
      runtimeLedger.bytes !== runtime.package.bytes || !runtimeLedger.urls.includes(runtime.package.url)) {
    throw new Error('Browser runtime is not cleared by the exact licence ledger');
  }
  checkPin(runtime.package);
  if (!Array.isArray(runtime.files) || runtime.files.length < 1 || runtime.files.length > 16) {
    throw new Error('Browser runtime requires a bounded file list');
  }
  const pins = new Map();
  for (const item of registry.items.values()) {
    if (!registry.ready(item.id)) continue;
    pins.set(modelAssetPath(item).slice('/models/'.length), { ...item, modelId: item.id });
  }
  const runtimePaths = [];
  for (const file of runtime.files) {
    checkPin(file);
    const path = `runtime/${runtime.package.sha256}/${safePath(file.path)}`;
    if (pins.has(path)) throw new Error('Duplicate runtime file');
    pins.set(path, file);
    runtimePaths.push(path);
  }
  const files = existsSync(sourceRoot) ? listFiles(sourceRoot) : [];
  const selected = [];
  for (const path of files) {
    const pin = pins.get(safePath(path));
    if (!pin) throw new Error(`Uncleared or unregistered staged asset: ${path}`);
    const source = join(sourceRoot, path);
    if (lstatSync(source).size !== pin.bytes) throw new Error(`Staged asset length mismatch: ${path}`);
    const bytes = readFileSync(source);
    if (createHash('sha256').update(bytes).digest('hex') !== pin.sha256) throw new Error(`Staged asset SHA-256 mismatch: ${path}`);
    selected.push({ path, pin });
  }
  if (files.length && runtimePaths.some(path => !files.includes(path))) {
    throw new Error('Staging is incomplete: every pinned SDK/WASM file is required');
  }
  for (const { path } of selected) {
    const output = join(outputRoot, path);
    mkdirSync(dirname(output), { recursive: true });
    copyFileSync(join(sourceRoot, path), output);
  }
  const availability = {
    format: 'beljour-staged-models/1',
    models: selected.filter(({ pin }) => pin.modelId).map(({ pin }) => pin.modelId),
    runtime: files.length ? runtime.version : null,
  };
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(join(outputRoot, 'availability.json'), JSON.stringify(availability, null, 2) + '\n');
  return availability;
}

export function copyConfiguredModels() {
  const read = path => JSON.parse(readFileSync(path, 'utf8'));
  return copyStagedModels({
    sourceRoot: 'models', outputRoot: 'dist/models',
    catalogue: read('../api/plumb_api/models/catalog.json'),
    ledger: read('../licences.json'), runtime: read('../api/plumb_api/models/runtime.json'),
  });
}
