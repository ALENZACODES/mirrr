// Lane D r22d: DOM-level consent, local edits, compare, export and pricing screens.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { renderJudgeSource } from '../dist/js/ui/shell/judge-source.js';
import { JUDGE_CONSENT_FACTS, renderJudgeConsent } from '../dist/js/ui/shell/judge-consent.js';
import { renderJudgeHair, renderJudgeFace, renderJudgeMock } from '../dist/js/ui/shell/judge-edits.js';
import { comparisonLegend, renderJudgeCompare } from '../dist/js/ui/shell/judge-compare.js';
import { renderJudgeExport } from '../dist/js/ui/shell/judge-export-screen.js';
import { judgeBillingExplanation, renderJudgePaywall } from '../dist/js/ui/shell/judge-paywall.js';
import { JudgeImage } from '../dist/js/ui/shell/judge-image.js';
import { control, judgeDOM } from './judge-fixtures-r22d.mjs';

function setup() {
  const a = judgeDOM();
  const image = new JudgeImage(a.document);
  const session = new JudgeSession();
  return { ...a, image, session, teardown() {
    image.dispose();
    a.close();
  } };
}

function ready(app) {
  app.image.sample();
  app.session.selectSource('sample');
  app.session.consent('local', true);
  app.session.consent('hair', true);
  app.session.consent('face', true);
  app.session.consent('mock', true);
}

test('source screen displays placeholder and a local file picker without any remote URL', () => {
  const a = setup();
  try {
    let clicked = 0;
    renderJudgeSource(a.document, a.host, a.session.snapshot, a.image, {
      sample: () => { clicked++; }, upload: () => {},
    });
    assert.match(a.host.textContent, /graphic placeholder/);
    assert.match(a.host.textContent, /10 MB maximum/);
    assert.ok(a.host.querySelector('input'));
    assert.equal(a.host.querySelectorAll('a').length, 0);
    assert.equal(a.host.querySelector('canvas'), null);
    control(a.host, 'sample').click();
    assert.equal(clicked, 1);
  } finally { a.teardown(); }
});

test('selected sample produces labelled preview', () => {
  const a = setup();
  try {
    ready(a);
    renderJudgeSource(a.document, a.host, a.session.snapshot, a.image, { sample() {}, upload() {} });
    assert.ok(a.host.querySelector('canvas'));
    assert.match(a.host.textContent, /Drawn sample selected/);
    assert.ok(a.calls.some(call => call.includes('SIMULATION — ILLUSTRATIVE DEMO')));
  } finally { a.teardown(); }
});

test('consent screen explains distinct local, real-provider and mock paths', () => {
  const a = setup();
  try {
    renderJudgeConsent(a.document, a.host, a.session.snapshot, () => {});
    assert.ok(JUDGE_CONSENT_FACTS.length >= 4);
    assert.match(a.host.textContent, /never uploads/);
    assert.match(a.host.textContent, /YouCam may receive/);
    assert.match(a.host.textContent, /do not grant consent/);
    assert.equal(a.host.querySelectorAll('input').length, 4);
    assert.ok(a.host.querySelector('fieldset'));
  } finally { a.teardown(); }
});

test('consent action checkboxes default off and individual ones are disabled until local', async () => {
  const a = setup();
  try {
    const actions = [];
    renderJudgeConsent(a.document, a.host, a.session.snapshot, (name, checked) => actions.push([name, checked]));
    for (const input of a.host.querySelectorAll('input')) assert.equal(input.checked, false);
    assert.equal(control(a.host, 'consent-hair').disabled, true);
    control(a.host, 'consent-local').checked = true;
    await control(a.host, 'consent-local').dispatch('change');
    assert.deepEqual(actions, [['local', true]]);
    a.session.consent('local', true);
    renderJudgeConsent(a.document, a.host, a.session.snapshot, (name, checked) => actions.push([name, checked]));
    assert.equal(control(a.host, 'consent-hair').disabled, false);
    assert.equal(control(a.host, 'consent-mock').disabled, false);
  } finally { a.teardown(); }
});

test('hair screen never exposes an unapproved active edit', () => {
  const a = setup();
  try {
    a.image.sample();
    a.session.selectSource('sample');
    let called = 0;
    renderJudgeHair(a.document, a.host, a.session.snapshot, a.image, () => called++);
    assert.equal(control(a.host, 'hair-chestnut').disabled, true);
    assert.match(a.host.textContent, /step 2/);
    control(a.host, 'hair-chestnut').click();
    assert.equal(called, 0);
  } finally { a.teardown(); }
});

test('hair actions allow one selected original colour after consent', async () => {
  const a = setup();
  try {
    ready(a);
    const choices = [];
    renderJudgeHair(a.document, a.host, a.session.snapshot, a.image, value => choices.push(value));
    assert.equal(control(a.host, 'hair-chestnut').disabled, false);
    await control(a.host, 'hair-chestnut').click();
    assert.deepEqual(choices, ['chestnut']);
    assert.match(a.host.textContent, /does not generate hair/);
    assert.ok(a.host.querySelector('canvas'));
  } finally { a.teardown(); }
});

