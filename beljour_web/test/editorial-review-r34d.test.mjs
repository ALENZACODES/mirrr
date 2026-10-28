/** House art approval is required before a collection rollout. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import {
  artworkReviewManifest,
  artworkReviewReceipt,
  validateArtworkManifest,
} from '../dist/js/layout/editorial/review.js';

const directory = new URL('../public/editorial-review/', import.meta.url);

test('the review batch contains exactly three original house drawing kinds', () => {
  const manifest = artworkReviewManifest();
  assert.equal(manifest.items.length, 3);
  assert.equal(manifest.completeCollectionApproved, false);
  assert.deepEqual(manifest.items.map(row => row.kind), ['portrait', 'figure', 'trust']);
  assert.ok(manifest.items.every(row => row.state === 'awaiting-owner-approval'));
  assert.ok(manifest.items.every(row => row.released === false));
  assert.ok(manifest.items.every(row => row.usedForTraining === false));
  for (const row of manifest.items) {
    const local = new URL(`${row.kind}.svg`, directory);
    assert.ok(statSync(local).size < 12_000);
    assert.match(row.path, /^web\/public\/editorial-review\//);
  }
});

test('receipt has no quality metrics, photos, provider data or unsupported claims', () => {
  const receipt = artworkReviewReceipt();
  assert.deepEqual(validateArtworkManifest(JSON.parse(receipt)), artworkReviewManifest());
  assert.doesNotMatch(receipt, /sha256|fileName|imageData|providerOutput|passedGate/i);
  assert.doesNotMatch(receipt, /faceAccuracy|realFacePass|clinical/i);
});

test('review-only images stay outside deployed public build', () => {
  const entry = readFileSync(new URL('../scripts/copy-static.mjs', import.meta.url), 'utf8');
  const serviceWorker = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(entry, /editorial-review/);
  assert.doesNotMatch(serviceWorker, /editorial-review/);
});

for (const modified of [
  { completeCollectionApproved: true },
  { items: [] },
  { items: artworkReviewManifest().items.map((row, index) => index === 0
    ? { ...row, state: 'approved' } : row) },
  { items: artworkReviewManifest().items.map((row, index) => index === 1
    ? { ...row, released: true } : row) },
]) {
  test('unapproved review claims fail before any distribution', () => {
    assert.throws(() => validateArtworkManifest({ ...artworkReviewManifest(), ...modified }));
  });
}
