import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllTrendingArtists, REGIONAL_ANCHORS } from '../src/trending_artists.js';

test('trending regions come back in a fixed order, not lookup-completion order', async () => {
  const a = await getAllTrendingArtists({ qlooClient: null });
  assert.deepEqual(Object.keys(a), Object.keys(REGIONAL_ANCHORS));
});
