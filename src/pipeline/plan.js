/**
 * Occasion planner — turns a free-text occasion into a multi-step plan by
 * chaining the product's own modules: look catalogue -> shade finder ->
 * wig matcher -> festival/bridal ritual knowledge -> timeline.
 * Constraints extracted from the text (outdoor, evening, tradition) propagate
 * into look filtering and the timeline.
 */
import { INSPIRATION_LOOKS, getPersonalisedLook } from '../style_match_engine.js';
import { findShades } from '../shade_finder.js';
import { matchWigs } from '../wig_matchmaker.js';
import { wantsWig, finishBasis, finishingSteps } from '../finishing.js';
import { buildAestheticVector, ARCHETYPE_KEYWORDS } from '../aesthetic.js';
import { qlooTaste, provenance } from '../taste_signals.js';
import { lookEvidence } from '../look_engine.js';

// Fitzpatrick type -> depth on the shade spectrum (I ~ Monk 1-2 ... VI ~ Monk 9-10, L* about 20).
const FITZ_DEPTH = { I: 3, II: 8, III: 16, IV: 26, V: 38, VI: 47 };
const COMMUNITIES = ['west-african', 'south-asian', 'caribbean', 'arab', 'latina', 'east-asian', 'east-african', 'south-african', 'black-american'];

const OCCASION_KEYS = [
  { key: 'wedding', words: ['wedding', 'bridal', 'bride', 'nikah', 'sangeet', 'mehndi', 'reception'], tags: ['wedding', 'wedding-guest', 'mehndi-night', 'sangeet', 'celebration', 'owambe'] },
  { key: 'eid', words: ['eid', 'ramadan', 'iftar'], tags: ['eid', 'eid-glam', 'celebration', 'evening'] },
  { key: 'diwali', words: ['diwali', 'navratri', 'holi', 'festival of lights'], tags: ['diwali', 'celebration', 'evening'] },
  { key: 'festival', words: ['festival', 'carnival', 'concert', 'owambe', 'party'], tags: ['celebration', 'owambe', 'night-out', 'statement-look'] },
  { key: 'night-out', words: ['night out', 'club', 'date night', 'dinner', 'evening', 'night'], tags: ['night-out', 'evening', 'casual-date'] },
  { key: 'work', words: ['work', 'office', 'interview', 'meeting', 'professional'], tags: ['everyday', 'daytime', 'casual'] },
  { key: 'photoshoot', words: ['photoshoot', 'photo shoot', 'shoot', 'editorial', 'headshot'], tags: ['photoshoot', 'editorial', 'art-event'] },
  { key: 'daytime', words: ['brunch', 'day', 'daytime', 'picnic', 'beach', 'summer', 'travel'], tags: ['daytime', 'brunch', 'beach', 'summer', 'travel', 'casual', 'outdoor'] },
];

export function parseOccasion(text = '') {
  const t = String(text).toLowerCase();
  const matched = OCCASION_KEYS.filter(o => o.words.some(w => t.includes(w)));
  const outdoor = /outdoor|outside|garden|beach|park|patio|sun|hot|humid|summer|picnic/.test(t);
  const evening = /evening|night|dinner|reception|club|sangeet|iftar/.test(t);
  const traditional = /tradition|heritage|honou?r|cultural|ceremony|bridal|nikah|mehndi|sangeet|durbar|owambe/.test(t);
  const subtle = /subtle|natural|soft|minimal|understated/.test(t);
  const bold = /bold|dramatic|statement|glam|full/.test(t);
  return { keys: matched.map(m => m.key), tags: [...new Set(matched.flatMap(m => m.tags))], outdoor, evening, traditional, subtle, bold };
}

function normCommunityHyphen(id) { return id ? String(id).replace(/_/g, '-') : null; }
function normCommunityUnder(id) { return id ? String(id).replace(/-/g, '_') : 'mixed'; }

/** Archetype each planner community belongs to, so Qloo's tags can speak for a community's looks. */
const COMMUNITY_ARCH = { 'west-african': 'afro_glam', 'south-african': 'afro_glam', 'east-african': 'afro_glam', 'black-american': 'hip_hop_glam', caribbean: 'caribbean_carnival', 'south-asian': 'desi_glam', arab: 'gulf_glam', latina: 'latina_glam', 'east-asian': 'k_beauty' };

