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
import { QlooClient, qlooClient } from './qloo.js';
import { buildPlan } from './pipeline/plan.js';

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
  '.webp': 'image/webp',
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
  // Images and fonts: cache 7 days; CSS/JS: cache 1 hour (versioned by deploy)
  const isAsset = ['.png','.webp','.jpg','.jpeg','.svg','.ico','.woff','.woff2'].includes(ext);
  const cacheControl = isAsset ? 'public, max-age=604800, immutable' : 'public, max-age=3600';
  try {
    const stat = statSync(filePath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    // Fall through to index.html for SPA routing
    const idx = join(PUBLIC_DIR, 'index.html');
    const stat = statSync(idx);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
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
    // Use process-level singleton so TtlCache persists across requests
    const activeQlooClient = process.env.QLOO_API_KEY ? qlooClient : null;
    try {
      if (communityId) {
        const result = await getTrendingArtists({ communityId, qlooClient: activeQlooClient, limit });
        return sendJSON(res, 200, { trending: result, community: communityId });
      } else {
        const all = await getAllTrendingArtists({ qlooClient: activeQlooClient, limitPerRegion: limit });
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

  // POST /api/plan — occasion planner: look + shade + wig + ritual + timeline
  if (method === 'POST' && path === '/api/plan') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    try {
      const plan = await buildPlan({
        occasion: String(body.occasion ?? '').slice(0, 500),
        communityId: body.communityId,
        fitzpatrick: body.fitzpatrick,
        undertone: body.undertone,
        tasteChips: Array.isArray(body.tasteChips) ? body.tasteChips.slice(0, 10) : [],
      });
      return sendJSON(res, 200, plan);
    } catch (err) {
      console.error('[/api/plan]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Plan error' });
    }
  }

  // GET /api/qloo/diag — raw boundary check: one live Qloo search, status + shape, no key exposed
  if (method === 'GET' && path === '/api/qloo/diag') {
    const key = process.env.QLOO_API_KEY;
    if (!key) return sendJSON(res, 200, { key_set: false });
    const q = new URL(req.url, 'http://x').searchParams.get('q') || 'Burna Boy';
    try {
      const base = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com';
      const r = await fetch(`${base}/v2/search?query=${encodeURIComponent(q)}&limit=3`, { headers: { 'X-API-Key': key, Accept: 'application/json' } });
      const text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch {}
      return sendJSON(res, 200, { key_set: true, key_len: key.length, status: r.status, top_level_keys: json ? Object.keys(json) : null, sample: text.slice(0, 1500) });
    } catch (err) {
      return sendJSON(res, 200, { key_set: true, key_len: key.length, error: err.message });
    }
  }

  // POST /api/agent/refine — agentic multi-turn stylist refinement
  if (method === 'POST' && path === '/api/agent/refine') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const {
      message = '',
      history = [],
      currentAesthetic,
      communityId,
      tasteChips = [],
      refinementCount = 1,
    } = body;

    try {
      const apiKey = process.env.QLOO_API_KEY;

      // Build a revised set of taste signals from the message + history
      const signals = extractRefinementSignals(message, history);

      let looks = [];
      let qlooPowered = false;
      let newAesthetic = currentAesthetic;
      let newCommunityId = communityId;

      // Use taste chips as entity inputs for Qloo if available
      const qlooInputs = tasteChips;

      if (apiKey && qlooInputs.length > 0) {
        const agent = new MirrrAgent({
          qlooApiKey: apiKey,
          options: { topLooks: 6, topShades: 3, topWigs: 3 },
        });
        const result = await agent.run({
          inputs: qlooInputs,
          freeText: [message],
          communityId,
        });
        looks = result.looks ?? [];
        qlooPowered = !!result.meta?.qloo_powered;
        newAesthetic = result.aesthetic ?? currentAesthetic;
        newCommunityId = result.communityId ?? communityId;
      } else {
        // Keyword-based refinement fallback using look engine
        looks = getRefinedLooksFallback(signals, communityId);
      }

      const reply = buildStylistReply(signals, looks, refinementCount);

      return sendJSON(res, 200, {
        reply,
        looks: looks.slice(0, 6),
        source: qlooPowered ? 'qloo' : 'template',
        aesthetic: newAesthetic,
        communityId: newCommunityId,
      });
    } catch (err) {
      console.error('[/api/agent/refine]', err);
      return sendJSON(res, 500, { error: err.message ?? 'Stylist refine error' });
    }
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

  // GET /api/style-match/looks — all look previews (optionally filtered)
  if (method === 'GET' && path === '/api/style-match/looks') {
    const fitzpatrick = url.searchParams.get('fitzpatrick');
    const community = url.searchParams.get('community');
    const vibe = url.searchParams.get('vibe');

    const LOOKS_CATALOGUE = {
      desi_baddie: { id: 'desi_baddie', name: 'Desi Baddie', community: 'south-asian', description: 'Smoky kohl eyes, glossy nude-brown lip, glass skin glow', image: '/look-desi-baddie.webp', vibe: ['bold', 'sultry', 'editorial'], occasion: ['night-out', 'wedding-guest', 'photoshoot'], fitzpatrickRange: ['III', 'IV', 'V'], tags: ['kohl', 'smoky-eye', 'glass-skin', 'nude-lip'] },
      persian_queen: { id: 'persian_queen', name: 'Persian Queen', community: 'arab', description: 'Thick winged liner, jewel-tone lid, bold brows, berry lip', image: '/look-persian-queen.webp', vibe: ['regal', 'dramatic', 'jewel-toned'], occasion: ['evening', 'celebration', 'eid'], fitzpatrickRange: ['II', 'III', 'IV'], tags: ['winged-liner', 'jewel-tone', 'bold-brow', 'berry-lip'] },
      west_african_glow: { id: 'west_african_glow', name: 'West African Glow', community: 'west-african', description: 'Luminous glass skin, bold orange-coral lip, natural glossy eye', image: '/look-west-african-skin.webp', vibe: ['glowing', 'joyful', 'radiant'], occasion: ['daytime', 'brunch', 'owambe'], fitzpatrickRange: ['V', 'VI'], tags: ['glass-skin', 'coral-lip', 'glow', 'melanin'] },
      k_beauty_seoul: { id: 'k_beauty_seoul', name: 'K-Beauty Seoul', community: 'east-asian', description: 'Dewy glass skin, straight brows, gradient lip, puppy-eye liner', image: '/look-k-beauty-seoul.webp', vibe: ['fresh', 'youthful', 'dewy'], occasion: ['everyday', 'daytime', 'casual-date'], fitzpatrickRange: ['I', 'II', 'III'], tags: ['glass-skin', 'gradient-lip', 'puppy-eye', 'k-beauty'] },
      hammam_goddess: { id: 'hammam_goddess', name: 'Hammam Goddess', community: 'arab', description: 'Luminous bronze skin, gold kohl, terracotta lip, no-makeup-makeup', image: '/look-hammam-glow.webp', vibe: ['ethereal', 'golden', 'natural'], occasion: ['beach', 'daytime', 'travel', 'summer'], fitzpatrickRange: ['III', 'IV', 'V'], tags: ['bronze', 'gold-kohl', 'terracotta', 'natural'] },
      mehndi_bride: { id: 'mehndi_bride', name: 'Mehndi Bride', community: 'south-asian', description: 'Full bridal glam — jewel eyes, statement brows, deep red lip, glass skin', image: '/look-mehndi-hands.webp', vibe: ['bridal', 'traditional', 'opulent'], occasion: ['wedding', 'mehndi-night', 'diwali', 'sangeet'], fitzpatrickRange: ['III', 'IV', 'V'], tags: ['bridal', 'jewel-eye', 'red-lip', 'mehndi'] },
      rooibos_glow: { id: 'rooibos_glow', name: 'Rooibos Glow', community: 'south-african', description: 'Earthy terracotta tones, warm berry lip, brow-forward, sun-kissed skin', image: '/look-rooibos-glow.webp', vibe: ['earthy', 'warm', 'grounded'], occasion: ['everyday', 'outdoor', 'casual'], fitzpatrickRange: ['IV', 'V', 'VI'], tags: ['terracotta', 'berry-lip', 'sun-kissed', 'earthy'] },
      loc_journey: { id: 'loc_journey', name: 'LOC Journey', community: 'black-american', description: 'Powerful matte skin, sculpted brows, bold jewel lip, editorial', image: '/look-loc-journey.webp', vibe: ['powerful', 'editorial', 'artistic'], occasion: ['editorial', 'photoshoot', 'statement-look'], fitzpatrickRange: ['V', 'VI'], tags: ['locs', 'editorial', 'bold-lip', 'sculpted'] },
    };

    let looks = Object.values(LOOKS_CATALOGUE);
    if (fitzpatrick) looks = looks.filter(l => l.fitzpatrickRange.includes(fitzpatrick));
    if (community) looks = looks.filter(l => l.community === community);
    if (vibe) looks = looks.filter(l => l.vibe.includes(vibe));

    return sendJSON(res, 200, { looks, total: looks.length, filters: { fitzpatrick, community, vibe } });
  }

  // POST /api/style-match/guide — personalised product breakdown for a look
  if (method === 'POST' && path === '/api/style-match/guide') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { lookId, fitzpatrick = 'IV', undertone = 'neutral' } = body;
    if (!lookId) return sendJSON(res, 400, { error: 'lookId is required' });

    // Step-by-step product breakdown for the look × skin tone
    const GUIDE_DATA = {
      desi_baddie: {
        steps: [
          { stepName: 'Glass Skin Base', zone: 'skin', technique: 'Press foundation into skin with damp beauty sponge. Bounce, do not drag.', products: { III: { foundation: 'Fenty Pro Filt\'r 230W', concealer: 'NARS Radiant Creamy — Syracuse', powder: 'Laura Mercier Translucent Loose' }, IV: { foundation: 'Fenty Pro Filt\'r 350W', concealer: 'NARS Radiant Creamy — Custard', powder: 'Laura Mercier Translucent Medium Deep' }, V: { foundation: 'Fenty Pro Filt\'r 420W', concealer: 'NARS Radiant Creamy — Amande', powder: 'Black Radiance Loose Setting — Warm Caramel' } } },
          { stepName: 'Kohl Smoky Eye', zone: 'eyes', technique: 'Prime lids. Black shadow on lid, brown in crease. Kohl the entire waterline — both top and bottom. This is the Desi Baddie signature.', products: { all: { primer: 'Urban Decay EPPP Original', lid: 'MAC Carbon (matte black)', crease: 'MAC Mulch (warm brown)', liner: "L'Oréal Le Khol 101 Midnight Black", mascara: "L'Oréal Voluminous Lash Paradise — Blackest Black" } } },
          { stepName: 'Bold Brows', zone: 'brows', technique: 'Short hair-strokes fill gaps only. Do not overdraw.', products: { all: { pencil: 'Anastasia Brow Wiz — Dark Brown or Ebony', gel: 'Glossier Boy Brow — Brown or Black' } } },
          { stepName: 'Glossy Nude-Brown Lip', zone: 'lips', technique: 'Line with brown liner slightly outside lip line. Fill in. Apply lipstick, then gloss on centre only.', products: { III: { liner: 'MAC Spice Lip Pencil', lipstick: 'MAC Velvet Teddy', gloss: 'Fenty Gloss Bomb — Fenty Glow' }, IV: { liner: 'MAC Chestnut Lip Pencil', lipstick: 'MAC Kinda Sexy', gloss: 'Fenty Gloss Bomb — Fu$$y' }, V: { liner: 'MAC Currant Lip Pencil', lipstick: 'MAC Marrakesh', gloss: 'NARS Afterglow Lip Shine — Orgasm' } } },
        ],
        proTips: ['Kohl the entire waterline — top and bottom — this is what makes the look distinctly Desi', 'Clean up eyeshadow fallout AFTER completing eyes, not during', 'For photos: increase highlighter 20% — cameras eat light'],
        budget: { low: 85, high: 220, currency: 'CAD' },
      },
      persian_queen: {
        steps: [
          { stepName: 'Matte Olive Base', zone: 'skin', technique: 'Persian/Arab skin has olive undertones. Avoid pink foundations. Build coverage only where needed.', products: { II: { foundation: 'Giorgio Armani Luminous Silk 3.5', concealer: 'Charlotte Tilbury Magic Away 3 Fair' }, III: { foundation: 'Giorgio Armani Luminous Silk 5', concealer: 'Charlotte Tilbury Magic Away 5 Medium' }, IV: { foundation: 'NARS Sheer Glow — Syracuse', concealer: 'NARS Radiant Creamy — Custard' } } },
          { stepName: 'Jewel Lid + Thick Wing', zone: 'eyes', technique: 'Emerald, sapphire or amethyst on lid. Apply shadow BEFORE liner to avoid disturbing wing. Then draw thick wing — extend 1–1.5cm past outer corner.', products: { all: { primer: 'Too Faced Shadow Insurance', jewel: 'Urban Decay Woodstock (purple) or Pat McGrath Emerald', crease: 'MAC Woodwinked (warm gold-brown)', liner: 'Kat Von D Tattoo Liner — Trooper Black', mascara: 'Benefit BADgal BANG — Black' } } },
          { stepName: 'Statement Brows', zone: 'brows', technique: 'Square the front of the brow slightly for power. Not arched — horizontal.', products: { all: { pencil: 'Anastasia Brow Definer — Dark Brown or Ebony', pomade: 'Anastasia Dipbrow — Dark Brown', gel: 'Boy Brow Glossier — Black' } } },
          { stepName: 'Rich Berry Lip', zone: 'lips', technique: 'Fill lips fully with liner for staying power. Berry, wine, deep rose — rich not muted.', products: { II: { liner: 'Charlotte Tilbury Lip Cheat — Pillow Talk Medium', lipstick: 'Charlotte Tilbury Matte Revolution — Glastonberry' }, III: { liner: 'MAC Currant', lipstick: 'MAC Rebel (berry-plum)' }, IV: { liner: 'MAC Vino', lipstick: 'Huda Beauty Power Bullet — Starstruck' } } },
        ],
        proTips: ['Apply jewel shadow before liner to avoid ruining your wing with fallout', 'Practice the wing on the back of your hand first — both sides must match', 'Set whole face with rosewater mist at end for dewy-over-matte finish'],
        budget: { low: 110, high: 300, currency: 'CAD' },
      },
    };

    const guide = GUIDE_DATA[lookId];
    if (!guide) {
      return sendJSON(res, 200, {
        lookId,
        message: `Style guide for ${lookId} — personalised for Fitzpatrick Type ${fitzpatrick}`,
        fitzpatrick,
        undertone,
        steps: [],
        note: 'Full guide available in the Style Match feature on the app',
      });
    }

    const personalisedSteps = guide.steps.map(step => {
      const products = step.products[fitzpatrick] || step.products['all'] || step.products;
      return { ...step, products };
    });

    return sendJSON(res, 200, {
      lookId,
      fitzpatrick,
      undertone,
      steps: personalisedSteps,
      proTips: guide.proTips,
      shoppingEstimate: guide.budget,
    });
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

  // Self-ping every 10 minutes to prevent Render free-tier cold starts.
  // Render spins down after ~15 min inactivity; this keeps the process warm.
  const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`;
  setInterval(() => {
    import('http').then(({ default: http }) => {
      const req = http.get(`${SELF_URL}/api/health`, (res) => { res.resume(); });
      req.on('error', () => {}); // silently ignore; best-effort
    }).catch(() => {});
  }, 10 * 60 * 1000); // 10 minutes
});

export default server;

// ─── REFINEMENT HELPER FUNCTIONS ─────────────────────────────────────────────
// These functions support the /api/agent/refine endpoint

/**
 * Extract refinement signals from user message and conversation history
 * @param {string} message - The user's refinement message
 * @param {Array} history - Prior conversation history
 * @returns {Object} Extracted signals for refinement
 */
function extractRefinementSignals(message, history) {
  const msg = (message || '').toLowerCase();
  
  const signals = {
    wantsMoreBold: /bold|dramatic|intense|stronger|more|brighter/.test(msg),
    wantsSubtler: /subtle|soft|natural|lighter|less|minimal|understated/.test(msg),
    wantsDifferentOccasion: /work|office|day|night|wedding|festival|everyday|casual|party|event/.test(msg),
    wantsTraditional: /traditional|cultural|heritage|classic|authentic/.test(msg),
    wantsModern: /modern|trendy|contemporary|current|new|fresh/.test(msg),
    mentionedColour: /red|pink|nude|gold|brown|blue|green|purple|coral|orange|wine|berry/.test(msg),
    mentionedSkin: /skin|tone|dark|light|deep|fair|medium|melanin/.test(msg),
    mentionedHair: /hair|curly|coily|straight|wavy|natural|locs|braids/.test(msg),
    extractedKeywords: msg.split(/\s+/).filter(w => w.length > 3).slice(0, 8),
    rawMessage: message,
  };

  // Extract occasion from history if not in current message
  if (history && history.length > 0) {
    const historyText = history.map(h => h.content || '').join(' ').toLowerCase();
    signals.priorOccasion = historyText.match(/wedding|festival|everyday|party|work/)?.[0] || null;
    signals.priorCommunity = historyText.match(/south-asian|west-african|arab|latina|caribbean|east-asian|east-african|south-african|black-american/)?.[0] || null;
  }

  return signals;
}

/**
 * Build refined looks fallback when Qloo is unavailable or returns insufficient results
 * @param {Object} signals - Extracted refinement signals
 * @param {string} communityId - The user's community
 * @returns {Array} Array of look objects
 */
function getRefinedLooksFallback(signals, communityId) {
  // Import community looks from look_styles if available
  const community = communityId || 'all';
  
  // Default refined look suggestions
  const baseLooks = [
    {
      id: `refined-${community}-1`,
      name: signals.wantsBold ? 'Bold Statement Look' : 'Refined Classic Look',
      community: community,
      occasion: signals.wantsMoreBold ? 'Evening / Event' : 'Everyday',
      description: signals.wantsMoreBold
        ? 'A dramatic, high-impact look with deep colour and definition.'
        : 'A polished, versatile look that transitions from day to evening.',
      type: 'look_refinement',
    },
    {
      id: `refined-${community}-2`,
      name: signals.wantsTraditional ? 'Cultural Heritage Look' : 'Modern Fusion Look',
      community: community,
      occasion: signals.wantsTraditional ? 'Cultural Event / Celebration' : 'Contemporary',
      description: signals.wantsTraditional
        ? 'Draws from traditional beauty heritage with authentic ingredients and techniques.'
        : 'A contemporary take that fuses cultural identity with modern beauty.',
      type: 'look_refinement',
    },
    {
      id: `refined-${community}-3`,
      name: 'Signature Edit',
      community: community,
      occasion: 'Your Choice',
      description: `A personalised refinement built from your feedback — ${signals.extractedKeywords.join(', ')}.`,
      type: 'look_refinement',
    },
  ];

  return baseLooks;
}

/**
 * Build a natural stylist reply for the refinement conversation
 * @param {Object} signals - Extracted refinement signals  
 * @param {Array} looks - The refined looks to present
 * @param {number} refinementCount - How many refinements have been done
 * @returns {string} Natural language reply from the AI stylist
 */
function buildStylistReply(signals, looks, refinementCount) {
  const lookNames = looks.map(l => l.name ?? l.look?.name).filter(Boolean).join(', ');
  
  const openers = [
    "Got it — I'm reading what you're looking for.",
    "I hear you. Let me adjust the direction.",
    "Perfect, that's helpful context.",
    "Understood — let me refine your recommendations.",
  ];

  const opener = openers[refinementCount % openers.length];

  let body = '';
  
  if (signals.wantsMoreBold) {
    body = `You want something bolder and more statement-making. I've shifted toward stronger colours and more definition.`;
  } else if (signals.wantsSubtler) {
    body = `Softer, more understated — I've moved away from heavy coverage and bold colour toward something more effortless.`;
  } else if (signals.wantsTraditional) {
    body = `Leaning into cultural heritage. These are rooted in tradition, with techniques and ingredients from the community's beauty history.`;
  } else if (signals.wantsModern) {
    body = `Contemporary and current. These looks draw on cultural identity but read completely modern.`;
  } else {
    body = `I've re-ranked the directions around what you described.`;
  }

  const closer = looks.length > 0 && lookNames
    ? `Top picks now: ${lookNames}. Which direction resonates most?`
    : `Let me know if you'd like to refine further — I can keep narrowing this down.`;

  return `${opener} ${body} ${closer}`;
}
