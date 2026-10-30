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
import { buildTransform } from './pipeline/transform.js';
import { MirrrAgent } from './agent/mirrr_agent.js';
import { matchShadeByColor, findShades, getShadeSpectrum, getDepthLabels, getUndertoneOptions } from './shade_finder.js';
import { matchWigs, getWigCatalogue, getWigLengths, getWigTextures } from './wig_matchmaker.js';
import { getLookProducts, getAllFormulas, getProductCategories } from './product_engine.js';
import { DEMO_PROFILES } from './demo_profiles.js';
import { getTrendingArtists, getAllTrendingArtists, REGIONAL_ANCHORS } from './trending_artists.js';
import { QlooClient, qlooClient } from './qloo.js';
import { buildPlan } from './pipeline/plan.js';
import { handleLibrary } from './library/routes.js';
import { handleStudio } from './studio/routes.js';
import { handleHairLab } from './hairlab/routes.js';
import { handleSkinClinic } from './skin/routes.js';
import { handleComplexion } from './makeup/routes.js';
import { handleColour } from './colour/routes.js';
import { handleNails } from './nails/routes.js';
import { handleAgeing } from './ageing/routes.js';
import { handleHairRemoval } from './bodyhair/routes.js';
import { handleSmile } from './oral/routes.js';
import { handleNight } from './sleep/routes.js';
import { handleBump } from './pregnancy/routes.js';
import { handleBridal } from './bridal/routes.js';
import { handleMix } from './ingredients/routes.js';
import { handleEco } from './eco/routes.js';
import { handleCalm } from './calm/routes.js';
import { handleLooks } from './looks/routes.js';
import { handleLeap } from './leap/routes.js';
import { handleRoutine } from './routine/routes.js';
import { handleGroom } from './groom/routes.js';
import { handlePhoto } from './photo/routes.js';
import { createRateLimiter, clientAddress, hopShape } from './ratelimit.js';

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

const takeToken = createRateLimiter();

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

