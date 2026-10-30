/**
 * Transformation engine — turns a user's face profile plus a target look into a
 * staged plan: Stage 1 today (makeup only), Stage 2 this week (brows & hair),
 * Stage 3 the full look. Reuses the product's own engines: look catalogue,
 * shade finder, wig matcher, product formulas, and the knowledge modules
 * (imported defensively, as plan.js does).
 */
import { LOOKS, recommendLooks, scoreLook } from '../look_engine.js';
import { SHADE_SPECTRUM, findShades } from '../shade_finder.js';
import { matchWigs } from '../wig_matchmaker.js';
import { buildAestheticVector } from '../aesthetic.js';
import { artistTagsFor } from '../local_taste.js';
import { getLookProducts } from '../product_engine.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public');
function lookImage(id) {
  const file = `look-${String(id).replace(/_/g, '-')}.webp`;
  return existsSync(join(PUBLIC_DIR, file)) ? `/${file}` : null;
}

export class TransformInputError extends Error {
  constructor(message) { super(message); this.name = 'TransformInputError'; this.status = 400; }
}

const hyphen = (id) => (id ? String(id).replace(/_/g, '-') : null);
const under = (id) => (id ? String(id).replace(/-/g, '_') : 'mixed');
const COMMUNITIES = ['west_african', 'south_asian', 'caribbean', 'arab', 'latina', 'east_asian', 'east_african', 'south_african', 'black_american', 'southeast_asian', 'mixed'];
const UNDERTONES = ['warm', 'cool', 'neutral', 'olive', 'golden', 'red', 'blue', 'peach', 'pink'];
const COMMUNITY_BY_ARCHETYPE = {
  afro_glam: 'west_african', amapiano_beat: 'south_african', hip_hop_glam: 'black_american', caribbean_carnival: 'caribbean',
  bollywood_bridal: 'south_asian', gulf_glam: 'arab', latina_glam: 'latina', k_beauty: 'east_asian', clean_minimal: 'mixed',
};

// ---------------------------------------------------------------------------
// Taste: rank looks from tags, and explain which chips drove the outcome
// ---------------------------------------------------------------------------

/** Rank looks for a set of taste tags (the affinity-weighted vector in aesthetic.js). */
export function rankLooksForTaste(tags = [], { topN = 5 } = {}) {
  const vec = buildAestheticVector(tags);
  return recommendLooks(vec, { topN }).map((r) => ({ id: r.look.id, name: r.look.name, score: r.score }));
}

function describeVector(v) {
  const bits = [];
  if (v.warmth >= 0.7) bits.push('warm'); else if (v.warmth <= 0.3) bits.push('cool');
  if (v.boldness >= 0.7) bits.push('bold'); else if (v.boldness <= 0.3) bits.push('soft');
  if (v.intensity >= 0.7) bits.push('high-drama'); else if (v.intensity <= 0.3) bits.push('understated');
  return bits;
}

/**
 * Only chips that actually moved the vector (or matched a known culture tag) are
 * named. Chips the vocabulary does not recognise carry no signal and are not
 * claimed as a reason.
 */
