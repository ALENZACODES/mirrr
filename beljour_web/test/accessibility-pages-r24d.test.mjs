// R24D: explicit across-page sign-off cannot be inferred from navigating a link.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import {
  REVIEW_PAGES,
  AccessibilityPageReview,
  reviewedPageHref,
} from '../dist/js/mobile/accessibility-pages.js';
import { AccessibilityReview } from '../dist/js/mobile/a11y-review.js';
import { FocusObservationSession } from '../dist/js/mobile/a11y-focus.js';
import {
  buildAccessibilityEvidence,
  validAccessibilityEvidence,
  serializeAccessibilityEvidence,
} from '../dist/js/diagnostics/accessibility-report.js';
import { mountAccessibilityPage } from '../dist/js/diagnostics/accessibility-page.js';

function host() {
  return { addEventListener() {}, removeEventListener() {} };
}

test('the four public route URLs are static, local and unique', () => {
  assert.deepEqual(REVIEW_PAGES.map((page) => page.id), ['home', 'studio', 'classic', 'trust']);
  assert.deepEqual(REVIEW_PAGES.map((page) => page.href), [
    'home.html', 'studio.html', 'index.html', 'trust.html',
  ]);
  assert.equal(new Set(REVIEW_PAGES.map((page) => page.href)).size, REVIEW_PAGES.length);
  for (const page of REVIEW_PAGES) {
    assert.equal(reviewedPageHref(page.id), page.href);
    assert.ok(!page.href.includes('http:'));
    assert.ok(!page.href.includes('https:'));
  }
  assert.throws(() => reviewedPageHref('unknown'), RangeError);
});

test('page review requires individual decisions and never asserts certification', () => {
  const review = new AccessibilityPageReview();
  const observed = [];
  const stop = review.subscribe((state) => observed.push(state.reviewed));
  assert.equal(review.snapshot.complete, false);
  assert.equal(review.snapshot.certified, false);
  review.record('home', 'checked-manually');
  review.record('studio', 'issue-observed');
  review.record('classic', 'unable-to-check');
  assert.equal(review.snapshot.complete, false);
  assert.equal(review.snapshot.issues, 1);
  review.record('trust', 'checked-manually');
  assert.equal(review.snapshot.complete, true);
  assert.equal(review.snapshot.certified, false);
  assert.deepEqual(observed, [0, 1, 2, 3, 4]);
  assert.throws(() => review.record('secret-face', 'checked-manually'), RangeError);
  assert.throws(() => review.record('home', 'auto-pass'), RangeError);
  stop();
  review.reset();
  assert.equal(review.snapshot.reviewed, 0);
  review.dispose();
});

test('export includes explicit page outcomes and keyboard/viewport aggregate evidence only', () => {
  const pages = new AccessibilityPageReview();
  pages.record('home', 'checked-manually');
  pages.record('trust', 'issue-observed');
  const check = new AccessibilityReview();
  check.answer('keyboard', 'confirmed');
  const focus = new FocusObservationSession(host());
  const keyboard = {
    recordedFocus: 5, tabRequests: 4, namedControls: 3, unnamedControls: 2,
    visibleRingHints: 4, ringUnknown: 1, notInTabOrder: 0, active: false,
    proof: 'manual-hint-only',
  };
  const responsive = {
    viewportWidth: 390, contentWidth: 390, controlsSeen: 12,
    smallTouchControls: 1, smallTextElements: 0, overflowPixels: 0,
    sampled: false, label: 'measurement-not-certification',
    warnings: ['Test 320px/390px, zoom and landscape physically; this scan cannot emulate them.'],
  };
  const result = buildAccessibilityEvidence(null, check.snapshot, focus.snapshot,
    pages.snapshot, keyboard, responsive);
  assert.equal(result.certified, false);
  assert.equal(result.allPagesReviewed, false);
  assert.equal(result.pages.length, 4);
  assert.equal(result.pages[0].decision, 'checked-manually');
  assert.equal(result.keyboard.recordedFocus, 5);
  assert.equal(result.responsive.viewportWidth, 390);
  assert.ok(validAccessibilityEvidence(result));
  const text = serializeAccessibilityEvidence(result);
  assert.match(text, /beljour-accessibility-review\/1/);
  assert.ok(!text.includes('person.jpg'));
  assert.ok(!text.includes('photoId'));
  assert.ok(!text.includes('user-agent'));
  assert.equal(validAccessibilityEvidence({ ...result, pages: [] }), false);
  assert.equal(validAccessibilityEvidence({ ...result, keyboard: { proof: 'certified' } }), false);
  pages.dispose();
  check.dispose();
  focus.dispose();
});

test('interactive screen creates four link-and-choice rows and preserves explicit results', async () => {
  const dom = installDOM();
  try {
    const main = dom.document.createElement('main');
    main.id = 'lg-main';
    const area = dom.document.createElement('section');
    dom.root.append(main, area);
    const browser = {
      innerWidth: 390,
      getComputedStyle: () => ({ fontSize: '16px', color: '#1b1b35', backgroundColor: '#ffffff' }),
      setTimeout: (fn) => fn(),
    };
    const panel = mountAccessibilityPage(dom.document, area, browser);
    for (const page of REVIEW_PAGES) {
      const select = area.querySelector(`#lg-accessibility-page-${page.id}`);
      assert.ok(select, page.id);
      const url = area.querySelectorAll('a').find((link) => link.href === page.href);
      assert.ok(url, page.href);
      assert.equal(url.target, '_blank');
      assert.equal(url.rel, 'noopener noreferrer');
      select.value = 'checked-manually';
      await select.dispatch('change');
    }
    assert.match(area.textContent, /4 routes reviewed/);
    const run = buttonNamed(area, 'Scan visible Home controls');
    await run.click();
    assert.match(area.textContent, /On-screen hints/);
    panel.close();
    assert.equal(area.children.length, 0);
  } finally { dom.restore(); }
});

test('exporter drops unknown fields, injected warnings and identifying strings', () => {
  const pages = new AccessibilityPageReview();
  const check = new AccessibilityReview();
  const focus = new FocusObservationSession(host());
  const keyboard = {
    recordedFocus: 2, tabRequests: 1, namedControls: 2, unnamedControls: 0,
    visibleRingHints: 1, ringUnknown: 1, notInTabOrder: 0, active: false,
    proof: 'manual-hint-only',
    identifyingImage: 'private-person.png',
  };
  const responsive = {
    viewportWidth: 390, contentWidth: 450, controlsSeen: 4,
    smallTouchControls: 1, smallTextElements: 0, overflowPixels: 60,
    sampled: false, label: 'measurement-not-certification',
    warnings: ['The inspected layout exceeds the viewport.', 'private-person.png'],
    deviceId: 'personal-device-id',
  };
  const report = buildAccessibilityEvidence(null, check.snapshot, focus.snapshot,
    pages.snapshot, keyboard, responsive);
  const raw = serializeAccessibilityEvidence(report);
  assert.ok(validAccessibilityEvidence(report));
  assert.doesNotMatch(raw, /private-person|personal-device|identifyingImage/);
  assert.deepEqual(report.responsive.warnings, ['The inspected layout exceeds the viewport.']);
  assert.equal(report.keyboard.recordedFocus, 2);
  assert.ok(!Object.hasOwn(report.keyboard, 'identifyingImage'));
  pages.dispose();
  check.dispose();
  focus.dispose();
});
