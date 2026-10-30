/**
 * Brow & Kohl Studio: culture-specific brow architecture and eye traditions, built into one
 * step-by-step plan for a person's face shape, eye shape, brow density and community.
 *
 * The technique text comes from the wired guides (eyeliner_styles_guide, brow_shaping_guide,
 * brow_shaping_ethnic_guide, eyebrow_shaping_guide, makeup_for_glasses). This module chooses
 * between them, adapts them to the person, and computes the diagram geometry the Studio draws.
 */
import {
  COMMUNITY_LINER_TRADITIONS, LINER_PRODUCTS, getLinerForEyeShape, getLinerStyleGuide, getWaterlineGuide,
} from '../eyeliner_styles_guide.js';
import { getBrowGuideForCommunity, getBrowShapeForFace, getBrowMappingGuide } from '../brow_shaping_guide.js';
import { getBrowGuide, BROW_SHAPING_METHODS } from '../brow_shaping_ethnic_guide.js';
import { getEyeHealthInfo, getSkinToneColorGuide } from '../eye_makeup_ethnic_guide.js';
import { getBrowFillingProducts } from '../eyebrow_shaping_guide.js';
import { getBrowsWithGlassesGuide } from '../makeup_for_glasses.js';
import { LIBRARY_COMMUNITIES, resolveCommunity, communityLabel } from '../library/communities.js';

const kebab = id => (id ? id.replace(/_/g, '-') : null);

export const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'long', 'diamond'];
export const EYE_SHAPES = ['almond', 'round', 'monolid', 'hooded', 'deep_set', 'wide_set', 'close_set'];
export const BROW_DENSITIES = ['sparse', 'medium', 'full'];
export const SKIN_TONES = ['light', 'medium-olive', 'medium-deep', 'deep'];

/** MIRRR shade ids (F01, L07, LM14, M21, MD29, D37, RD46, MX51) -> the eye guide's tone groups. */
export function toneForShade(shadeId) {
  const prefix = String(shadeId ?? '').toUpperCase().match(/^[A-Z]+/)?.[0];
  return { F: 'light', L: 'light', LM: 'medium-olive', M: 'medium-olive', MD: 'medium-deep', D: 'deep', RD: 'deep' }[prefix] ?? null;
}

/**
 * Brow architectures. Geometry is in a 300 x 160 diagram of a right eye: the brow runs from the
 * head (x 70) to the tail (x 250); archAt is where along that run the highest point sits;
 * lift is how far the arch rises above the head; tailDrop is how far the tail ends below the arch.
 */
export const BROW_STYLES = {
  soft_arch: {
    label: 'Soft natural arch',
    summary: 'Your own brow, groomed: a gentle rise two-thirds of the way along.',
    geometry: { archAt: 0.66, lift: 12, tailDrop: 10, headWidth: 13, tailWidth: 5 },
  },
  high_arch: {
    label: 'High sculpted arch',
    summary: 'The sharp, lifted, thick-at-the-head brow of Bollywood and Arab glamour.',
    geometry: { archAt: 0.68, lift: 24, tailDrop: 18, headWidth: 14, tailWidth: 4 },
    tradition: { 'south-asian': 'bollywood_brow' },
  },
  straight: {
    label: 'Straight K-beauty brow',
    summary: 'Soft, feathery and nearly flat: the brow reads youthful and relaxed.',
    geometry: { archAt: 0.7, lift: 2, tailDrop: 3, headWidth: 12, tailWidth: 7 },
    tradition: { 'east-asian': 'korean_straight_brow' },
  },
  low_full: {
    label: 'Low, full brow',
    summary: 'A fuller brow with a low arch that pulls attention down the face.',
    geometry: { archAt: 0.6, lift: 7, tailDrop: 6, headWidth: 16, tailWidth: 7 },
  },
  angular_lift: {
    label: 'Angular lifted brow',
    summary: 'A defined angle at the arch that adds length and structure.',
    geometry: { archAt: 0.72, lift: 20, tailDrop: 16, headWidth: 12, tailWidth: 4, angular: true },
  },
  flat_horizontal: {
    label: 'Long horizontal brow',
    summary: 'Extended outward with almost no arch to add width.',
    geometry: { archAt: 0.75, lift: 4, tailDrop: 2, headWidth: 12, tailWidth: 6, extend: 18 },
  },
};

