import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { realDemoRoutes } from '../dist/js/layout/judge-live-routes.js';

const modules = [
  'layout/judge-live-routes.ts',
  'layout/judge-live-runbook.ts',
  'layout/judge-live-checks.ts',
  'layout/judge-live-report.ts',
  'layout/judge-failure-replay.ts',
  'mobile/judge-device-selfcheck.ts',
  'ui/shell/judge-live-panel.ts',
  'ui/shell/judge-failure-panel.ts',
  'ui/shell/judge-device-selfcheck-panel.ts',
];

function source(name) {
  return readFileSync(new URL('../src/' + name, import.meta.url), 'utf8');
}

test('all nine new modules have an exact Lane D-only registry ownership entry', () => {
  const registry = readFileSync(new URL('../../api/plumb_api/arena/lane_registry/d.py', import.meta.url), 'utf8');
  const block = registry.split('# --- Lane D r24d-cp5:');
  assert.equal(block.length, 2);
  const ownerMap = block[1].split('def lane_d_r24d_cp5_ownership')[0];
  assert.match(ownerMap, /LANE_D_R24D_CP5_MODULES/);
  assert.match(block[1], /lane_d_r24d_cp5_ownership/);
  for (const path of modules) {
    assert.ok(ownerMap.includes(`"web/src/${path}"`), path);
    assert.ok(existsSync(new URL('../src/' + path, import.meta.url)), path);
  }
  assert.equal((ownerMap.match(/\("D",/g) ?? []).length, modules.length);
});

test('new modules never call fetch, transport photos or import private provider adapters', () => {
  for (const path of modules) {
    const code = source(path);
    assert.doesNotMatch(code, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|sendBeacon\s*\(/, path);
    assert.doesNotMatch(code, /from\s+["'][^"']*(?:providers|styling-tasks|api\.js)/, path);
    assert.doesNotMatch(code, /navigator\.credentials|\.postMessage\s*\(/, path);
    assert.doesNotMatch(code, /FileReader|\.arrayBuffer\s*\(|\.toDataURL\s*\(/, path);
  }
});

test('new state modules do not persist source images, operator choices or provider data', () => {
  for (const path of modules) {
    const code = source(path);
    assert.doesNotMatch(code, /localStorage\.|sessionStorage\.|indexedDB\.|caches\.open/, path);
    assert.doesNotMatch(code, /writeFileSync|cloudUpload|\.cookie\b/, path);
  }
});

test('no new shipped module has a round or checkpoint suffix', () => {
  for (const path of modules) assert.doesNotMatch(path, /r24d|cp5|_r\d+/);
});

test('the deployed build includes all the public entry pages used by the real-flow handoff', () => {
  for (const route of realDemoRoutes()) {
    const name = route.href.split('#')[0];
    assert.ok(existsSync(new URL('../dist/' + name, import.meta.url)), name);
    assert.equal(route.carriesPhoto, false);
    assert.equal(route.liveVerified, false);
  }
});

test('all new CSS keeps red reserved and functional sizes above the 12px minimum', () => {
  const css = readFileSync(new URL('../layout.css', import.meta.url), 'utf8');
  const tail = css.split('/* Lane D r24d-cp5:')[1];
  assert.ok(tail);
  assert.doesNotMatch(tail, /#e1000f|var\(--rouge\)/i);
  assert.match(tail, /#000091/);
  assert.match(tail, /min-height:\s*44px/);
  assert.match(tail, /:focus-visible/);
  assert.match(tail, /prefers-reduced-motion/);
  assert.match(tail, /max-width:\s*660px/);
  const declarations = [...tail.matchAll(/font-size:\s*([\d.]+)(rem|px)/g)];
  for (const [, size, unit] of declarations) {
    assert.ok(Number(size) * (unit === 'rem' ? 16 : 1) >= 12);
  }
});

test('the optional handoff cannot silently open a link or make a unit-spending request', () => {
  const mode = source('layout/judge-mode.ts');
  const panel = source('ui/shell/judge-live-panel.ts');
  assert.match(mode, /renderJudgeLivePanel\(doc, surface, liveChecks\)/);
  assert.match(panel, /link\.href = route\.href/);
  assert.match(panel, /link\.rel = "noopener noreferrer"/);
  assert.doesNotMatch(panel, /location\.href\s*=|window\.open\s*\(/);
  assert.match(panel, /judgeButton\(doc, "Download photo-free operator checklist"/);
});

test('the optional mock refusal does not weaken the original source, consent or export flow', () => {
  const mode = source('layout/judge-mode.ts');
  assert.match(mode, /renderJudgeFailurePanel/);
  assert.match(mode, /session\.setMock\(false\)/);
  assert.match(mode, /failureReplay\.reset\(\)/);
  assert.match(mode, /renderJudgeConsent/);
  assert.match(mode, /prepareJudgeDownload/);
  assert.match(mode, /evidence\.changedEdit\(\)/);
  assert.match(mode, /failureReplay\.dispose\(\)/);
  assert.match(mode, /liveChecks\.dispose\(\)/);
});
