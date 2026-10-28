// Lane D R24D: local-only app installation contract with mocked browser APIs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { InstallState } from '../dist/js/mobile/install-state.js';
import {
  isPublicShellCache,
  inspectPublicShellStorage,
  clearPublicShellStorage,
} from '../dist/js/mobile/install-storage.js';
import { createInstallController } from '../dist/js/mobile/install-controller.js';
import { mountInstallPage } from '../dist/js/mobile/install-page.js';
import { mountInstallEntry } from '../dist/js/mobile/install-entry.js';

const version = 'a'.repeat(24);
const ourCache = `beljour-public-shell-${version}`;

function events() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type, payload = {}) {
      for (const listener of listeners.get(type) ?? []) listener({ type, ...payload });
    },
    count(type) { return listeners.get(type)?.size ?? 0; },
  };
}

function fixture({ secure = true, worker = true, standalone = false } = {}) {
  const local = events();
  const swEvents = events();
  const regEvents = events();
  const posts = [];
  const registrations = [];
  const registered = {
    waiting: null,
    installing: null,
    active: { scriptURL: 'https://beljour.pages.dev/service-worker.js' },
    addEventListener: regEvents.addEventListener,
    removeEventListener: regEvents.removeEventListener,
  };
  const workerContainer = {
    async register(url, options) {
      registrations.push([url, options]);
      return registered;
    },
    async getRegistration() { return registered; },
    addEventListener: swEvents.addEventListener,
    removeEventListener: swEvents.removeEventListener,
  };
  const removed = [];
  const keys = ['unrelated-private-cache', ourCache, 'beljour-public-shell-not-a-hash'];
  const caches = {
    async keys() { return keys.slice(); },
    async delete(key) {
      removed.push(key);
      const index = keys.indexOf(key);
      if (index !== -1) keys.splice(index, 1);
      return index !== -1;
    },
  };
  const port = {
    capabilities: { secure, worker, standalone },
    workers: worker ? workerContainer : null,
    caches,
    storage: { async estimate() { return { usage: 12345, quota: 900000 }; } },
    onLine: () => true,
    addEventListener: local.addEventListener,
    removeEventListener: local.removeEventListener,
  };
  return { port, local, swEvents, regEvents, registered, posts, registrations, removed, keys };
}

function fakeWindow(hash = '#home') {
  const listeners = events();
  const win = {
    location: { hash },
    navigator: { serviceWorker: null, onLine: true, storage: null },
    caches: null,
    isSecureContext: true,
    matchMedia: () => ({ matches: false }),
    addEventListener: listeners.addEventListener,
    removeEventListener: listeners.removeEventListener,
    fire: listeners.emit,
    count: listeners.count,
  };
  return win;
}

test('PWA state cannot claim success from an install prompt or offline registration', () => {
  const state = new InstallState({ secure: true, worker: true, standalone: false });
  assert.equal(state.snapshot.offline, 'available');
  assert.equal(state.snapshot.install, 'browser-menu');
  assert.equal(state.snapshot.verifiedOffline, false);
  assert.equal(state.snapshot.updateWaiting, false);
  assert.throws(() => state.promptStarted(), RangeError);
  state.promptAvailable();
  state.promptStarted();
  state.promptChoice(true);
  assert.equal(state.snapshot.install, 'accepted');
  assert.equal(state.snapshot.verifiedOffline, false);
  state.installed();
  assert.equal(state.snapshot.install, 'installed');
  state.setOffline('ready');
  assert.equal(state.snapshot.offline, 'ready');
  state.dispose();
});

test('insecure and unsupported browsers never enable offline', () => {
  const state = new InstallState({ secure: false, worker: true, standalone: false });
  state.setOffline('enabling');
  assert.equal(state.snapshot.offline, 'unsupported');
  assert.equal(state.snapshot.install, 'unsupported');
  const other = new InstallState({ secure: true, worker: false, standalone: false });
  other.setOffline('ready');
  assert.equal(other.snapshot.offline, 'unsupported');
  state.dispose();
  other.dispose();
});