/** Which brow the face-shape guidance in brow_shaping_guide points to. */
const BROW_FOR_FACE = { oval: 'soft_arch', round: 'angular_lift', square: 'low_full', heart: 'low_full', long: 'flat_horizontal', diamond: 'soft_arch' };

/**
 * Eye looks. linerStyle names a style in eyeliner_styles_guide; looks without one carry their
 * own technique. Geometry: lid line thickness at the inner and outer corner, wing angle in
 * degrees (positive lifts, negative drops), wing length, lower line coverage (0 to 1),
 * waterline (upper/lower), smudge radius.
 */
export const EYE_LOOKS = {
  full_waterline_kohl: {
    label: 'Full-waterline kohl',
    linerStyle: 'kajal_smudged',
    product: 'kohl_kajal',
    communities: ['south-asian', 'arab', 'east-african', 'west-african'],
    geometry: { inner: 3, outer: 5, wingAngle: 0, wingLength: 6, lower: 1, waterline: ['upper', 'lower'], smudge: 2.5 },
  },
  arab_wing: {
    label: 'Arab wing',
    linerStyle: 'arabic_eye',
    product: 'kohl_kajal',
    communities: ['arab'],
    geometry: { inner: 4, outer: 7, wingAngle: 14, wingLength: 34, lower: 1, waterline: ['upper', 'lower'], innerFlick: 10, smudge: 0.6 },
  },
  puppy_eye: {
    label: 'K-beauty puppy eye',
    product: 'pencil_liner',
    communities: ['east-asian'],
    tradition: 'korean_trend',
    steps: [
      'Use a soft brown pencil or brown gel liner rather than black, so the line reads gentle.',
      'Draw a thin line close to the upper lash roots from the middle of the eye outward.',
      'At the outer corner, follow the downward slope of the lower lash line instead of flicking up, extending only a few millimetres past the corner.',
      'Join the end of that downward tail back to the upper line and fill the small triangle so the outer corner looks rounded and soft.',
      'Optional: a little brown shadow or pencil under the outer third of the lower lashes, smudged, to deepen the droop.',
    ],
    geometry: { inner: 1, outer: 3.5, wingAngle: -16, wingLength: 16, lower: 0.25, waterline: [], smudge: 0.8, colour: '#5b3a29' },
  },
  cat_eye: {
    label: 'Classic cat eye',
    linerStyle: 'classic_cat_eye',
    product: 'liquid_liner',
    communities: ['latina', 'west-african'],
    geometry: { inner: 1, outer: 6, wingAngle: 24, wingLength: 30, lower: 0, waterline: [], smudge: 0 },
  },
  tightline: {
    label: 'Tightline (no visible liner)',
    linerStyle: 'tight_lining',
    product: 'pencil_liner',
    communities: [],
    geometry: { inner: 0, outer: 0, wingAngle: 0, wingLength: 0, lower: 0, waterline: ['upper'], smudge: 0 },
  },
  graphic: {
    label: 'Graphic liner',
    linerStyle: 'graphic_liner',
    product: 'liquid_liner',
    communities: [],
    steps: [
      'Draw a thin liquid line along the upper lash roots and finish it in a sharp, lifted wing.',
      'Open your eyes and look straight ahead in the mirror before the next line; the floating line has to sit where it shows with eyes open.',
      'Draw a second, separate line just above the crease, starting over the middle of the eye and sweeping out past the wing without touching it.',
      'Keep the gap between the two lines even; clean the edges with a pointed cotton swab and micellar water.',
      'For colour, the graphic line can be white, gold, cobalt, emerald, orange or violet while the lash line stays black.',
    ],
    geometry: { inner: 2, outer: 5, wingAngle: 30, wingLength: 38, lower: 0, waterline: [], smudge: 0, floating: true },
  },
  bare: {
    label: 'No liner',
    linerStyle: 'no_liner',
    product: null,
    communities: [],
    geometry: { inner: 0, outer: 0, wingAngle: 0, wingLength: 0, lower: 0, waterline: [], smudge: 0 },
  },
};