test('face screen uses its independent permission and transparent illustrative description', async () => {
  const a = setup();
  try {
    ready(a);
    a.session.consent('face', false);
    renderJudgeFace(a.document, a.host, a.session.snapshot, a.image, () => {});
    assert.equal(control(a.host, 'face-cool').disabled, true);
    a.session.consent('face', true);
    let selected = '';
    renderJudgeFace(a.document, a.host, a.session.snapshot, a.image, value => { selected = value; });
    await control(a.host, 'face-warm').click();
    assert.equal(selected, 'warm');
    assert.match(a.host.textContent, /not a measured skin/);
  } finally { a.teardown(); }
});

test('mock screen is never a live API call and requires opt-in', async () => {
  const a = setup();
  try {
    ready(a);
    a.session.consent('mock', false);
    let count = 0;
    renderJudgeMock(a.document, a.host, a.session.snapshot, a.image, () => count++);
    assert.equal(control(a.host, 'mock-tryon').disabled, true);
    assert.match(a.host.textContent, /No provider call/);
    a.session.consent('mock', true);
    renderJudgeMock(a.document, a.host, a.session.snapshot, a.image, () => count++);
    await control(a.host, 'mock-tryon').click();
    assert.equal(count, 1);
    assert.equal(a.host.querySelector('a').href, 'index.html#/photo');
  } finally { a.teardown(); }
});

test('compare screen has keyboard-native range and live numeric explanation', async () => {
  const a = setup();
  try {
    ready(a);
    const values = [];
    renderJudgeCompare(a.document, a.host, a.session.snapshot, a.image, value => values.push(value));
    const input = a.host.querySelector('input');
    assert.equal(input.type, 'range');
    assert.equal(input.min, '0');
    assert.equal(input.max, '100');
    assert.equal(input.value, '50');
    input.value = '75';
    await input.dispatch('input');
    assert.deepEqual(values, [75]);
    assert.match(a.host.textContent, /75% original/);
    assert.equal(comparisonLegend(0), '0% original on the left, 100% illustrated result on the right.');
  } finally { a.teardown(); }
});

test('compare screen offers recovery when all image steps were skipped', () => {
  const a = setup();
  try {
    renderJudgeCompare(a.document, a.host, a.session.snapshot, a.image, () => {});
    assert.match(a.host.textContent, /No image has been selected/);
    assert.equal(a.host.querySelector('input'), null);
  } finally { a.teardown(); }
});

test('export controls require an image and give a permanent label disclosure', () => {
  const a = setup();
  try {
    renderJudgeExport(a.document, a.host, a.session.snapshot, a.image, { change() {}, save: async () => {} });
    assert.equal(control(a.host, 'export-save').disabled, true);
    assert.match(a.host.textContent, /burned into the saved image pixels/);
    assert.match(a.host.textContent, /No account, server/);
  } finally { a.teardown(); }
});

test('export screen passes format and size changes through typed callbacks', async () => {
  const a = setup();
  try {
    ready(a);
    const changes = [];
    let saves = 0;
    renderJudgeExport(a.document, a.host, a.session.snapshot, a.image, {
      change: (...args) => changes.push(args),
      save: async () => { saves++; },
    });
    const format = control(a.host, 'export-format');
    format.value = 'image/jpeg';
    await format.dispatch('change');
    const size = control(a.host, 'export-size');
    size.value = 'large';
    await size.dispatch('change');
    assert.deepEqual(changes, [
      ['image/jpeg', 'standard', 'export-format'],
      ['image/png', 'large', 'export-size'],
    ]);
    await control(a.host, 'export-save').click();
    assert.equal(saves, 1);
    assert.match(a.host.textContent, /Download requested/);
  } finally { a.teardown(); }
});

test('paywall is informational, has no card form and every button has an action', async () => {
  const a = setup();
  try {
    let done = 0;
    renderJudgePaywall(a.document, a.host, () => done++);
    assert.match(a.host.textContent, /no checkout/i);
    assert.match(a.host.textContent, /3-day free trial/);
    assert.match(a.host.textContent, /\$5\.99/);
    assert.match(a.host.textContent, /\$49\.99/);
    assert.equal(a.host.querySelectorAll('form').length, 0);
    assert.equal(a.host.querySelectorAll('input').length, 0);
    assert.equal(a.host.querySelector('a').href, 'studio.html');
    assert.match(judgeBillingExplanation('yearly'), /\$49\.99/);
    await control(a.host, 'plan-yearly').click();
    assert.match(a.host.textContent, /per year/);
    await control(a.host, 'finish').click();
    assert.equal(done, 1);
  } finally { a.teardown(); }
});
