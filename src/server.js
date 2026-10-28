/**
 * MIRRR — Express server
 * Your Taste. Your Looks. Your Style.
 *
 * Most beauty apps were built for the West. MIRRR was built for the rest.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runPipeline } from './pipeline/index.js';
import { narrate } from './llm/index.js';
import { getArchetypes } from './aesthetic.js';
import { LOOKS } from './look_engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(express.json({ limit: '50kb' }));
app.use(express.static(join(__dirname, '../public')));

// Basic CORS for hackathon demo
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Naive in-memory rate limiter: 30 req/min per IP
const _ratemap = new Map();
app.use((req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const window = 60_000;
  const limit = 30;
  let bucket = _ratemap.get(ip);
  if (!bucket || now - bucket.start > window) {
    bucket = { start: now, count: 0 };
  }
  bucket.count++;
  _ratemap.set(ip, bucket);
  if (bucket.count > limit) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    product: 'MIRRR',
    tagline: 'Your Taste. Your Looks. Your Style.',
    qloo_key_set: !!process.env.QLOO_API_KEY,
  });
});

// ---------------------------------------------------------------------------
// GET /api/archetypes — return all look archetypes
// ---------------------------------------------------------------------------

app.get('/api/archetypes', (_req, res) => {
  res.json({ archetypes: getArchetypes() });
});

// ---------------------------------------------------------------------------
// GET /api/looks — return full look catalogue
// ---------------------------------------------------------------------------

app.get('/api/looks', (_req, res) => {
  const looks = LOOKS.map(({ id, name, archetype, description, tags }) => ({
    id, name, archetype, description, tags,
  }));
  res.json({ looks });
});

// ---------------------------------------------------------------------------
// POST /api/taste/profile
//
// Body: { inputs: string[], freeText?: string[] }
//   inputs   — cultural names user likes (artists, films, brands, places)
//   freeText — optional extra signals
//
// Returns: { aesthetic, tags, entities, meta }
// ---------------------------------------------------------------------------

app.post('/api/taste/profile', async (req, res) => {
  const { inputs, freeText = [] } = req.body ?? {};

  if (!Array.isArray(inputs) || inputs.length === 0) {
    return res.status(400).json({
      error: 'inputs must be a non-empty array of cultural names.',
    });
  }

  if (inputs.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 inputs per request.' });
  }

  try {
    const results = await runPipeline({ inputs, freeText });
    const { aesthetic, tags, entities, meta } = results;
    res.json({ aesthetic, tags, entities, meta });
  } catch (err) {
    console.error('[/api/taste/profile]', err);
    res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/taste/looks
//
// Body: { inputs: string[], freeText?: string[], topN?: number }
//
// Returns: { looks, aesthetic, narration, tags, entities, meta }
// ---------------------------------------------------------------------------

app.post('/api/taste/looks', async (req, res) => {
  const { inputs, freeText = [], topN = 3 } = req.body ?? {};

  if (!Array.isArray(inputs) || inputs.length === 0) {
    return res.status(400).json({
      error: 'inputs must be a non-empty array of cultural names.',
    });
  }

  if (inputs.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 inputs per request.' });
  }

  try {
    const results = await runPipeline({ inputs, freeText, topLooks: Math.min(topN, 5) });
    const { narration, source } = await narrate(results);
    res.json({ ...results, narration, narration_source: source });
  } catch (err) {
    console.error('[/api/taste/looks]', err);
    res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/taste/demo
//
// Demo mode — uses curated seed data, no Qloo key needed.
// ---------------------------------------------------------------------------

import { DEMO_PROFILES } from './demo_profiles.js';

app.post('/api/taste/demo', async (req, res) => {
  const { profile = 'afrobeats' } = req.body ?? {};
  const seed = DEMO_PROFILES[profile] ?? DEMO_PROFILES.afrobeats;

  try {
    // Build aesthetic from seed tags directly (no Qloo call)
    const { buildAestheticVector } = await import('./aesthetic.js');
    const { recommendLooks } = await import('./look_engine.js');

    const aesthetic = buildAestheticVector(seed.tags, { freeText: seed.freeText });
    const looks = recommendLooks(aesthetic, { topN: 3 });
    const { narration, source } = await narrate({
      aesthetic,
      looks,
      tags: seed.tags,
      entities: seed.entities,
      meta: { demo: true, profile },
    });

    res.json({
      aesthetic,
      looks,
      narration,
      narration_source: source,
      tags: seed.tags,
      entities: seed.entities,
      meta: { demo: true, profile },
    });
  } catch (err) {
    console.error('[/api/taste/demo]', err);
    res.status(500).json({ error: err.message ?? 'Demo error' });
  }
});

// ---------------------------------------------------------------------------
// 404 catch-all → serve index.html (SPA)
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n🪞 MIRRR — Your Taste. Your Looks. Your Style.`);
  console.log(`   Most beauty apps were built for the West. MIRRR was built for the rest.\n`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Qloo key: ${process.env.QLOO_API_KEY ? '✓ set' : '✗ not set (demo mode available)'}\n`);
});

export default app;