/** Eye-shape adjustments that follow the tips in EYE_SHAPE_LINER_GUIDE. */
function adaptToEyeShape(g, eyeShape) {
  const out = { ...g };
  switch (eyeShape) {
    case 'hooded': // drawn with eyes open: the wing must clear the hood, the lid line stays thin
      out.outer = Math.min(out.outer, 4); out.wingAngle = out.wingAngle > 0 ? out.wingAngle + 6 : out.wingAngle; out.hoodSafe = true; break;
    case 'monolid': // the whole lid shows: a thicker line is visible where a thin one disappears
      out.outer = out.outer ? out.outer + 2 : 0; out.inner = out.inner ? out.inner + 1 : 0; break;
    case 'deep_set': // keep the upper line light so the eye is not pushed back
      out.outer = Math.min(out.outer, 3); out.inner = Math.min(out.inner, 1); break;
    case 'round': // elongate: extend the outer line, keep the lower line partial
      out.wingLength = out.wingLength ? out.wingLength + 8 : 0; out.lower = Math.min(out.lower, 0.5); break;
    case 'wide_set': // draw attention inward
      out.innerFlick = Math.max(out.innerFlick ?? 0, out.inner ? 8 : 0); out.wingLength = Math.round(out.wingLength * 0.7); break;
    case 'close_set': // draw attention outward, keep the inner corner light
      out.inner = Math.min(out.inner, 0.5); out.innerFlick = 0; out.wingLength = out.wingLength ? out.wingLength + 6 : 0; break;
    default: break;
  }
  return out;
}

/**
 * Face shape tunes whichever brow architecture is in use, so it changes the drawing even when the
 * architecture itself came from the community: a round face gets a sharper, higher peak; a long
 * face a flatter, longer line; a square face a softer arch; a heart face a lower, rounded arch; a
 * diamond face a curve that peaks nearer the centre.
 */
const FACE_TUNING = {
  oval: null,
  round: { lift: 6, archAt: 0.03, note: 'peak lifted and moved out to add height' },
  long: { lift: -6, extend: 10, note: 'arch flattened and tail lengthened to add width' },
  square: { lift: -3, soften: true, note: 'arch softened to balance a strong jaw' },
  heart: { lift: -5, archAt: -0.03, soften: true, note: 'arch lowered and rounded to balance a wider forehead' },
  diamond: { lift: 2, archAt: -0.05, soften: true, note: 'curved peak set nearer the centre to soften the cheekbones' },
};

export function adaptToFace(geometry, faceShape) {
  const t = FACE_TUNING[faceShape];
  if (!t) return { ...geometry };
  const out = { ...geometry };
  out.lift = Math.max(0, out.lift + t.lift);
  if (t.archAt) out.archAt = +(out.archAt + t.archAt).toFixed(2);
  if (t.extend) out.extend = (out.extend ?? 0) + t.extend;
  if (t.soften) out.angular = false;
  return out;
}

export const faceTuningNote = faceShape => FACE_TUNING[faceShape]?.note ?? null;

/** Brow density changes the brow's weight in the diagram and the product that fills it. */
function adaptToDensity(geometry, density) {
  const k = density === 'sparse' ? 0.7 : density === 'full' ? 1.25 : 1;
  return { ...geometry, headWidth: +(geometry.headWidth * k).toFixed(1), tailWidth: +(geometry.tailWidth * k).toFixed(1), strokes: density === 'sparse' };
}

const FILL_FOR_DENSITY = {
  sparse: { type: 'pencils', how: 'Draw hair-like strokes in the direction of growth to build the shape where hair is missing.' },
  medium: { type: 'powders', how: 'Press powder into the gaps with a small angled brush, lighter at the head and sharper at the tail.' },
  full: { type: 'gels', how: 'Brush the hairs up and set them with clear or tinted gel; fill only where the shape needs a crisp edge.' },
};