test('storage only deletes exact shell cache versions, not unrelated app data', async () => {
  const found = fixture();
  assert.ok(isPublicShellCache(ourCache));
  for (const input of ['beljour-public-shell-hi', 'some-app', 'beljour-public-shell-' + 'x'.repeat(24), null]) {
    assert.equal(isPublicShellCache(input), false);
  }
  const before = await inspectPublicShellStorage(found.port.caches, found.port.storage, true);
  assert.equal(before.cacheVersions, 1);
  assert.equal(before.siteUsageBytes, 12345);
  assert.equal(before.siteQuotaBytes, 900000);
  assert.equal(before.pageIsOffline, false);
  assert.match(before.message, /include other browser data/);
  assert.equal(await clearPublicShellStorage(found.port.caches), 1);
  assert.deepEqual(found.removed, [ourCache]);
  assert.ok(found.keys.includes('unrelated-private-cache'));
  assert.equal(await clearPublicShellStorage(found.port.caches), 0);
  const unknown = await inspectPublicShellStorage(null, {
    async estimate() { throw Error('blocked'); },
  }, null);
  assert.equal(unknown.siteUsageBytes, null);
  assert.equal(unknown.pageIsOffline, null);
});

test('service worker registers only after explicit visitor action', async () => {
  const app = fixture();
  const controller = createInstallController(app.port);
  assert.deepEqual(app.registrations, []);
  assert.equal(app.local.count('beforeinstallprompt'), 1);
  await controller.enableOffline();
  assert.deepEqual(app.registrations, [['/service-worker.js', { scope: '/' }]]);
  assert.equal(controller.state.snapshot.offline, 'ready');
  assert.equal(controller.state.snapshot.verifiedOffline, false);
  assert.equal(app.regEvents.count('updatefound'), 1);
  const storage = await controller.inspectStorage();
  assert.equal(storage.cacheVersions, 1);
  await controller.clearCache();
  assert.deepEqual(app.removed, [ourCache]);
  controller.dispose();
  assert.equal(app.local.count('beforeinstallprompt'), 0);
  assert.equal(app.swEvents.count('controllerchange'), 0);
  assert.equal(app.regEvents.count('updatefound'), 0);
});