function pickLook(parsed, communityId, fitz, kept = []) {
  const all = Object.values(INSPIRATION_LOOKS);
  const totalAff = 2 * kept.reduce((a, t) => a + (t.weight ?? t.affinity ?? 1), 0);
  const qShare = (l) => { if (!totalAff) return { share: 0, tags: [] }; const ev = lookEvidence({ archetype: COMMUNITY_ARCH[l.community], cultural_affinity: [...(l.vibe ?? []), ...(l.tags ?? [])] }, kept, ARCHETYPE_KEYWORDS); return { share: ev.reduce((a, t) => a + t.ev, 0) / totalAff, tags: ev.map(t => t.name) }; };
  const score = (l) => {
    let s = 6 * qShare(l).share;
    if (communityId && l.community === communityId) s += 4;
    const occHits = (l.occasion ?? []).filter(o => parsed.tags.includes(o)).length;
    s += occHits * 2;
    if (fitz && l.fitzpatrickRange?.includes(fitz)) s += 2;
    const vibes = l.vibe ?? [];
    if (parsed.bold && vibes.some(v => ['bold', 'dramatic', 'glam', 'regal'].includes(v))) s += 1;
    if (parsed.subtle && vibes.some(v => ['natural', 'soft', 'minimal', 'effortless', 'fresh'].includes(v))) s += 1;
    if (parsed.outdoor && (l.occasion ?? []).some(o => ['outdoor', 'daytime', 'beach', 'summer'].includes(o))) s += 1;
    return s;
  };
  const ranked = all.map(l => ({ l, s: score(l) })).sort((a, b) => b.s - a.s);
  return { look: ranked[0].l, reason: ranked[0].s, qloo: qShare(ranked[0].l), alternatives: ranked.slice(1, 3).map(r => r.l) };
}

