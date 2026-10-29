/**
 * MIRRR Cultural Beauty Myths Debunked
 * Separating fact from fiction across ethnic beauty communities
 * Science-backed responses to widespread misinformation
 */

// ─── UNIVERSAL MYTHS ──────────────────────────────────────────────────────────

export const UNIVERSAL_MYTHS = [
  {
    myth: 'Natural or organic beauty products are always safer and better',
    truth: 'Natural doesn\'t mean safe, and synthetic doesn\'t mean dangerous. Poison ivy is natural. Lye (sodium hydroxide, used in cold process soap) is natural. Many of the most irritating and allergenic skincare ingredients are plant-derived. Meanwhile, many thoroughly tested and safe synthetic ingredients have excellent safety profiles. The relevant questions are: Is the ingredient tested? What is its concentration? What is your skin type?',
    relevant_communities: ['all'],
    example: 'Tea tree oil (natural) can cause severe contact dermatitis at full concentration. Hyaluronic acid (can be synthetic) is one of the gentlest and most universally tolerated skincare ingredients.',
  },
  {
    myth: 'Drinking lots of water will give you glowing skin',
    truth: 'Adequate hydration is necessary for overall health and the skin barrier functions better when the body is properly hydrated. However, drinking excessive water beyond normal hydration needs does not meaningfully increase skin moisture content. Skin moisture is primarily maintained by the stratum corneum (top skin layer) and the ingredients you apply, not by the amount of water consumed. Chronically dehydrated people may see improvement from better hydration; already adequately hydrated people will not see dramatic changes.',
    relevant_communities: ['all'],
    what_actually_works: 'Ceramide-containing moisturisers, hyaluronic acid, and protective oils do more for skin moisture than drinking extra water beyond adequate intake.',
  },
  {
    myth: 'Pores open and close with heat and cold',
    truth: 'Pores do not have muscles. They cannot open or close. They are fixed structures. Steam does not "open pores" — it softens the sebum and debris inside pores, making them easier to cleanse. Cold water does not "close" pores. The appearance of pores can vary with skin condition (hydrated vs dehydrated, oil production, product residue) but the physical size is determined by genetics.',
    relevant_communities: ['all'],
    why_it_matters: 'Understanding this prevents both unnecessary practices (seeking treatments to "open" or "close" pores) and correct understanding (focus on keeping pores clear of debris, managing oil production, and using ingredients that minimise their appearance like retinol).',
  },
  {
    myth: 'Toothpaste dries out pimples',
    truth: 'Toothpaste was historically used for spot treatment, but modern toothpastes contain ingredients that can seriously irritate skin — fluoride, SLS (sodium lauryl sulphate), whitening agents, and flavourings. These can cause chemical burns, contact dermatitis, and PIH on the spot being treated — literally making dark spots worse. A benzoyl peroxide spot treatment, salicylic acid patch, or even ice is far better and safer.',
    relevant_communities: ['all'],
    extra_risk: 'PIH risk from toothpaste-caused irritation is particularly significant for Fitzpatrick IV-VI skin.',
  },
  {
    myth: 'You can shrink your pores permanently with products',
    truth: 'Pore size is primarily genetic. You can MINIMISE their APPEARANCE with products (niacinamide reduces sebum production making pores look smaller; retinol keeps pores clear of debris; clay masks temporarily remove surface oil) and procedures (chemical peels, laser treatments can improve pore appearance over time). But you cannot permanently shrink pores with topical products.',
    relevant_communities: ['all'],
  },
  {
    myth: 'More product = more results',
    truth: 'With most active skincare ingredients, there is an optimal dose above which you either see no additional benefit, more irritation, or diminishing returns. Using double the amount of retinol does not give double the results — it gives more irritation and potential for PIH. The same applies to AHAs, vitamin C, and other actives.',
    relevant_communities: ['all'],
  },
  {
    myth: 'If it doesn\'t tingle, it\'s not working',
    truth: 'Tingling from skincare products is a sign of mild irritation or sensitisation — not effectiveness. A well-formulated product at the right pH and concentration will work without causing discomfort. Skin "getting used to" an irritating product is often the skin building a trauma response, not adaptation.',
    relevant_communities: ['all'],
    relevant_products: 'Often cited with vitamin C and AHAs — at correct concentrations and proper formulation, these work without burning.',
  },
];

