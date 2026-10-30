// Rate limiting (src/ratelimit.js): local lab routes never throttle normal use; upstream routes keep 30 a minute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRateLimiter, tierFor, TIERS, clientAddress, isTrustedHop, hopShape } from '../src/ratelimit.js';

test('routes that can reach Qloo or the narrator are the upstream tier; the labs are local', () => {
  for (const p of ['/api/taste/profile', '/api/agent/run', '/api/trending', '/api/trending/regions', '/api/plan', '/api/transform', '/api/qloo/diag']) assert.equal(tierFor(p), 'upstream', p);
  for (const p of ['/api/complexion/plan', '/api/skin/plan', '/api/hairlab/journey', '/api/library', '/api/shades/find', '/api/health']) assert.equal(tierFor(p), 'local', p);
});

test('upstream keeps the old 30 a minute; local allows a long lab session and refills', () => {
  let t = 0;
  const take = createRateLimiter({ now: () => t });
  const run = (path, n) => Array.from({ length: n }, () => take('1.1.1.1', path).ok).filter(Boolean).length;
  assert.equal(run('/api/taste/profile', 40), 30);
  const blocked = take('1.1.1.1', '/api/taste/profile');
  assert.equal(blocked.ok, false); assert.equal(blocked.retryAfter, 2);
  assert.equal(run('/api/complexion/plan', 240), 240, 'the upstream bucket is separate from the local one');
  assert.equal(take('1.1.1.1', '/api/complexion/plan').ok, false);
  t += 10_000; // 10 s later: 40 local tokens and 5 upstream tokens are back
  assert.equal(run('/api/complexion/plan', 50), 40);
  assert.equal(run('/api/taste/profile', 10), 5);
  assert.equal(take('2.2.2.2', '/api/taste/profile').ok, true, 'other visitors are unaffected');
  assert.ok(TIERS.local.capacity >= 200);
});

test('idle visitors are forgotten', () => {
  let t = 0;
  const take = createRateLimiter({ now: () => t, maxIdleMs: 1000 });
  for (let i = 0; i < 30; i++) take('3.3.3.3', '/api/taste/profile');
  assert.equal(take('3.3.3.3', '/api/taste/profile').ok, false);
  t += 120_000;
  assert.equal(take('4.4.4.4', '/api/health').ok, true); // triggers the sweep
  assert.equal(take('3.3.3.3', '/api/taste/profile').ok, true);
});

test('a long lab session from one address over HTTP never sees a 429, and a flood still does', async () => {
  const PORT = 3800 + Math.floor(Math.random() * 90);
  const server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(PORT), QLOO_API_KEY: '' }, stdio: 'pipe' });
  try {
    const B = `http://127.0.0.1:${PORT}`;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${B}/api/health`, { headers: { 'x-forwarded-for': '10.7.7.1' } })).ok) break; } catch { /* booting */ }
      await new Promise(r => setTimeout(r, 100));
    }
    const h = { 'x-forwarded-for': '10.7.7.2', 'content-type': 'application/json' };
    const statuses = [];
    for (const shape of ['round', 'oval', 'square', 'heart', 'long', 'diamond']) {
      for (const fitz of ['I', 'II', 'III', 'IV', 'V', 'VI', 'V', 'IV', 'III', 'II']) {
        statuses.push((await fetch(`${B}/api/complexion/plan`, { method: 'POST', headers: h, body: JSON.stringify({ faceShape: shape, fitzpatrick: fitz }) })).status);
      }
    }
    assert.equal(statuses.length, 60);
    assert.deepEqual([...new Set(statuses)], [200]);
    const flood = await Promise.all(Array.from({ length: 260 }, () => fetch(`${B}/api/health`, { headers: { 'x-forwarded-for': '10.7.7.3' } }).then(r => r.status)));
    assert.ok(flood.includes(429));
    const r = flood.indexOf(429) >= 0 && await fetch(`${B}/api/health`, { headers: { 'x-forwarded-for': '10.7.7.3' } });
    assert.equal(r.status, 429); assert.ok(Number(r.headers.get('retry-after')) >= 1);
  } finally { server.kill(); }
});

const req = (peer, xff, extra = {}) => ({ socket: { remoteAddress: peer }, headers: { ...(xff === undefined ? {} : { 'x-forwarded-for': xff }), ...extra } });

test('private, loopback and Cloudflare hops are trusted proxies; public addresses and junk are not', () => {
  for (const ip of ['10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '127.0.0.1', '::1', '::ffff:10.0.0.1', '162.158.10.1', '104.16.0.1', '2606:4700::6810:1', 'fd00::1']) assert.ok(isTrustedHop(ip), ip);
  for (const ip of ['172.32.0.1', '8.8.8.8', '81.2.69.160', '2001:db8::1', '999.1.1.1', 'garbage', '']) assert.ok(!isTrustedHop(ip), ip);
});

test('behind the proxy, the visitor is the right-most hop that is not a proxy; a typed X-Forwarded-For is ignored', () => {
  // Render: the visitor typed "1.2.3.4"; Cloudflare appended the real address, then the edge and Render's own hops.
  assert.equal(clientAddress(req('10.0.0.5', '1.2.3.4, 81.2.69.160, 162.158.1.1, 10.1.1.1')), '81.2.69.160');
  assert.equal(clientAddress(req('10.0.0.5', '81.2.69.160')), '81.2.69.160');
  // a different made-up value on every request still lands in the same bucket
  const seen = new Set(['5.5.5.5', '6.6.6.6', '7.7.7.7'].map(f => clientAddress(req('10.0.0.5', `${f}, 81.2.69.160, 10.1.1.1`))));
  assert.deepEqual([...seen], ['81.2.69.160']);
  // several X-Forwarded-For headers are read as one list
  assert.equal(clientAddress(req('10.0.0.5', ['6.6.6.6', '81.2.69.160, 10.2.2.2'])), '81.2.69.160');
});

test('a direct connection is its own address whatever it claims', () => {
  assert.equal(clientAddress(req('81.2.69.160', '1.1.1.1')), '81.2.69.160');
  assert.equal(clientAddress(req('81.2.69.160')), '81.2.69.160');
});

test('local tools behind loopback keep their own private test addresses', () => {
  assert.equal(clientAddress(req('127.0.0.1', '10.7.7.2')), '10.7.7.2');
  assert.equal(clientAddress(req('::1')), '::1');
});

test('the logged chain shape carries no addresses', () => {
  const shape = hopShape(req('10.0.0.5', '1.2.3.4, 81.2.69.160, 162.158.1.1, 10.1.1.1', { 'cf-connecting-ip': '81.2.69.160' }));
  assert.equal(shape, 'xff=xxcp peer=trusted cf-connecting-ip=same-as-picked');
  assert.doesNotMatch(shape, /\d+\.\d+\.\d+/);
});
