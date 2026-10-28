// Service worker contract evaluated in a VM with synthetic public bytes only.
// No browser install or live network is claimed. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { OfflineInstaller } from '../dist/js/offline/install.js';

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');
const origin = 'https://offline.example.test';
function harness(options = {}) {
  const files = new Map([['/studio.html', '<html>Synthetic shell</html>'], ['/js/main.js', 'export const local = true;']]);
  const inventory = { version: 'a'.repeat(24), assets: [...files].map(([path, text]) => ({ path, bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') })) };
  const handlers = new Map(), stores = new Map(), calls = [], deleted = [];
  let activations = 0;
  const self = { BELJOUR_OFFLINE: options.inventory ?? inventory, location: { origin },
    addEventListener(type, fn) { handlers.set(type, fn); },
    clients: { async get(id) { return id === 'editor' ? { type: 'window', url: origin + '/studio.html' } : { type: 'window', url: 'https://outside.example/studio.html' }; } },
    async skipWaiting() { activations++; } };
  const caches = { async keys() { return [...stores.keys()]; }, async delete(name) { deleted.push(name); return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map()); const rows = stores.get(name);
      return { async put(key, response) { rows.set(String(key), response.clone()); }, async match(key) { return rows.get(String(key))?.clone(); } };
    } };
  const fetch = async (request) => {
    calls.push(request); const pathname = new URL(request.url).pathname;
    return new Response(options.corrupt ? 'tampered' : files.get(pathname) ?? 'missing', { status: files.has(pathname) ? 200 : 404 });
  };
  runInNewContext(source, { self, caches, fetch, Request, Response, URL, Map, Uint8Array, crypto: webcrypto, importScripts(path) { assert.equal(path, '/offline-manifest.js'); } });
  async function event(type, extra = {}) {
    const work = []; let response;
    handlers.get(type)({ ...extra, waitUntil(promise) { work.push(promise); }, respondWith(promise) { response = promise; } });
    await Promise.all(work); return response ? await response : undefined;
  }
  return { event, calls, deleted, stores, inventory, get activations() { return activations; } };
}

test('offline install verifies bytes and caches only approved public assets without credentials', async () => {
  const h = harness(); await h.event('install');
  assert.equal(h.stores.size, 1); assert.equal([...h.stores.values()][0].size, 2);
  assert.ok(h.calls.every(request => request.credentials === 'omit' && request.redirect === 'error'));
  assert.equal(h.activations, 0, 'installation does not replace the active editor');
  const response = await h.event('fetch', { request: new Request(origin + '/studio.html') });
  assert.match(await response.text(), /Synthetic shell/); assert.equal(h.calls.length, 2, 'offline hit makes no request');
});
test('a changed asset hash fails install and removes the incomplete new cache', async () => {
  const h = harness({ corrupt: true }); await assert.rejects(h.event('install'), /size differs|hash differs/);
  assert.equal(h.stores.size, 0); assert.equal(h.deleted.length, 1); assert.equal(h.activations, 0);
});
test('API calls, photos, model bytes, external origins, queries and non-GET requests bypass the cache', async () => {
  const h = harness(); await h.event('install');
  const requests = ['/api/photos/a.jpg', '/models/face.task', '/photos/p.jpg', '/studio.html?photo=secret', '/js/main.js?token=secret', 'https://external.test/studio.html']
    .map(path => new Request(path.startsWith('https:') ? path : origin + path));
  requests.push(new Request(origin + '/studio.html', { method: 'POST', body: 'private' }),
    new Request(origin + '/studio.html', { headers: { Authorization: 'private' } }),
    new Request(origin + '/studio.html', { headers: { Range: 'bytes=0-10' } }));
  for (const request of requests) assert.equal(await h.event('fetch', { request }), undefined);
  assert.equal(h.calls.length, 2); assert.equal([...h.stores.values()][0].size, 2);
});
test('activation touches only this app caches and never claims existing clients', async () => {
  const h = harness(); await h.event('install');
  h.stores.set('beljour-public-shell-old', new Map()); h.stores.set('another-app-private', new Map());
  await h.event('activate'); assert.deepEqual(h.deleted, ['beljour-public-shell-old']);
  assert.ok(h.stores.has('another-app-private')); assert.equal(h.activations, 0);
});
test('only an explicit message from a same-origin editor can activate a waiting update', async () => {
  const h = harness();
  for (const extra of [{ data: { type: 'skipWaiting' }, source: { id: 'editor' } },
    { data: { type: 'BELJOUR_ACTIVATE_AFTER_SAVE' } },
    { data: { type: 'BELJOUR_ACTIVATE_AFTER_SAVE' }, source: { id: 'external' } }]) await h.event('message', extra);
  assert.equal(h.activations, 0);
  await h.event('message', { data: { type: 'BELJOUR_ACTIVATE_AFTER_SAVE' }, source: { id: 'editor' } });
  assert.equal(h.activations, 1);
});
test('malformed inventories cannot add user-data or model paths to the cache', () => {
  for (const path of ['/api/photo.js', '/models/model.js', '/photos/private.jpeg', '/../secret.js', 'https://external.test/x.js']) {
    const inventory = { version: 'a'.repeat(24), assets: [{ path, bytes: 1, sha256: 'b'.repeat(64) }] };
    assert.throws(() => harness({ inventory }), /Unsafe offline asset/);
  }
});
test('registration requires enable and concurrent install clicks reuse the same promise', async () => {
  let resolve, calls = 0;
  const host = { register(path, options) { calls++; assert.equal(path, '/service-worker.js'); assert.equal(options.updateViaCache, 'none'); return new Promise(done => { resolve = done; }); } };
  const installer = new OfflineInstaller(host); assert.equal(calls, 0);
  const first = installer.enable(), second = installer.enable(); assert.equal(first, second); assert.equal(calls, 1);
  resolve({ waiting: null, active: {} }); assert.equal(await first, 'ready');
});
test('an active edit blocks an update and update acceptance never reloads the page', async () => {
  const messages = []; const installer = new OfflineInstaller({ async register() { return { waiting: { postMessage: message => messages.push(message) } }; } });
  assert.equal(await installer.enable(), 'update_waiting'); assert.equal(installer.applyUpdate(true), 'save_first'); assert.equal(messages.length, 0);
  assert.equal(installer.applyUpdate(false), 'applied'); assert.deepEqual(messages, [{ type: 'BELJOUR_ACTIVATE_AFTER_SAVE' }]);
});
test('failed or unsupported install remains an optional feature', async () => {
  const unavailable = new OfflineInstaller(null); assert.equal(await unavailable.enable(), 'unsupported'); assert.equal(unavailable.applyUpdate(false), 'no_update');
  const denied = new OfflineInstaller({ async register() { throw new Error('denied'); } }); assert.equal(await denied.enable(), 'failed');
});
test('the built manifest is a deterministic inventory of actual public bytes with an original tricolour icon', () => {
  const context = { self: {} }; runInNewContext(readFileSync(new URL('../dist/offline-manifest.js', import.meta.url), 'utf8'), context);
  const inventory = context.self.BELJOUR_OFFLINE; assert.ok(inventory.assets.length > 20);
  for (const row of inventory.assets) {
    assert.doesNotMatch(row.path, /\/models\/|\/api\/|\.map$|\.task$|\.tflite$/);
    const bytes = readFileSync(new URL('../dist' + row.path, import.meta.url));
    assert.equal(bytes.length, row.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256);
  }
  const manifest = JSON.parse(readFileSync(new URL('../dist/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.start_url, '/studio.html'); assert.equal(manifest.display, 'standalone');
  const icon = readFileSync(new URL('../dist/icons/beljour.svg', import.meta.url), 'utf8');
  for (const colour of ['#000091', '#FFFFFF', '#E1000F']) assert.ok(icon.includes(colour));
  assert.ok(existsSync(new URL('../dist/service-worker.js', import.meta.url)));
});
