import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JUDGE_CUES, validateJudgeCuePlan } from '../dist/js/layout/judge-runbook.js';

const modules = [
  'layout/judge-evidence-ledger.ts',
  'layout/judge-demo-readiness.ts',
  'layout/judge-proof-policy.ts',
  'layout/judge-proof-report.ts',
  'layout/judge-runbook.ts',
  'mobile/judge-demo-preflight.ts',
  'ui/shell/judge-preflight-panel.ts',
  'ui/shell/judge-proof-panel.ts',
  'ui/shell/judge-runbook-panel.ts',
  'ui/shell/judge-readiness-panel.ts',
];

const source = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');
const css = () => readFileSync(new URL('../layout.css', import.meta.url), 'utf8');

test('every new client module is in the owned Lane D module registry', () => {
  const registry = readFileSync(
    new URL('../../api/plumb_api/arena/lane_registry/d.py', import.meta.url), 'utf8',
  );
  const block = registry.split('# --- Lane D r24d-cp4:');
  assert.equal(block.length, 2);
  const ownerMap = block[1].split('def lane_d_r24d_cp4_ownership')[0];
  assert.match(ownerMap, /LANE_D_R24D_CP4_MODULES/);
  assert.match(block[1], /lane_d_r24d_cp4_ownership/);
  for (const path of modules) {
    assert.match(ownerMap, new RegExp('web/src/' + path.replace('.', '\.')));
  }
  assert.equal((ownerMap.match(/\("D",/g) ?? []).length, modules.length);
});

test('new client modules never fetch, send or establish network connections', () => {
  for (const path of modules) {
    const code = source(path);
    assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(/, path);
    assert.doesNotMatch(code, /sendBeacon\s*\(|navigator\.sendBeacon/, path);
    assert.doesNotMatch(code, /from ["'][^"']*providers\//, path);
    assert.doesNotMatch(code, /from ["'][^"']*api\.js/, path);
  }
});

test('new client modules never persist image pixels, names, identities or consent state', () => {
  for (const path of modules) {
    const code = source(path);
    assert.doesNotMatch(code, /localStorage\.|sessionStorage\.|indexedDB\./, path);
    assert.doesNotMatch(code, /writeFileSync|sendFile|cloudUpload/, path);
    assert.doesNotMatch(code, /JSON\.stringify\(state\)|JSON\.stringify\(image\)/, path);
  }
});

test('the optional operator report is never created automatically on page entry', () => {
  const mode = source('layout/judge-mode.ts');
  const proof = source('ui/shell/judge-proof-panel.ts');
  assert.match(mode, /state\.step === "plans"/);
  assert.match(mode, /renderJudgeProofPanel/);
  assert.match(proof, /judgeButton\(doc, "Download photo-free rehearsal note"/);
  assert.doesNotMatch(proof, /setInterval|setTimeout\(/);
});

test('Judge Mode still reaches its real tools through existing public navigation only', () => {
  const html = readFileSync(new URL('../home.html', import.meta.url), 'utf8');
  const guide = source('ui/shell/judge-runbook-panel.ts');
  assert.match(html, /href="#judge"/);
  assert.match(html, /href="studio\.html"/);
  assert.match(html, /href="trust\.html"/);
  assert.doesNotMatch(guide, /import .*engines\//);
});

test('all new CSS colours respect the existing restricted-red rule', () => {
  const styles = css();
  const added = styles.split('/* Lane D r24d-cp4:');
  assert.equal(added.length, 2);
  assert.doesNotMatch(added[1], /#e1000f|var\(--rouge\)/i);
  assert.match(added[1], /#000091/i);
});

test('all new Judge Mode functional CSS text keeps the twelve-pixel minimum', () => {
  const added = css().split('/* Lane D r24d-cp4:')[1];
  const values = [...added.matchAll(/font-size:\s*([\d.]+)(rem|px)/g)];
  assert.ok(values.length > 0);
  for (const [, amount, unit] of values) {
    const px = Number(amount) * (unit === 'rem' ? 16 : 1);
    assert.ok(px >= 12, `${amount}${unit} would be under 12px`);
  }
});

test('the operator flow has no removable simulation label, provider proof or billable action', () => {
  const report = source('layout/judge-proof-report.ts');
  const mode = source('layout/judge-mode.ts');
  assert.match(report, /SIMULATION_MARK/);
  assert.match(report, /downloadArrivalVerified: false/);
  assert.match(report, /providerCallsMeasured: "not-measured"/);
  assert.match(mode, /renderJudgePaywall/);
  assert.doesNotMatch(report, /paymentToken|cardNumber|subscriptionId/);
});

test('the script does not claim the local mock is a YouCam result', () => {
  assert.deepEqual(validateJudgeCuePlan(), []);
  const mock = JUDGE_CUES.find(cue => cue.step === 'tryon');
  assert.ok(mock);
  assert.match(mock.narration, /does not call/);
  assert.match(mock.recovery, /skip visibly/);
  assert.match(mock.honestBoundary, /separate live product flow/);
});

test('no new production module has a checkpoint suffix in its shipped path', () => {
  for (const path of modules) assert.doesNotMatch(path, /r24d|cp4/);
});

test('new proof screens retain explicit keyboard focus and responsive styles', () => {
  const styles = css().split('/* Lane D r24d-cp4:')[1];
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /min-height:\s*44px/);
  assert.match(styles, /@media \(max-width: 660px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});