// ─── SOUTH ASIAN / DESI BEAUTY MYTHS ──────────────────────────────────────────

export const SOUTH_ASIAN_MYTHS = [
  {
    myth: 'Coconut oil is good for acne-prone skin',
    truth: 'Coconut oil is highly comedogenic (pore-clogging rating of 4/5). It is excellent for dry, non-acne-prone skin and for hair. But applying it to already acne-prone skin — especially the face — is likely to worsen breakouts. The "oil cleansing method" can work with non-comedogenic oils (jojoba, hemp seed, grapeseed) but not with coconut oil for those prone to acne.',
    relevant_communities: ['south-asian'],
    caveat: 'Coconut oil is excellent for hair, scalp, and body use. The acne issue is specific to face application on acne-prone skin.',
  },
  {
    myth: 'Turmeric brightens skin permanently and is safe for everyone',
    truth: 'Turmeric (specifically curcumin) has some anti-inflammatory and antioxidant properties and may offer mild brightening benefit with consistent use. However: (1) it can stain skin and nails yellow — often difficult to remove; (2) it can cause contact dermatitis in sensitive individuals; (3) the concentrations in DIY masks are not controlled and vary wildly; (4) it does not replace clinically proven brightening treatments for significant hyperpigmentation. The cultural practice is legitimate but the miraculous claims are exaggerated.',
    relevant_communities: ['south-asian'],
  },
  {
    myth: 'Threading causes hair to grow back thicker',
    truth: 'Like all hair removal methods that remove from the surface (not the root), threading does not change the thickness or colour of regrowth. Hair appears coarser when it grows back because it has a blunt tip rather than the natural tapered end — the same optical illusion that makes shaved hair appear thicker. The hair itself is identical.',
    relevant_communities: ['south-asian', 'arab'],
  },
  {
    myth: 'Henna is completely safe for everyone',
    truth: 'Natural plant henna (Lawsonia inermis — the green paste that creates red/orange stains) is generally safe for most people. HOWEVER: (1) black henna or chemical henna contains PPD (paraphenylenediamine) — an industrial dye that can cause severe chemical burns, keloid scarring, and lifelong sensitisation to PPD; (2) compound henna contains metallic salts that interfere with chemical hair colour; (3) some people are allergic to natural henna itself, though rare; (4) henna on hair permanently changes the hair shaft — bleaching after henna is unpredictable and dangerous.',
    relevant_communities: ['south-asian', 'arab', 'east-african'],
    critical: 'BLACK HENNA IS NOT NATURAL AND IS DANGEROUS. It is a serious safety concern particularly at tourist destinations and children\'s events.',
  },
  {
    myth: 'Oil massage (champi) prevents hair loss',
    truth: 'Regular scalp massage (regardless of whether oil is used) has evidence for increasing hair thickness over time — a 2019 study showed 4 minutes of daily scalp massage over 24 weeks increased hair thickness. The massage itself is the beneficial component. Oils provide conditioning benefits but specific hair growth claims for most oils (except rosemary oil, which has strong evidence, and black seed oil) are not well-supported by clinical trials.',
    relevant_communities: ['south-asian'],
    what_is_proven: 'Rosemary oil has clinical trial evidence showing similar efficacy to minoxidil for hair loss. The massage component is also evidence-backed for thickness (not necessarily length).',
  },
  {
    myth: 'Fair skin is naturally better or more desirable than darker skin',
    truth: 'Colourism is a harmful system of discrimination that has been reinforced through colonial history and the beauty industry. Skin colour is determined by melanin — the body\'s natural UV protection. There is absolutely no objective basis for equating lighter skin with beauty or worth. Melanin-rich skin has significant advantages including UV protection, skin aging more slowly, and lower rates of UV-related skin cancers. The beauty industry is increasingly recognising and celebrating the full spectrum of skin tones.',
    relevant_communities: ['south-asian'],
    call_to_action: 'Examine product choices and beauty routines — are skin-lightening products chosen from personal preference or from colourism? Many skin-brightening ingredients treat PIH specifically; this is different from trying to change your natural skin tone.',
  },
  {
    myth: 'Ubtan (chickpea flour + turmeric + milk) is just a DIY trend',
    truth: 'Ubtan is a traditional Indian beauty preparation with thousands of years of documented use. The chickpea flour provides mild physical exfoliation and skin-brightening gram protein. Turmeric offers anti-inflammatory effects. Milk provides lactic acid (natural AHA). Rose water adds soothing properties. While trendy now, ubtan is a legitimate ancestral beauty practice — not a fad.',
    relevant_communities: ['south-asian'],
  },
];

