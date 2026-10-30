/**
 * Pregnancy & Postpartum planner: is this ingredient or treatment OK at your stage, what to do
 * for the concern you have now, what changes to expect, and your community's pregnancy or
 * postpartum traditions.
 *
 * Stage decides every verdict (first trimester, second, third, breastfeeding, or postpartum and
 * not breastfeeding), using only what the guides say for that stage; where they say nothing, the
 * verdict says so instead of guessing. Concern picks the advice; Fitzpatrick type sets melasma
 * risk and the deeper-skin notes. Community adds traditions only.
 */
import { UNIVERSAL_PREGNANCY_BEAUTY as UP, getPregnancyBeautyGuide } from '../pregnancy_beauty_ethnic_guide.js';
import { PREGNANCY_INGREDIENT_SAFETY as SAFETY, PREGNANCY_SKIN_CHANGES, PREGNANCY_HAIR_CHANGES, POSTPARTUM_BEAUTY } from '../pregnancy_beauty_guide.js';
import { UNIVERSAL_POSTPARTUM_BEAUTY as UPP, getPostpartumBeautyGuide } from '../postpartum_beauty_ethnic_guide.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const STAGES = [
  { id: 't1', label: 'Pregnant: first trimester (weeks 1–13)', pregnant: true, trimester: 'firstTrimester' },
  { id: 't2', label: 'Pregnant: second trimester (weeks 14–27)', pregnant: true, trimester: 'secondTrimester' },
  { id: 't3', label: 'Pregnant: third trimester (weeks 28–40+)', pregnant: true, trimester: 'thirdTrimester' },
  { id: 'bf', label: 'After birth, breastfeeding', pregnant: false },
  { id: 'pp', label: 'After birth, not breastfeeding', pregnant: false },
];
export const CONCERNS = [
  { id: 'melasma', label: 'Dark patches (melasma)' }, { id: 'acne', label: 'Breakouts' },
  { id: 'stretch', label: 'Stretch marks' }, { id: 'hair', label: 'Hair changes and shedding' }, { id: 'itch', label: 'Itchy, stretching skin' },
];

const avoid = n => UP.ingredientsToAvoid.find(x => x.ingredient.startsWith(n));
const safe = n => UP.safeIngredients.find(x => x.ingredient.startsWith(n));
const hairRule = n => UP.hairDuringPregnancy.safeHairCare.find(x => x.startsWith(n));
const bfAvoid = re => `On the guide's avoid-while-breastfeeding list: ${UPP.safeBeautyForBreastfeeding.avoidWhileBreastfeeding.find(x => re.test(x))}.`;
const bfSafe = re => `On the guide's safe-while-breastfeeding list: ${UPP.safeBeautyForBreastfeeding.safeWhileBreastfeeding.find(x => re.test(x))}.`;
const v = (verdict, text) => ({ verdict, text });
const same = x => ({ t1: x, t2: x, t3: x });
const NOT_BF = POSTPARTUM_BEAUTY.introducing_actives_postpartum.not_breastfeeding;

