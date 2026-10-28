// Lane D R24D: drawn DOM only. Never opens a real face or makes a network request.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Element, installDOM, buttonNamed } from './helpers/dom.mjs';
import {
  AccessibilityReview,
  REVIEW_TASKS,
  isReviewTask,
  isReviewDecision,
} from '../dist/js/mobile/a11y-review.js';
import {
  parseOpaqueColour,
  luminance,
  contrastRatio,
  contrastGrade,
} from '../dist/js/mobile/a11y-contrast.js';
import {
  focusKind,
  FocusObservationSession,
} from '../dist/js/mobile/a11y-focus.js';
import { inspectAccessibility } from '../dist/js/mobile/a11y-scan.js';
import {
  buildAccessibilityEvidence,
  validAccessibilityEvidence,
  serializeAccessibilityEvidence,
  accessibilityEvidenceText,
} from '../dist/js/diagnostics/accessibility-report.js';
import { mountAccessibilityPage } from '../dist/js/diagnostics/accessibility-page.js';
import { mountAccessibilityEntry } from '../dist/js/diagnostics/accessibility-entry.js';

function makeTree() {
  const dom = installDOM();
  const main = dom.document.createElement('main');
  const heading = dom.document.createElement('h1');
  heading.textContent = 'Synthetic test heading';
  const nav = dom.document.createElement('nav');
  const good = dom.document.createElement('a');
  good.textContent = 'Home';
  good.href = 'home.html';
  nav.append(good);
  const bad = dom.document.createElement('button');
  const text = dom.document.createElement('p');
  text.textContent = 'Synthetic text';
  const input = dom.document.createElement('input');
  input.id = 'file-picker';
  const label = dom.document.createElement('label');
  label.setAttribute('for', 'file-picker');
  label.textContent = 'Local photo picker';
  const image = dom.document.createElement('img');
  const repeated = dom.document.createElement('p');
  repeated.id = 'file-picker';
  repeated.textContent = 'Dummy';
  main.append(heading, nav, bad, text, label, input, image, repeated);
  dom.root.append(main);
  return { ...dom, main, nav, good, bad, text, input, image, repeated };
}

function focusHost() {
  const registered = new Set();
  return {
    registered,
    addEventListener(_type, cb) { registered.add(cb); },
    removeEventListener(_type, cb) { registered.delete(cb); },
    fire(target) { for (const callback of [...registered]) callback({ target }); },
  };
}

function browser(hash = '#accessibility') {
  const events = new Map();
  return {
    innerWidth: 390,
    location: { hash },
    getComputedStyle() {
      return { fontSize: '16px', color: 'rgb(27, 27, 53)', backgroundColor: 'rgb(255, 255, 255)' };
    },
    setTimeout(fn) { fn(); },
    addEventListener(type, fn) {
      const row = events.get(type) ?? new Set();
      row.add(fn);
      events.set(type, row);
    },
    removeEventListener(type, fn) { events.get(type)?.delete(fn); },
    fire(type) { for (const fn of events.get(type) ?? []) fn({ type }); },
    count(type) { return events.get(type)?.size ?? 0; },
  };
}

test('manual tasks are explicit, stay in memory and cannot certify WCAG', () => {
  const review = new AccessibilityReview();
  const visited = [];
  const stop = review.subscribe((result) => visited.push(result.reviewed));
  assert.equal(REVIEW_TASKS.length, 5);
  assert.equal(review.snapshot.certified, false);
  assert.equal(review.snapshot.manualComplete, false);
  assert.equal(review.snapshot.reviewed, 0);
  for (const item of REVIEW_TASKS) {
    assert.ok(isReviewTask(item.id));
    assert.ok(isReviewDecision('issue-found'));
    assert.ok(!isReviewDecision('automated-pass'));
    review.answer(item.id, item.id === 'photo' ? 'issue-found' : 'confirmed');
  }
  assert.equal(review.snapshot.manualComplete, true);
  assert.equal(review.snapshot.issues, 1);
  assert.equal(review.snapshot.confirmed, 4);
  assert.equal(review.snapshot.certified, false);
  assert.deepEqual(visited, [0, 1, 2, 3, 4, 5]);
  assert.throws(() => review.answer('portrait-data', 'confirmed'), RangeError);
  assert.throws(() => review.answer('photo', 'passed'), RangeError);
  stop();
  review.reset();
  assert.equal(review.snapshot.reviewed, 0);
  assert.deepEqual(visited, [0, 1, 2, 3, 4, 5]);
  review.dispose();
});

