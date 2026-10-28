// Typed API admission errors preserve the server's retry guidance without retries.
// All fetches are in-memory mocks. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, ApiError, store } from '../dist/js/api.js';
import { SESSION_KEY } from '../dist/js/session.js';
import { errorBox } from '../dist/js/ui/widgets.js';
import { installDOM } from './helpers/dom.mjs';

async function rejection(retryAfter) {
  const previous = { fetch: globalThis.fetch, api: globalThis.BELJOUR_API, old: globalThis.PLUMB_API };
  let calls = 0;
  store.setItem(SESSION_KEY, 'browserRateLimitTestR14');
  globalThis.BELJOUR_API = 'https://local-api.test';
  delete globalThis.PLUMB_API;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(options.headers['X-Beljour-Session'], 'browserRateLimitTestR14');
    const headers = { 'Content-Type': 'application/json' };
    if (retryAfter !== null) headers['Retry-After'] = retryAfter;
    return new Response(JSON.stringify({ error: { code: 'rate_limited', message: 'Wait a moment and try again.' } }), { status: 429, headers });
  };
  try {
    let failure;
    try { await api.quote({ action: 'makeup', photo_id: 'a'.repeat(64), lip_id: 'L01' }); }
    catch (error) { failure = error; }
    assert.ok(failure instanceof ApiError);
    assert.equal(failure.status, 429); assert.equal(failure.code, 'rate_limited');
    assert.equal(failure.message, 'Wait a moment and try again.');
    assert.equal(calls, 1, 'the client never silently retries a unit-spending request');
    return failure;
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.api === undefined) delete globalThis.BELJOUR_API; else globalThis.BELJOUR_API = previous.api;
    if (previous.old === undefined) delete globalThis.PLUMB_API; else globalThis.PLUMB_API = previous.old;
  }
}
test('API exposes the integer Retry-After from a typed429 without scheduling another request', async () => {
  assert.equal((await rejection('5')).retryAfterSeconds, 5);
});
test('API rejects malformed retry delays and bounds unusually long delays', async () => {
  for (const value of [null, '', '-1', '0', '1.5', '1e3', 'tomorrow', 'Infinity']) {
    assert.equal((await rejection(value)).retryAfterSeconds, null, String(value));
  }
  assert.equal((await rejection('999999999')).retryAfterSeconds, 86400);
});

test('429 guidance is visible and announced without inventing a delay for other errors', () => {
  const dom = installDOM(); try {
    const one = errorBox(new ApiError(429, 'rate_limited', 'Wait a moment.', 1));
    assert.equal(one.getAttribute('role'), 'alert');
    assert.equal(one.textContent, 'Wait a moment. Try again in 1 second.');
    assert.match(errorBox(new ApiError(429, 'rate_limited', 'Wait a moment.', 5)).textContent, /5 seconds/);
    assert.equal(errorBox(new ApiError(404, 'photo_gone', 'Choose your photo again.')).textContent, 'Choose your photo again.');
  } finally { dom.restore(); }
});