/** Ingredient or treatment -> verdict per stage, each with the guide sentence it rests on. */
export const INGREDIENTS = [
  { id: 'retinoid', label: 'Retinol, tretinoin or adapalene', rule: { ...same(v('avoid', avoid('Retinoids').reason)), bf: v('avoid', bfAvoid(/Retinol/)), pp: v('ok', NOT_BF) } },
  { id: 'hydroquinone', label: 'Hydroquinone', rule: { ...same(v('avoid', avoid('Hydroquinone').reason)), bf: v('avoid', bfAvoid(/Hydroquinone/)), pp: v('caution', PREGNANCY_SKIN_CHANGES.melasma_chloasma.postpartum_treatment) } },
  { id: 'salicylicWash', label: 'Salicylic acid face wash (2% or less)', rule: { ...same(v('caution', SAFETY.AVOID.salicylic_acid.practitioner_note)), bf: v('ok', `From the breastfeeding guide: ${UPP.safeBeautyForBreastfeeding.avoidWhileBreastfeeding.find(x => /salicylic/i.test(x))}.`), pp: v('ok', NOT_BF) } },
  { id: 'salicylicPeel', label: 'Salicylic peel or strong BHA', rule: { ...same(v('avoid', avoid('High-dose salicylic').reason)), bf: v('avoid', `Generally avoided while breastfeeding: ${POSTPARTUM_BEAUTY.breastfeeding_ingredients.generally_avoid.find(x => /peel/i.test(x))}.`), pp: v('caution', NOT_BF) } },
  { id: 'benzoyl', label: 'Benzoyl peroxide (2.5–5%)', rule: { ...same(v('caution', safe('Benzoyl').notes)), bf: v('ok', bfSafe(/Benzoyl/)), pp: v('ok', NOT_BF) } },
  { id: 'azelaic', label: 'Azelaic acid', rule: { ...same(v('ok', safe('Azelaic').notes)), bf: v('ok', bfSafe(/Azelaic/)), pp: v('ok', NOT_BF) } },
  { id: 'vitaminC', label: 'Vitamin C serum', rule: { ...same(v('ok', safe('Vitamin C').notes)), bf: v('ok', bfSafe(/Vitamin C/)), pp: v('ok', NOT_BF) } },
  { id: 'niacinamide', label: 'Niacinamide', rule: { ...same(v('ok', safe('Niacinamide').notes)), bf: v('ok', bfSafe(/Niacinamide/)), pp: v('ok', NOT_BF) } },
  { id: 'glycolic', label: 'Glycolic or lactic acid (low strength)', rule: { ...same(v('ok', safe('Glycolic').notes)), bf: v('ok', bfSafe(/Glycolic/)), pp: v('ok', NOT_BF) } },
  { id: 'chemicalSpf', label: 'Chemical sunscreen (oxybenzone, avobenzone)', rule: { ...same(v('caution', avoid('Chemical sunscreens').reason)), bf: v('caution', bfAvoid(/Chemical sunscreens/)), pp: v('ok', 'Any broad-spectrum sunscreen you will wear every day; daily SPF is what keeps melasma from coming back.') } },
  { id: 'mineralSpf', label: 'Mineral sunscreen (zinc oxide, titanium dioxide)', rule: { ...same(v('ok', safe('Zinc oxide').notes)), bf: v('ok', bfSafe(/Mineral sunscreen/)), pp: v('ok', SAFETY.SAFE.sunscreens.zinc_oxide) } },
  { id: 'hairDye', label: 'Permanent hair dye', rule: { t1: v('avoid', hairRule('Hair dye')), t2: v('caution', hairRule('Hair dye')), t3: v('caution', hairRule('Hair dye')), bf: null, pp: null } },
  { id: 'relaxer', label: 'Chemical relaxer', rule: { t1: v('avoid', hairRule('Chemical relaxers')), t2: v('caution', hairRule('Chemical relaxers')), t3: v('caution', hairRule('Chemical relaxers')), bf: null, pp: null } },
  { id: 'keratin', label: 'Keratin or Brazilian blowout (formaldehyde)', rule: { ...same(v('avoid', SAFETY.AVOID.formaldehyde_releasers.specific_concern)), bf: v('caution', SAFETY.AVOID.formaldehyde_releasers.concern), pp: v('caution', SAFETY.AVOID.formaldehyde_releasers.concern) } },
  { id: 'henna', label: 'Plant henna', rule: { ...same(v('ok', hairRule('Henna'))), bf: null, pp: null } },
  { id: 'sprayTan', label: 'Spray tan or self-tanner', rule: { ...same(v('caution', SAFETY.AVOID.spray_tans_self_tanners.concern)), bf: v('caution', bfAvoid(/Self-tanner/)), pp: null } },
  { id: 'clarySage', label: 'Clary sage, rosemary or other strong essential oils', rule: { ...same(v('avoid', SAFETY.AVOID.essential_oils_high_risk.reason)), bf: v('caution', `Generally avoided while breastfeeding: ${POSTPARTUM_BEAUTY.breastfeeding_ingredients.generally_avoid.find(x => /Essential oils/.test(x))}.`), pp: null } },
  { id: 'mercury', label: 'Unlabelled or imported skin-lightening cream', rule: { ...same(v('avoid', avoid('Mercury').reason)), bf: v('avoid', avoid('Mercury').reason), pp: v('avoid', avoid('Mercury').reason) } },
  { id: 'bakuchiol', label: 'Bakuchiol', rule: { ...same(v('caution', safe('Bakuchiol').notes)), bf: null, pp: null } },
];
const NO_RULE = 'The guides give no rule for this at your stage, so this planner will not guess: ask your doctor, midwife or pharmacist.';

const pick = (val, list, d) => (list.includes(val) ? val : d);
const deepSkin = fitz => ['IV', 'V', 'VI'].includes(fitz);
const dash = id => id.replace(/_/g, '-');

