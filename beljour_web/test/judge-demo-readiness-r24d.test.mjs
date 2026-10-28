import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { JudgeEvidenceLedger } from '../dist/js/layout/judge-evidence-ledger.js';
import { evaluateJudgeWitness } from '../dist/js/layout/judge-proof-policy.js';
import { evaluateDemoCapabilities } from '../dist/js/mobile/judge-demo-preflight.js';
import { judgeDemoReadiness, judgeReadinessLabel } from '../dist/js/layout/judge-demo-readiness.js';
import { renderJudgeReadinessPanel } from '../dist/js/ui/shell/judge-readiness-panel.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function matrix() {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  const device = evaluateDemoCapabilities({
    makeCanvas: () => ({ getContext: () => ({}), toBlob() {} }),
    makeObjectURL() {}, imageBitmap() {}, online: true,
  });
  return { session, ledger, device };
}

test('a new visit remains rehearsal-only regardless of browser Canvas support', () => {
  const data = matrix();
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(report.status, 'rehearsal-only');
  assert.equal(report.confirmsLiveYouCam, false);
  assert.equal(report.clearsPublicRelease, false);
  assert.equal(report.rows.length, 9);
  assert.equal(report.externalChecksPending, 6);
});

test('known local Canvas cannot certify provider availability', () => {
  const data = matrix();
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(report.rows[2].status, 'observed-locally');
  assert.equal(report.rows[3].status, 'not-checked');
  assert.match(report.rows[3].nextCheck, /working API response/);
});

test('download request becomes local observation but not saved-file certification', () => {
  const data = matrix();
  data.ledger.record('download-requested', 1);
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(report.rows[1].status, 'observed-locally');
  assert.match(report.rows[1].evidence, /saved-file arrival is not verified/);
  assert.equal(report.clearsPublicRelease, false);
});

test('readiness shows live permission and model licences as external checks', () => {
  const data = matrix();
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(report.rows.find(row => row.code === 'realtime-provider-consent').status, 'not-checked');
  assert.equal(report.rows.find(row => row.code === 'commercial-licence').status, 'not-checked');
  assert.equal(report.rows.find(row => row.code === 'frozen-face-gate').status, 'not-checked');
});

test('a preflight failure is explicit without triggering a server fallback', () => {
  const data = matrix();
  data.device = evaluateDemoCapabilities({});
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(report.rows[2].status, 'incomplete');
  assert.match(report.rows[2].evidence, /No working local/);
});

test('readiness rows have unique codes, next steps and readable labels', () => {
  const data = matrix();
  const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
  const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
  assert.equal(new Set(report.rows.map(row => row.code)).size, report.rows.length);
  for (const row of report.rows) {
    assert.ok(row.title.length >= 10);
    assert.ok(row.evidence.length >= 20);
    assert.ok(row.nextCheck.length >= 20);
    assert.ok(judgeReadinessLabel(row.status).length >= 10);
  }
});

test('readiness panel shows nine decisions without pretending an external pass', () => {
  const page = judgeDOM();
  try {
    const data = matrix();
    const witness = evaluateJudgeWitness(data.session.snapshot, data.ledger.snapshot());
    const report = judgeDemoReadiness(witness, data.ledger.snapshot(), data.device);
    renderJudgeReadinessPanel(page.document, page.host, report);
    assert.equal(page.host.querySelectorAll('dt').length, 9);
    assert.match(page.host.textContent, /What a real judge demo still needs/);
    assert.match(page.host.textContent, /Release decision not made/);
    assert.match(page.host.textContent, /Live YouCam integration/);
    assert.equal(page.host.querySelectorAll('button').length, 0);
  } finally { page.close(); }
});
