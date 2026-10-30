/**
 * Nails & Scent Studio: a manicure and a fragrance planned for you.
 *
 * Nails: pick your Fitzpatrick type and undertone (the colour lists for that depth, minus what the
 * undertone guide says to skip), a nail shape, finish, how you wear them (natural, gel, acrylic, dip
 * or press-on, with safe removal), and an occasion for a nail-art idea. Scent: a fragrance family,
 * the occasion (which sets the concentration) and your climate. Community adds traditions only:
 * nail art, fragrance profiles and gifting customs. Nothing about your body is inferred from it.
 */
import { NAIL_SHAPES, NAIL_STYLES, NAIL_COLOURS_BY_SKIN_TONE as BY_FITZ, getNailStylesForCommunity } from '../nail_artistry.js';
import { NAIL_COLOURS_BY_SKIN_TONE as BY_BAND, NAIL_COLOUR_THEORY, NAIL_FINISHES, ETHNIC_NAIL_TRADITIONS } from '../nail_colours_guide.js';
import { NAIL_ENHANCEMENT_GUIDE, SAFE_REMOVAL_GUIDE, CUTICLE_CARE, MELANONYCHIA_GUIDE } from '../nail_care_ethnic.js';
import { FRAGRANCE_FAMILIES, CONCENTRATION_GUIDE, LAYERING_TECHNIQUES, FRAGRANCE_GIFTING, getConcentrationForOccasion } from '../fragrance_layering_guide.js';
import { FRAGRANCE_APPLICATION, FRAGRANCE_LAYERING_GUIDE } from '../fragrance_guide_extended.js';
import { COMMUNITY_FRAGRANCE_PROFILES } from '../fragrance_atlas.js';
import { namedColours } from '../colour/studio.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const UNDERTONES = [
  { id: 'warm', label: 'Warm (golden, peachy)' }, { id: 'cool', label: 'Cool (pink, red, bluish)' }, { id: 'neutral', label: 'Neutral' },
];
export const SHAPES = Object.values(NAIL_SHAPES).map(s => ({ id: s.id, label: s.name }));
export const FINISHES = Object.entries(NAIL_FINISHES).map(([id, f]) => ({ id, label: f.finish }));
export const WEAR = [
  { id: 'natural', label: 'My natural nails' }, { id: 'soft_gel', label: 'Gel polish' }, { id: 'hard_gel', label: 'Hard gel / builder' },
  { id: 'acrylic', label: 'Acrylic' }, { id: 'dip_powder', label: 'Dip powder' }, { id: 'press_ons', label: 'Press-ons' },
];
export const NAIL_OCCASIONS = [...new Set(Object.values(NAIL_STYLES).map(s => s.category))].map(id => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
export const FAMILIES = Object.entries(FRAGRANCE_FAMILIES).map(([id, f]) => ({ id, label: f.name }));
export const SCENT_OCCASIONS = ['office', 'date', 'evening', 'wedding', 'summer', 'gym', 'religious'].map(id => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
export const CLIMATES = [{ id: 'hot_humid', label: 'Hot and humid' }, { id: 'cold', label: 'Cold' }, { id: 'dry', label: 'Dry' }];

const FITZ_KEY = { I: 'fitzpatrick-I-II', II: 'fitzpatrick-I-II', III: 'fitzpatrick-III', IV: 'fitzpatrick-IV', V: 'fitzpatrick-V', VI: 'fitzpatrick-VI' };
const BAND_KEY = { I: 'fair', II: 'light_medium', III: 'medium_olive', IV: 'tan', V: 'deep', VI: 'deep' };
/** Colour families each undertone guide says to skip ("pinks with blue undertones" for warm, "warm corals, golden" for cool). */
const CLASH = { warm: /^(cool|icy|baby blue|lilac|lavender|mint)/, cool: /^(warm|orange|coral|peach|mustard|bronze|copper|gold)/ };
const LONG = /long/i;
const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');

/** Colours for this depth, as swatches, with anything the undertone should skip moved out. */
export function nailColours(fitz, undertone) {
  const a = BY_FITZ[FITZ_KEY[fitz]]; const b = BY_BAND[BAND_KEY[fitz]];
  const groups = {
    everyday: b.flattering.everyday ?? [], statement: [...(b.flattering.statement ?? []), ...a.standout],
    dark: b.flattering.dark_drama ?? [], flattering: a.flattering,
  };
  const out = {}; const skipped = [];
  for (const [k, list] of Object.entries(groups)) {
    out[k] = [];
    for (const line of list) {
      const c = namedColours(line)[0];
      if (!c) continue;
      if (CLASH[undertone]?.test(c.word)) skipped.push(line); else if (!out[k].some(x => x.word === c.word)) out[k].push({ ...c, line });
    }
  }
  return {
    skin: b.skin_tone, ...out, skipped,
    avoid: [...(a.avoid ?? []), ...(Array.isArray(b.avoid) ? b.avoid : b.avoid ? [b.avoid] : [])],
    tip: b.tip ?? b.notes ?? a.notes, metallics: typeof b.flattering.metallics === 'string' ? b.flattering.metallics : null,
    undertone: NAIL_COLOUR_THEORY.warm_cool_neutral[undertone],
  };
}

function wearPlan(wear, shape) {
  const s = NAIL_SHAPES[shape];
  const needsLength = LONG.test(s.lengthRequired ?? '');
  const g = wear === 'soft_gel' || wear === 'hard_gel' ? NAIL_ENHANCEMENT_GUIDE.gel[wear] : NAIL_ENHANCEMENT_GUIDE[wear === 'natural' ? 'natural_nail_growth' : wear];
  const removal = { soft_gel: SAFE_REMOVAL_GUIDE.gel_polish_removal, acrylic: SAFE_REMOVAL_GUIDE.acrylic_removal, dip_powder: SAFE_REMOVAL_GUIDE.gel_polish_removal, press_ons: SAFE_REMOVAL_GUIDE.press_on_removal }[wear] ?? null;
  return {
    id: wear, label: WEAR.find(w => w.id === wear).label, what: g.what ?? null,
    pros: g.pros ?? [], cons: g.cons ?? [], tips: g.tips ?? [], note: g.ethnic_skin_consideration ?? g.hygiene_note ?? g.size_consideration ?? null,
    removal: removal && { steps: removal.soak_off_method ?? removal.diy_safe_method ?? removal.safest_method ?? [], note: removal.professional ?? removal.peel_off_gels ?? null },
    hardGelRemoval: wear === 'hard_gel' ? g.cons.find(c => /file/i.test(c)) ?? null : null,
    lengthWarning: needsLength && wear === 'natural' ? `${s.name} needs ${s.lengthRequired.toLowerCase()} length: grow your nails out first, or wear it with gel, acrylic or press-ons.` : null,
  };
}

function nailArt(occasion, cid) {
  const all = Object.values(NAIL_STYLES).filter(s => s.category === occasion);
  const mine = getNailStylesForCommunity(dash(cid)).filter(s => s.category === occasion);
  const s = mine[0] ?? all[0];
  return { name: s.name, description: s.description, colours: s.colourScheme ?? [], techniques: s.techniques ?? [], occasions: s.occasions ?? [], context: s.culturalContext ?? null, fromYourCommunity: mine.length > 0 };
}

function scentPlan(family, occasion, climate) {
  const f = FRAGRANCE_FAMILIES[family];
  const c = getConcentrationForOccasion(occasion);
  const climateNote = FRAGRANCE_APPLICATION.for_different_climates[climate === 'dry' ? 'dry_skin_note' : climate];
  // Light families fade fast; the guides pair them with a base to last (layering technique) in heat or for long events.
  const light = /lightest|evaporates fast|ephemeral/i.test(f.longevity ?? '');
  const combos = FRAGRANCE_LAYERING_GUIDE.recommended_combinations.filter(x => f.keyNotes.some(n => `${x.a} ${x.b}`.toLowerCase().includes(n.toLowerCase().split(' ')[0])));
  return {
    family: { name: f.name, character: f.characteristics, notes: f.keyNotes, longevity: f.longevity ?? null, bestFor: f.bestFor },
    concentration: { name: c.name, strength: c.concentration, longevity: c.longevity, character: c.character, how: c.application ?? null, alcoholFree: /no alcohol/i.test(c.concentration) },
    climate: climateNote, amount: climate === 'hot_humid' ? 'Use less: heat makes fragrance project further.' : climate === 'cold' ? 'Use a little more: cold slows how far it travels.' : 'Moisturise first so it lasts.',
    pyramid: Object.values(LAYERING_TECHNIQUES.pyramid).map(p => ({ name: p.name, duration: p.duration, examples: p.examples, mine: p.examples.filter(e => f.keyNotes.some(n => n.toLowerCase() === e.toLowerCase())) })),
    prep: LAYERING_TECHNIQUES.methods.skin_prep.steps,
    pulsePoints: FRAGRANCE_APPLICATION.pulse_points.classic,
    layering: combos.length ? combos : light ? FRAGRANCE_LAYERING_GUIDE.recommended_combinations.slice(0, 1) : [],
  };
}

function communityNotes(cid) {
  const d = dash(cid); const u = cid;
  const prof = COMMUNITY_FRAGRANCE_PROFILES[d];
  const gift = FRAGRANCE_GIFTING[u];
  return {
    nails: ETHNIC_NAIL_TRADITIONS[u]?.traditions ?? null,
    nailStyles: getNailStylesForCommunity(d).map(s => s.name),
    scent: prof ? { signature: prof.signatureScents, style: prof.perfumeStyle, note: prof.notes ?? null } : null,
    gifting: gift ? { occasions: gift.occasions, gifts: gift.gifts.map(g => `${g.item}: ${g.note}`) } : null,
  };
}

export function buildNailScentPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const undertone = pick(input.undertone, UNDERTONES.map(x => x.id), 'warm');
  const shape = pick(input.shape, SHAPES.map(x => x.id), 'oval');
  const finish = pick(input.finish, FINISHES.map(x => x.id), 'creme');
  const wear = pick(input.wear, WEAR.map(x => x.id), 'natural');
  const nailOccasion = pick(input.nailOccasion, NAIL_OCCASIONS.map(x => x.id), 'minimal');
  const family = pick(input.family, FAMILIES.map(x => x.id), 'woody');
  const scentOccasion = pick(input.scentOccasion, SCENT_OCCASIONS.map(x => x.id), 'office');
  const climate = pick(input.climate, CLIMATES.map(x => x.id), 'hot_humid');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const colours = nailColours(fitz, undertone);
  const s = NAIL_SHAPES[shape]; const f = NAIL_FINISHES[finish];
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { fitzpatrick: fitz, undertone, shape, finish, wear, nailOccasion, family, scentOccasion, climate, community: cid, tone: tone.id },
    tone,
    nails: {
      colours, polish: colours.everyday[0] ?? colours.flattering[0],
      shape: { id: shape, name: s.name, description: s.description, length: s.lengthRequired, bestFor: s.bestFor, tip: s.tips },
      finish: { id: finish, name: f.finish, description: f.description, bestFor: f.best_for ?? null, atHome: f.home_application ?? null },
      wear: wearPlan(wear, shape), art: nailArt(nailOccasion, cid),
      cuticles: { routine: CUTICLE_CARE.cuticle_oil_routine, deepSkin: ['IV', 'V', 'VI'].includes(fitz) ? CUTICLE_CARE.deep_skin_cuticle_note : null },
      streaks: { normal: MELANONYCHIA_GUIDE.what_is_normal.in_darker_skin, seeADoctor: MELANONYCHIA_GUIDE.when_to_see_a_doctor },
    },
    scent: scentPlan(family, scentOccasion, climate),
    communityNotes: communityNotes(cid),
  };
}

export function nailScentOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK, undertones: UNDERTONES,
    shapes: SHAPES, finishes: FINISHES, wear: WEAR, nailOccasions: NAIL_OCCASIONS, families: FAMILIES, scentOccasions: SCENT_OCCASIONS, climates: CLIMATES, tones: MONK_TONES,
  };
}
