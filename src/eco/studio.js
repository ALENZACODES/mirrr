/**
 * Eco Beauty planner: one swap from plastic to a lower-waste option, your community's starter kit
 * and how its guide uses each ingredient, what to do this season, where an ingredient comes from
 * and what threatens it, the steps for what you care about most (plastic, water, sourcing or
 * microplastics), how to stretch wash day for your hair type, and a reef-aware sunscreen note for
 * your Fitzpatrick type.
 *
 * Everything quotes the four eco guides on the Eco Beauty shelf (after the audit in
 * wire/ops-b16-*.mjs) plus the SPF and white-cast guides the Skin Clinic already uses. Brand
 * names appear only where a guide names them; this planner sells nothing.
 */
import {
  UNIVERSAL_ECO_BEAUTY_PRINCIPLES as U, ETHNIC_ECO_BEAUTY_GUIDES as GUIDES, ECO_BEAUTY_INGREDIENT_INDEX as INDEX,
  ECO_BEAUTY_STARTER_KITS as KITS, SEASONAL_ECO_BEAUTY_CALENDAR as SEASONS, CLIMATE_RESILIENT_INGREDIENTS as RESILIENT,
  CROSS_COMMUNITY_THEMES as THEMES, MICROPLASTICS_AND_BEAUTY as MICRO, ECO_INGREDIENT_DEEP_DIVES as DEEP, ECO_BEAUTY_GLOSSARY,
} from '../eco_sustainable_beauty_ethnic_guide.js';
import { CLEAN_BEAUTY_MYTHS, ETHICAL_SOURCING, ECO_BEAUTY_BY_COMMUNITY, SUSTAINABLE_PACKAGING, WATERLESS_BEAUTY, CERTIFICATIONS } from '../eco_beauty_guide.js';
import { INGREDIENT_SOURCING_ETHICS as ISE, getEcoBeautyGuide } from '../eco_sustainable_beauty.js';
import { DRY_HAIR_CARE, MINIMAL_WASTE_BEAUTY, getWaterlessBeautyGuide } from '../waterless_beauty_ethnic_guide.js';
import { getSPFRecsForFitzpatrick } from '../spf_guide_ethnic.js';
import { getWhiteCastSolutions } from '../sun_protection_extended.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => id.replace(/_/g, '-');
const SWAP_IDS = ['shampoo', 'facewash', 'moisturiser', 'rounds', 'razor', 'toothbrush', 'dryshampoo'];
/** What each swap looks like in the picture: [from, to]. */
const SWAP_SHAPES = { shampoo: ['bottle', 'bar'], facewash: ['pump', 'jar'], moisturiser: ['tub', 'tin'], rounds: ['pads', 'cloth'], razor: ['razor', 'safety'], toothbrush: ['brush', 'bamboo'], dryshampoo: ['can', 'shaker'] };
export const SWAPS = U.plasticFreeSwaps.swaps.map((s, i) => ({ id: SWAP_IDS[i], ...s, shapes: SWAP_SHAPES[SWAP_IDS[i]] }));
export const SEASON_IDS = Object.keys(SEASONS);
export const INGREDIENT_SLUGS = Object.keys(INDEX);
export const HAIR = [
  { id: 'type12', label: 'Straight or wavy (Type 1–2)' },
  { id: 'type3', label: 'Curly (Type 3)' },
  { id: 'type4', label: 'Coily (Type 4)' },
];
export const FOCUS = [
  { id: 'plastic', label: 'Less plastic' },
  { id: 'water', label: 'Less water' },
  { id: 'sourcing', label: 'Fairer sourcing' },
  { id: 'microplastics', label: 'No microplastics' },
];
const DEFAULTS = { swap: 'shampoo', community: 'west_african', season: 'autumn', ingredient: 'shea-butter', focus: 'plastic', hair: 'type4', fitzpatrick: 'V' };
const pick = (v, list, d) => (list.includes(v) ? v : d);

/** Key-ingredient names in the community guides that do not start with the index slug's first word. */
const NAME_MATCH = { 'black-soap': /black soap/i, 'black-seed-oil': /black seed/i, 'castor-oil': /castor/i, 'cacao': /cacao/i, 'sake-kasu': /sake kasu/i };
/** Extra sections the guides hold for some ingredients. */
const EXTRA = {
  'shea-butter': { sourcing: 'shea', ethical: 'shea_butter', threat: 'Shea butter', deep: 'sheaButterDeepDive' },
  'argan-oil': { sourcing: 'argan', ethical: 'argan_oil', threat: 'Argan oil', deep: 'arganOilDeepDive' },
  'baobab-oil': { sourcing: 'baobab', threat: 'Baobab oil', resilient: 'Baobab' },
  'marula-oil': { sourcing: 'marula' },
  'palm-oil': { ethical: 'palm_oil' },
  frankincense: { threat: 'Frankincense resin' },
  'sea-moss': { threat: 'Sea moss' },
  cacao: { threat: 'Cocoa butter' },
  'rose-water': { threat: 'Rose water / rose otto' },
  moringa: { resilient: 'Moringa', deep: 'moringa360' },
  nopal: { resilient: 'Nopal Cactus' },
  'aloe-vera': { resilient: 'Aloe Vera' },
  neem: { resilient: 'Neem' },
  rooibos: { resilient: 'Rooibos' },
  tulsi: { resilient: 'Tulsi (Holy Basil)' },
  'coconut-oil': { deep: 'coconutComplexUse' },
};
const label = slug => slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const commLabel = dash => LIBRARY_COMMUNITIES.find(c => c.id === dash.replace(/-/g, '_'))?.label ?? dash;
const flatText = v => (v == null ? [] : typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flatText) : Object.values(v).flatMap(flatText));

