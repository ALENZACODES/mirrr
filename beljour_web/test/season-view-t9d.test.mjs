/** DOM safety and focus behavior for the BELJOUR Season Book. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installDOM } from './helpers/dom.mjs';
import { SeasonBookController } from '../dist/js/layout/season-book/controller.js';
import { renderSeasonBook } from '../dist/js/layout/season-book/view.js';
import { exampleLook, mockPort } from './helpers/season-book-fixtures.mjs';

function fixture() {
  const dom = installDOM();
  const panel = dom.document.createElement('section');
  dom.root.append(panel);
  const controller = new SeasonBookController(() => [exampleLook()], { today: () => '2026-10-26' });
  const unsubscribe = controller.subscribe(state => {
    renderSeasonBook(dom.document, panel, state, {
      personalize: () => { void controller.personalizeFromUserAction(); },
      setAlerts: checked => controller.setInPageAlertsFromUserAction(checked),
      clearPersonal: () => controller.resetPersonal(),
    });
  });
  return { ...dom, panel, controller, close() {
    unsubscribe();
    controller.dispose();
    dom.restore();
  } };
}

test('unwired Season Book is hidden and contains no invented trends', () => {
  const page = fixture();
  try {
    assert.equal(page.panel.hidden, true);
    assert.equal(page.panel.textContent, '');
  } finally {
    page.close();
  }
});

test('reviewed trends carry dated external citations and safe link properties', async () => {
  const page = fixture();
  try {
    await page.controller.connect(mockPort());
    assert.equal(page.panel.hidden, false);
    assert.match(page.panel.textContent, /The Season Book/);
    assert.match(page.panel.textContent, /BELJOUR/);
    assert.match(page.panel.textContent, /2026-10-22/);
    assert.equal(page.panel.querySelectorAll('article').length, 1);
    const link = page.panel.querySelector('a');
    assert.equal(link.href, 'https://example.org/fixture');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.target, '_blank');
    assert.doesNotMatch(page.panel.textContent, /Hidden Study|Awaiting editorial review/);
  } finally {
    page.close();
  }
});

test('personal evidence is not accessed until the button is clicked', async () => {
  const page = fixture();
  try {
    const port = mockPort();
    await page.controller.connect(port);
    assert.deepEqual(port.calls, ['load']);
    const button = page.panel.querySelector('[data-season-action="personalize"]');
    assert.ok(button);
    await button.click();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(page.controller.snapshot().personalized, true);
    assert.match(page.panel.textContent, /confirmed mapping supports this shade/);
    assert.doesNotMatch(page.panel.textContent, /Fixture Saved Look/);
  } finally {
    page.close();
  }
});

test('in-page alert requires opt-in and never opens push permission', async () => {
  const page = fixture();
  const before = globalThis.Notification;
  globalThis.Notification = { requestPermission() {
    throw new Error('Browser push is forbidden');
  } };
  try {
    await page.controller.connect(mockPort());
    const input = page.panel.querySelector('[data-season-action="alert"]');
    assert.equal(input.checked, false);
    input.checked = true;
    await input.dispatch('change');
    assert.equal(page.controller.snapshot().alertOptedIn, true);
    await page.panel.querySelector('[data-season-action="personalize"]').click();
    await Promise.resolve();
    await Promise.resolve();
    assert.match(page.panel.textContent, /Your season match is in/);
  } finally {
    if (before === undefined) delete globalThis.Notification;
    else globalThis.Notification = before;
    page.close();
  }
});

test('failed source renders UNVERIFIED with no fictitious counts', async () => {
  const page = fixture();
  try {
    await page.controller.connect({ ...mockPort(), loadReviewedSeason: async () => ({ format: 'wrong' }) });
    assert.match(page.panel.textContent, /UNVERIFIED/);
    assert.doesNotMatch(page.panel.textContent, /\b(?:95|96|98|100)%\b/);
  } finally {
    page.close();
  }
});

test('text content does not parse markup or create unexpected elements', async () => {
  const page = fixture();
  try {
    const catalogue = mockPort().loadReviewedSeason();
    const source = await catalogue;
    source.houses[0].reportedTrend = '<strong>Test fixture text, never injected as markup</strong>';
    await page.controller.connect(mockPort({ catalogue: source }));
    assert.match(page.panel.textContent, /<strong>/);
    assert.equal(page.panel.querySelectorAll('strong').length, 1);
  } finally {
    page.close();
  }
});
