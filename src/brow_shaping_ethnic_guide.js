/**
 * MIRRR — Eyebrow Shaping and Care (Multicultural Focus)
 * Brow anatomy, shaping techniques, threading, and multicultural brow aesthetics.
 */

export const BROW_ANATOMY = {
  title: 'Eyebrow Anatomy and Growth',
  structure: {
    regions: 'The eyebrow is divided into three regions: the head (medial — the inner corner closest to the nose); the body (central — the main arch area); and the tail (lateral — the outer end tapered to a point); the head is typically the fullest section; the body has the highest point at the arch; the tail tapers to a point or gradual fade',
    growth: 'Eyebrow hairs grow in a cycle similar to scalp hair but shorter: anagen (growth) phase: 1-3 months (much shorter than scalp hair\'s 2-6 years — this is why brows grow back slowly after overplucking); catagen (transition): a few weeks; telogen (resting/shedding): 1-3 months; the combination of short anagen and normal telogen means brows are always relatively short; average brow growth rate is approximately 0.14mm/day (versus 0.35mm/day for scalp hair)',
    follicle: 'Brow follicle damage from overplucking: repeated plucking of the same hair over many years can cause progressive damage to the hair follicle; the follicle loses its ability to produce a hair; this is the origin of the "thin brow" that many people in their 40s-60s have — decades of overplucking the 1990s fashion for very thin brows left many follicles permanently damaged; regrowth after years of overplucking may be incomplete, sparse, or absent in some areas'
  },
  browGrowth: {
    
    minoxidil: 'Minoxidil for brow growth: the same 2-5% minoxidil used for scalp hair loss has been applied off-label to eyebrows for growth stimulation; minoxidil works by prolonging anagen and increasing follicle size; it requires consistent use and the effect is lost if discontinued; it can cause slight skin irritation around the eye area; very small amounts applied carefully to the brow area with a cotton swab are used; consult a dermatologist before use',
    supplements: 'Biotin for brow growth: biotin (vitamin B7) supplementation is widely marketed for hair and brow growth; the evidence is primarily in individuals with biotin deficiency (which is rare); supplementation in individuals without deficiency is not strongly supported by clinical trials; biotin-rich foods (eggs, nuts, seeds, legumes) provide adequate biotin for most individuals'
  }
};

