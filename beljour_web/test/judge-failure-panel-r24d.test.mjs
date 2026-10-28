import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeFailureReplay, MOCK_FAILURE_CASES } from '../dist/js/layout/judge-failure-replay.js';
import { renderJudgeFailurePanel } from '../dist/js/ui/shell/judge-failure-panel.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

function renderCase() {
  const app = judgeDOM();
  const replay = new JudgeFailureReplay();
  const operations = [];
  const actions = {
    simulate(id) { operations.push(['simulate', id]); replay.simulate(id); },
    acknowledge() { operations.push(['acknowledge']); replay.acknowledge(); },
    reset() { operations.push(['reset']); replay.reset(); },
  };
  renderJudgeFailurePanel(app.document, app.host, replay, actions);
  return { app, replay, operations, actions };
}

test('failure simulation is visibly optional and has no automatic action', () => {
  const { app, replay } = renderCase();
  try {
    assert.match(app.host.textContent, /optional/i);
    assert.match(app.host.textContent, /fictional failure cases/);
    assert.equal(replay.snapshot().phase, 'idle');
    assert.equal(app.host.querySelectorAll('button').length, MOCK_FAILURE_CASES.length + 2);
    assert.equal(control(app.host, 'failure-acknowledge').disabled, true);
  } finally { replay.dispose(); app.close(); }
});

test('every failure scenario is exposed through an accessible action', () => {
  const { app, replay } = renderCase();
  try {
    for (const scenario of MOCK_FAILURE_CASES) {
      const button = control(app.host, `failure-${scenario.id}`);
      assert.ok(button, `Missing ${scenario.id}`);
      assert.equal(button.type, 'button');
      assert.equal(button.textContent, scenario.label);
    }
  } finally { replay.dispose(); app.close(); }
});

test('simulation action is forwarded once without a provider call or state mutation', async () => {
  const { app, replay, operations } = renderCase();
  try {
    await control(app.host, 'failure-offline').click();
    assert.deepEqual(operations, [['simulate', 'offline']]);
    assert.equal(replay.snapshot().requestsSent, 0);
    assert.equal(replay.snapshot().preservesOriginal, true);
  } finally { replay.dispose(); app.close(); }
});

test('the refusal panel describes the exact selected failure without claiming a live result', () => {
  const app = judgeDOM();
  const replay = new JudgeFailureReplay();
  replay.simulate('bad-response');
  try {
    renderJudgeFailurePanel(app.document, app.host, replay, {
      simulate: () => {}, acknowledge: () => {}, reset: () => {},
    });
    const summary = app.host.querySelector('details');
    assert.equal(summary.open, true);
    assert.match(app.host.textContent, /proposed output cannot be displayed/);
    assert.match(app.host.textContent, /Simulated requests: 0/);
    assert.match(app.host.textContent, /Provider result verified: no/);
    assert.equal(control(app.host, 'failure-acknowledge').disabled, false);
  } finally { replay.dispose(); app.close(); }
});

test('ready-to-retry only enables clearing an illustration, not a network request', () => {
  const app = judgeDOM();
  const replay = new JudgeFailureReplay();
  replay.simulate('timeout');
  replay.acknowledge();
  try {
    renderJudgeFailurePanel(app.document, app.host, replay, {
      simulate: () => {}, acknowledge: () => {}, reset: () => {},
    });
    assert.match(app.host.textContent, /No provider retry occurred/);
    assert.equal(control(app.host, 'failure-acknowledge').disabled, true);
    assert.equal(control(app.host, 'failure-reset').disabled, false);
  } finally { replay.dispose(); app.close(); }
});

test('after reset, the error result remains a local-only empty illustration', () => {
  const app = judgeDOM();
  const replay = new JudgeFailureReplay();
  replay.simulate('unit-limit');
  replay.reset();
  try {
    renderJudgeFailurePanel(app.document, app.host, replay, {
      simulate: () => {}, acknowledge: () => {}, reset: () => {},
    });
    assert.equal(app.host.querySelector('details').open, false);
    assert.equal(control(app.host, 'failure-reset').disabled, true);
    assert.doesNotMatch(app.host.textContent, /Simulated requests: 0/);
  } finally { replay.dispose(); app.close(); }
});