function ingredientCheck(id, stage) {
  const ing = INGREDIENTS.find(x => x.id === id);
  const r = ing.rule[stage] ?? { verdict: 'ask', text: NO_RULE };
  const later = STAGES.filter(s => s.id !== stage).map(s => ({ stage: s.id, label: s.label, verdict: ing.rule[s.id]?.verdict ?? 'ask' }));
  return { id, label: ing.label, ...r, otherStages: later };
}

function stageNotes(stage) {
  const s = STAGES.find(x => x.id === stage);
  if (s.pregnant) {
    const t = UP.trimesterGuide[s.trimester];
    const skin = PREGNANCY_SKIN_CHANGES[s.trimester.replace('Trimester', '_trimester')];
    return { weeks: t.weeks, whatHappens: t.whatHappens, focus: t.beautyFocus, tips: t.skincareTips, skinChanges: skin.changes };
  }
  const h = POSTPARTUM_BEAUTY.hormone_adjustment;
  return {
    weeks: h.timeline, whatHappens: h.skin_effects, focus: POSTPARTUM_BEAUTY.introducing_actives_postpartum.note,
    tips: stage === 'bf' ? UPP.safeBeautyForBreastfeeding.safeWhileBreastfeeding : POSTPARTUM_BEAUTY.introducing_actives_postpartum.priority,
    skinChanges: UPP.postpartumSkinChanges.commonChanges.map(c => `${c.change}: ${c.description}`),
  };
}

function concernPlan(concern, stage) {
  const pregnant = STAGES.find(x => x.id === stage).pregnant; const bf = stage === 'bf';
  const M = PREGNANCY_SKIN_CHANGES.melasma_chloasma;
  const pp = name => UPP.postpartumSkinChanges.commonChanges.find(c => c.change.startsWith(name));
  if (concern === 'melasma') {
    return pregnant
      ? { title: 'Melasma while pregnant', about: M.what, cause: M.cause, doNow: [...M.prevention, ...M.safe_treatments_during_pregnancy], notNow: M.unsafe_for_melasma_during_pregnancy }
      : { title: 'Melasma after birth', about: pp('Melasma').description, cause: pp('Melasma').timeline, doNow: POSTPARTUM_BEAUTY.introducing_actives_postpartum.priority.filter(x => bf ? !/not breastfeeding/.test(x) : true), notNow: bf ? UPP.safeBeautyForBreastfeeding.avoidWhileBreastfeeding : [], later: bf ? M.postpartum_treatment : null };
  }
  if (concern === 'acne') {
    return pregnant
      ? { title: 'Breakouts while pregnant', about: UP.trimesterGuide.firstTrimester.whatHappens.find(x => /acne/i.test(x)), doNow: UP.safeIngredients.filter(x => /Acne|Multi-benefit/.test(x.category)).map(x => `${x.ingredient}: ${x.notes}`), notNow: [avoid('Retinoids').ingredient, avoid('High-dose salicylic').ingredient, avoid('Benzoyl').ingredient] }
      : { title: 'Breakouts after birth', about: pp('Postpartum acne').description, doNow: [pp('Postpartum acne').management], notNow: bf ? UPP.safeBeautyForBreastfeeding.avoidWhileBreastfeeding.filter(x => /Retinol|salicylic/i.test(x)) : [] };
  }
  if (concern === 'stretch') {
    const T = UP.stretchMarkTimeline;
    const rows = { t1: ['12–16'], t2: ['16–24', '24–32'], t3: ['24–32', '32–40'], bf: ['Postpartum'], pp: ['Postpartum'] }[stage];
    const protocol = T.protocol.filter(p => rows.includes(p.week)).map(p => `${p.week === 'Postpartum' ? 'After birth' : `Weeks ${p.week}`}: ${p.action}`);
    return { title: 'Stretch marks', about: pp('Stretch marks').description, doNow: [...protocol, `Oils and creams people use: ${T.bestIngredients.join(', ')}`], notNow: bf ? UPP.safeBeautyForBreastfeeding.avoidWhileBreastfeeding.filter(x => /Retinol/.test(x)) : [], expectations: T.managedExpectations };
  }
  if (concern === 'hair') {
    const H = PREGNANCY_HAIR_CHANGES;
    return pregnant
      ? { title: 'Hair while pregnant', about: H.during_pregnancy.positive.mechanism, doNow: UP.hairDuringPregnancy.safeHairCare, notNow: [], expectations: H.during_pregnancy.negative_for_some.texture_change }
      : { title: 'Shedding after birth', about: `${H.postpartum_hair_loss.timing} ${H.postpartum_hair_loss.duration}`, doNow: H.postpartum_hair_loss.support.filter(x => bf ? true : !/Biotin supplements/.test(x)), notNow: [], expectations: H.postpartum_hair_loss.reassurance, seeDoctor: H.postpartum_hair_loss.when_to_see_doctor, texturedHair: H.postpartum_hair_loss.ethnic_note };
  }
  const third = UP.trimesterGuide.thirdTrimester;
  const P = PREGNANCY_SKIN_CHANGES.third_trimester.puppp;
  return {
    title: 'Itchy, stretching skin',
    about: third.whatHappens[0],
    doNow: third.skincareTips.filter(x => /itch|oat/i.test(x)),
    notNow: [],
    seeDoctor: [third.whatHappens[0].split(';')[1].trim(), `${PREGNANCY_SKIN_CHANGES.third_trimester.changes.find(x => x.startsWith('PUPPP'))}. ${P.treatment}`],
    expectations: pregnant ? null : POSTPARTUM_BEAUTY.hormone_adjustment.skin_effects.find(x => /Dry skin/.test(x)),
  };
}

