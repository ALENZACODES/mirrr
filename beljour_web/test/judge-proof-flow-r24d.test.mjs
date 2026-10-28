import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { JudgeEvidenceLedger } from '../dist/js/layout/judge-evidence-ledger.js';
import { evaluateJudgeWitness } from '../dist/js/layout/judge-proof-policy.js';
import { judgeRunbook } from '../dist/js/layout/judge-runbook.js';
import { renderJudgeRunbookPanel } from '../dist/js/ui/shell/judge-runbook-panel.js';
import { renderJudgeProofPanel } from '../dist/js/ui/shell/judge-proof-panel.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

async function press(host, action) {
  const button = control(host, action);
  assert.ok(button, `missing ${action}`);
  assert.equal(button.disabled, false, `${action} is disabled`);
  await button.click();
}

async function opt(host, action) {
  const input = control(host, 'consent-' + action);
  assert.ok(input, `missing consent ${action}`);
  input.checked = true;
  await input.dispatch('change');
}

async function reachExport(host) {
  await press(host, 'sample');
  await press(host, 'next');
  for (const action of ['local', 'hair', 'face', 'mock']) await opt(host, action);
  await press(host, 'next');
  await press(host, 'hair-chestnut');
  await press(host, 'next');
  await press(host, 'face-warm');
  await press(host, 'next');
  await press(host, 'mock-tryon');
  await press(host, 'next');
  const slider = host.querySelectorAll('input').find(node => node.type === 'range');
  assert.ok(slider, 'comparison divider should be an accessible native range control');
  slider.value = '73';
  await slider.dispatch('input');
  await press(host, 'next');
}

function lastProof(host) {
  const section = host.querySelector('.lg-judge-proof-panel');
  assert.ok(section, 'final proof section is missing');
  return section;
}

function emptyProof() {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  const witness = evaluateJudgeWitness(session.snapshot, ledger.snapshot());
  const runbook = judgeRunbook(session.snapshot, witness, 0);
  return { witness, ledger, runbook };
}

test('the first screen offers an optional pace guide and browser readiness disclosure', () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    assert.match(app.host.textContent, /Step 1 of 8/);
    assert.match(app.host.textContent, /Three-minute demo talk track/);
    assert.match(app.host.textContent, /Browser and live-service readiness/);
    assert.equal(app.host.querySelectorAll('.lg-judge-cue-panel').length, 1);
    assert.equal(app.host.querySelectorAll('.lg-judge-preflight').length, 1);
    assert.equal(app.host.querySelector('.lg-judge-proof-panel'), null);
    guide.dispose();
  } finally { app.close(); }
});

test('the talk track does not introduce a second step route or replace navigation', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    const cue = app.host.querySelector('.lg-judge-cue-panel');
    assert.ok(cue);
    assert.equal(cue.querySelectorAll('button').length, 0);
    assert.ok(control(app.host, 'next'));
    assert.ok(control(app.host, 'skip'));
    assert.ok(control(app.host, 'exit'));
    await press(app.host, 'skip');
    assert.equal(guide.session.snapshot.step, 'consent');
    guide.dispose();
  } finally { app.close(); }
});

test('skipping all steps displays precisely one observed plan visit, not eight passes', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    for (let index = 0; index < 7; index += 1) await press(app.host, 'skip');
    assert.equal(guide.session.snapshot.step, 'plans');
    const proof = lastProof(app.host);
    assert.match(proof.textContent, /1 of 8 local actions observed/);
    assert.match(proof.textContent, /7 skipped/);
    assert.match(proof.textContent, /No labelled image download was requested/);
    assert.equal(proof.querySelectorAll('li').length, 8);
    guide.dispose();
  } finally { app.close(); }
});

test('visiting export and continuing without Save is recorded as a visited screen only', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await reachExport(app.host);
    assert.equal(guide.session.snapshot.step, 'export');
    await press(app.host, 'next');
    const proof = lastProof(app.host);
    assert.match(proof.textContent, /Export: Screen visited only/);
    assert.match(proof.textContent, /No labelled image download was requested/);
    assert.doesNotMatch(proof.textContent, /8 of 8 local actions observed/);
    guide.dispose();
  } finally { app.close(); }
});

test('a real Save click in the local mock is recorded only as a browser request', async () => {
  const app = judgeDOM();
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  let created = 0;
  URL.createObjectURL = () => { created += 1; return 'blob:judge-test'; };
  URL.revokeObjectURL = () => {};
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await reachExport(app.host);
    await press(app.host, 'export-save');
    assert.equal(created, 1);
    assert.match(app.host.textContent, /Download requested/);
    await press(app.host, 'next');
    const proof = lastProof(app.host);
    assert.match(proof.textContent, /8 of 8 local actions observed/);
    assert.match(proof.textContent, /Export: Observed locally/);
    assert.match(proof.textContent, /file integrity have not been checked/);
    assert.match(proof.textContent, /real adapter, external faces and release gates/);
    guide.dispose();
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    app.close();
  }
});