test('contrast is correct for known opaque colours and cautious otherwise', () => {
  assert.deepEqual(parseOpaqueColour('#000091'), [0, 0, 145]);
  assert.deepEqual(parseOpaqueColour('#fff'), [255, 255, 255]);
  assert.deepEqual(parseOpaqueColour('rgb(27, 27, 53)'), [27, 27, 53]);
  assert.deepEqual(parseOpaqueColour('rgba(27, 27, 53, 1)'), [27, 27, 53]);
  for (const input of ['transparent', 'currentcolor', '#f', '#ffffff00', 'rgb(500,0,0)', 'rgba(1,2,3,0.5)']) {
    assert.equal(parseOpaqueColour(input), null, input);
  }
  assert.equal(luminance([0, 0, 0]), 0);
  assert.equal(luminance([255, 255, 255]), 1);
  assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  assert.ok(contrastRatio([0, 0, 145], [255, 255, 255]) > 10);
  assert.equal(contrastGrade('#fff', '#fff').grade, 'low');
  assert.equal(contrastGrade('#000', '#fff').grade, 'passes-normal-text');
  assert.equal(contrastGrade('inherit', '#fff').grade, 'unknown');
  assert.throws(() => luminance([257, 0, 0]), RangeError);
});

test('focus review records only roles and counts and detaches listener', () => {
  const host = focusHost();
  const session = new FocusObservationSession(host);
  assert.equal(session.snapshot.started, false);
  session.start();
  session.start();
  assert.equal(host.registered.size, 1);
  const link = new Element('a');
  const button = new Element('button');
  host.fire(link);
  host.fire(button);
  assert.equal(session.snapshot.total, 2);
  assert.deepEqual(session.snapshot.distinctKinds, ['button', 'link']);
  assert.equal(focusKind(new Element('input')), 'input');
  for (let index = 0; index < 9; index += 1) host.fire(button);
  assert.equal(session.snapshot.trappedCandidate, false, 'two distinct controls are not a focus trap');
  session.stop();
  assert.equal(host.registered.size, 0);
  const frozen = session.snapshot.total;
  host.fire(button);
  assert.equal(session.snapshot.total, frozen);
  session.start();
  for (let index = 0; index < 10; index += 1) host.fire(link);
  assert.equal(session.snapshot.trappedCandidate, true);
  session.dispose();
  assert.equal(host.registered.size, 0);
  assert.equal(session.snapshot.started, false);
});

test('DOM inspection reports real issues without serializing text or IDs', () => {
  const app = makeTree();
  try {
    const result = inspectAccessibility(app.main, {
      viewportWidth: 320,
      contentWidth: 350,
      style: (node) => ({
        fontSize: node === app.text ? '10px' : '16px',
        color: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(255, 255, 255)',
      }),
    });
    const kinds = new Set(result.findings.map((item) => item.rule));
    for (const kind of ['control-name', 'image-alt', 'duplicate-id', 'font-size', 'contrast', 'horizontal-overflow']) {
      assert.ok(kinds.has(kind), `${kind} should appear`);
    }
    assert.ok(!kinds.has('input-label'), 'a for= label exists');
    assert.ok(result.inspected > 5);
    const serialized = JSON.stringify(result);
    for (const forbidden of ['Synthetic test heading', 'Local photo picker', 'file-picker']) {
      assert.ok(!serialized.includes(forbidden), forbidden);
    }
    assert.equal(result.incomplete, false);
  } finally { app.restore(); }
});

