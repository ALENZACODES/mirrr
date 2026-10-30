/**
 * Hair Removal Planner: the method for the area you want smooth, judged against your skin type,
 * hair texture and hair colour.
 *
 * Area and method set what is done and how. Fitzpatrick type decides which lasers are safe (the
 * guide's safety matrix) and how much dark-mark aftercare you need. Hair texture sets the ingrown
 * and razor-bump risk; hair colour decides whether light-based methods can work at all. An event
 * adds a timeline. Community adds traditions only; nothing about your skin or hair is inferred
 * from it.
 */
import {
  UNIVERSAL_BODY_HAIR, ETHNIC_BODY_HAIR_GUIDES, OCCASION_GUIDES, COMMON_HAIR_REMOVAL_MISTAKES,
  getUniversalRemovalMethod, isLaserSafeForPhototype, getCommunitySignatureMethod, getRecommendedPostCareOil,
} from '../body_hair_ethnic_guide.js';
import { SHAVING_GUIDE, INGROWN_HAIR_GUIDE, THREADING_ELECTROLYSIS, WAXING_GUIDE } from '../body_hair_guide_ethnic.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const AREAS = [
  { id: 'face', label: 'Face (brows, upper lip, chin)' }, { id: 'underarms', label: 'Underarms' },
  { id: 'legs', label: 'Legs' }, { id: 'arms', label: 'Arms' }, { id: 'bikini', label: 'Bikini area' },
];
export const HAIR = [
  { id: 'fine', label: 'Fine or straight' }, { id: 'wavy', label: 'Wavy or curly' }, { id: 'coily', label: 'Coarse or tightly coiled' },
];
export const COLOURS = [{ id: 'dark', label: 'Dark (black or brown)' }, { id: 'light', label: 'Light (blonde, red, grey or white)' }];
export const METHODS = Object.entries(UNIVERSAL_BODY_HAIR.removalMethods).map(([id, m]) => ({ id, label: m.name }));
export const OCCASIONS = [
  { id: 'none', label: 'No event' }, ...Object.entries(OCCASION_GUIDES).map(([id, o]) => ({ id, label: o.title.replace(/ (Hair Removal |Preparation )?Guide$/, '') })),
];

const AREA_WORDS = { face: /face|eyebrow|upper lip|chin/i, underarms: /underarm/i, legs: /\blegs\b/i, arms: /\barms\b/i, bikini: /bikini/i };

/** Methods whose guide entry names this area among the ones it is best for. */
export function suitedToArea(area) {
  return METHODS.filter(m => AREA_WORDS[area].test(UNIVERSAL_BODY_HAIR.removalMethods[m.id].bestFor ?? '')).map(m => m.id);
}

const LASERS = [['alexandrite', 'Alexandrite (755nm)'], ['diode', 'Diode (810nm)'], ['ndYAG', 'Nd:YAG (1064nm)']];
const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');
const CONCERN_KEY = /pfb|hyperpig|razorBump|laser|SkinConcerns|ingrown|brightening/i;
const deepSkin = fitz => ['IV', 'V', 'VI'].includes(fitz);

/** How well a method suits this area, skin and hair: good, caution or avoid, with the reasons. */
export function verdict(method, { area, hair, colour, fitz }) {
  const why = []; let level = 'good';
  const flag = (l, text) => { why.push(text); if (l === 'avoid' || level === 'good') level = l === 'avoid' ? 'avoid' : 'caution'; };
  if (method === 'threading' && area !== 'face') flag('avoid', 'Threading is for the face: brows, upper lip and chin.');
  if (method === 'laser' || method === 'IPL') {
    if (colour === 'light') flag('avoid', 'Light-based removal needs dark hair: blonde, red, grey and white hair have too little melanin for it to work. Electrolysis works on every colour.');
    if (method === 'IPL' && isLaserSafeForPhototype('IPL', fitz) === false) flag('avoid', `IPL is not safe on skin type ${fitz}: the skin's own melanin absorbs the light.`);
    if (method === 'laser' && deepSkin(fitz)) flag('caution', `Only the Nd:YAG (1064nm) laser is safe on skin type ${fitz}. Ask the clinic which laser it is before you book, and have a test patch.`);
  }
  if (hair === 'coily' && ['shaving', 'epilating'].includes(method)) flag('caution', method === 'shaving'
    ? 'Tightly coiled hair cut at the surface curls back into the skin (razor bumps). Use a single blade, shave with the grain, and do not stretch the skin.'
    : 'Pulling coiled hair from the root with an epilator often leaves it growing back under the skin.');
  if (hair === 'wavy' && method === 'shaving') flag('caution', 'Curly hair can grow back into the skin; shave with the grain and exfoliate between shaves.');
  if (method === 'depilatoryCreams' && (area === 'face' || area === 'bikini')) flag('caution', 'Skin here is thin: patch-test first and use a cream made for the face or bikini line.');
  if (deepSkin(fitz) && ['waxing', 'epilating', 'depilatoryCreams'].includes(method)) flag('caution', 'Irritation can leave dark marks on deeper skin; follow the dark-mark aftercare below.');
  if (method === 'electrolysis' && ['legs', 'arms'].includes(area)) flag('caution', 'Electrolysis treats one hair at a time, so large areas take many sessions.');
  return { level, why };
}