export const BROW_SHAPING_METHODS = {
  threading: {
    name: 'Threading (Khite / Fatkha)',
    origin: 'Threading is believed to have originated in ancient India, Persia, and Central Asia; it is documented in Indian beauty practices from at least the early medieval period; the Arabic term khite (خيط — literally "thread") and the Persian fatkha reflect its spread through Islamic beauty culture; it is now the dominant brow shaping method in South Asian, Arab, Middle Eastern, and Central Asian communities, and has become globally popular',
    technique: 'A doubled, twisted thread is rolled across the skin surface; the twisted loop catches and pulls out multiple hairs simultaneously as it rolls; the technique allows precise control of which hairs are removed; it can create a very crisp, defined line; the threading practitioner holds one end of the thread in their teeth (or uses a device) and one in their hand to create the twisting and rolling motion',
    advantages: 'Advantages of threading: extreme precision — can remove individual hairs or create very defined lines; safe for all skin types including the most sensitive (unlike wax which can lift skin or cause post-wax hyperpigmentation in sensitive or dark skin; thread removes only hair, not skin); no chemical exposure; the shape can be modified precisely in the session; more effective than tweezing for large areas because multiple hairs are removed simultaneously',
    disadvantages: 'Disadvantages: requires a skilled practitioner — poor threading technique creates uneven brows; the sensation can be painful (particularly across the upper brow bone); the technique only works on hairs above the skin — it cannot access ingrown hairs; some redness immediately after that resolves within 30 minutes to a few hours',
    ethnicSkinNote: 'Threading is particularly advantageous for melanin-rich skin: waxing can cause PIH from the trauma of skin lifting; threading removes only hair and does not pull the skin; the lower risk of PIH makes threading the preferred method for dark-skinned individuals; threading is also the only method that can precisely remove the fine vellus hairs around the brow edge that wax and laser miss'
  },
  waxing: {
    name: 'Eyebrow Waxing',
    types: {
      strip: 'Strip wax (soft wax): applied warm; a strip of cloth or paper is pressed on and pulled off; removes hair in the direction of the strip; less precise than threading for individual hair removal',
      hardWax: 'Hard wax (no-strip wax): applied warm and allowed to harden; then pulled off without a strip; grips the hair more efficiently and lifts less skin; preferred for sensitive areas (brows, upper lip, bikini); generally less traumatic to the skin than strip wax'
    },
    warnings: {
      dark: 'CRITICAL for dark skin: soft wax can lift the epidermis when it is peeled off; this micro-trauma causes PIH in Fitzpatrick III-VI skin; hard wax is safer but not risk-free; threading or precise tweezing is preferable for dark-skinned individuals for the brow area',
      retinoids: 'Do not wax skin currently using retinoids (tretinoin, retinol, retinaldehyde) — the skin is more fragile and skin lifting is significantly more likely; discontinue retinoids to the brow area for at least 5-7 days before waxing'
    }
  },
  tweezing: {
    name: 'Tweezing (Plucking)',
    advantages: 'Most accessible (home use); immediate precise control; no chemical or thermal risk',
    disadvantages: 'Slow (one hair at a time); painful; risk of follicle damage with repeated plucking over years; ingrown hairs if the hair is broken rather than pulled from the root',
    technique: 'Always pull in the direction of hair growth (not against it); tweeze after shower when hair follicles are open from steam; use a magnifying mirror in good lighting; tweeze only outside a clearly mapped brow shape',
    overpluckingHistory: 'The 1990s overplucked brow disaster: thin, highly arched, pencil-thin brows were fashionable throughout the 1990s and early 2000s; millions of people spent years plucking their brows very thin to achieve this look; the repeated plucking damaged many follicles permanently; the "thicker natural brow" fashion revival of the 2010s left many who had followed the 1990s trend with irreparably sparse brows where they had over-plucked; the lesson is that following extreme brow fashions that require significant removal of natural brow hair risks permanent follicle damage'
  },
  microblading: {
    name: 'Microblading and Brow PMU (Permanent Makeup)',
    description: 'Microblading: a form of semi-permanent brow tattooing using a hand-held blade-like tool with micro needles to deposit pigment into the superficial dermis creating hairlike strokes; results last 12-18 months depending on skin type and lifestyle; follow-up touch-up at 4-6 weeks after initial application for best results',
    variations: {
      microblading: 'Microblading: hairlike strokes; most natural-looking; best on dry to normal skin; may fade faster on oily skin',
      ombre: 'Ombre/powder brow: shaded effect without hairlike strokes; more makeup-like appearance; better suited to oily skin; more durable',
      combo: 'Combination brow: microbladed hair strokes in the front (head) with shading in the body and tail; increasingly popular as it combines the natural look of microblading with the durability of powder'
    },
    ethnicSkinWarning: {
      dark: 'CRITICAL for dark skin: microblading on Fitzpatrick IV-VI skin carries significant risk of PIH and poor healing; the micro-wounds from the blade triggers the inflammation-PIH response in melanin-rich skin; the pigment may not be visible against darker skin; the hairlike strokes may heal as a blurry patch rather than defined strokes in oily skin; if considering microblading on dark skin, seek a practitioner who specialises specifically in dark skin microblading; a patch test and consultation is essential',
      lighter: 'Ombre/powder brow is generally safer for darker skin tones than microblading; the shading technique involves less trauma per area than the repeated blade strokes of microblading'
    },
    pigmentWarning: 'Brow PMU pigment safety: the composition of brow PMU pigments varies; iron oxides (red, yellow, black iron oxide) are the safest and most stable pigments; organic pigments (AZO pigments) may cause reactions and can change colour unpredictably over time; carbon black (for grey-black shades) is generally safe; always check that the practitioner uses body-safe, professional-grade pigments'
  },
  laser: {
    name: 'Laser Brow Removal',
    note: 'Laser hair removal of the brow can be used to tidy areas outside the desired brow shape; caution: laser on the brow area requires protective eye shields specifically for the eye rather than standard laser shields; CONTRAINDICATED: do not perform laser hair removal ON the brow itself near the eye without proper ocular protection; Fitzpatrick IV-VI skin requires Nd:YAG 1064nm or long-pulsed diode laser'
  }
};

export const ETHNIC_BROW_AESTHETICS = {
  overview: 'Eyebrow aesthetics are among the most culturally specific aspects of beauty: what constitutes an ideal brow shape varies significantly between communities; the Western (particularly Northern European American) ideal of an arched, defined brow is NOT the global standard; South Asian brows are historically straight to gently arched; East Asian (particularly Korean) brows are straight; Arab brows are bold and naturally arched; the ideal brow shape is the one that is most harmonious with the individual\'s face structure, not the one that is fashionable in the dominant culture'
};