test('prompt dismissal and acceptance are truthful and do not make network calls', async () => {
  const app = fixture();
  const controller = createInstallController(app.port);
  let prevented = 0;
  let prompts = 0;
  const event = {
    preventDefault() { prevented += 1; },
    async prompt() { prompts += 1; },
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  };
  app.local.emit('beforeinstallprompt', event);
  assert.equal(prevented, 1);
  assert.equal(controller.state.snapshot.install, 'prompt-ready');
  await controller.requestInstall();
  assert.equal(prompts, 1);
  assert.equal(controller.state.snapshot.install, 'dismissed');
  app.local.emit('beforeinstallprompt', { ...event, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  await controller.requestInstall();
  assert.equal(controller.state.snapshot.install, 'accepted');
  app.local.emit('appinstalled');
  assert.equal(controller.state.snapshot.install, 'installed');
  controller.dispose();
});

test('a waiting update requires saved-work confirmation and never reloads a page', async () => {
  const app = fixture();
  const controller = createInstallController(app.port);
  await controller.enableOffline();
  assert.equal(controller.applyUpdate(), false);
  app.registered.waiting = {
    scriptURL: 'https://beljour.pages.dev/service-worker.js',
    postMessage(value) { app.posts.push(value); },
  };
  app.regEvents.emit('updatefound');
  assert.equal(controller.state.snapshot.updateWaiting, true);
  assert.equal(controller.applyUpdate(), false);
  controller.confirmSavedWork(false);
  assert.equal(controller.applyUpdate(), false);
  controller.confirmSavedWork(true);
  assert.equal(controller.applyUpdate(), true);
  assert.deepEqual(app.posts, [{ type: 'BELJOUR_ACTIVATE_AFTER_SAVE' }]);
  assert.equal(controller.state.snapshot.updateWaiting, false);
  assert.equal(controller.state.snapshot.updateAcknowledged, false);
  assert.equal(controller.applyUpdate(), false);
  controller.dispose();
});

test('failures remain local and avoid false install or offline claims', async () => {
  const app = fixture();
  app.port.workers.register = async () => { throw Error('offline registration refused'); };
  const controller = createInstallController(app.port);
  await controller.enableOffline();
  assert.equal(controller.state.snapshot.offline, 'error');
  assert.equal(controller.state.snapshot.errorCode, 'registration');
  let prevented = 0;
  app.local.emit('beforeinstallprompt', {
    preventDefault() { prevented += 1; },
    async prompt() { throw Error('browser denied'); },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  await controller.requestInstall();
  assert.equal(prevented, 1);
  assert.equal(controller.state.snapshot.errorCode, 'prompt');
  assert.equal(controller.state.snapshot.install, 'browser-menu');
  controller.dispose();
});

test('install page enables offline only by clicking and supports error, storage and teardown', async () => {
  const dom = installDOM();
  const host = dom.document.createElement('section');
  dom.root.append(host);
  try {
    const app = fixture();
    const controller = createInstallController(app.port);
    const panel = mountInstallPage(dom.document, host, controller);
    assert.match(host.textContent, /No photo or recipe is cached/);
    assert.equal(app.registrations.length, 0);
    assert.equal(buttonNamed(host, 'Use browser install prompt').disabled, true);
    assert.equal(buttonNamed(host, 'Allow waiting update').disabled, true);
    await buttonNamed(host, 'Enable public offline shell').click();
    // Microtask callbacks may update status after fake DOM click completes.
    await Promise.resolve();
    assert.equal(app.registrations.length, 1);
    assert.match(host.textContent, /registration accepted/i);
    assert.equal(buttonNamed(host, 'Clear public-shell cache').disabled, true);
    const check = host.querySelector('#lg-install-clear-confirm');
    check.checked = true;
    await check.dispatch('change');
    await buttonNamed(host, 'Clear public-shell cache').click();
    await Promise.resolve();
    assert.deepEqual(app.removed, [ourCache]);
    panel.destroy();
    assert.equal(host.children.length, 0);
    controller.dispose();
  } finally { dom.restore(); }
});

test('install entry never installs on route load and cleans event listeners', () => {
  const dom = installDOM();
  try {
    const target = dom.document.createElement('section');
    target.id = 'lg-install-root';
    dom.root.append(target);
    const win = fakeWindow('#home');
    const entry = mountInstallEntry(dom.document, win);
    assert.equal(entry.active(), false);
    win.location.hash = '#install';
    win.fire('hashchange');
    assert.equal(entry.active(), true);
    assert.ok(dom.root.dataset.installActive);
    assert.match(target.textContent, /optional browser installation/i);
    win.location.hash = '#home';
    win.fire('hashchange');
    assert.equal(entry.active(), false);
    entry.destroy();
    assert.equal(win.count('beforeinstallprompt'), 0);
    assert.equal(win.count('hashchange'), 0);
    assert.equal(win.count('pagehide'), 0);
  } finally { dom.restore(); }
});

test('new install controls do not register workers eagerly or make direct fetch calls', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const files = [
    '../src/mobile/install-state.ts',
    '../src/mobile/install-storage.ts',
    '../src/mobile/install-controller.ts',
    '../src/mobile/install-page.ts',
    '../src/mobile/install-entry.ts',
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /\bfetch\s*\(/, file);
    assert.doesNotMatch(source, /XMLHttpRequest|localStorage|sessionStorage/, file);
  }
  const controller = read('../src/mobile/install-controller.ts');
  assert.match(controller, /register\("\/service-worker\.js"/);
  assert.match(controller, /async enableOffline/);
  assert.match(read('../home.html'), /href="#install"/);
  assert.match(read('../src/layout/entries.ts'), /mountInstallEntry/);
});
