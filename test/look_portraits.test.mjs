// Signature look portraits: the 8 Style Match looks and the 4 top taste looks each point at a
// WebP card portrait of 60 KB or less, cards say the photo is generated, and keep a fallback.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { getAllLookPreviews as getAllStyleLooks } from '../src/style_match_engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const STYLE = ['desi_baddie', 'persian_queen', 'west_african_glow', 'k_beauty_seoul', 'hammam_goddess', 'mehndi_bride', 'rooibos_glow', 'loc_journey'];
const TASTE = ['afrobeats_concert', 'afro_glam_editorial', 'hbcu_homecoming', 'hip_hop_glam'];
const webp = f => { const b = readFileSync(f); return b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'; };

test('all twelve signature portraits are WebP cards of 60 KB or less', () => {
  for (const id of [...STYLE, ...TASTE]) {
    const f = join(PUB, 'looks', `${id}.webp`);
    assert.ok(webp(f), id); assert.ok(statSync(f).size <= 60 * 1024, `${id} ${statSync(f).size}`);
  }
});

test('Style Match looks (engine and server copy) use the new portraits', () => {
  const looks = getAllStyleLooks();
  for (const id of STYLE) assert.equal(looks.find(l => l.id === id)?.image, `/looks/${id}.webp`, id);
  const srv = readFileSync(join(ROOT, 'src/server.js'), 'utf8');
  for (const id of STYLE) assert.ok(srv.includes(`image: '/looks/${id}.webp'`), `server ${id}`);
});

test('taste look cards map the four top looks; cards label generated photos and fall back', () => {
  const app = readFileSync(join(PUB, 'app.js'), 'utf8');
  for (const id of TASTE) assert.match(app, new RegExp(`${id}: +'looks/${id}\\.webp'`));
  assert.doesNotMatch(app, /not a real person|gen-badge/);
  assert.match(app, /look-card-img"[^>]*onerror="this\.parentElement\.remove\(\)"/);
  assert.match(app, /sm-photo--none/);
});