test('hidden nodes are excluded; bounded scan declares truncation', () => {
  const app = makeTree();
  try {
    app.bad.hidden = true;
    const checked = inspectAccessibility(app.main);
    assert.ok(!checked.findings.some((item) => item.rule === 'control-name'));
    const limited = inspectAccessibility(app.main, { maxElements: 2, maxFindings: 5 });
    assert.equal(limited.inspected, 2);
    assert.equal(limited.incomplete, true);
    assert.ok(limited.omitted > 0);
    assert.throws(() => inspectAccessibility(app.main, { maxElements: 0 }), RangeError);
    assert.throws(() => inspectAccessibility(app.main, { maxFindings: 300 }), RangeError);
    assert.throws(() => inspectAccessibility(null), TypeError);
    const unlabeled = new Element('button');
    unlabeled.setAttribute('aria-label', 'Named from attribute');
    app.main.append(unlabeled);
    assert.ok(!inspectAccessibility(app.main).findings.some((item) => item.rule === 'control-name'));
  } finally { app.restore(); }
});

test('accessibility evidence retains only safe fixed fields, never a pass claim', () => {
  const app = makeTree();
  try {
    const probe = inspectAccessibility(app.main);
    const review = new AccessibilityReview();
    review.answer('keyboard', 'confirmed');
    review.answer('reader', 'not-applicable');
    const focus = new FocusObservationSession(focusHost());
    const result = buildAccessibilityEvidence(probe, review.snapshot, focus.snapshot);
    assert.equal(result.certified, false);
    assert.equal(result.reviewedTasks, 2);
    assert.equal(result.completedManualReview, false);
    assert.ok(validAccessibilityEvidence(result));
    assert.ok(!validAccessibilityEvidence({ schema: 'beljour-accessibility-review/2' }));
    assert.match(accessibilityEvidenceText(result), /Not certified/);
    const serial = serializeAccessibilityEvidence(result);
    for (const forbidden of ['photoId', 'filename', 'keyboardValue', 'data:image', 'faceGeometry']) {
      assert.ok(!serial.includes(forbidden), forbidden);
    }
    assert.throws(() => serializeAccessibilityEvidence({ schema: 'invalid' }), RangeError);
    focus.dispose();
    review.dispose();
  } finally { app.restore(); }
});

test('interactive review can scan, answer, observe focus and close locally', async () => {
  const app = makeTree();
  try {
    const host = app.document.createElement('section');
    app.root.append(host);
    const page = mountAccessibilityPage(app.document, host, browser());
    assert.equal(page.active(), true);
    assert.ok(host.textContent.includes('Accessibility self-check'));
    assert.equal(host.querySelectorAll('fieldset').length, 2);
    assert.equal(host.querySelectorAll('select').length, REVIEW_TASKS.length + 4);
    const run = buttonNamed(host, 'Scan visible Home controls');
    assert.ok(run);
    await run.click();
    assert.match(host.textContent, /On-screen hints/);
    const first = host.querySelectorAll('select')[0];
    first.value = 'confirmed';
    await first.dispatch('change');
    assert.match(host.textContent, /Not certified/);
    const focus = buttonNamed(host, 'Start focus observation');
    await focus.click();
    assert.match(host.textContent, /only element kinds/);
    await focus.click();
    assert.equal(focus.textContent, 'Start focus observation');
    page.close();
    assert.equal(page.active(), false);
    assert.equal(host.children.length, 0);
  } finally { app.restore(); }
});

test('hash entry opens only on its own route and cleans up on navigation', () => {
  const dom = installDOM();
  try {
    const host = dom.document.createElement('section');
    host.id = 'lg-accessibility-root';
    dom.root.append(host);
    const win = browser('#home');
    const entry = mountAccessibilityEntry(dom.document, win);
    assert.equal(entry.active(), false);
    assert.equal(host.hidden, true);
    win.location.hash = '#accessibility';
    win.fire('hashchange');
    assert.equal(entry.active(), true);
    assert.equal(dom.root.dataset.accessibilityActive, 'true');
    win.fire('pagehide');
    assert.equal(entry.active(), false);
    entry.destroy();
    assert.equal(win.count('hashchange'), 0);
    assert.equal(win.count('pagehide'), 0);
  } finally { dom.restore(); }
});

test('public route and reviewed styles stay within Lane D and avoid red body text', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(read('../home.html'), /id="lg-accessibility-root"/);
  assert.match(read('../home.html'), /href="#accessibility"/);
  assert.match(read('../src/layout/entries.ts'), /mountAccessibilityEntry/);
  const css = read('../layout.css').split('/* Lane D r24d:')[1];
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /(?<![\w-])color:\s*#e1000f/i);
});
