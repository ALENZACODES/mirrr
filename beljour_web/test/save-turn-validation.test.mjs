import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkedTurnWeights } from '../dist/js/save/turn-validation.js';

test('a valid weight plane is copied, not shared', () => {
  const source = new Float32Array(16).fill(.8);
  const result = checkedTurnWeights(source, 4, 4);
  assert.equal(result.refused, false);
  if (!result.refused) {
    source[0]=0;
    assert.ok(Math.abs(result.weights[0] - .8) < 1e-6);
  }
});
test('NaN, infinities and negative/over-one fractions refuse', () => {
  for(const value of [NaN,Infinity,-Infinity,-.1,1.1]) {
    const w = new Float32Array(16).fill(.5); w[0]=value;
    const result = checkedTurnWeights(w,4,4);
    assert.equal(result.refused,true);
    assert.equal(result.code,'invalid_weights');
  }
});
test('incorrect image dimensions refuse without processing', () => {
  const w = new Float32Array(16).fill(.5);
  for(const [width,height] of [[0,4],[4,0],[2,7],[NaN,3],[-1,3]]) {
    const result = checkedTurnWeights(w,width,height);
    assert.equal(result.refused,true);
  }
});
