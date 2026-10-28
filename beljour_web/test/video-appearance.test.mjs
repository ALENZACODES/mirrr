// #72 Video age and gender on synthetic frame sequences (test/helpers/frames.mjs): every frame
// equals the still engines on the smoothed points, changes stay in the face areas with alpha
// kept, the One Euro smoothing measurably steadies the face points that drive each frame, faceless frames
// and strength 0 pass through, and the screen offers it with its label. No camera, file or
// network. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processSequence, NO_INPUTS } from '../dist/js/reel/live/frames.js';
import { VideoAppearance, appearanceLayers, APPEARANCE_MODES, LABEL } from '../dist/js/reel/live/appearance.js';
import { effectChoice } from '../dist/js/reel/live/effects.js';
import { renderLayers } from '../dist/js/ui/shell/pipeline.js';
import { appearanceStackReport } from '../dist/js/ui/shell/appearance-stack.js';
import { sequence } from './helpers/frames.mjs';

const fetchTrap = () => { const previous = globalThis.fetch; globalThis.fetch = () => { throw new Error('network used'); }; return () => { globalThis.fetch = previous; }; };
const alphaKept = (a, b) => { for (let i = 3; i < a.data.length; i += 4) if (a.data[i] !== b.data[i]) return false; return true; };
const source = (frame, face) => ({ id: 'video-frame', label: 'Video frame', kind: 'uploaded', image: frame.image, face, disposable: true });

for (const mode of APPEARANCE_MODES.map((m) => m.id)) {
  test(`#72 ${mode}: each frame is the still engines on the smoothed points, inside the face, alpha kept`, async () => {
    const restore = fetchTrap(); try {
      const { frames, inputs } = sequence(4);
      const effect = new VideoAppearance({ mode });
      await processSequence(frames, effect, (_, i) => inputs[i], (out, frame) => {
        assert.ok(out.changed, 'the appearance changes the face');
        assert.ok(alphaKept(out.image, frame.image));
        const layers = appearanceLayers({ mode }, 70), still = renderLayers(source(frame, effect.lastPoints), layers).image;
        for (let i = 0; i < still.width * still.height; i++) for (let k = 0; k < 3; k++) {
          assert.equal(out.image.data[i * 4 + k], still.data[i * 3 + k], 'same pixels as the still engines on the smoothed points');
        }
        const check = appearanceStackReport(source(frame, effect.lastPoints), layers, out.image);
        assert.ok(check.passed && check.changedOutside === 0 && !check.lightened);
      }, 70);
    } finally { restore(); }
  });
}

test('#72 the effect steadies the face points that drive each frame (One Euro)', () => {
  const { frames, inputs } = sequence(10, { drift: 0, jitter: 2 });
  const deviation = (smoothed) => {
    const effect = new VideoAppearance({ mode: 'gender', slider: 66 });
    let total = 0;
    frames.forEach((frame, i) => {
      effect.apply(frame, inputs[i], 0);
      if (i >= 4) for (let k = 0; k < 478; k += 5) total += Math.hypot(effect.lastPoints[k][0] - inputs[i].truth[k][0], effect.lastPoints[k][1] - inputs[i].truth[k][1]);
      if (!smoothed) effect.reset();
    });
    return total;
  };
  const steady = deviation(true), raw = deviation(false);
  assert.ok(steady < raw * 0.7, `points off the true face: smoothed ${steady} vs raw ${raw}`);
});

test('#72 frames without a face and strength 0 pass through unchanged', async () => {
  const { frames, inputs } = sequence(3);
  const blank = await processSequence(frames, new VideoAppearance({ mode: 'gender' }), () => NO_INPUTS, (out, frame) => {
    assert.deepEqual(out.image.data, frame.image.data);
  }, 70);
  assert.equal(blank.changed, 0); assert.match(blank.notes[0], /No face/);
  const zero = await processSequence(frames, new VideoAppearance({ mode: 'older' }), (_, i) => inputs[i], (out, frame) => {
    assert.deepEqual(out.image.data, frame.image.data);
  }, 0);
  assert.equal(zero.changed, 0);
});

test('#72 is offered on the Video and live screen as a labelled simulation and refuses bad settings', () => {
  const choice = effectChoice('appearance');
  assert.equal(choice.needsFace, true);
  const made = choice.make({ appearance: 'younger' });
  assert.equal(made.label, LABEL); assert.match(LABEL, /simulation/); assert.match(LABEL, /Not a prediction of age, sex or gender identity/);
  assert.throws(() => new VideoAppearance({ mode: 'teen' }), /unknown video appearance/);
  assert.throws(() => new VideoAppearance({ mode: 'gender', slider: 150 }), /-100 to 100/);
  assert.deepEqual(appearanceLayers({ mode: 'gender_younger', stop: 5 }, 60).map((l) => [l.kind, l.parameters]), [['gender', { slider: 33 }], ['younger', { stop: 3 }]]);
});