// ─── ARAB / MIDDLE EASTERN BEAUTY MYTHS ──────────────────────────────────────

export const ARAB_MYTHS = [
  {
    myth: 'Argan oil is a miracle product for all skin types',
    truth: 'Argan oil is excellent — rich in oleic acid, vitamin E, and polyphenols — but it is NOT suitable for all skin types. Oleic-acid-dominant oils (including argan, olive, coconut) are rich and deeply penetrating, which is wonderful for dry or mature skin. However, for acne-prone or sebum-heavy skin, oleic-dominant oils can worsen breakouts. Linoleic-acid-dominant oils (rosehip, grapeseed, hemp seed) are better for acne-prone skin.',
    relevant_communities: ['arab'],
    who_it_works_for: 'Excellent for dry, mature, damaged, or eczema-prone skin. Avoid on acne-prone, oily face skin.',
  },
  {
    myth: 'Kohl/kajal from traditional lead-based formulas are the most effective eyeliners',
    truth: 'Traditional kohl made from galena (lead sulphide), surma, or kohl-stone can contain significant levels of lead — a known neurotoxin. Traditional preparations that have been used for millennia do carry real risk, particularly for children. Modern kajal products use carbon black or iron oxides instead, which are safe. The cultural and aesthetic identity of kajal can be honoured with safer modern formulations.',
    relevant_communities: ['arab', 'south-asian', 'east-african'],
    evidence: 'Lead exposure from traditional kohl has been documented in studies across multiple countries. Children are most vulnerable.',
  },
  {
    myth: 'Hammam scrubbing too hard gives better results',
    truth: 'The kessa glove (Italian glove, Morocco exfoliation mitt) works by softening the skin through steam heat and then removing loosened dead skin cells. The exfoliation action requires minimal pressure — the dead cells lift with light pressure after sufficient steaming. Aggressive scrubbing does not remove more dead skin; it traumatises living skin layers, causes redness, and triggers PIH in darker skin tones.',
    relevant_communities: ['arab'],
    correct_technique: 'Steam in hammam for 10-15 minutes minimum. Then use kessa glove with gentle, even strokes. The dead skin lifts naturally.',
  },
  {
    myth: 'Halawa (sugar wax) is the same as commercial hot wax',
    truth: 'Halawa is fundamentally different from commercial waxes in composition and mechanism. Halawa is made from sugar, lemon juice, and water — it only adheres to hair, not to skin. Commercial wax can adhere to skin and cause trauma and PIH. Traditional halawa, properly made, is gentler for skin and particularly better for darker skin tones. It can be rewarmed repeatedly, is natural, and leaves minimal residue.',
    relevant_communities: ['arab'],
  },
];

// ─── WEST AFRICAN / BLACK BEAUTY MYTHS ───────────────────────────────────────