export const ETHNIC_BROW_GUIDES = {
  'west-african': {
    community: 'West African',
    naturalBrow: 'West African women typically have strong, well-defined natural brows with good density; the West African brow ideal is the bold, defined natural brow that frames the large, expressive West African eye; the 1990s overplucking fashion was particularly damaging for West African women who removed naturally full brows to follow the pencil-thin trend; the natural brow celebration movement aligns perfectly with West African aesthetic tradition',
    threading: 'Threading is popular in West African Muslim communities; other communities may prefer tweezing or waxing; threading salons in West African diaspora communities (London, Paris, New York) are often shared spaces with South Asian threading practitioners who have established this technique globally',
    brownBeauty: 'Brow makeup for dark complexions: dark brown or black brow pencil; brow pomade for a fuller, defined look; clear or tinted brow gel to set natural brows; avoid the "Instagram brow" (extremely structured, over-carved, over-highlighted) which looks unnatural against West African features; a natural, slightly groomed full brow is the ideal',
    pih: 'PIH from waxing: the brow area on dark skin is vulnerable to PIH from wax trauma; threading preferred; if waxing, use only hard wax and apply SPF to the brow area after waxing',
    recommendations: 'Threading for precise shaping without PIH risk; castor oil nightly for brow growth stimulation; dark brown brow pencil in hair-like strokes; clear brow gel to set; protect the natural brow thickness that is a West African beauty asset'
  },
  'south-asian': {
    community: 'South Asian',
    threading: 'Threading (khite; dhaaga) is THE South Asian brow shaping method — it is as culturally embedded in South Asian beauty as kajal eye application; threading salons are found everywhere South Asian diaspora communities exist; many South Asian women have a relationship with their threading practitioner spanning years or decades; the threading appointment (often combined with upper lip threading) is a regular beauty appointment as standard as a haircut',
    browShape: 'The South Asian brow ideal: traditionally the South Asian brow ideal is a gently arched to straight brow with a natural beginning and a tapered end; the very high, sharply arched brow of Western editorial fashion is not traditionally South Asian; the Bollywood brow has evolved over decades — from the very defined, arched 1960s brow (Waheeda Rehman, Nutan) to the more natural, full 2010s-2020s brow (Deepika Padukone, Anushka Sharma); the current South Asian brow ideal is the naturally full, gently shaped brow',
    hairyBrow: 'The unibrow concern: the space between the eyebrows (glabella) often has more hair growth in South Asian women than in some other communities; threading the centre between the brows is a standard part of South Asian brow grooming; however, from a modern beauty perspective, some South Asian women are choosing to leave the space between their brows partially or fully natural as a nod to Frida Kahlo\'s aesthetic and broader natural brow movements',
    karvaChauth: 'Festive brow grooming: brows are specifically addressed for Diwali, Eid (for Muslim South Asians), weddings, and other major celebrations; a fresh threading appointment in the days before a major event is standard South Asian beauty practice; the fresh-threaded brow is part of the complete celebratory beauty preparation alongside champi, henna, and skin care',
    microblading: 'Microblading caution for South Asian skin: South Asian Fitzpatrick III-V skin is at moderate-to-high risk of PIH from microblading; powder/ombre brow is safer; consult a practitioner who specifically has experience with South Asian skin before proceeding',
    recommendations: 'Threading for brow shaping — always threading, not waxing; dark brown (not black — which can look harsh) brow pencil in hair-like strokes for any sparse areas; castor oil nightly to the brow for density; protect the natural South Asian brow fullness rather than over-thinning'
  },
  caribbean: {
    community: 'Caribbean',
    browTrends: 'Caribbean brow aesthetics are strongly influenced by both West African natural brow tradition and North American beauty trends; the "Instagram brow" (over-shaped, over-highlighted, with visible carving) has been popular in Caribbean diaspora communities; the more natural, thicker brow aesthetic has been gaining ground',
    mixedInfluence: 'The cultural diversity of the Caribbean means brow practices vary significantly: Afro-Caribbean women may follow West African or Black American brow aesthetics; Indo-Caribbean women follow South Asian threading tradition; mixed-heritage women adapt to their features',
    browAndCarnival: 'Carnival brow: for Carnival events, brow aesthetics are deliberately dramatic — cut brows (shaved-in designs), graphic brow shapes, and gem-decorated brows are all part of the Carnival face art tradition; these are not everyday brow choices but celebratory expressions',
    recommendations: 'Threading where available for PIH-safe shaping; natural full brow preservation; dark brow pencil or pomade; castor oil for growth; SPF on the brow area after any shaping to prevent PIH'
  },
  arab: {
    community: 'Arab',
    browTradition: 'Eyebrow shaping is a central Arab beauty practice; threading was developed in the Middle East and South Asia and remains the preferred method in Arab beauty culture; the Arab brow ideal is strong, well-defined, and naturally arched — not the very thin 1990s style but a well-groomed, full, defined brow that frames the eyes powerfully',
    hijabBrow: 'Brow importance in hijab culture: when hair is covered and the face is the primary visual field, eyebrows play an outsized role in facial expression and beauty; well-shaped, defined brows are particularly important for women wearing hijab; brow makeup (pencil, pomade, powder) is one of the most important makeup products for hijab-wearing Muslim women',
    islamicScholarship: 'The Islamic scholarly debate on eyebrow shaping: there is a centuries-long debate in Islamic jurisprudence about the permissibility of eyebrow plucking or shaping; the hadith narrates that the Prophet (PBUH) cursed the one who removes eyebrow hair (namas); some scholars interpret this as a prohibition on all eyebrow shaping; others interpret it more narrowly (only prohibiting excessive thinning or specific pre-Islamic practices); in practice, many Muslim women shape their brows to some degree; this remains an individual decision between the Muslim woman and her interpretation of Islamic guidance; MIRRR notes this debate respectfully without taking a position on the Islamic ruling',
    arabBrowAesthetic: 'The Arab brow aesthetic: the brow should look natural and strong, not over-worked; threading to clean up stray hairs while preserving natural fullness; the space between the brows (the glabella) is typically threaded for definition; the arch is preserved at its natural height rather than being dramatically lifted; brow filler used sparsely to add density where needed rather than dramatically reconstructing the brow',
    recommendations: 'Threading as the preferred shaping method; strong natural brow preservation; brow pencil or pomade in dark brown or black for definition; avoid over-thinning, which is hard to grow back; castor oil for brow growth maintenance'
  },
  latina: {
    community: 'Latina',
    frida: 'Frida Kahlo and the Latina natural brow: Frida Kahlo\'s bold, unibrow-embracing aesthetic has become one of the most powerful beauty symbols in Latina and feminist beauty culture globally; her refusal to conform to Eurocentric standards of facial hair removal (joined brow; slight upper lip hair; all left natural) is a direct cultural ancestor of the current natural brow movement; Latina women choosing to leave their brows full and natural (and even their unibrow ungroomed) are connecting to a powerful tradition of beauty self-determination',
    warmBrow: 'Brow colour for warm Latina complexions: dark brown to black brow pencil and pomade; for those with warm dark hair, an auburn or warm brown brow product can look more natural than black; ash brown looks grey and unnatural on warm Latina skin — always choose warm-toned brow products',
    bolivian: 'The Bolivian cholita brow: cholita women of Bolivia (indigenous Aymara women) maintain a traditional beauty aesthetic including strong, natural brows that contrast with their traditional hat (bowler hat/bombín) and traditional dress; the Bolivian cholita look is an increasingly celebrated example of indigeneous Latina beauty that is culturally specific and proud',
    recommendations: 'Threading (widely available in Latin American communities and diaspora areas); for those not removing the unibrow — this is a valid and beautiful choice; warm brown or dark brown brow pencil (never ash or cool-toned); castor oil for brow growth; natural-looking, full brow shape; Frida-inspired thick brow celebration'
  },
  'east-asian': {
    community: 'East Asian',
    koreanBrow: 'The Korean straight brow (일자 눈썹 — ilja nunsseop — literally "one-line brow"): the defining East Asian brow aesthetic of the 2010s and 2020s is the straight brow — with minimal or no arch; the brow runs almost horizontally from head to tail with a very slight natural angle; this is the direct opposite of the Western high-arch ideal; the straight brow is considered youthful and natural in Korean beauty; creating a straight brow from a naturally arched brow involves: mapping the brow to ensure the tail doesn\'t drop (which creates a negative canthal tilt appearance); filling in above the arch with brow powder to "fill in" the curve and create the illusion of a straighter brow; brushing brow hairs downward and then setting with a clear gel',
    japanBrow: 'Japanese brow aesthetic: J-beauty brows tend to be slightly more defined than K-beauty; natural brow shape is highly valued; the "Shiseido brow" (referring to Shiseido cosmetics) is a precisely drawn natural brow with a moderate arch; J-beauty avoids the very dramatic Instagram brow',
    eyebrowTech: 'East Asian eyebrow technology: the Korean and Japanese beauty industries have created the most technologically sophisticated brow makeup products: micro-tip brow pens that create hair-like strokes; 6-hour eyebrow gel; the Korean cushion brow product (a micro-cushion applicator for brow powder); tinted brow mascara for a natural effect; these products aim for "no-makeup brow" authenticity',
    browColouringNote: 'Eyebrow colouring in East Asian beauty: many East Asians have naturally very dark, near-black brows; browning or lightening the brows to match a lighter hair colour (from hair dyeing) is common in Korean and Japanese beauty; brow colouring products in softer brown shades are widely used; the brow colour should be harmonious with the hair colour',
    recommendations: 'Straight brow technique for K-beauty aesthetic (fill in above the arch, brush down); tinted brow gel for natural effect; brow pencil in soft brown or grey-brown (not black — too harsh against softer East Asian colouring unless natural brows are very dark); Korean micro-tip brow pen for hairlike strokes; feathered, natural texture rather than carved-out harshness'
  },
  'east-african': {
    community: 'East African',
    naturalBrow: 'East African women (particularly Somali, Ethiopian, and Eritrean) typically have well-defined, naturally arched brows with good density; these natural brows are a significant beauty asset and the East African aesthetic is one that celebrates strong, defined natural brows without excessive grooming',
    threadingInDiaspora: 'In East African diaspora communities, threading salons serve the community alongside South Asian-operated threading businesses; the technique is the same but the East African practitioner may have specific knowledge of East African facial structure and brow expectations',
    somaliIdeal: 'Somali brow ideal: strong, defined, naturally arched brows; keeping the brow\'s natural strength while cleaning up stray hairs is the usual approach',
    recommendations: 'Threading for shaping; preserve the natural fullness and arch; castor oil for maintenance; dark brow pencil sparingly for any sparse areas; brow gel to set'
  },
  'south-african': {
    community: 'South African',
    africanBrow: 'South African Black women typically have strong, bold natural brows as a beauty asset; the African brow ideal is full, defined, and natural — complementing the strong bone structure characteristic of many African facial types',
    urbanBeauty: 'Urban South African brow trends: South African major cities (Johannesburg, Cape Town, Durban) have vibrant beauty cultures influenced by global trends but with a strong African identity; the bold natural brow with defined, well-groomed edges is the current dominant aesthetic in urban Black South African beauty',
    microblading: 'Microblading in South Africa: microblading is increasingly popular but carries PIH risk for Black South African skin; powder/ombre brow is a safer alternative; finding practitioners in South Africa who specialise in dark skin microblading is the key recommendation',
    ndebele: 'Ndebele brow decoration: the Ndebele tribe\'s traditional face and body painting traditions include decorative designs around the eyes and brows; these geometric, bold designs on celebration occasions create a distinctive brow framing effect that connects to broader African geometric visual tradition',
    recommendations: 'Strong, bold natural brow preservation; threading for shaping; castor oil or marula oil to the brow for growth support; brow pomade for definition; powder/ombre brow over microblading for any PMU treatment'
  },
  'black-american': {
    community: 'Black American',
    browHistory: 'The history of eyebrow aesthetics in Black American beauty: from the highly arched, pencilled brow of classic Hollywood (when Black actresses conformed to Eurocentric brow ideals) through the thin-brow 1990s that affected Black American women as much as any community, to the current celebration of the natural, full brow; the "no-brow" and super-thin brow eras are universally understood now as having caused long-term damage to follicles',
    browMakeup: 'Brow makeup in Black American beauty: brow pencil and brow pomade are heavily used; the "Instagram brow" (highly structured, with a defined under-carve and dramatic tail) has been popular and influential; the fade-to-natural brow (beginning very soft at the head and building to full density in the body and tail) is a more natural-looking technique that has gained popularity; brow products must be in warm-to-neutral brown or dark brown rather than grey-toned ashiness',
    ombre: 'Ombre brow for Black American skin: powder/ombre semi-permanent brow is more suitable than microblading for the melanin-rich skin of Black American women; a powder effect brow that gradually intensifies from head to tail looks natural and is durable',
    recommendations: 'Brow pencil with fine tip for hair-like strokes; brow pomade for fuller coverage; warm brown (not ash) tones; preserve the natural fullness of Black American brows; castor oil nightly for growth; threading or precise tweezing over waxing for dark skin; powder/ombre PMU if considering semi-permanent brow'
  }
};

export function getBrowGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BROW_GUIDES['west-african'],
    'south-asian': ETHNIC_BROW_GUIDES['south-asian'],
    caribbean: ETHNIC_BROW_GUIDES.caribbean,
    arab: ETHNIC_BROW_GUIDES.arab,
    latina: ETHNIC_BROW_GUIDES.latina,
    'east-asian': ETHNIC_BROW_GUIDES['east-asian'],
    'east-african': ETHNIC_BROW_GUIDES['east-african'],
    'south-african': ETHNIC_BROW_GUIDES['south-african'],
    'black-american': ETHNIC_BROW_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

