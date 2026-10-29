/**
 * MIRRR — HTTP server (Node built-ins only, no Express)
 * Your Taste. Your Looks. Your Style.
 *
 * Most beauty apps were built for the West. MIRRR was built for the rest.
 */

import { createServer } from 'http';
import { createReadStream, statSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { runPipeline } from './pipeline/index.js';
import { narrate } from './llm/index.js';
import { getArchetypes } from './aesthetic.js';
import { LOOKS } from './look_engine.js';
import { scoreDNA, getCommunities, QUIZ_QUESTIONS } from './cultural_dna.js';
import { MirrrAgent } from './agent/mirrr_agent.js';
import { findShades, getShadeSpectrum, getDepthLabels, getUndertoneOptions } from './shade_finder.js';
import { matchWigs, getWigCatalogue, getWigLengths, getWigTextures } from './wig_matchmaker.js';
import { getLookProducts, getAllFormulas, getProductCategories } from './product_engine.js';
import { DEMO_PROFILES } from './demo_profiles.js';
import { getTrendingArtists, getAllTrendingArtists, REGIONAL_ANCHORS } from './trending_artists.js';
import { QlooClient } from './qloo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;
const PUBLIC_DIR = join(__dirname, '../public');

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

const _ratemap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 60_000;
  const limit = 30;
  let bucket = _ratemap.get(ip);
  if (!bucket || now - bucket.start > window) bucket = { start: now, count: 0 };
  bucket.count++;
  _ratemap.set(ip, bucket);
  return bucket.count <= limit;
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? 'unknown';
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 50 * 1024) { req.destroy(); return reject(new Error('Body too large')); }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const mime = MIME[ext] ?? 'application/octet-stream';
  try {
    const stat = statSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size });
    createReadStream(filePath).pipe(res);
  } catch {
    // Fall through to index.html for SPA routing
    const idx = join(PUBLIC_DIR, 'index.html');
    const stat = statSync(idx);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat.size });
    createReadStream(idx).pipe(res);
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function router(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const path = url.pathname;
  const method = req.method;

  setCORS(res);
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Rate limit API routes
  if (path.startsWith('/api/')) {
    if (!checkRateLimit(getIP(req))) {
      return sendJSON(res, 429, { error: 'Too many requests. Please slow down.' });
    }
  }

  // -------------------------------------------------------------------------
  // Static files
  // -------------------------------------------------------------------------

  if (!path.startsWith('/api/')) {
    const filePath = join(PUBLIC_DIR, path === '/' ? 'index.html' : path);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      return serveStatic(res, filePath);
    }
    // SPA fallback
    return serveStatic(res, join(PUBLIC_DIR, 'index.html'));
  }

  // -------------------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------------------

  // GET /api/health
  if (method === 'GET' && path === '/api/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      product: 'MIRRR',
      tagline: 'Your Taste. Your Looks. Your Style.',
      qloo_key_set: !!process.env.QLOO_API_KEY,
    });
  }

  // GET /api/archetypes
  if (method === 'GET' && path === '/api/archetypes') {
    return sendJSON(res, 200, { archetypes: getArchetypes() });
  }

  // GET /api/looks
  if (method === 'GET' && path === '/api/looks') {
    const looks = LOOKS.map(({ id, name, archetype, description, tags }) => ({ id, name, archetype, description, tags }));
    return sendJSON(res, 200, { looks });
  }

  // GET /api/communities
  if (method === 'GET' && path === '/api/communities') {
    return sendJSON(res, 200, { communities: getCommunities() });
  }

  // GET /api/quiz
  if (method === 'GET' && path === '/api/quiz') {
    return sendJSON(res, 200, { questions: QUIZ_QUESTIONS });
  }

  // POST /api/dna/score
  if (method === 'POST' && path === '/api/dna/score') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { answers } = body;
    if (!answers || typeof answers !== 'object') {
      return sendJSON(res, 400, { error: 'answers must be an object { questionId: optionId }' });
    }
    try {
      return sendJSON(res, 200, scoreDNA(answers));
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  // GET /api/shades/spectrum
  if (method === 'GET' && path === '/api/shades/spectrum') {
    return sendJSON(res, 200, {
      spectrum: getShadeSpectrum(),
      depth_labels: getDepthLabels(),
      undertone_options: getUndertoneOptions(),
    });
  }

  // POST /api/shades/find
  if (method === 'POST' && path === '/api/shades/find') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { communityId, depthTarget, undertone, topN = 6 } = body;
    if (depthTarget === undefined) return sendJSON(res, 400, { error: 'depthTarget is required (1–30)' });
    return sendJSON(res, 200, { shades: findShades({ communityId, depthTarget, undertone, topN }) });
  }

  // GET /api/wigs/catalogue
  if (method === 'GET' && path === '/api/wigs/catalogue') {
    return sendJSON(res, 200, {
      wigs: getWigCatalogue(),
      lengths: getWigLengths(),
      textures: getWigTextures(),
    });
  }

  // POST /api/wigs/match
  if (method === 'POST' && path === '/api/wigs/match') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { aesthetic, communityId, lengthPref, texturePref, topN = 5 } = body;
    if (!aesthetic) return sendJSON(res, 400, { error: 'aesthetic object is required' });
    return sendJSON(res, 200, { wigs: matchWigs({ aesthetic, communityId, lengthPref, texturePref, topN }) });
  }

  // GET /api/products/categories
  if (method === 'GET' && path === '/api/products/categories') {
    return sendJSON(res, 200, { categories: getProductCategories() });
  }

  // GET /api/products/looks
  if (method === 'GET' && path === '/api/products/looks') {
    return sendJSON(res, 200, { looks: getAllFormulas() });
  }

  // GET /api/products/look/:lookId
  const lookMatch = path.match(/^\/api\/products\/look\/([^/]+)$/);
  if (method === 'GET' && lookMatch) {
    const lookId = lookMatch[1];
    const depth = url.searchParams.get('depth') ?? 'medium';
    const products = getLookProducts(lookId, depth);
    if (!products) return sendJSON(res, 404, { error: `Look '${lookId}' not found` });
    return sendJSON(res, 200, { products });
  }

  // POST /api/taste/profile
  if (method === 'POST' && path === '/api/taste/profile') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { inputs, freeText = [] } = body;
    if (!Array.isArray(inputs) || inputs.length === 0)
      return sendJSON(res, 400, { error: 'inputs must be a non-empty array of cultural names.' });
    if (inputs.length > 20) return sendJSON(res, 400, { error: 'Maximum 20 inputs per request.' });
    try {
      const { aesthetic, tags, entities, meta } = await runPipeline({ inputs, freeText });
      return sendJSON(res, 200, { aesthetic, tags, entities, meta });
    } catch (err) {
      console.error('[/api/taste/profile]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Internal error' });
    }
  }

  // POST /api/taste/looks
  if (method === 'POST' && path === '/api/taste/looks') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { inputs, freeText = [], topN = 3 } = body;
    if (!Array.isArray(inputs) || inputs.length === 0)
      return sendJSON(res, 400, { error: 'inputs must be a non-empty array of cultural names.' });
    if (inputs.length > 20) return sendJSON(res, 400, { error: 'Maximum 20 inputs per request.' });
    try {
      const results = await runPipeline({ inputs, freeText, topLooks: Math.min(topN, 5) });
      const { narration, source } = await narrate(results);
      return sendJSON(res, 200, { ...results, narration, narration_source: source });
    } catch (err) {
      console.error('[/api/taste/looks]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Internal error' });
    }
  }

  // POST /api/taste/demo
  if (method === 'POST' && path === '/api/taste/demo') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { profile = 'afrobeats' } = body;
    const seed = DEMO_PROFILES[profile] ?? DEMO_PROFILES.afrobeats;
    try {
      const { buildAestheticVector } = await import('./aesthetic.js');
      const { recommendLooks } = await import('./look_engine.js');
      const aesthetic = buildAestheticVector(seed.tags, { freeText: seed.freeText });
      const looks = recommendLooks(aesthetic, { topN: 3 });
      const { narration, source } = await narrate({ aesthetic, looks, tags: seed.tags, entities: seed.entities, meta: { demo: true, profile } });
      return sendJSON(res, 200, { aesthetic, looks, narration, narration_source: source, tags: seed.tags, entities: seed.entities, meta: { demo: true, profile } });
    } catch (err) {
      console.error('[/api/taste/demo]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Demo error' });
    }
  }

  // POST /api/agent/run
  if (method === 'POST' && path === '/api/agent/run') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    if ((!Array.isArray(body.inputs) || body.inputs.length === 0) &&
        (!body.dnaAnswers || Object.keys(body.dnaAnswers).length === 0)) {
      return sendJSON(res, 400, { error: 'Provide inputs (cultural names) and/or dnaAnswers from the quiz.' });
    }
    if (Array.isArray(body.inputs) && body.inputs.length > 20)
      return sendJSON(res, 400, { error: 'Maximum 20 inputs per request.' });
    try {
      const agent = new MirrrAgent({
        qlooApiKey: process.env.QLOO_API_KEY,
        options: { topLooks: 3, topShades: 6, topWigs: 5 },
      });
      const result = await agent.run({
        inputs: body.inputs ?? [],
        freeText: body.freeText ?? [],
        dnaAnswers: body.dnaAnswers,
        communityId: body.communityId,
        depthTarget: body.depthTarget,
        undertone: body.undertone,
        lengthPref: body.lengthPref,
        texturePref: body.texturePref,
      });
      return sendJSON(res, 200, result);
    } catch (err) {
      console.error('[/api/agent/run]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Agent error' });
    }
  }

  // GET /api/trending?community=west_african&limit=6
  if (method === 'GET' && path === '/api/trending') {
    const communityId = url.searchParams.get('community') ?? null;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '6', 10), 12);
    const qlooClient = process.env.QLOO_API_KEY
      ? new QlooClient({ apiKey: process.env.QLOO_API_KEY })
      : null;
    try {
      if (communityId) {
        const result = await getTrendingArtists({ communityId, qlooClient, limit });
        return sendJSON(res, 200, { trending: result, community: communityId });
      } else {
        const all = await getAllTrendingArtists({ qlooClient, limitPerRegion: limit });
        return sendJSON(res, 200, { trending: all });
      }
    } catch (err) {
      console.error('[/api/trending]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Trending error' });
    }
  }

  // GET /api/trending/regions — list all available regions
  if (method === 'GET' && path === '/api/trending/regions') {
    return sendJSON(res, 200, {
      regions: Object.keys(REGIONAL_ANCHORS).map(key => ({
        id: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        artistCount: REGIONAL_ANCHORS[key].length,
      })),
    });
  }

  // POST /api/agent/demo
  if (method === 'POST' && path === '/api/agent/demo') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { profile = 'afrobeats', depthTarget, undertone, lengthPref, texturePref } = body;
    const seed = DEMO_PROFILES[profile] ?? DEMO_PROFILES.afrobeats;
    try {
      const agent = new MirrrAgent({
        qlooApiKey: null,
        options: { topLooks: 3, topShades: 6, topWigs: 5 },
      });
      const result = await agent.run({
        inputs: seed.entities?.map(e => e.name) ?? [],
        freeText: seed.freeText ?? [],
        dnaAnswers: seed.dnaAnswers,
        communityId: seed.communityId,
        depthTarget: depthTarget ?? seed.depthTarget,
        undertone: undertone ?? seed.undertone,
        lengthPref: lengthPref ?? seed.lengthPref,
        texturePref: texturePref ?? seed.texturePref,
      });
      return sendJSON(res, 200, { ...result, meta: { ...result.meta, demo: true, profile } });
    } catch (err) {
      console.error('[/api/agent/demo]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Demo agent error' });
    }
  }

  // 404
  return sendJSON(res, 404, { error: 'Not found' });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  try {
    await router(req, res);
  } catch (err) {
    console.error('[unhandled]', err);
    if (!res.headersSent) sendJSON(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n🪞 MIRRR — Your Taste. Your Looks. Your Style.`);
  console.log(`   Most beauty apps were built for the West. MIRRR was built for the rest.\n`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Qloo key: ${process.env.QLOO_API_KEY ? '✓ set' : '✗ not set (demo mode available)'}\n`);
});

export default server;
