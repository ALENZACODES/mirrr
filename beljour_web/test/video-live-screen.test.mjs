// Video and live screen on synthetic frame sequences: a chosen clip is processed frame by
// frame on this device with injected decoding, measuring and recording; no network, no clip
// kept unless she ticks keep, coded message when the models are not available. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderVideoLive } from '../dist/js/screens/video-live.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { sequence } from './helpers/frames.mjs';

function environment() {
  const dom = installDOM(), previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Local screen attempted a network request'); };
  return { restore() { dom.restore(); globalThis.fetch = previous; } };
}

export function fakeDeps({ ready = true, n = 6, opts = {} } = {}) {
  opts = { ...opts };
  const { frames, inputs } = sequence(n, opts);
  const state = { pushed: 0, painted: [], saved: [], measured: 0, recorders: 0 };
  const deps = {
    async *frames() { for (const f of frames) yield f; },
    async measure(image) { const i = frames.findIndex((f) => f.image === image); state.measured++; return inputs[i]; },
    ready: () => ready,
    recorder() { state.recorders++; return { push() { state.pushed++; }, async finish() { return new Blob(['clip']); } }; },
    paint(image, label) { state.painted.push({ image, label }); const el = new Element('figure'); el.textContent = label; return el; },
    save(blob, name) { state.saved.push(name); const el = new Element('a'); el.textContent = 'Save the processed clip'; return el; },
    mirror() {
      return {
        async getCamera() { state.cameras = (state.cameras ?? 0) + 1; return { getTracks: () => [{ stop() { state.tracksStopped = (state.tracksStopped ?? 0) + 1; } }] }; },
        grab: () => frames[0].image, measure: async () => inputs[0], paint(image) { state.mirrorPaints = (state.mirrorPaints ?? 0) + 1; state.lastMirror = image; },
        schedule(cb) { state.tick = cb; return 1; }, cancel() {}, now: () => (state.now = (state.now ?? 0) + 0.1),
      };
    },
    async still() { return new Blob(['png']); },
  };
  return { deps, state, frames, inputs };
}

export function mount(deps) {
  const main = new Element('main'), ctx = { consent: true, go() {}, refreshPhotoPanel() {} };
  const dispose = renderVideoLive(main, ctx, deps);
  main.querySelector('#video-clip').files = [new Blob(['drawn'])];
  return { main, dispose };
}

test('a clip is processed frame by frame, the last frame shown, and nothing kept by default', async () => {
  const env = environment(); try {
    const { deps, state, frames } = fakeDeps();
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'retouch';
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.measured, frames.length);
    assert.equal(state.painted.length, 1);
    assert.equal(state.recorders, 0);
    assert.match(main.textContent, /Processed 6 frames on this device; nothing was uploaded/);
    assert.match(main.textContent, /No clip was kept/);
    assert.match(state.painted[0].label, /not medical advice/);
  } finally { env.restore(); }
});

test('ticking keep records the processed frames and offers them to save', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps();
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'retouch';
    main.querySelector('#video-keep').checked = true;
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.recorders, 1);
    assert.equal(state.pushed, 6);
    assert.deepEqual(state.saved, ['beljour-clip.webm']);
  } finally { env.restore(); }
});

test('without on-device models the screen says so and changes nothing', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps({ ready: false });
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'retouch';
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.measured, 0);
    assert.match(main.textContent, /not available in this browser yet. Nothing was changed/);
  } finally { env.restore(); }
});

test('the background change asks for the person outline and uses the chosen backdrop', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps();
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'background';
    main.querySelector('#video-backdrop').value = 'sauge';
    main.querySelector('#video-strength').value = '100';
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.painted.length, 1);
    assert.match(state.painted[0].label, /Background changed on this device/);
    const img = state.painted[0].image;
    assert.deepEqual(Array.from(img.data.slice(0, 3)), [158, 172, 150]);
  } finally { env.restore(); }
});

test('enhance needs no models and runs on every frame', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps({ ready: false });
    deps.ready = (needs) => !needs.face && !needs.person;
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'enhance';
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.painted.length, 1);
    assert.match(state.painted[0].label, /no detail is invented/);
    assert.match(main.textContent, /Processed 6 frames on this device/);
  } finally { env.restore(); }
});

test('a live filter runs on a clip with the chosen look and is labelled a simulation', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps();
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'ar_filter';
    main.querySelector('#video-filter').value = 'joues';
    await buttonNamed(main, 'Process this clip on this device').click();
    assert.equal(state.painted.length, 1);
    assert.match(state.painted[0].label, /Live filter: a local look with our own drawn layer. A simulation./);
  } finally { env.restore(); }
});

test('the reel editor finds two scenes, renders only the kept one and offers it to save', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps({ n: 10, opts: { cut: 5 } });
    const { main } = mount(deps);
    main.querySelector('#video-effect').value = 'enhance';
    await buttonNamed(main, 'Find the scenes in this clip').click();
    assert.match(main.textContent, /Found 2 scenes on this device/);
    const second = main.querySelector('#reel-scene-1');
    second.checked = false;
    await second.dispatch('change');
    main.querySelector('#video-keep').checked = true;
    await buttonNamed(main, 'Render the kept scenes').click();
    assert.match(main.textContent, /Rendered 5 frames from 1 scene on this device; nothing was uploaded/);
    assert.equal(state.pushed, 5);
    assert.deepEqual(state.saved, ['beljour-reel.webm']);
    main.querySelector('#reel-scene-0').checked = false;
    await main.querySelector('#reel-scene-0').dispatch('change');
    await buttonNamed(main, 'Render the kept scenes').click();
    assert.match(main.textContent, /nothing to render/);
  } finally { env.restore(); }
});

test('the live mirror stays off without camera consent, then runs, saves one frame and stops on withdrawal', async () => {
  const env = environment(); try {
    const { deps, state } = fakeDeps();
    const { main, dispose } = mount(deps);
    main.querySelector('#video-effect').value = 'enhance';
    await buttonNamed(main, 'Start the live mirror').click();
    assert.equal(state.cameras ?? 0, 0);
    assert.match(main.textContent, /Tick the camera agreement first. The camera stays off/);
    main.querySelector('#mirror-consent').checked = true;
    await buttonNamed(main, 'Start the live mirror').click();
    assert.equal(state.cameras, 1);
    assert.match(main.textContent, /not recorded or uploaded/);
    state.tick(); state.tick();
    assert.equal(state.mirrorPaints, 2);
    await buttonNamed(main, 'Save this frame').click();
    assert.deepEqual(state.saved, ['beljour-mirror.png']);
    const consent = main.querySelector('#mirror-consent');
    consent.checked = false;
    await consent.dispatch('change');
    assert.equal(state.tracksStopped, 1);
    assert.match(main.textContent, /Camera agreement withdrawn; the camera is off/);
    dispose();
  } finally { env.restore(); }
});