function keyIngredient(slug, dash) {
  const re = NAME_MATCH[slug] ?? new RegExp(`^${slug.split('-')[0]}`, 'i');
  return (GUIDES[dash]?.keyIngredients ?? []).find(i => re.test(i.name)) ?? null;
}

function ingredientPlan(slug) {
  const comms = INDEX[slug];
  const x = EXTRA[slug] ?? {};
  const uses = comms.map(dash => {
    const k = keyIngredient(slug, dash);
    const dye = GUIDES[dash]?.traditionalDyes?.[slug];
    if (k) return { community: commLabel(dash), name: k.name, profile: k.sustainabilityProfile ?? null, notes: k.ecoNotes ?? null, uses: k.beautyUses ?? [], threat: k.climateThreat ?? k.climateVulnerability ?? null };
    if (dye) return { community: commLabel(dash), name: label(slug), profile: null, notes: dye.overview ?? null, uses: dye.beautyApplication ? [dye.beautyApplication] : [], threat: null };
    return { community: commLabel(dash), name: label(slug), profile: null, notes: null, uses: [], threat: null };
  });
  const s = x.sourcing ? ISE[x.sourcing] : null;
  const e = x.ethical ? ETHICAL_SOURCING[x.ethical] : null;
  const t = x.threat ? U.climateChangeAndBeauty.threats.find(y => y.ingredient === x.threat) : null;
  const r = x.resilient ? RESILIENT.find(y => y.ingredient === x.resilient) : null;
  const d = x.deep ? DEEP[x.deep] : null;
  return {
    slug, name: uses.find(u => u.name)?.name ?? label(slug), communities: comms.map(commLabel), uses,
    sourcing: s ? { origin: s.origin ?? null, history: s.supplyChainHistory ?? s.importance ?? null, ethics: s.supplyChainEthics ?? s.progress ?? null, action: s.consumerAction ?? null } : null,
    ethical: e ? { concern: e.concern ?? e.positive_story ?? null, choice: e.ethical_choice ?? null, hidden: e.in_beauty ?? null } : null,
    climateThreat: t ? { threat: t.threat, response: t.response } : null,
    resilient: r ? { rank: r.rank, of: RESILIENT.length, level: r.climateResilience, reason: r.reason ?? null } : null,
    deepDive: d ? { title: d.ingredient, points: flatText(d).filter(v => v !== d.ingredient && v.length > 30).slice(0, 4) } : null,
  };
}

function focusPlan(id) {
  switch (id) {
    case 'water': return { id, label: 'Less water', intro: THEMES.waterAndBeauty.overview ?? null, steps: THEMES.waterAndBeauty.waterConservationPractices, extra: WATERLESS_BEAUTY.what };
    case 'sourcing': return { id, label: 'Fairer sourcing', intro: U.ethicalSourcing.title, steps: U.ethicalSourcing.redFlags.map(f => `Red flag: ${f}`), extra: U.ethicalSourcing.certifications.map(c => `${c.name}: ${c.what}`).join(' · ') };
    case 'microplastics': return { id, label: 'No microplastics', intro: MICRO.sourcesInBeauty[0].status, steps: MICRO.avoidanceStrategies, extra: CERTIFICATIONS.marketing_terms_without_certification.eco_friendly };
    default: return { id: 'plastic', label: 'Less plastic', intro: THEMES.packagingWasteAudit.title, steps: THEMES.packagingWasteAudit.solutionFramework, extra: SUSTAINABLE_PACKAGING.material_hierarchy.best_to_worst_environmental.map(m => m.material).join(' > ') };
  }
}

function hairPlan(id, dash) {
  const t = DRY_HAIR_CARE.noWashDayTechniques[id];
  const ds = DRY_HAIR_CARE.dryShampoo;
  const wl = getWaterlessBeautyGuide(dash);
  return {
    id, label: HAIR.find(h => h.id === id).label, technique: t.technique, extend: t.extend,
    dryShampoo: id === 'type4' ? [ds.type4.appropriateness, ds.type4.alternatives] : [ds.mechanism, ds.ingredients.starch, ds.darkHair],
    styling: id === 'type4' ? [DRY_HAIR_CARE.waterlessStyling.fingerStyle, DRY_HAIR_CARE.waterlessStyling.elongate] : [DRY_HAIR_CARE.waterlessStyling.holdProducts],
    community: wl?.currentPractice?.hair ?? null,
  };
}