/** Removal method for the brow, from the community guide and the skin-safety notes. */
function shapingMethod(community) {
  const t = BROW_SHAPING_METHODS.threading;
  const threadFirst = ['south-asian', 'arab', 'east-african', 'west-african', 'black-american', 'caribbean', 'latina', 'south-african'].includes(community);
  return threadFirst
    ? { method: t.name, why: t.ethnicSkinNote ?? t.advantages, technique: t.technique }
    : { method: BROW_SHAPING_METHODS.tweezing.name, why: BROW_SHAPING_METHODS.tweezing.advantages, technique: BROW_SHAPING_METHODS.tweezing.technique };
}

/** Eye looks ranked for a community: its own traditions first, each with the reason. */
export function rankEyeLooks(communityRaw) {
  const id = resolveCommunity(communityRaw).id;
  const c = kebab(id);
  const traditions = (c && COMMUNITY_LINER_TRADITIONS[c]) || null;
  return Object.entries(EYE_LOOKS)
    .map(([lookId, look]) => {
      const own = c && look.communities.includes(c);
      const reason = own && traditions
        ? (look.tradition && traditions[look.tradition]) || traditions.iconic || traditions.popular_look || traditions.popular || Object.values(traditions)[0]
        : null;
      return { id: lookId, label: look.label, forYou: !!own, because: reason ? String(reason) : null };
    })
    .sort((a, b) => Number(b.forYou) - Number(a.forYou));
}

function pickBrowStyle(requested, faceShape, community) {
  if (requested && BROW_STYLES[requested]) return { id: requested, chosenBy: 'you' };
  if (community === 'east-asian') return { id: 'straight', chosenBy: 'community' };
  if (community === 'south-asian' || community === 'arab') return { id: 'high_arch', chosenBy: 'community' };
  return { id: BROW_FOR_FACE[faceShape] ?? 'soft_arch', chosenBy: 'face' };
}

function pickEyeLook(requested, community) {
  if (requested && EYE_LOOKS[requested]) return requested;
  return rankEyeLooks(community)[0].id;
}

const clampChoice = (v, list, dflt) => (list.includes(v) ? v : dflt);

/**
 * Build a full Studio plan. Every option changes the plan: the brow and eye geometry, the
 * technique steps, the products, and the reasons shown.
 */
