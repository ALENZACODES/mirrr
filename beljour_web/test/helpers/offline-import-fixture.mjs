/** Drawn-only fixtures for local-file replay. Author: John Khan. */
import { createHash } from 'node:crypto';
import { syntheticPng } from './synthetic-png.mjs';
import { ContinuousDemoState } from '../../dist/js/layout/continuous/state.js';
import { OfflineImportController } from '../../dist/js/layout/continuous/offline-import-controller.js';

export async function localPng(width = 8, height = 8) {
  return syntheticPng(width, height);
}

export function localDigest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function localManifest(png, changes = {}) {
  const bytes = new Uint8Array(await png.arrayBuffer());
  const data = {
    format: 'beljour-local-png-replay/1',
    family: 'hair',
    mediaType: 'image/png',
    width: 8,
    height: 8,
    size: png.size,
    sha256: localDigest(bytes),
    source: 'operator-supplied-unverified',
    scene: 'drawn-pair',
    providerVerified: false,
    realFaceTested: false,
    unitsSpentByViewer: 0,
    ...changes,
  };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

export function localState() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  for (const key of ['local', 'hair', 'face', 'mock']) {
    state.setPermission(key, true);
  }
  return state;
}

export function localController(state = localState(), options = {}) {
  const urls = [];
  const revoked = [];
  const announcements = [];
  let counter = 0;
  const controller = new OfflineImportController({
    current: () => ({ state: state.snapshot, drawn: options.drawn ?? true }),
    onChange: () => { announcements.push('updated'); },
    digest: options.digest ?? {
      digest: async bytes => localDigest(bytes),
    },
    urls: options.urls ?? {
      create() {
        const url = `blob:local-replay-${++counter}`;
        urls.push(url);
        return url;
      },
      revoke(url) { revoked.push(url); },
    },
  });
  return { state, controller, urls, revoked, announcements, dispose() {
    controller.dispose();
    state.dispose();
  } };
}

export async function localFiles(changes = {}) {
  const png = await localPng();
  const manifest = await localManifest(png, changes);
  return { png, manifest };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