async function ritualFor(communityId, parsed) {
  // Weddings: bridal knowledge first (community-specific rituals).
  if (parsed.keys.includes('wedding')) {
    try {
      const b = await import('../bridal_beauty_planner.js');
      const rituals = b.getBridalRitualsForCommunity?.(communityId);
      const profile = b.getCommunityBridalProfile?.(communityId);
      if (Array.isArray(rituals) && rituals.length) {
        const sig = profile?.signatureLook;
        const signature = sig && typeof sig === 'object'
          ? Object.entries(sig).map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`)
          : (sig ? [String(sig)] : []);
        return { source: 'bridal_beauty_planner', festival: null, tradition: profile?.name ?? null, signature, rituals: rituals.slice(0, 4), skincareTip: null };
      }
    } catch { /* module unavailable */ }
  }
  // Named festivals (Eid, Diwali, general festival) or a tradition-focused request.
  if (parsed.keys.some(k => ['eid', 'diwali', 'festival'].includes(k)) || parsed.traditional) {
    try {
      const fest = await import('../festival_calendar.js');
      const all = Object.values(fest.FESTIVALS).filter(x => x.community === communityId);
      const word = parsed.keys.find(k => ['eid', 'diwali'].includes(k));
      const f = (word && all.find(x => x.name.toLowerCase().includes(word))) ?? all[0];
      if (f) {
        return { source: 'festival_calendar', festival: f.name, tradition: f.beautyTradition, rituals: (f.beautyRituals ?? []).slice(0, 4), skincareTip: f.skincareTip ?? null };
      }
    } catch { /* module unavailable */ }
  }
  return null;
}

function buildTimeline(look, personalised, parsed, ritual) {
  const tl = [];
  tl.push({ when: 'Night before', step: 'Cleanse, exfoliate gently, and use a hydrating mask so foundation sits smoothly.' });
  if (ritual?.rituals?.length) tl.push({ when: 'Night before', step: `Tradition prep: ${ritual.rituals[0]}.` });
  const steps = (personalised?.steps ?? look.steps ?? []).slice().sort((a, b) => a.order - b.order);
  steps.forEach((st, i) => {
    tl.push({ when: i === 0 ? 'Morning of' : 'Getting ready', step: `${st.stepName}: ${st.technique}` });
  });
  if (parsed.outdoor) tl.push({ when: 'Before you leave', step: 'Apply a broad-spectrum SPF 30+ under base, then set with a long-wear setting spray to hold through heat and humidity.' });
  if (parsed.evening) tl.push({ when: 'Before you leave', step: 'Check your look under warm, low light and add a touch of highlighter or lip gloss for evening glow.' });
  tl.push({ when: 'Touch-up kit', step: 'Blotting papers, your lip colour, and a small powder for midday refresh.' });
  return tl;
}

export async function buildPlan({ occasion = '', communityId, fitzpatrick, undertone, tasteChips = [], finish = [] } = {}) {
  const parsed = parseOccasion(occasion);
  const community = COMMUNITIES.includes(normCommunityHyphen(communityId)) ? normCommunityHyphen(communityId) : null;
  const fitz = FITZ_DEPTH[fitzpatrick] ? fitzpatrick : null;
  const tone = undertone || 'neutral';

  // Live Qloo taste for the user's taste chips (artists, films, brands): its tags steer the look.
  const q = tasteChips.length ? await qlooTaste(tasteChips) : null;
  const kept = q?.kept ?? [];
  const { look, reason, alternatives, qloo: lookQloo } = pickLook(parsed, community, fitz, kept);
  const lookCommunity = community ?? look.community;
  const personalised = getPersonalisedLook(look.id, fitz ?? 'IV', tone);

  const depthTarget = FITZ_DEPTH[fitz ?? 'IV'];
  const shades = findShades({ communityId: normCommunityUnder(lookCommunity), depthTarget, undertone: tone, topN: 3 });
  const shade = shades[0] ? { name: shades[0].name, code: shades[0].code, hex: shades[0].hex, undertone: tone, depthGap: shades[0].depthGap, undertoneMatch: shades[0].undertoneMatch, note: shades[0].coverageNote } : null;

  const aesthetic = buildAestheticVector(kept, { freeText: [occasion, ...(look.tags ?? [])] });
  // A wig only when she picked Wigs ("Finish your look — your choice"); never by default.
  const wigs = wantsWig(finish) ? matchWigs({ aesthetic, communityId: normCommunityUnder(lookCommunity), topN: 1 }) : [];
  const wig = wigs[0] ? { name: wigs[0].wig?.name, texture: wigs[0].wig?.texture, length: wigs[0].wig?.length, why: wigs[0].wig?.description ?? null } : null;
  const lashProduct = (look.products ?? []).find(p => p.category === 'lash');
  const finishing = { ...finishBasis(finish), steps: finishingSteps(finish, { wig, lash: lashProduct ? [lashProduct.finish, lashProduct.color, lashProduct.notes].filter(Boolean).join(', ') : null }) };

  const ritual = await ritualFor(lookCommunity, parsed);

  const constraints = [];
  if (parsed.outdoor) constraints.push('outdoor: long-wear finish plus SPF step added');
  if (parsed.evening) constraints.push('evening: warm-light check and glow step added');
  if (parsed.traditional) constraints.push('tradition: community ritual knowledge included');
  if (fitz) constraints.push(`shade matched to Fitzpatrick ${fitz}, ${tone} undertone`);
  if (!constraints.length) constraints.push('no explicit constraints detected; using your community and taste');

  return {
    occasion: { text: occasion, detected: parsed.keys, outdoor: parsed.outdoor, evening: parsed.evening },
    look: { id: look.id, name: look.name, community: look.community, description: look.description, image: look.image, whyChosen: [parsed.keys.length ? `matched ${parsed.keys.join(', ')}` : null, lookQloo?.tags?.length ? `Qloo tied your taste to ${lookQloo.tags.slice(0, 3).join(', ')}` : null].filter(Boolean).join('; ') || (reason > 0 ? 'matched your community' : 'closest overall match'), qlooEvidence: lookQloo?.tags?.length ? Math.round(lookQloo.share * 100) / 100 : null, alternatives: alternatives.map(a => ({ id: a.id, name: a.name })) },
    shade,
    wig,
    finishing,
    ritual,
    timeline: buildTimeline(look, personalised, parsed, ritual),
    constraints,
    source: q?.qloo_powered ? 'qloo+catalogue' : 'catalogue',
    meta: q ? { qloo_powered: q.qloo_powered, qloo_unreachable: q.unreachable, qloo_error: q.errors[0] ?? null, provenance: provenance(q), demo: !q.qloo_powered } : { qloo_powered: false, no_taste_input: true },
  };
}