function sunPlan(fitz) {
  const recs = getSPFRecsForFitzpatrick(fitz);
  const deep = ['IV', 'V', 'VI'].includes(fitz);
  const wc = getWhiteCastSolutions();
  const risk = recs.recommendation?.whiteCastRisk ?? null;
  return {
    type: fitz,
    reef: CLEAN_BEAUTY_MYTHS.what_is_legitimately_concerning.sunscreen_chemicals.context,
    forYou: recs.recommendation?.recommendation ?? `The SPF guide gives no white-cast warning for Type ${fitz}: an untinted mineral (zinc oxide) sunscreen, the reef-aware choice, usually suits.`,
    whiteCastRisk: risk ?? 'Low',
    level: FITZPATRICK.indexOf(fitz),
    mineral: deep ? `${wc.what_causes_it.mineral_filters} ${wc.what_causes_it.particle_size}` : null,
    stick: U.solidProducts.categories.find(c => /sunscreen/i.test(c.product))?.benefit ?? null,
  };
}

function communityPlan(cid) {
  const dash = kebab(cid);
  const g = GUIDES[dash];
  const kit = KITS[dash];
  const wl = getWaterlessBeautyGuide(dash);
  const es = getEcoBeautyGuide(dash);
  const by = ECO_BEAUTY_BY_COMMUNITY[cid];
  return {
    id: cid, label: LIBRARY_COMMUNITIES.find(c => c.id === cid)?.label ?? cid, title: g?.title ?? null, tagline: g?.tagline ?? null,
    kit: kit ? { title: kit.title, products: kit.coreProducts, packaging: kit.totalPackaging ?? null, recipe: kit.diyRecipe ?? null } : null,
    ingredients: (g?.keyIngredients ?? []).map(i => ({ name: i.name, profile: i.sustainabilityProfile ?? null, threat: i.climateThreat ?? i.climateVulnerability ?? null })),
    waterless: wl ? Object.entries(wl.currentPractice ?? {}).map(([k, v]) => ({ when: k, what: v })) : [],
    sourcing: es ? Object.entries(es).filter(([k, v]) => k !== 'community' && typeof v === 'string').map(([k, v]) => ({ topic: k.replace(/([A-Z])/g, ' $1').toLowerCase(), text: v })) : [],
    brands: by?.brands ?? [],
  };
}

export function buildEcoPlan(input = {}) {
  const swapId = pick(input.swap, SWAP_IDS, DEFAULTS.swap);
  const cid = resolveCommunity(input.community ?? DEFAULTS.community).id ?? DEFAULTS.community;
  const season = pick(input.season, SEASON_IDS, DEFAULTS.season);
  const slug = pick(input.ingredient, INGREDIENT_SLUGS, DEFAULTS.ingredient);
  const focus = pick(input.focus, FOCUS.map(f => f.id), DEFAULTS.focus);
  const hair = pick(input.hair, HAIR.map(h => h.id), DEFAULTS.hair);
  const fitz = pick(input.fitzpatrick, FITZPATRICK, DEFAULTS.fitzpatrick);
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const swap = SWAPS.find(s => s.id === swapId);
  const s = SEASONS[season];
  return {
    choices: { swap: swapId, community: cid, season, ingredient: slug, focus, hair, fitzpatrick: fitz, tone: tone.id },
    tone,
    swap,
    routine: U.zeroWasteRoutine.steps,
    community: communityPlan(cid),
    season: { id: season, label: s.season, theme: s.theme, practices: s.practices, focus: s.communityFocus ?? null },
    ingredient: ingredientPlan(slug),
    focus: focusPlan(focus),
    hair: hairPlan(hair, kebab(cid)),
    sun: sunPlan(fitz),
    diy: MINIMAL_WASTE_BEAUTY.DIYBeauty.simple,
  };
}

export function lookupEcoTerm(q) {
  const t = String(q ?? '').trim().toLowerCase().slice(0, 60);
  if (t.length < 2) return { query: t, entry: null };
  const hit = Object.entries(ECO_BEAUTY_GLOSSARY).find(([k]) => k.toLowerCase().includes(t) || t.includes(k.toLowerCase()));
  return { query: t, entry: hit ? { term: hit[0], definition: hit[1] } : null };
}

export function ecoOptions() {
  return {
    swaps: SWAPS.map(s => ({ id: s.id, label: s.conventional })),
    communities: LIBRARY_COMMUNITIES.map(c => ({ id: c.id, label: c.label })),
    seasons: SEASON_IDS.map(id => ({ id, label: SEASONS[id].season })),
    ingredients: INGREDIENT_SLUGS.map(slug => ({ id: slug, label: ingredientPlan(slug).name })),
    focus: FOCUS, hair: HAIR, fitzpatrick: FITZPATRICK, tones: MONK_TONES,
  };
}
