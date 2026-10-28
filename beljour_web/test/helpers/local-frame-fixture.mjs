/** Deterministic, fully drawn-only cached-preview fixture. Author: John Khan. */
import { ContinuousDemoState } from '../../dist/js/layout/continuous/state.js';
import { FRAME_HEIGHT, FRAME_WIDTH } from '../../dist/js/layout/continuous/frame-cache-contract.js';

export function drawnState() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  for (const name of ['local', 'hair', 'face', 'mock']) state.setPermission(name, true);
  return state;
}

export function pixels(id = 'hair', tone = 71) {
  const rgba = new Uint8ClampedArray(FRAME_WIDTH * FRAME_HEIGHT * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = tone;
    rgba[i + 1] = tone;
    rgba[i + 2] = tone;
    rgba[i + 3] = 255;
  }
  return {
    id, width: FRAME_WIDTH, height: FRAME_HEIGHT, rgba,
    provenance: 'local-rendered-illustration', providerVerified: false, unitsSpent: 0,
  };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