test('browser rejection of a download leaves it unobserved and offers a clear retry', async () => {
  const app = judgeDOM();
  const create = URL.createObjectURL;
  URL.createObjectURL = () => { throw Error('browser refused'); };
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await reachExport(app.host);
    await press(app.host, 'export-save');
    assert.match(app.host.textContent, /could not be saved/);
    await press(app.host, 'next');
    const proof = lastProof(app.host);
    assert.match(proof.textContent, /Export: Screen visited only/);
    assert.match(proof.textContent, /No labelled image download was requested/);
    guide.dispose();
  } finally {
    URL.createObjectURL = create;
    app.close();
  }
});

test('local consent withdrawal clears a previously chosen hair overlay', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample');
    await press(app.host, 'next');
    await opt(app.host, 'local');
    await opt(app.host, 'hair');
    await press(app.host, 'next');
    await press(app.host, 'hair-chestnut');
    await press(app.host, 'back');
    const consent = control(app.host, 'consent-local');
    consent.checked = false;
    await consent.dispatch('change');
    assert.equal(guide.session.snapshot.hair, 'none');
    assert.equal(guide.session.snapshot.permissions.hair, false);
    await press(app.host, 'skip');
    assert.match(app.host.textContent, /Select a photo and opt into the hair action on step 2/);
    guide.dispose();
  } finally { app.close(); }
});

test('consent changes do not grant real YouCam permission', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample');
    await press(app.host, 'next');
    await opt(app.host, 'local');
    await opt(app.host, 'mock');
    assert.equal(guide.session.snapshot.permissions.mock, true);
    assert.match(app.host.textContent, /These boxes do not grant consent/);
    assert.match(app.host.textContent, /mock and does not use provider units/);
    guide.dispose();
  } finally { app.close(); }
});

test('final evidence panel offers exactly one opt-in text report button', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    for (let index = 0; index < 7; index += 1) await press(app.host, 'skip');
    const proof = lastProof(app.host);
    assert.equal(proof.querySelectorAll('button').length, 1);
    assert.equal(control(proof, 'proof-download')?.textContent, 'Download photo-free rehearsal note');
    assert.match(proof.textContent, /The report remains on this device/);
    guide.dispose();
  } finally { app.close(); }
});

test('the report button fails with a readable message if browser file URLs are unavailable', async () => {
  const app = judgeDOM();
  const create = URL.createObjectURL;
  URL.createObjectURL = () => { throw Error('unavailable'); };
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    for (let index = 0; index < 7; index += 1) await press(app.host, 'skip');
    await press(app.host, 'proof-download');
    assert.match(app.host.textContent, /Text report could not be downloaded/);
    assert.equal(control(app.host, 'proof-download').disabled, false);
    guide.dispose();
  } finally {
    URL.createObjectURL = create;
    app.close();
  }
});

test('pure proof panel draws a complete eight-row native list without claiming quality', () => {
  const app = judgeDOM();
  try {
    const fixture = emptyProof();
    renderJudgeProofPanel(
      app.document, app.host, fixture.witness, fixture.ledger.snapshot(), fixture.runbook,
      { urls: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} } },
    );
    const panel = lastProof(app.host);
    assert.equal(panel.querySelectorAll('li').length, 8);
    assert.equal(panel.querySelectorAll('progress').length, 1);
    assert.match(panel.textContent, /not a provider test/i);
    assert.match(panel.textContent, /No labelled image download/);
  } finally { app.close(); }
});

test('the timed cue panel is native details and presents current step recovery options', () => {
  const app = judgeDOM();
  try {
    const fixture = emptyProof();
    renderJudgeRunbookPanel(app.document, app.host, fixture.runbook, fixture.witness, { expanded: true });
    const details = app.host.querySelector('details');
    assert.equal(details.open, true);
    assert.equal(details.querySelectorAll('summary').length, 1);
    assert.equal(details.querySelectorAll('li').length, 8);
    assert.match(details.textContent, /What to say and show/);
    assert.match(details.textContent, /Recovery:/);
    assert.match(details.textContent, /not a measured API or phone speed budget/);
  } finally { app.close(); }
});

test('the guide can still be exited by keyboard without persisting its evidence ledger', async () => {
  const app = judgeDOM();
  try {
    let exits = 0;
    const guide = mountJudgeMode(app.document, app.host, () => { exits += 1; });
    await press(app.host, 'sample');
    await app.host.dispatch('keydown', { key: 'Escape' });
    assert.equal(exits, 1);
    assert.equal(guide.session.snapshot.source, null);
    assert.equal(guide.image.hasImage, false);
    assert.equal(app.host.children.length, 0);
  } finally { app.close(); }
});

test('a second mount begins with no old observations or download receipt', async () => {
  const app = judgeDOM();
  try {
    let guide = mountJudgeMode(app.document, app.host, () => {});
    for (let index = 0; index < 7; index += 1) await press(app.host, 'skip');
    assert.ok(lastProof(app.host));
    guide.dispose();
    guide = mountJudgeMode(app.document, app.host, () => {});
    assert.equal(guide.session.snapshot.source, null);
    assert.equal(guide.session.snapshot.step, 'source');
    assert.equal(app.host.querySelector('.lg-judge-proof-panel'), null);
    assert.match(app.host.textContent, /Step 1 of 8/);
    guide.dispose();
  } finally { app.close(); }
});