export const WEST_AFRICAN_MYTHS = [
  {
    myth: 'Black skin doesn\'t need sunscreen',
    truth: 'This is one of the most dangerous myths in skin health. While melanin does provide some natural UV protection (SPF ~13 in very dark skin vs ~3 in lighter skin), this is nowhere near sufficient for daily UV protection. Black and darker-skinned individuals have lower rates of skin cancer but are more likely to DIE from skin cancer when they develop it — in part because it\'s caught later due to the misconception that dark skin doesn\'t need checking or protection. UV damage also causes hyperpigmentation, worsening of existing PIH, and premature aging — all concerns for darker skin.',
    relevant_communities: ['west-african', 'black-american', 'east-african', 'south-african', 'caribbean'],
    critical: true,
  },
  {
    myth: 'Shea butter can replace all skincare products',
    truth: 'Raw shea butter is an excellent moisturiser and has some anti-inflammatory properties (contains triterpenes). It is high in oleic and stearic acids, making it very rich and occlusive. However, it does not: exfoliate, treat hyperpigmentation, protect from UV, provide antioxidant protection, address acne, or replace a comprehensive skincare routine for those with specific skin concerns. It is an excellent BASE product and natural moisturiser.',
    relevant_communities: ['west-african', 'black-american', 'east-african', 'caribbean'],
  },
  {
    myth: 'Vaseline/petroleum jelly clogs pores',
    truth: 'Petroleum jelly (Vaseline) is non-comedogenic — it does not penetrate pores or clog them. It sits on top of the skin as a pure occlusive, sealing in moisture. Petroleum jelly is actually one of the most studied and safest skin barrier products available and is used in clinical wound care. The confusion comes from its heavy, greasy texture which people associate with clogging. This has been studied — petroleum jelly does not cause acne.',
    relevant_communities: ['west-african', 'black-american', 'caribbean'],
    note: 'Vaseline is excellent for very dry skin, as an overnight lip treatment, on cuticles, and for healing minor wounds. Black Americans have used it for generations — with good reason.',
  },
  {
    myth: 'Black hair grows slower than other hair types',
    truth: 'All hair grows at approximately the same rate — roughly 0.5 inches (1.2cm) per month — regardless of ethnicity or hair type. The difference in apparent length retention between Type 4 coily hair and straight hair is due to SHRINKAGE (coily hair can shrink 50-75% of its actual length) and BREAKAGE (the unique structure of Type 4 hair means more points of vulnerability leading to breakage before length is retained). The goal is not to grow hair faster but to RETAIN more of the hair that is growing.',
    relevant_communities: ['west-african', 'black-american', 'east-african', 'caribbean'],
    what_helps: 'Low manipulation styles, LOC method, protective styles, moisture retention, avoiding heat and chemical damage, and regular protein/moisture balance treatments all increase LENGTH RETENTION.',
  },
  {
    myth: 'You shouldn\'t wash natural Type 4 hair too frequently because it\'s naturally dry',
    truth: 'While it\'s true that the coily structure of Type 4 hair makes natural oil (sebum) slow to travel down the hair shaft — and that washing does remove some moisture — avoiding washing creates scalp buildup (sebum, dead skin cells, product residue, bacteria) that inhibits hair growth and causes scalp conditions. Finding the right washing frequency for YOUR scalp (which may be weekly for most, or twice weekly for active people) and using hydrating, sulphate-free cleansers allows for proper scalp health WITHOUT excessive dryness. Follow washing with LOC method.',
    relevant_communities: ['west-african', 'black-american'],
  },
  {
    myth: 'Relaxers permanently make hair "better"',
    truth: 'Chemical relaxers permanently break the disulfide bonds in hair that create its natural curl pattern. This chemically alters the hair structure permanently — the hair does not "revert" to its natural state. Relaxed hair requires ongoing chemical treatment (touch-ups at the roots as new growth comes in), which is a commitment that involves repeated chemical exposure. Relaxed hair is also more fragile than natural hair, particularly at the demarcation line (where relaxed meets natural hair). Neither relaxed nor natural is objectively "better" — this is a personal choice. But understanding that relaxers cause permanent structural change is important.',
    relevant_communities: ['west-african', 'black-american', 'caribbean'],
  },
];

// ─── EAST ASIAN BEAUTY MYTHS ──────────────────────────────────────────────────