function melasmaRisk(fitz) {
  const M = PREGNANCY_SKIN_CHANGES.melasma_chloasma; const higher = ['III', 'IV', 'V', 'VI'].includes(fitz);
  return {
    type: fitz, higher, note: higher ? M.ethnic_note : M.prevention[0],
    deeperSkin: deepSkin(fitz) ? { concerns: UP.melaninConsiderations.concerns, strategies: UP.melaninConsiderations.strategies } : null,
  };
}

/** Postpartum guides are written in each community's own shape: list their named practices. */
function practices(g) {
  const out = [];
  for (const [k, val] of Object.entries(g)) {
    if (['communityId', 'communityName'].includes(k) || /Philosophy$/.test(k)) continue;
    const title = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
    if (typeof val === 'string') out.push({ title, text: val, items: [] });
    else if (Array.isArray(val)) out.push({ title, text: null, items: val.map(item) });
    else if (val && typeof val === 'object') {
      const text = val.description ?? val.context ?? val.approach ?? val.traditionalApproach ?? val.postpartumSheddingContext ?? val.postpartumApproach ?? null;
      const lists = Object.values(val).filter(Array.isArray).flat().map(item);
      out.push({ title: val.name ?? title, text: typeof text === 'string' ? text : null, items: lists });
    }
  }
  return out;
}
const item = x => (typeof x === 'string' ? x : [x.food ?? x.herb ?? x.plant ?? x.practice ?? x.concern ?? x.name, x.benefit ?? x.description ?? x.remedy ?? x.use].filter(Boolean).join(': '));

function communityNotes(cid, pregnant) {
  if (pregnant) {
    const g = getPregnancyBeautyGuide(dash(cid));
    return {
      kind: 'pregnancy', philosophy: g.pregnancyPhilosophy,
      avoid: g.safeSkincare.avoid, safeAlternatives: g.safeSkincare.safeAlternatives, notes: g.safeSkincare.notes ?? null,
      stretchMarks: { traditional: g.stretchMarkPrevention.traditionalApproach, wisdom: g.stretchMarkPrevention.communityWisdom ?? null },
      hair: g.hairChanges.management, foods: g.prenatalBeautyFoods.map(item),
      rituals: g.traditionalPregnancyRituals.map(r => ({ name: r.name, description: r.description ?? null, safetyNote: r.safetyNote ?? null })),
      recipe: g.glowRecipe,
    };
  }
  const g = getPostpartumBeautyGuide(dash(cid));
  return { kind: 'postpartum', philosophy: g.postpartumPhilosophy ?? null, practices: practices(g) };
}

export function buildBumpPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const stage = pick(input.stage, STAGES.map(x => x.id), 't2');
  const concern = pick(input.concern, CONCERNS.map(x => x.id), 'melasma');
  const ingredient = pick(input.ingredient, INGREDIENTS.map(x => x.id), 'retinoid');
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const st = STAGES.find(x => x.id === stage);
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { stage, concern, ingredient, fitzpatrick: fitz, community: cid, tone: tone.id },
    tone, stage: { id: stage, label: st.label, pregnant: st.pregnant },
    check: ingredientCheck(ingredient, stage),
    concern: concernPlan(concern, stage),
    stageNotes: stageNotes(stage),
    melasma: melasmaRisk(fitz),
    disclaimer: SAFETY.disclaimer,
    communityNotes: communityNotes(cid, st.pregnant),
  };
}

export function bumpOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK,
    stages: STAGES.map(({ id, label }) => ({ id, label })), concerns: CONCERNS, ingredients: INGREDIENTS.map(({ id, label }) => ({ id, label })), tones: MONK_TONES,
  };
}