function becauseLines(look, tasteChips) {
  const lines = [];
  const scored = [];
  for (const chip of tasteChips) {
    const v = buildAestheticVector([chip, ...artistTagsFor(chip)]);
    const moved = v.intensity !== 0.5 || v.warmth !== 0.5 || v.boldness !== 0.5 || (v.cultural_tags?.length ?? 0) > 0;
    const archetypeMatch = v.archetypes?.includes(look.archetype) && moved;
    if (!moved) continue;
    scored.push({ chip, v, fit: scoreLook(look, v) + (archetypeMatch ? 0.15 : 0) });
  }
  scored.sort((a, b) => b.fit - a.fit);
  for (const { chip, v } of scored.slice(0, 2)) {
    const traits = describeVector(v);
    const culture = v.cultural_tags?.[0];
    const parts = [];
    if (traits.length) parts.push(`leaning ${traits.join(' and ')}`);
    if (culture) parts.push(`${culture} influence`);
    lines.push(`Because you love ${chip}: ${parts.join(', ') || 'steering toward this style'} — that is why ${look.name} suits you.`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Knowledge modules (defensive)
// ---------------------------------------------------------------------------

async function tryImport(path) {
  try { return await import(path); } catch { return null; }
}

async function browKnowledge(communityHy) {
  const m = await tryImport('../brow_shaping_guide.js');
  try {
    const g = m?.getBrowGuideForCommunity?.(communityHy);
    if (!g) return null;
    const trad = g.communityTraditions;
    return { shade: g.shadeGuide ?? null, tradition: trad ? (trad.what ?? trad.in_india ?? trad.origin ?? null) : null };
  } catch { return null; }
}

async function linerKnowledge(communityHy) {
  const m = await tryImport('../eyeliner_styles_guide.js');
  try {
    const g = m?.getLinerGuideForCommunity?.(communityHy) ?? m?.getLinerGuideForCommunity?.(under(communityHy));
    const t = g?.communityTraditions;
    if (!t) return null;
    return t.popular_look ?? t.iconic ?? t.bridal ?? Object.values(t).find((v) => typeof v === 'string') ?? null;
  } catch { return null; }
}

async function hairKnowledge(hairTexture) {
  if (!hairTexture) return null;
  const m = await tryImport('../hair_texture_guide.js');
  try {
    const g = m?.getProtectiveStylesByTexture?.(String(hairTexture));
    if (!g) return null;
    return typeof g === 'string' ? g : (g.styles ?? g.description ?? null);
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Face -> base shade (always a real SHADE_SPECTRUM entry)
// ---------------------------------------------------------------------------

function resolveFace(face = {}, look) {
  const undertone = UNDERTONES.includes(face.undertone) ? face.undertone : 'neutral';
  let community = under(face.communityId);
  if (!COMMUNITIES.includes(community)) community = COMMUNITY_BY_ARCHETYPE[look.archetype] ?? 'mixed';

  let shade = face.shadeId ? SHADE_SPECTRUM.find((s) => s.id === face.shadeId) : null;
  let alsoClose = [];
  if (!shade) {
    const depth = Number.isFinite(Number(face.depth)) ? Number(face.depth) : 24;
    const ranked = findShades({ communityId: community, depthTarget: depth, undertone, topN: 3 });
    shade = ranked[0]?.shade ?? SHADE_SPECTRUM[0];
    alsoClose = ranked.slice(1).map((r) => r.shade);
  } else {
    const ranked = findShades({ communityId: community, depthTarget: shade.depth, undertone, topN: 4 });
    alsoClose = ranked.map((r) => r.shade).filter((s) => s.id !== shade.id).slice(0, 2);
  }
  return {
    undertone,
    community,
    shade,
    alsoClose,
    hairTexture: face.hairTexture ?? null,
    hairLength: face.hairLength ?? null,
  };
}

const shadeObj = (s) => ({ name: s.name, hex: s.hex, code: s.id });

// ---------------------------------------------------------------------------
// Stage building
// ---------------------------------------------------------------------------

const specOf = (look, cat) => (look.products ?? []).find((p) => p.category === cat);
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const describeSpec = (p) => {
  if (!p) return '';
  const bits = [
    Array.isArray(p.tones) ? p.tones.join(', ') : null, p.shade, p.colour, p.style, p.placement,
    p.spray ? `${p.spray} setting spray` : null, p.type, p.product,
    p.finish ? `${p.finish} finish` : null, p.coverage ? `${p.coverage} coverage` : null,
  ].filter(Boolean);
  return cap(bits.join(' · '));
};

function formulaFor(formulas, cat) {
  return formulas?.products?.find((p) => p.category === cat) ?? null;
}

export async function buildTransform({ face = {}, targetLookId, tasteChips = [] } = {}) {
  if (!targetLookId || typeof targetLookId !== 'string') throw new TransformInputError('targetLookId is required');
  const look = LOOKS.find((l) => l.id === targetLookId);
  if (!look) throw new TransformInputError(`Unknown look '${String(targetLookId).slice(0, 60)}'`);

  const chips = (Array.isArray(tasteChips) ? tasteChips : []).filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim().slice(0, 60)).slice(0, 20);
  const f = resolveFace(face, look);
  const communityHy = hyphen(f.community);
  const formulas = getLookProducts(look.id, 'medium');

  const [browK, linerK, hairK] = await Promise.all([browKnowledge(communityHy), linerKnowledge(communityHy), hairKnowledge(f.hairTexture)]);

  // --- Stage 1: makeup only (base, eyes, lips) ---
  const baseSpec = specOf(look, 'foundation');
  const baseFormula = formulaFor(formulas, 'foundation');
  const eyeSpec = specOf(look, 'eyeshadow');
  const linerSpec = specOf(look, 'liner');
  const lashSpec = specOf(look, 'lash');
  const lipSpec = specOf(look, 'lip');

  const baseStep = {
    area: 'base',
    title: `Base in ${f.shade.name}`,
    technique: `Apply SPF, then ${describeSpec(baseSpec) || 'a skin-like base'} in ${f.shade.name} (${f.undertone} undertone), pressing in with a damp sponge from the centre of the face outward. ${baseFormula?.tip ?? 'Blend down the jaw and neck so the colour matches.'}`,
    shade: shadeObj(f.shade),
    product: baseFormula?.formula ?? (baseSpec ? `Foundation: ${describeSpec(baseSpec)}` : 'Foundation in your matched shade'),
    why: f.alsoClose.length ? `Closest to your skin and ${f.undertone} undertone. If it looks off in daylight, try ${f.alsoClose.map((s) => s.name).join(' or ')}.` : `Closest to your skin and ${f.undertone} undertone.`,
  };
  const eyeStep = {
    area: 'eyes',
    title: 'Eyes',
    technique: [
      eyeSpec ? `Shadow: ${describeSpec(eyeSpec)}. Sweep the lightest tone over the lid, deepen the outer corner and crease.` : null,
      linerSpec ? `Liner: ${describeSpec(linerSpec)}.` : null,
      lashSpec ? `Lashes: ${describeSpec(lashSpec)}.` : null,
      linerK ? `Community technique: ${linerK}` : null,
    ].filter(Boolean).join(' ') || 'Define the eyes with a soft wash of shadow and liner along the lash line.',
    product: [eyeSpec && 'Eyeshadow', linerSpec && 'Liner', lashSpec && 'Lashes'].filter(Boolean).join(' + ') || undefined,
    why: 'Matches the eye shape and colour story of this look, translated for your depth.',
  };
  const lipStep = {
    area: 'lips',
    title: 'Lips',
    technique: `${describeSpec(lipSpec) || 'Colour that suits your undertone'}. Line the lips first, fill in, then blot and reapply for wear. On ${f.shade.name}, check the colour against your skin in daylight.`,
    product: lipSpec ? `Lip: ${describeSpec(lipSpec)}` : formulaFor(formulas, 'lip')?.formula,
    why: `Finishes the look and balances the ${f.undertone} undertone in your base.`,
  };

  // --- Stage 2: brows + hair ---
  const browSpec = specOf(look, 'brow');
  const browStep = {
    area: 'brows',
    title: 'Brows',
    technique: [
      browSpec ? `Brow: ${describeSpec(browSpec)}.` : 'Shape with short hair-like strokes, then brush up and set.',
      browK?.shade ? `Shade: ${browK.shade}` : null,
      browK?.tradition ? `Tradition: ${browK.tradition}` : null,
    ].filter(Boolean).join(' '),
    why: 'Brows frame the look; the shade is chosen to sit softer than your hair, not harsher.',
  };

  const lookVec = { ...look.weights, archetypes: [look.archetype], hair_vibe: undefined };
  const wigMatches = matchWigs({ aesthetic: lookVec, communityId: f.community, lengthPref: f.hairLength || null, topN: 3 });
  const lookWigIds = new Set((look.wig_styles ?? []).map((w) => w.id));
  const wigs = [
    ...wigMatches.filter((m) => lookWigIds.has(m.wig.id)),
    ...wigMatches.filter((m) => !lookWigIds.has(m.wig.id)),
  ].slice(0, 2);
  const hairSteps = [];
  if (wigs.length) {
    hairSteps.push({
      area: 'hair',
      title: `Hair: ${wigs[0].wig.name}`,
      technique: `${wigs[0].wig.description ?? ''} Order or book this style ahead — it is the longest lead-time step.${wigs[1] ? ` Alternative: ${wigs[1].wig.name}.` : ''}`.trim(),
      wig: { name: wigs[0].wig.name, why: wigs[0].wig.description ?? 'Matches this look’s hair story.' },
      why: lookWigIds.has(wigs[0].wig.id) ? 'One of the styles this look is built around.' : `Fits your ${f.hairLength ?? 'preferred'} length and the look’s energy.`,
    });
  }
  hairSteps.push({
    area: 'hair',
    title: f.hairTexture ? `Prepare your ${f.hairTexture} hair` : 'Prepare your natural hair',
    technique: hairK
      ? `Protective option for your texture: ${hairK}`
      : 'Cleanse, deep-condition, and put hair in a protective base (braids or flat twists) before installing or styling.',
    why: 'Healthy hair underneath is what makes the final style last.',
  });

  // --- Stage 3: the full look = finishing touches + maintenance ---
  const finishCats = ['highlight', 'bronzer', 'blush', 'contour', 'setting', 'gems', 'glitter', 'gold_accents', 'bindi', 'accessories', 'mascara'];
  const finishAreas = { highlight: 'base', bronzer: 'base', blush: 'base', contour: 'base', setting: 'base', gems: 'eyes', glitter: 'eyes', gold_accents: 'eyes', bindi: 'brows', accessories: 'hair', mascara: 'eyes' };
  const FINISH_DEFAULT = {
    setting: 'Mist a setting spray over the finished face', mascara: 'Coat lashes from root to tip',
    highlight: 'Tap highlight on the high points of the face', bronzer: 'Sweep bronzer where the sun would hit',
    blush: 'Blend blush up from the apples of the cheeks', contour: 'Sculpt under the cheekbones, along the jaw and the sides of the nose',
    gems: 'Press face gems on with lash glue', glitter: 'Press glitter on with a glitter primer', gold_accents: 'Add the gold accents with a fine brush',
    bindi: 'Place the bindi centred between the brows', accessories: 'Add the accessories',
  };
  const finishSteps = (look.products ?? []).filter((p) => finishCats.includes(p.category)).map((p) => ({
    area: finishAreas[p.category],
    title: `Finish: ${p.category.replace('_', ' ')}`,
    // Never repeat the title as the technique ("Finish: setting / setting").
    technique: `${describeSpec(p) || FINISH_DEFAULT[p.category] || cap(p.category.replace('_', ' '))}. Add this last so it sits on top of the base.`,
    why: 'The finishing detail that turns the makeup into the full look.',
  }));
  const fullSteps = [
    { area: 'base', title: 'Put it together', technique: `Order of work: skin prep and SPF, base in ${f.shade.name}, brows, eyes, lips, then finish.`, shade: shadeObj(f.shade), why: 'Doing steps in this order keeps colour clean and wear time long.' },
    ...finishSteps,
    { area: 'hair', title: 'Style the hair last', technique: wigs.length ? `Finish with ${wigs[0].wig.name}, then check the whole look in daylight.` : 'Style hair last and check the whole look in daylight.', why: 'Hair changes how the face reads, so it comes last.' },
    { area: 'base', title: 'Keep it going', technique: 'Blot, do not wipe, through the day; re-apply lip colour; at night remove with an oil cleanser and moisturise. Re-check your shade each season as your skin tone shifts.', why: 'Maintenance keeps the look repeatable.' },
  ];

  const stages = [
    { id: 'today', title: 'Today — makeup only', subtitle: 'Base, eyes and lips in your shades.', steps: [baseStep, eyeStep, lipStep] },
    { id: 'week', title: 'This week — brows & hair', subtitle: 'Shape brows and book the hair that completes it.', steps: [browStep, ...hairSteps] },
    { id: 'full', title: 'The full look', subtitle: 'Everything together, finished and maintained.', steps: fullSteps },
  ];

  const because = chips.length ? becauseLines(look, chips) : [];
  const alt = chips.length ? rankLooksForTaste(chips, { topN: 4 }).filter((r) => r.id !== look.id).slice(0, 3) : [];

  return {
    target: { id: look.id, name: look.name, image: lookImage(look.id), description: look.description, archetype: look.archetype },
    face: { shade: shadeObj(f.shade), undertone: f.undertone, community: communityHy, hairTexture: f.hairTexture, hairLength: f.hairLength },
    stages,
    because,
    alternatives: alt,
    source: because.length ? 'taste+catalogue' : 'catalogue',
  };
}