export const EAST_ASIAN_MYTHS = [
  {
    myth: 'Rice water makes hair grow faster',
    truth: 'Rice water contains inositol, a compound that penetrates the hair shaft and strengthens it from within — reducing friction and improving elasticity. This is real science. HOWEVER, this does not make hair grow FASTER. What it may do is reduce breakage, allowing you to RETAIN more of the hair that is growing. The Yao women of Huangluo (China) who use rice water regularly have extraordinary length, but this is attributed to retention (reduced breakage) not increased growth rate.',
    relevant_communities: ['east-asian'],
    truth_about_inositol: 'Inositol is the one known compound that actually penetrates the hair shaft and is retained there. The rice water tradition has real scientific backing for strengthening — just not for growth rate increase.',
  },
  {
    myth: 'Japanese women\'s perfect skin comes entirely from their diet',
    truth: 'Japanese skin care culture emphasises multilayer skincare routines (often 8-10 steps), thorough sun protection (hat + umbrella + sunscreen culture), and very thorough gentle cleansing. Diet plays a role but it is not the dominant factor. The disciplined SPF usage across generations is likely the single biggest contributor to the appearance of age-defying skin. Fermented foods in the diet do have gut microbiome benefits, which has skin connections, but the primary drivers are skincare practices.',
    relevant_communities: ['east-asian'],
  },
  {
    myth: 'K-beauty 10-step routines are essential for good skin',
    truth: 'The "10-step K-beauty routine" was partly a marketing concept amplified by Western beauty media. Korean dermatologists and skincare experts themselves rarely advocate for exactly 10 steps — they emphasise thorough cleansing, hydration, and sun protection above all. A well-chosen 3-4 step routine is more sustainable and often more effective than 10 mediocre steps. The QUALITY and consistency of products matters more than the NUMBER of steps.',
    relevant_communities: ['east-asian'],
  },
  {
    myth: 'Monolid eyes need double eyelid surgery to be beautiful',
    truth: 'Monolid eyes are a natural feature associated with East Asian heritage. The pressure on East Asian women to undergo double eyelid (blepharoplasty) surgery has roots in Eurocentric beauty standards, colonialism, and internalised racism. Monolid eyes are beautiful, and there is an active reclamation in East Asian communities of diverse eye shapes as equally beautiful. Many K-beauty and J-beauty makeup techniques celebrate and enhance monolid features rather than disguising them.',
    relevant_communities: ['east-asian'],
    makeup_instead: 'Cut crease techniques adapted for monolids, puppy liner, lower lash line emphasis, and graphic liner all celebrate rather than disguise the monolid.',
  },
];

// ─── LATINA BEAUTY MYTHS ──────────────────────────────────────────────────────

export const LATINA_MYTHS = [
  {
    myth: 'Lemon juice on skin is a good natural brightener',
    truth: 'Lemon juice is highly acidic (pH ~2) and contains psoralens (photosensitising compounds). Applied to skin in sunlight, it can cause phytophotodermatitis — a severe chemical burn reaction that leaves significant and long-lasting PIH. Even in the absence of sunlight, the low pH can damage the skin barrier and cause sensitisation. The natural citric acid content, while technically an AHA, is present in uncontrolled concentration. NEVER apply lemon juice to skin, particularly on darker skin tones already prone to PIH.',
    relevant_communities: ['latina', 'all'],
    what_to_do_instead: 'Use a properly formulated lactic acid or citric acid product at controlled pH and concentration for brightening benefits without the burn risk.',
  },
  {
    myth: 'Olive oil is excellent for all skin types',
    truth: 'Olive oil is very high in oleic acid and contains oleuropein (which can be irritating to the skin barrier). Research has shown that olive oil can actually impair the skin barrier and worsen eczema in some individuals — it is specifically NOT recommended by paediatric dermatologists for baby skin. For cooking: excellent. For dry, non-acne-prone, mature skin: acceptable in small amounts. For babies, sensitive, acne-prone, or barrier-compromised skin: better alternatives exist.',
    relevant_communities: ['latina'],
  },
  {
    myth: 'All Latinas have the same skin tone',
    truth: 'Latin America encompasses hundreds of ethnic and racial backgrounds — from predominantly Indigenous to African descent to European to Asian (particularly in Brazil and Peru). "Latina" skin encompasses the full spectrum from very fair to very deep, with the full range of undertones. The beauty industry has historically homogenised Latinas as having medium-tan warm skin, erasing the vast diversity within this community.',
    relevant_communities: ['latina'],
  },
];

// ─── HAIR MYTHS ACROSS COMMUNITIES ───────────────────────────────────────────

