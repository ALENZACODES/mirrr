import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';
import { renderContinuousOperator } from '../dist/js/ui/shell/continuous-operator-panel.js';
import {
  inspectOperatorControls,
  operatorA11yCaption,
} from '../dist/js/layout/continuous/operator-accessibility.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function fixture() {
  const app = judgeDOM();
  const state = new OperatorRehearsal(() => 0);
  const actions = {
    start: () => state.start(),
    pause: () => state.clock.pause(),
    resume: () => state.clock.resume(),
    stop: () => state.clock.stop(),
    visit: id => state.open(id),
    acknowledge: id => state.acknowledge(id),
    refuse: (id, reason) => state.refuse(id, reason),
    clear: id => state.clear(id),
    export: () => {},
  };
  function render() {
    app.host.replaceChildren(renderContinuousOperator(app.document, state.snapshot, actions));
  }
  render();
  return { ...app, state, render, close() { state.dispose(); app.close(); } };
}

test('the operator list passes basic static keyboard and link tests', () => {
  const app = fixture();
  try {
    const result = inspectOperatorControls(app.host);
    assert.equal(result.kind, 'beljour-operator-accessibility/1');
    assert.equal(result.checked, true);
    assert.equal(result.links, 7);
    assert.ok(result.buttons > 0);
    assert.deepEqual(result.duplicateActions, []);
    assert.equal(result.missingNames, 0);
    assert.equal(result.unsafeLinks, 0);
    assert.equal(result.smallTargets, 0);
    assert.equal(result.browserCertified, false);
    assert.equal(result.screenReaderCertified, false);
    assert.match(operatorA11yCaption(result), /Physical-device and screen-reader reviews remain required/);
  } finally { app.close(); }
});

test('the accessibility audit does not require the operator controls to exist', () => {
  const app = judgeDOM();
  try {
    const result = inspectOperatorControls(app.host);
    assert.equal(result.checked, false);
    assert.equal(result.links, 0);
    assert.match(operatorA11yCaption(result), /not inspected/);
  } finally { app.close(); }
});

test('untrusted link destinations are reported without following navigation', () => {
  const app = fixture();
  try {
    const anchor = app.host.querySelectorAll('a')[0];
    anchor.href = 'https://unexpected.invalid/photo';
    assert.ok(inspectOperatorControls(app.host).unsafeLinks > 0);
    anchor.href = 'photo.html?picture=secret';
    assert.ok(inspectOperatorControls(app.host).unsafeLinks > 0);
    anchor.href = 'photo.html';
    assert.equal(inspectOperatorControls(app.host).unsafeLinks, 0);
  } finally { app.close(); }
});

test('missing button labels, duplicate controls and small touch targets are found', () => {
  const app = fixture();
  const previous = app.host.querySelectorAll('button')[0].getBoundingClientRect;
  try {
    const first = app.host.querySelectorAll('button')[0];
    first.textContent = '';
    assert.ok(inspectOperatorControls(app.host).missingNames > 0);
    first.textContent = 'Start';
    const second = app.host.querySelectorAll('button')[1];
    second.dataset.tourAction = first.dataset.tourAction;
    assert.ok(inspectOperatorControls(app.host).duplicateActions.length > 0);
    first.getBoundingClientRect = () => ({ width: 28, height: 28 });
    assert.ok(inspectOperatorControls(app.host).smallTargets > 0);
  } finally {
    app.host.querySelectorAll('button')[0].getBoundingClientRect = previous;
    app.close();
  }
});

test('changing operator mark states retains semantics and link count', () => {
  const app = fixture();
  try {
    app.state.start();
    app.state.open('photo');
    app.state.acknowledge('photo');
    app.state.refuse('hair', 'no-consent');
    app.render();
    const result = inspectOperatorControls(app.host);
    assert.equal(result.links, 7);
    assert.deepEqual(result.duplicateActions, []);
    assert.equal(result.unsafeLinks, 0);
    assert.equal(result.missingNames, 0);
  } finally { app.close(); }
});