// The first few requests after start log the forwarding chain's shape (no addresses) so the
// proxy setup the rate limiter relies on can be checked in the service logs.
let shapesLogged = 0;
function getIP(req) {
  if (shapesLogged < 3 && req.headers['x-forwarded-for']) { shapesLogged++; console.log(`client-ip: ${hopShape(req)}`); }
  return clientAddress(req);
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
  // Images/fonts are content-addressed by filename and long-cached; HTML/JS/CSS always revalidate so a deploy is never masked by a stale copy.
  const cacheControl = isAsset ? 'public, max-age=604800, immutable' : 'no-cache';
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
    const { ok, retryAfter } = takeToken(getIP(req), path);
    if (!ok) {
      res.setHeader('Retry-After', String(retryAfter));
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

  // POST /api/shades/match-color — nearest shades to a skin colour sampled in the browser from the user's photo
  if (method === 'POST' && path === '/api/shades/match-color') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    const { r, g, b, undertone, topN = 5 } = body;
    if (![r, g, b].every(v => Number.isFinite(v) && v >= 0 && v <= 255)) return sendJSON(res, 400, { error: 'r, g, b (0-255) are required' });
    return sendJSON(res, 200, matchShadeByColor({ r, g, b }, { topN: Math.min(Number(topN) || 5, 10), undertone }));
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

  // POST /api/transform — staged transformation plan: face profile + target look -> today / this week / full look
  if (method === 'POST' && path === '/api/transform') {
    const body = await readBody(req).catch(err => { sendJSON(res, 400, { error: err.message }); return null; });
    if (!body) return;
    try {
      const plan = await buildTransform({ face: body.face, targetLookId: body.targetLookId, tasteChips: body.tasteChips });
      return sendJSON(res, 200, plan);
    } catch (err) {
      if (err?.status === 400) return sendJSON(res, 400, { error: err.message });
      console.error('[/api/transform]', err);
      return sendJSON(res, 500, { error: 'Transform error' });
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
      // Sample profiles run the same live Qloo pipeline on their seed names; only when Qloo gives
      // nothing is the result demo data (and labelled so).
      const agent = new MirrrAgent({
        qlooApiKey: process.env.QLOO_API_KEY,
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
      return sendJSON(res, 200, { ...result, meta: { ...result.meta, demo: !result.meta?.qloo_powered, sample_profile: profile } });
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
      west_african_glow: {
        steps: [
          { stepName: 'Prep: Shea + Hydration', zone: 'prep', technique: 'Glow on deeper skin starts with moisture, not highlighter. Press a light layer of shea-based or ceramide moisturiser into damp skin, then a thin SPF. Warm a pea-size amount between palms and press, do not rub, so skin looks lit from within rather than oily.', products: { all: { moisturiser: 'Shea Moisture Raw Shea Butter Face Lotion or Fenty Skin Hydra Vizor Huez SPF 30', spf: 'Supergoop Unseen Sunscreen SPF 40 or Black Girl Sunscreen SPF 30', primer: 'Fenty Beauty Hydra Vizor or a thin layer of facial oil' } } },
          { stepName: 'Luminous Skin Base', zone: 'skin', technique: 'Choose the shade by matching your jaw and neck, then check it in daylight. Use a skin-tint or light foundation and build coverage only where needed. Keep the finish satin, not matte, and skip heavy powder except in the T-zone.', products: { V: { foundation: "Fenty Beauty Soft'Lit Naturally Luminous Foundation, deep shades in the 400 range (match undertone, warm or neutral)", concealer: 'Fenty Beauty Pro Filt\'r Instant Retouch Concealer, one shade lighter than foundation under the eyes', powder: 'Fenty Beauty Pro Filt\'r Instant Retouch Setting Powder in a deep shade, T-zone only' }, VI: { foundation: "Fenty Beauty Soft'Lit Naturally Luminous Foundation, deep shades in the 450 to 500 range (match undertone)", concealer: 'Fenty Beauty Pro Filt\'r Instant Retouch Concealer in a deep shade, one shade lighter than foundation under the eyes', powder: 'Fenty Beauty Pro Filt\'r Instant Retouch Setting Powder in a deep shade, T-zone only' } } },
          { stepName: 'Glossy Natural Eye', zone: 'eyes', technique: 'Keep the eyes soft so the lip can lead. Sweep a warm bronze or copper shade through the crease, press a clear or gold-tinted gloss on the centre of the lid, curl the lashes and finish with one coat of black mascara.', products: { all: { crease: 'Fenty Beauty Snap Shadows palette (warm bronze shades) or a copper-toned MAC eyeshadow', lidGloss: 'Fenty Beauty Gloss Bomb Universal Lip Luminizer, dabbed on the lid', mascara: "L'Oréal Voluminous Lash Paradise, Blackest Black" } } },
          { stepName: 'Defined Brows', zone: 'brows', technique: 'Brush brows up and fill sparse areas with light hair-like strokes. Natural, full and slightly feathered reads fresh and daytime-appropriate.', products: { all: { pencil: 'Anastasia Beverly Hills Brow Wiz in Dark Brown or Ebony', gel: 'Glossier Boy Brow in Black or Brown' } } },
          { stepName: 'Bold Orange-Coral Lip', zone: 'lips', technique: 'Line the edge with a coral or warm-red pencil, fill in, then blot once and re-apply for colour that sits true on deeper lips. Add gloss on the centre for a juicy finish. Orange-coral looks brightest on deeper skin when the formula is creamy, not chalky.', products: { all: { liner: 'MAC Lip Pencil in Chilli or Cherry', lipstick: 'MAC Lipstick in Chili (amplified cream) or Mehr', gloss: 'Fenty Beauty Gloss Bomb in Hot Chocolit (clear over colour: use Universal for a true clear)' } } },
          { stepName: 'Cheek + Highlight', zone: 'cheeks', technique: 'Press cream blush on the apples and tap it up toward the temples. Add a liquid or cream highlight on the high points only. Keep the glow on cheekbone, brow bone and the bridge of the nose.', products: { all: { blush: 'Rare Beauty Soft Pinch Liquid Blush in Joy or Hope', highlight: 'Fenty Beauty Killawatt Freestyle Highlighter in a bronze-gold shade' } } },
          { stepName: 'Set + Lock', zone: 'finish', technique: 'Mist the face lightly and press with fingertips. Only set where you shine in the first hour (centre of the forehead and chin). Hot weather at an owambe or outdoor party needs a setting spray to keep the glow from sliding.', products: { all: { spray: 'Urban Decay All Nighter Long-Lasting Makeup Setting Spray or MAC Fix+', blotting: 'Fenty Beauty Invisimatte Blotting Paper' } } },
        ],
        proTips: [
          'Match foundation to the neck and chest, not just the face; West African skin often varies in depth across the face and neck',
          'Orange-coral looks vibrant when the lipstick undertone is warm; avoid blue-based pinks that can look ashy on deeper skin',
          'If the event is a long owambe, bring a blotting sheet and a small lip gloss for touch-ups',
          'Gele or a headwrap draws attention to the eyes and brows, so keep eye makeup soft and let the lip carry the colour',
        ],
        budget: { low: 90, high: 240, currency: 'CAD' },
      },
      k_beauty_seoul: {
        steps: [
          { stepName: 'Prep: Skin First', zone: 'prep', technique: 'The glass-skin look is built in layers. Cleanse, apply a hydrating toner, then essence, then a light moisturiser, giving each layer a minute to absorb. Finish with a sunscreen. Skip heavy oils under foundation so the base stays fresh.', products: { all: { toner: 'Isntree Hyaluronic Acid Toner or Klairs Supple Preparation Facial Toner', essence: 'COSRX Advanced Snail 96 Mucin Power Essence', moisturiser: 'Laneige Water Bank Blue Hyaluronic Cream', spf: 'Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+' } } },
          { stepName: 'Dewy Glass Skin Base', zone: 'skin', technique: 'Use a cushion or a skin tint and pat it on with the puff, from the centre of the face outward. One thin layer, then spot-conceal. Light-skinned base shades usually work best with a slightly pink or neutral undertone, so test along the jawline.', products: { I: { foundation: 'Laneige Neo Cushion Glow in 17C Porcelain or Hera Black Cushion in a fair shade (or similar)', concealer: 'Clio Kill Cover Concealer in the lightest shade, or a similar K-beauty concealer' }, II: { foundation: 'Laneige Neo Cushion Glow in 21N Beige or Hera Black Cushion in a light shade (or similar)', concealer: 'Clio Kill Cover Concealer in Linen or similar' }, III: { foundation: 'Laneige Neo Cushion Glow in 23N Sand or Hera Black Cushion in a medium shade (or similar)', concealer: 'Clio Kill Cover Concealer in Ginger or similar' } } },
          { stepName: 'Puppy-Eye Liner', zone: 'eyes', technique: 'Use a soft brown or dark brown pencil. Draw a thin line along the upper lash line, extending down slightly at the outer corner for a soft, downturned shape. Add a small amount of shimmer on the centre of the lid and on the aegyo sal (the slight puffiness under the eye). Keep mascara light.', products: { all: { liner: 'Clio Gelpresso Waterproof Pencil Gel Liner in Brown', shimmer: 'Etude House Play Color Eyes in a soft pearl shade', mascara: 'Heroine Make Long & Curl Mascara Super Waterproof' } } },
          { stepName: 'Straight Soft Brows', zone: 'brows', technique: 'Fill in with a soft brown, not black, making the brow horizontal instead of arched. Straight brows create the youthful, soft face K-beauty is known for.', products: { all: { pencil: 'Etude House Drawing Eye Brow in Brown or Rom&nd Han All Brow Pencil in Natural Brown', gel: 'a clear or brown brow gel' } } },
          { stepName: 'Gradient Lip', zone: 'lips', technique: 'Dab tint on the centre of the lips with a finger or applicator, then blend outward with a fingertip so the edges fade softly. Build to your preferred level. The gradient is meant to look like natural flush, not a lipstick outline.', products: { all: { tint: 'Rom&nd Juicy Lasting Tint in Fig Fig or Peripera Ink Mood Glowy Tint', balm: 'Laneige Lip Sleeping Mask underneath for smoothness' } } },
          { stepName: 'Soft Cheeks + Set', zone: 'cheeks', technique: 'Tap a cream or liquid blush high on the cheeks, near the under-eye. Skip bronzer and contouring. Set only the T-zone with a translucent powder, or use a setting mist and leave the rest dewy.', products: { all: { blush: 'Rom&nd Better Than Cheek Blush or Clio Pro Layer Blusher', powder: 'Innisfree No-Sebum Mineral Powder (T-zone only)', spray: 'Etude House Fix and Fix Setting Spray or similar' } } },
        ],
        proTips: [
          'Skin prep matters more than any product, so spend time on layering hydration before makeup',
          'Choose cushion shades by testing on the jawline in daylight; K-beauty shades run lighter and with fewer undertone options',
          'Avoid heavy contour and matte bronzer, which fight the dewy, flat-light K-beauty finish',
          'Blot the T-zone through the day instead of adding more powder, so the glow stays',
        ],
        budget: { low: 70, high: 190, currency: 'CAD' },
      },
      hammam_goddess: {
        steps: [
          { stepName: 'Prep: Hammam-Inspired Glow', zone: 'prep', technique: 'The hammam tradition starts with steam, gentle exfoliation and moisture. Cleanse, gently exfoliate (a soft cloth or a kessa glove works well), then apply a few drops of argan oil mixed with a light moisturiser. Finish with SPF if you are going to be outdoors.', products: { all: { cleanser: 'Beldi black soap (savon beldi) or a gentle cream cleanser', oil: 'Pure argan oil (cosmetic grade) pressed into damp skin', spf: 'Supergoop Unseen Sunscreen SPF 40 or Tower 28 SunnyDays SPF 30 Tinted Skin Tint' } } },
          { stepName: 'Bronze, Skin-Like Base', zone: 'skin', technique: 'Use a sheer skin tint or light foundation that matches the neck, then add warmth with a cream bronzer at the high points of the face where the sun would hit. Keep the texture sheer so freckles and natural texture show.', products: { III: { foundation: 'Tower 28 SunnyDays SPF 30 Tinted Skin Tint or Kosas Revealer Skin-Improving Foundation SPF 25, medium-light shade', bronzer: 'Fenty Beauty Match Stix Matte Contour in a light-medium shade' }, IV: { foundation: 'Tower 28 SunnyDays SPF 30 Tinted Skin Tint or Kosas Revealer Skin-Improving Foundation SPF 25, medium shade', bronzer: 'Fenty Beauty Match Stix Matte Contour in a medium shade' }, V: { foundation: 'Tower 28 SunnyDays SPF 30 Tinted Skin Tint or Kosas Revealer Skin-Improving Foundation SPF 25, medium-deep shade', bronzer: 'Fenty Beauty Match Stix Matte Contour in a medium-deep shade' } } },
          { stepName: 'Gold Kohl Eye', zone: 'eyes', technique: 'Kohl is a long tradition across North Africa and the Arab world. Apply a warm brown or gold kohl pencil on the upper and lower lash lines and smudge slightly with a small brush. Press a gold shimmer on the lid centre, then add one coat of mascara. The finish should be soft and glowing, not graphic.', products: { all: { liner: 'a warm gold-brown kohl pencil such as MAC Eye Kohl in Teddy', shimmer: 'MAC Pro Longwear Paint Pot in Soft Ochre or a gold cream shadow', mascara: 'Maybelline Lash Sensational Sky High, Very Black' } } },
          { stepName: 'Natural Brows', zone: 'brows', technique: 'Brush brows into place and fill only sparse spots. The look is natural, so avoid heavy definition.', products: { all: { gel: 'Benefit Gimme Brow+ in a shade that matches your hair', pencil: 'Anastasia Beverly Hills Brow Wiz, only on sparse areas' } } },
          { stepName: 'Terracotta Lip + Cheek', zone: 'lips', technique: 'Dab a terracotta or brick-rose tint on the lips and press the same colour on the cheeks for a cohesive, sun-warmed face. Blot and re-apply for a soft stain rather than a full opaque lip.', products: { all: { lip: 'MAC Lipstick in Taupe or Brick-o-la (blotted), or Fenty Beauty Gloss Bomb in a warm nude', cheek: 'Rare Beauty Soft Pinch Liquid Blush in Grace or Hope', gloss: 'Kosas Wet Lip Oil Gloss in a warm nude shade' } } },
          { stepName: 'Golden Highlight + Mist', zone: 'finish', technique: 'Tap a golden, cream highlighter on cheekbones and the bridge of the nose. Finish with a rosewater mist, a long-standing practice in Moroccan and wider Arab beauty, to keep the skin looking fresh. Avoid powder if possible.', products: { all: { highlight: 'Fenty Beauty Killawatt Freestyle Highlighter in a gold shade or Rare Beauty Positive Light Liquid Luminizer', mist: 'Rosewater facial mist (pure, alcohol-free)' } } },
        ],
        proTips: [
          'Choose a sheer, skin-like base: the look reads as no-makeup, so heavy coverage works against it',
          'Gold and bronze tones flatter warm and olive undertones best; check shimmer pigments on the inner wrist first',
          'For beach and summer wear, use a waterproof mascara and cream products that do not slide',
          'Keep a small rosewater mist in your bag for a quick refresh on hot days',
        ],
        budget: { low: 80, high: 220, currency: 'CAD' },
      },
      mehndi_bride: {
        steps: [
          { stepName: 'Prep: Long-Wear Foundation Layer', zone: 'prep', technique: 'Bridal events can last many hours, with photography and movement. Cleanse, hydrate, then apply a pore-smoothing primer to the T-zone and a hydrating primer on the cheeks. Allow 5 minutes for each layer to set before foundation.', products: { all: { primer: 'Fenty Beauty Pro Filt\'r Soft Matte Primer on the T-zone, or Smashbox Photo Finish Foundation Primer', hydrating: 'Laneige Water Bank Blue Hyaluronic Cream or a light moisturiser', spf: 'Use a sunscreen without a white cast; avoid flashback for photography' } } },
          { stepName: 'Flawless Glass-Skin Base', zone: 'skin', technique: 'Use a medium-to-full coverage foundation applied with a damp sponge, then conceal and colour-correct where needed (dark circles often need a peach or orange corrector on deeper skin). Bake only lightly with a fine powder and avoid the cakey look, especially in photos.', products: { III: { foundation: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation, medium shades in the 230 to 260 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Custard or similar medium shade', powder: 'Laura Mercier Translucent Loose Setting Powder' }, IV: { foundation: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation, medium-deep shades in the 330 to 360 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Cafe Con Leche or similar medium-deep shade', powder: 'Laura Mercier Translucent Loose Setting Powder, Medium Deep' }, V: { foundation: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation, deep shades in the 420 to 450 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Amande or similar deep shade', powder: 'Black Radiance True Complexion Pressed Powder in a warm deep shade' } } },
          { stepName: 'Jewel-Tone Bridal Eyes', zone: 'eyes', technique: 'Layer a jewel shade, such as emerald, deep teal, gold or burgundy, over a stable cream or primer. Define the upper lash line with a bold black or brown kajal and smudge it slightly for depth. Line the waterline with kajal as well, and finish with false lashes if desired. Match the eye colour to the outfit: many brides coordinate with the colour of the lehenga or jewellery.', products: { all: { primer: 'Urban Decay Eyeshadow Primer Potion', palette: 'Huda Beauty Desert Dusk Eyeshadow Palette or Natasha Denona Bronze Palette', kajal: 'Lakme Eyeconic Kajal or MAC Eye Kohl in Feline', mascara: "L'Oréal Voluminous Lash Paradise Waterproof", lashes: 'Ardell or Huda Beauty false lashes, in a style that suits your eye shape' } } },
          { stepName: 'Statement Brows', zone: 'brows', technique: 'Strong, defined brows frame the eyes and keep the look balanced against the bold lip. Fill the gaps with fine strokes and set with a clear or tinted gel so they hold through a long event.', products: { all: { pencil: 'Anastasia Beverly Hills Brow Wiz in Dark Brown or Ebony', pomade: 'Anastasia Beverly Hills Dipbrow Pomade in Dark Brown', gel: 'Benefit Gimme Brow+ or Glossier Boy Brow' } } },
          { stepName: 'Deep Red Lip', zone: 'lips', technique: 'Outline with a matching liner, fill completely, then blot and re-apply for staying power. A true red or deep red-brick works across the range of South Asian skin tones. Pick a warm red for warm undertones, or a slightly blue-based red for cooler tones.', products: { III: { liner: 'MAC Lip Pencil in Cherry', lipstick: 'MAC Lipstick in Ruby Woo or Russian Red' }, IV: { liner: 'MAC Lip Pencil in Cherry', lipstick: 'MAC Lipstick in Chili or Brick-o-la' }, V: { liner: 'MAC Lip Pencil in Burgundy', lipstick: 'MAC Lipstick in Diva or Sin' } } },
          { stepName: 'Glow + Set for the Photographs', zone: 'finish', technique: 'Apply cream blush and a soft highlight to keep the skin looking alive on camera. Set the base with a finely milled powder, and finish with a long-lasting setting spray. Bridal makeup often needs touch-ups, so a small kit helps.', products: { all: { blush: 'Rare Beauty Soft Pinch Liquid Blush in Joy or Hope', highlight: 'Fenty Beauty Killawatt Freestyle Highlighter', spray: 'Urban Decay All Nighter Long-Lasting Makeup Setting Spray or Kryolan Fixing Spray', touchup: 'Blotting paper, a small lip pencil and a mini concealer' } } },
        ],
        proTips: [
          'Do a full makeup trial in the same lighting you will be photographed in, with the outfit and jewellery nearby',
          'Dark circles are often best handled with colour correction first (peach or orange on deeper skin) and concealer second',
          'Match the lip undertone to the dupatta and jewellery colours so the full look reads as one design',
          'Waterproof mascara and a long-wear liner help, since emotional moments and long hours are part of a mehndi or wedding event',
        ],
        budget: { low: 130, high: 380, currency: 'CAD' },
      },
      rooibos_glow: {
        steps: [
          { stepName: 'Prep: Rooibos + Sun Care', zone: 'prep', technique: 'South African beauty traditions often use rooibos and marula for their antioxidant and moisturising properties. Cleanse, apply a rooibos-based toner or mist, then a light moisturiser. Always finish with SPF: sun-kissed skin is a style, not a reason to skip protection.', products: { all: { toner: 'A rooibos-based toner or mist, or plain rooibos tea cooled and used as a toner', oil: 'Pure marula oil, a few drops pressed into skin', spf: 'Black Girl Sunscreen SPF 30 or Supergoop Unseen Sunscreen SPF 40' } } },
          { stepName: 'Sun-Kissed Skin Base', zone: 'skin', technique: 'A sheer, warm base with some visible skin texture keeps the earthy look natural. Warm undertones in deeper skin often look best with a golden or neutral-warm foundation, so avoid pink-based shades.', products: { IV: { foundation: "Fenty Beauty Soft'Lit Naturally Luminous Foundation, medium-deep shades in the 340 to 360 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Cafe Con Leche or similar', bronzer: 'Fenty Beauty Sun Stalkr Instant Warmth Bronzer in a shade one to two depths deeper than your skin, or a similar warm bronzer' }, V: { foundation: "Fenty Beauty Soft'Lit Naturally Luminous Foundation, deep shades in the 420 to 450 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Amande or similar', bronzer: 'Fenty Beauty Sun Stalkr Instant Warmth Bronzer in a deep warm shade' }, VI: { foundation: "Fenty Beauty Soft'Lit Naturally Luminous Foundation, deep shades in the 450 to 500 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in a deep shade, matched to undertone', bronzer: 'Fenty Beauty Match Stix Matte Contour in a deep shade, used as a warm sweep' } } },
          { stepName: 'Terracotta Eyes', zone: 'eyes', technique: 'Sweep a warm terracotta or burnt orange shade across the lid and blend it into the crease. Add a deeper brown shade along the outer corner. Keep the colour earthy rather than glittery, and finish with brown or black mascara.', products: { all: { palette: 'Huda Beauty Desert Dusk Palette or Natasha Denona Bronze Palette (terracotta shades)', pencil: 'MAC Eye Kohl in Teddy or Smolder', mascara: 'Maybelline Lash Sensational Sky High, Very Black' } } },
          { stepName: 'Brow-Forward', zone: 'brows', technique: 'Brows lead this look. Fill them in with soft, full strokes slightly darker than your natural brow, and brush them up and set with gel.', products: { all: { pencil: 'Anastasia Beverly Hills Brow Wiz in Ebony or Dark Brown', pomade: 'Anastasia Beverly Hills Dipbrow Pomade in Ebony', gel: 'Benefit Gimme Brow+ in Deep or Glossier Boy Brow in Black' } } },
          { stepName: 'Warm Berry Lip', zone: 'lips', technique: 'Use a warm berry or red-brown lipstick, avoiding blue-based tones, which can look ashy. Blot after application, then press another thin layer for a soft stain.', products: { all: { liner: 'MAC Lip Pencil in Chestnut or Burgundy', lipstick: 'MAC Lipstick in Marrakesh or Whirl', gloss: 'Fenty Beauty Gloss Bomb in Hot Chocolit' } } },
          { stepName: 'Cheek + Finish', zone: 'finish', technique: 'Press warm blush on the cheek apples and extend it up toward the temples to mimic sun warmth. A light dusting of powder on the T-zone is enough, and a setting spray will keep the finish fresh for outdoor wear.', products: { all: { blush: 'Rare Beauty Soft Pinch Liquid Blush in Joy or Grace', spray: 'MAC Fix+ or Urban Decay All Nighter Setting Spray' } } },
        ],
        proTips: [
          'Choose warm, golden or red-based tones; cool pinks tend to look ashy against deeper warm skin',
          'For outdoor days, use SPF under a cream-based makeup routine and reapply through the day',
          'The terracotta and berry range looks balanced when only one area is bold; if the brow is strong, soften the eye or lip',
          'Cream products blend better and last longer in dry, sunny weather',
        ],
        budget: { low: 85, high: 230, currency: 'CAD' },
      },
      loc_journey: {
        steps: [
          { stepName: 'Prep: Skin + Edges', zone: 'prep', technique: 'Editorial matte skin on deeper tones starts with a clean, hydrated base so the matte finish does not look dry or flat. Cleanse, moisturise, then apply a blurring primer to the T-zone. Smooth your edges and hairline before makeup so product does not catch on them. A satin or silk scarf around the locs during makeup keeps them out of the way.', products: { all: { moisturiser: 'Black Girl Sunscreen SPF 30 or a ceramide moisturiser', primer: "Fenty Beauty Pro Filt'r Soft Matte Primer on the T-zone", edges: 'Your usual edge control or a gentle gel, kept away from the foundation area' } } },
          { stepName: 'Powerful Matte Base', zone: 'skin', technique: 'Apply a full-coverage matte foundation with a dense brush or damp sponge, pressing into the skin. Colour-correct dark circles with an orange or deep-peach corrector before concealer. Set with a powder that matches your depth, avoiding any with a white cast. The matte finish photographs well under studio lights.', products: { V: { foundation: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation, deep shades in the 420 to 450 range (match undertone)", concealer: 'NARS Radiant Creamy Concealer in Amande or Fenty Beauty Pro Filt\'r Instant Retouch Concealer in a deep shade', powder: 'Fenty Beauty Pro Filt\'r Instant Retouch Setting Powder in a deep shade' }, VI: { foundation: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation, deep shades in the 460 to 500 range (match undertone)", concealer: 'Fenty Beauty Pro Filt\'r Instant Retouch Concealer in a deep shade, matched to undertone', powder: 'Fenty Beauty Pro Filt\'r Instant Retouch Setting Powder in a deep shade' } } },
          { stepName: 'Sculpted Brows', zone: 'brows', technique: 'Sharp, sculpted brows are the frame of this look. Draw the shape with a firm pencil or pomade, clean the edges with concealer and set with a strong gel. Keep the tail clean and the arch intentional.', products: { all: { pomade: 'Anastasia Beverly Hills Dipbrow Pomade in Ebony', pencil: 'Anastasia Beverly Hills Brow Definer in Ebony', gel: 'Benefit Gimme Brow+ in Deep or Maybelline Tattoo Studio Brow Pomade in Deep Brown' } } },
          { stepName: 'Editorial Eye', zone: 'eyes', technique: 'Keep the eye graphic but controlled so the lip stays the focus. A clean matte brown or black wash with a sharp outer edge works well. A metallic accent on the inner corner adds depth for photos.', products: { all: { palette: 'Natasha Denona Mini Xenon or Pat McGrath Mothership palette (matte browns and blacks)', liner: 'Kat Von D Tattoo Liner in Trooper Black', mascara: 'Too Faced Better Than Sex Mascara' } } },
          { stepName: 'Bold Jewel Lip', zone: 'lips', technique: 'Deeper skin tones can carry rich jewel colours such as plum, deep wine, emerald-black or burgundy beautifully. Outline precisely, fill in, then blot and apply a second layer. Use a matte formula for the editorial finish, or a satin one for a softer effect.', products: { all: { liner: 'MAC Lip Pencil in Vino or Plum', lipstick: 'MAC Lipstick in Sin, Diva or Media (matte)', alternative: 'a deep berry liquid lipstick from Fenty Beauty Stunna Lip Paint, matched to your undertone' } } },
          { stepName: 'Contour + Lock', zone: 'finish', technique: 'Contour with a warm-neutral shade under the cheekbone, then tap a soft highlighter on the cheekbone to keep dimension. Finish with a strong setting spray to make the matte base last through a long shoot.', products: { all: { contour: 'Fenty Beauty Match Stix Matte Contour in a deep shade', highlight: 'Fenty Beauty Killawatt Freestyle Highlighter in a bronze or gold shade', spray: 'Urban Decay All Nighter Long-Lasting Makeup Setting Spray or Kryolan Fixing Spray' } } },
        ],
        proTips: [
          'Check the foundation and powder in natural light and on camera, since some products flash back or look ashy',
          'Colour-correct dark circles rather than using a lighter concealer alone, which tends to look grey',
          'If you have locs, protect them with a satin scarf during makeup and keep hair products away from the skin',
          'On a long shoot, keep blotting papers and a lip pencil on hand and touch up the T-zone instead of adding more powder',
        ],
        budget: { low: 120, high: 340, currency: 'CAD' },
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

    const typeOrder = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const requestedType = typeOrder.includes(fitzpatrick) ? fitzpatrick : 'IV';
    const requestedIndex = typeOrder.indexOf(requestedType);
    const nearestType = types => types.reduce((best, type) =>
      !best || Math.abs(typeOrder.indexOf(type) - requestedIndex) < Math.abs(typeOrder.indexOf(best) - requestedIndex)
        ? type : best, null);

    // Prefer one skin type supported by every type-specific step so the label is accurate.
    const typedSteps = guide.steps.map(step => typeOrder.filter(type => Object.hasOwn(step.products, type)))
      .filter(types => types.length > 0);
    const commonTypes = typeOrder.filter(type => typedSteps.every(types => types.includes(type)));
    const candidates = commonTypes.length ? commonTypes : typeOrder.filter(type => typedSteps.some(types => types.includes(type)));
    const fitzpatrickUsed = nearestType(candidates) ?? requestedType;

    const flattenProduct = value => {
      if (Array.isArray(value)) return value.map(flattenProduct).filter(Boolean).join(', ');
      if (value && typeof value === 'object') return Object.entries(value).map(([key, v]) => `${key}: ${flattenProduct(v)}`).join('; ');
      return String(value ?? '');
    };
    const personalisedSteps = guide.steps.map(step => {
      const types = typeOrder.filter(type => Object.hasOwn(step.products, type));
      const chosenType = types.includes(fitzpatrickUsed) ? fitzpatrickUsed : nearestType(types);
      const values = chosenType ? step.products[chosenType] : step.products.all ?? {};
      const products = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, flattenProduct(value)]));
      return { ...step, products };
    });

    return sendJSON(res, 200, {
      lookId,
      fitzpatrick: requestedType,
      fitzpatrickUsed,
      fitzpatrickAvailable: candidates,
      undertone,
      steps: personalisedSteps,
      proTips: guide.proTips,
      shoppingEstimate: guide.budget,
    });
  }

  // GET /api/library, /api/library/search, /api/library/guide/:id
  if (handleLibrary(method, path, url, res, sendJSON)) return;

  // GET /api/studio/options, GET /api/studio/looks, POST /api/studio/plan
  if (await handleStudio(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleHairLab(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleSkinClinic(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleComplexion(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleColour(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleNails(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleAgeing(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleHairRemoval(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleSmile(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleNight(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleBump(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleBridal(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleMix(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleEco(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleCalm(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleLooks(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleLeap(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleRoutine(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handleGroom(method, path, url, req, res, { sendJSON, readBody })) return;
  if (await handlePhoto(method, path, url, req, res, { sendJSON, readBody })) return;

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