export const UNIVERSAL_HAIR_MYTHS = [
  {
    myth: 'Trimming hair makes it grow faster',
    truth: 'Hair grows from the follicle at the scalp. Trimming the ends has no physiological connection to growth rate at the root. Trimming removes split ends, which reduces breakage travelling up the hair shaft — this helps RETAIN length that has already grown. The appearance of faster growth comes from better retention, not increased growth.',
    relevant_communities: ['all'],
  },
  {
    myth: 'Biotin supplements will make everyone\'s hair grow faster and thicker',
    truth: 'Biotin (vitamin B7) deficiency DOES cause hair loss — but biotin deficiency is rare in people who eat a varied diet. For people who are NOT biotin deficient, taking extra biotin produces no measurable increase in hair growth or thickness. The biotin supplement industry is largely marketing. Note: biotin at high doses can interfere with thyroid function tests and certain lab results — tell your doctor if you take high-dose biotin before testing.',
    relevant_communities: ['all'],
    what_actually_works: 'Iron (for those deficient — check ferritin), vitamin D, adequate protein, and zinc all have more evidence for hair health.',
  },
  {
    myth: 'Stress-related hair loss can be solved with topical products',
    truth: 'Telogen effluvium (stress-triggered hair loss) is an internal process — excess hair follicles shifting from growth phase to shedding phase in response to physical or emotional stress. Topical products cannot address the root cause (pun intended). The treatment is managing or resolving the stressor, supporting overall health (nutrition, sleep), and time — most telogen effluvium resolves naturally within 3-6 months of the triggering stressor resolving.',
    relevant_communities: ['all'],
  },
  {
    myth: 'Wearing wigs and weaves causes permanent hair loss',
    truth: 'Wigs and weaves THEMSELVES do not cause permanent hair loss — improper installation and wearing practices do. Traction alopecia from weaves comes from braids sewn too tight, the weight of extensions pulling on edges, and wearing weaves without breaks for the scalp. A properly installed protective style, worn for appropriate duration (6-8 weeks maximum), with adequate moisturising of the natural hair underneath, does not cause permanent loss.',
    relevant_communities: ['west-african', 'black-american', 'east-african', 'caribbean'],
  },
];

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMythsForCommunity(communityId) {
  const communityMythMap = {
    'south-asian': SOUTH_ASIAN_MYTHS,
    'arab': ARAB_MYTHS,
    'west-african': WEST_AFRICAN_MYTHS,
    'black-american': WEST_AFRICAN_MYTHS,
    'east-african': WEST_AFRICAN_MYTHS,
    'east-asian': EAST_ASIAN_MYTHS,
    'latina': LATINA_MYTHS,
    'caribbean': WEST_AFRICAN_MYTHS,
  };

  const communitySpecific = communityMythMap[communityId] || [];
  const universal = UNIVERSAL_MYTHS;
  const hairMyths = UNIVERSAL_HAIR_MYTHS;

  return {
    communitySpecific,
    universal: universal.filter(m => m.relevant_communities.includes(communityId) || m.relevant_communities.includes('all')),
    hairMyths: hairMyths.filter(m => m.relevant_communities.includes(communityId) || m.relevant_communities.includes('all')),
  };
}

export function getAllMythsByCategory() {
  return {
    universal: UNIVERSAL_MYTHS,
    southAsian: SOUTH_ASIAN_MYTHS,
    arab: ARAB_MYTHS,
    westAfrican: WEST_AFRICAN_MYTHS,
    eastAsian: EAST_ASIAN_MYTHS,
    latina: LATINA_MYTHS,
    hair: UNIVERSAL_HAIR_MYTHS,
  };
}

export function getCriticalMythsForSafety() {
  const critical = [
    ...UNIVERSAL_MYTHS.filter(m => m.myth.includes('sunscreen') || m.myth.includes('tingle')),
    ...WEST_AFRICAN_MYTHS.filter(m => m.critical),
    ...ARAB_MYTHS.filter(m => m.relevant_communities.includes('arab') && m.myth.includes('lead')),
    ...LATINA_MYTHS.filter(m => m.myth.includes('lemon')),
    ...SOUTH_ASIAN_MYTHS.filter(m => m.myth.includes('henna')),
  ];
  return critical;
}

export const MYTHS_STATS = {
  totalMythsCovered:
    UNIVERSAL_MYTHS.length +
    SOUTH_ASIAN_MYTHS.length +
    ARAB_MYTHS.length +
    WEST_AFRICAN_MYTHS.length +
    EAST_ASIAN_MYTHS.length +
    LATINA_MYTHS.length +
    UNIVERSAL_HAIR_MYTHS.length,
  communitiesCovered: 7,
  criticalSafetyMyths: 4,
};