function lasers(fitz, colour) {
  const types = UNIVERSAL_BODY_HAIR.removalMethods.laser.laserTypes;
  return LASERS.map(([id, label]) => ({
    id, label, safe: colour === 'dark' && isLaserSafeForPhototype(id, fitz) === true,
    note: types[id]?.safeFor ?? null,
  }));
}

function methodPlan(method) {
  const m = getUniversalRemovalMethod(method);
  const extra = {
    shaving: { technique: SHAVING_GUIDE.technique, razor: SHAVING_GUIDE.razorSelection, after: SHAVING_GUIDE.aftershave },
    waxing: { types: WAXING_GUIDE.types, after: WAXING_GUIDE.aftercare },
    threading: { how: THREADING_ELECTROLYSIS.threading },
    electrolysis: { how: THREADING_ELECTROLYSIS.electrolysis },
  }[method] ?? null;
  return { id: method, name: m.name, description: m.description, bestFor: m.bestFor ?? null, risks: m.risks ?? m.limitations ?? m.limitation ?? null, more: extra };
}

function aftercare(fitz, hair) {
  const post = UNIVERSAL_BODY_HAIR.postRemovalProtocol;
  const ing = UNIVERSAL_BODY_HAIR.safeIngredients;
  return {
    before: UNIVERSAL_BODY_HAIR.preRemovalProtocol.general,
    first24Hours: post.first24Hours, days2To7: post.days2Through7,
    ingrown: hair === 'fine' ? null : {
      prevention: UNIVERSAL_BODY_HAIR.ingrownHairScience.prevention, more: INGROWN_HAIR_GUIDE.prevention, treatment: INGROWN_HAIR_GUIDE.treatment,
      razorBumps: hair === 'coily' ? UNIVERSAL_BODY_HAIR.ingrownHairScience.pfb.management : null,
    },
    darkMarks: deepSkin(fitz) ? { niacinamide: ing.niacinamide, azelaicAcid: ing.azelaicAcid } : null,
    mistakes: deepSkin(fitz) || hair === 'coily'
      ? COMMON_HAIR_REMOVAL_MISTAKES.forDarkerSkinTones.map(({ mistake, why, fix }) => ({ mistake, why, fix }))
      : COMMON_HAIR_REMOVAL_MISTAKES.forAllSkinTones.map(({ mistake, why, fix }) => ({ mistake, why, fix })),
  };
}

function occasionPlan(occasion, cid) {
  if (occasion === 'none') return null;
  const o = OCCASION_GUIDES[occasion];
  return { title: o.title, timeline: o.timeline, areas: o.bodyAreaPriority ?? null, essentials: o.essentials ?? null, yourTradition: o.byEthnicity?.[dash(cid)] ?? null };
}

function communityNotes(cid) {
  const d = dash(cid); const g = ETHNIC_BODY_HAIR_GUIDES[d];
  const skip = new Set(['id', 'communityName', 'countries', 'productRecommendations', 'culturalNotes']);
  // skin and hair concerns are the reader's own (aftercare above), so only practices are shown here
  const traditions = Object.fromEntries(Object.entries(g).filter(([k]) => !skip.has(k) && !CONCERN_KEY.test(k)));
  return { signature: getCommunitySignatureMethod(d), postCareOil: getRecommendedPostCareOil(d), traditions, notes: g.culturalNotes ?? null };
}

export function buildHairRemovalPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const area = pick(input.area, AREAS.map(x => x.id), 'underarms');
  const hair = pick(input.hair, HAIR.map(x => x.id), 'coily');
  const colour = pick(input.colour, COLOURS.map(x => x.id), 'dark');
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const method = pick(input.method, METHODS.map(x => x.id), 'shaving');
  const occasion = pick(input.occasion, OCCASIONS.map(x => x.id), 'none');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const ctx = { area, hair, colour, fitz };
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { area, hair, colour, fitzpatrick: fitz, method, occasion, community: cid, tone: tone.id },
    tone,
    skinType: { type: fitz, safeLasers: lasers(fitz, colour).filter(l => l.safe).map(l => l.label) },
    suitedToArea: suitedToArea(area),
    method: methodPlan(method),
    verdict: verdict(method, ctx),
    compare: METHODS.map(m => ({ id: m.id, label: m.label, ...verdict(m.id, ctx) })),
    lasers: lasers(fitz, colour),
    laserSafety: deepSkin(fitz) ? UNIVERSAL_BODY_HAIR.darkerSkinLaserGuidance : null,
    aftercare: aftercare(fitz, hair),
    occasion: occasionPlan(occasion, cid),
    communityNotes: communityNotes(cid),
  };
}

export function hairRemovalOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK,
    areas: AREAS, hair: HAIR, colours: COLOURS, methods: METHODS, occasions: OCCASIONS, tones: MONK_TONES,
  };
}
