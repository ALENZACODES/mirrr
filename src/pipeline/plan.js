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
import { buildAestheticVector } from '../aesthetic.js';

const FITZ_DEPTH = { I: 4, II: 8, III: 14, IV: 22, V: 34, VI: 46 };
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

function pickLook(parsed, communityId, fitz) {
  const all = Object.values(INSPIRATION_LOOKS);
  const score = (l) => {
    let s = 0;
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
  return { look: ranked[0].l, reason: ranked[0].s, alternatives: ranked.slice(1, 3).map(r => r.l) };
}

async function ritualFor(communityId, parsed) {
  // Weddings: bridal knowledge first (community-specific rituals).
  if (parsed.keys.includes('wedding')) {
    try {
      const b = await import('../bridal_beauty_planner.js');
      const rituals = b.getBridalRitualsForCommunity?.(communityId);
      const profile = b.getCommunityBridalProfile?.(communityId);
      if (Array.isArray(rituals) && rituals.length) {
        return { source: 'bridal_beauty_planner', festival: null, tradition: profile?.signatureLook ?? null, rituals: rituals.slice(0, 4), skincareTip: null };
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

export async function buildPlan({ occasion = '', communityId, fitzpatrick, undertone, tasteChips = [] } = {}) {
  const parsed = parseOccasion(occasion);
  const community = COMMUNITIES.includes(normCommunityHyphen(communityId)) ? normCommunityHyphen(communityId) : null;
  const fitz = FITZ_DEPTH[fitzpatrick] ? fitzpatrick : null;
  const tone = undertone || 'neutral';

  const { look, reason, alternatives } = pickLook(parsed, community, fitz);
  const lookCommunity = community ?? look.community;
  const personalised = getPersonalisedLook(look.id, fitz ?? 'IV', tone);

  const depthTarget = FITZ_DEPTH[fitz ?? 'IV'];
  const shades = findShades({ communityId: normCommunityUnder(lookCommunity), depthTarget, undertone: tone, topN: 3 });
  const shade = shades[0] ? { name: shades[0].name, code: shades[0].code, hex: shades[0].hex, undertone: tone, score: Number(shades[0].score.toFixed(2)), note: shades[0].coverageNote } : null;

  const aesthetic = buildAestheticVector(tasteChips, { freeText: [occasion, ...(look.tags ?? [])] });
  const wigs = matchWigs({ aesthetic, communityId: normCommunityUnder(lookCommunity), topN: 1 });
  const wig = wigs[0] ? { name: wigs[0].wig?.name, texture: wigs[0].wig?.texture, length: wigs[0].wig?.length, why: wigs[0].wig?.description ?? null } : null;

  const ritual = await ritualFor(lookCommunity, parsed);

  const constraints = [];
  if (parsed.outdoor) constraints.push('outdoor: long-wear finish plus SPF step added');
  if (parsed.evening) constraints.push('evening: warm-light check and glow step added');
  if (parsed.traditional) constraints.push('tradition: community ritual knowledge included');
  if (fitz) constraints.push(`shade matched to Fitzpatrick ${fitz}, ${tone} undertone`);
  if (!constraints.length) constraints.push('no explicit constraints detected; using your community and taste');

  return {
    occasion: { text: occasion, detected: parsed.keys, outdoor: parsed.outdoor, evening: parsed.evening },
    look: { id: look.id, name: look.name, community: look.community, description: look.description, image: look.image, whyChosen: reason > 0 ? `matched ${parsed.keys.join(', ') || 'your community'}` : 'closest overall match', alternatives: alternatives.map(a => ({ id: a.id, name: a.name })) },
    shade,
    wig,
    ritual,
    timeline: buildTimeline(look, personalised, parsed, ritual),
    constraints,
    source: tasteChips.length ? 'taste+catalogue' : 'catalogue',
  };
}