export function buildStudioPlan(input = {}) {
  const community = resolveCommunity(input.community);
  const c = kebab(community.id);
  const faceShape = clampChoice(input.faceShape, FACE_SHAPES, 'oval');
  const eyeShape = clampChoice(input.eyeShape, EYE_SHAPES, 'almond');
  const density = clampChoice(input.browDensity, BROW_DENSITIES, 'medium');
  const wearsGlasses = !!input.wearsGlasses;
  const skinTone = clampChoice(input.skinTone, SKIN_TONES, toneForShade(input.shadeId) ?? 'medium-deep');

  // Brow
  const browPick = pickBrowStyle(input.browStyle, faceShape, c);
  const brow = BROW_STYLES[browPick.id];
  const faceGuide = getBrowShapeForFace(faceShape);
  const communityBrow = c ? getBrowGuideForCommunity(c) : null;
  const ethnicBrow = c ? getBrowGuide(c) : null;
  const tradKey = brow.tradition?.[c];
  const fill = FILL_FOR_DENSITY[density];
  const fillProducts = getBrowFillingProducts(fill.type);
  const mapping = getBrowMappingGuide().three_points;
  const shaping = shapingMethod(c);

  // Eye
  const lookId = pickEyeLook(input.eyeLook, community.id);
  const look = EYE_LOOKS[lookId];
  const style = look.linerStyle ? getLinerStyleGuide(look.linerStyle) : null;
  const shapeTip = getLinerForEyeShape(eyeShape);
  const usesWaterline = look.geometry.waterline.length > 0;
  const waterline = usesWaterline ? getWaterlineGuide() : null;
  const products = look.product ? (LINER_PRODUCTS[look.product]?.products ?? []) : [];
  const traditions = c ? COMMUNITY_LINER_TRADITIONS[c] : null;
  const kohlSafety = look.product === 'kohl_kajal' ? getEyeHealthInfo('kohl-safety') : null;
  const colourGuide = getSkinToneColorGuide(skinTone);

  const because = [];
  if (browPick.chosenBy === 'community') {
    const t = communityBrow?.communityTraditions?.what ?? ethnicBrow?.recommendations;
    if (t) because.push({ about: 'brow', text: String(t) });
  }
  if (browPick.chosenBy !== 'face' && faceTuningNote(faceShape)) because.push({ about: 'brow', text: `For a ${faceShape} face the ${brow.label.toLowerCase()} is tuned: ${faceTuningNote(faceShape)}.` });
  if (browPick.chosenBy === 'face' && faceGuide?.recommended) because.push({ about: 'brow', text: `For a ${faceShape} face: ${faceGuide.recommended}` });
  if (look.communities.includes(c) && traditions) {
    const t = (look.tradition && traditions[look.tradition]) || traditions.iconic || traditions.popular_look || traditions.popular;
    if (t) because.push({ about: 'eye', text: t });
  }
  if (shapeTip?.liner_tip && look.geometry.outer + look.geometry.wingLength > 0) because.push({ about: 'eye', text: `For ${eyeShape.replace('_', '-')} eyes: ${shapeTip.liner_tip}` });

  const browSteps = [
    `Find the head: ${mapping.head.how_to_find}`,
    mapping.arch?.how_to_find ? `Find the arch: ${mapping.arch.how_to_find}` : null,
    mapping.tail?.how_to_find ? `Find the tail: ${mapping.tail.how_to_find}` : null,
    `Shape with ${shaping.method.toLowerCase()}: ${shaping.technique}`,
    `${brow.label}: ${brow.summary}`,
    `Fill (${density} brows): ${fill.how}`,
    communityBrow?.shadeGuide ? `Shade: ${communityBrow.shadeGuide}` : null,
  ].filter(Boolean);

  const eyeSteps = look.steps ?? (Array.isArray(style?.how_to) ? style.how_to : style?.technique ? [style.technique] : []);
  const glasses = wearsGlasses ? getBrowsWithGlassesGuide() : null;

  return {
    community: community.id ? { id: community.id, label: communityLabel(community.id), substituted: community.substituted } : null,
    choices: { faceShape, eyeShape, browDensity: density, browStyle: browPick.id, eyeLook: lookId, wearsGlasses, skinTone },
    brow: {
      style: browPick.id,
      label: brow.label,
      chosenBy: browPick.chosenBy,
      faceAdvice: faceGuide ? { recommended: faceGuide.recommended, avoid: faceGuide.avoid ?? null } : null,
      tradition: tradKey ? communityBrow?.communityTraditions ?? null : null,
      communityNotes: ethnicBrow?.recommendations ?? null,
      shaping,
      fill: { type: fill.type, how: fill.how, products: fillProducts?.recommendations ?? [] },
      steps: browSteps,
      geometry: adaptToDensity(adaptToFace(brow.geometry, faceShape), density),
      faceTuning: faceTuningNote(faceShape),
    },
    eye: {
      look: lookId,
      label: look.label,
      what: style?.what ?? null,
      steps: eyeSteps,
      eyeShapeTip: shapeTip ? { tip: shapeTip.liner_tip, recommended: shapeTip.recommended_styles ?? [], avoid: shapeTip.avoid ?? null } : null,
      waterlineSafety: waterline ? waterline.safety : null,
      kohlSafety: kohlSafety ? { name: kohlSafety.name, risk: kohlSafety.risk ?? [], safer: kohlSafety.safeAlternatives ?? [] } : null,
      shadowColours: colourGuide,
      products,
      geometry: adaptToEyeShape(look.geometry, eyeShape),
    },
    glasses: glasses ? { principles: glasses.key_principles ?? [] } : null,
    because,
    ranking: rankEyeLooks(community.id),
  };
}

export function studioOptions() {
  return {
    communities: LIBRARY_COMMUNITIES,
    faceShapes: FACE_SHAPES,
    eyeShapes: EYE_SHAPES,
    browDensities: BROW_DENSITIES,
    skinTones: SKIN_TONES,
    browStyles: Object.entries(BROW_STYLES).map(([id, s]) => ({ id, label: s.label, summary: s.summary })),
    eyeLooks: Object.entries(EYE_LOOKS).map(([id, l]) => ({ id, label: l.label })),
  };
}
