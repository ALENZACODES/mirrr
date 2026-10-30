/**
 * MIRRR — Eyebrow Shaping Guide (Multicultural Perspectives)
 * Complete eyebrow anatomy, shaping techniques, brow mapping,
 * and multicultural eyebrow traditions and care across all 9 communities.
 */

export const EYEBROW_ANATOMY = {
  title: 'Eyebrow Anatomy and Hair Biology',
  structure: {
    hairFollicle: 'Eyebrow hairs grow from follicles embedded in the dermis beneath the brow area; unlike scalp hair, eyebrow hairs have a shorter anagen (growth) phase of approximately 4-6 weeks and a longer telogen (resting) phase; this is why brows do not grow to the length of scalp hair',
    growthCycle: {
      anagen: 'Active growth phase: 4-6 weeks for brow hair (versus 3-7 years for scalp hair); determines the maximum length brow hair will reach before falling out',
      catagen: 'Transition phase: 2-3 weeks; the follicle shrinks and the hair detaches from the blood supply',
      telogen: 'Resting and shedding phase: approximately 3 months; the old hair is shed and a new hair begins to form in the follicle',
      regrowth: 'This means brows take approximately 3-4 months to fully regrow after being removed; the persistent myth that brows do not grow back is largely false — though years of repeated over-plucking can permanently damage follicles and reduce regrowth'
    },
    hairCharacteristics: {
      ethnicVariation: 'Brow hair characteristics vary significantly across ethnic groups: South Asian and Arab brows tend to be dark, straight to slightly wavy, and dense; East Asian brows have a characteristic straight/horizontal pattern with follicles angled differently than Caucasian brows; West African and Black American brows are often coarser and can have a wider natural growth pattern; fair Northern European brows are often lighter and more sparse naturally',
      thickness: 'Brow hair shaft diameter varies: thicker, coarser hair shafts are more common in South Asian, West African, and East African populations; finer hair is more common in East Asian and Northern European populations; coarser hair creates bolder, more naturally defined brows and may require different grooming approaches'
    }
  },
  mapping: {
    title: 'Eyebrow Mapping — The Golden Ratio Method',
    startingPoint: 'The inner corner of the brow should align vertically above the inner corner of the nostril; a straight edge placed at the outer edge of the nostril and pointing straight up indicates the inner brow start',
    archPeak: 'The highest point of the arch should align with a line drawn from the outer edge of the nostril through the outer edge of the iris (coloured part of the eye); the arch position creates the lift and shape of the brow',
    endPoint: 'The tail end of the brow should align with a line drawn from the outer edge of the nostril to the outer corner of the eye; the tail should end at or slightly above the level of the brow start (never lower, as this pulls the face down)',
    browThickness: {
      face: 'Brow thickness should generally be proportional to face features; bolder, stronger facial features are balanced by fuller brows; finer features often suit more defined but slightly less full brows',
      trend: 'Brow trends swing dramatically: the 1990s and 2000s saw extremely thin, over-plucked brows across mainstream beauty; the 2010s-present has seen a major return to full, thick brows; many women over-plucked in the 1990s/2000s permanently damaged their follicles and now cannot regrow brows to their natural state; leaving brows full is strongly recommended'
    }
  }
};

export const SHAPING_TECHNIQUES = {
  title: 'Eyebrow Shaping Methods',
  threading: {
    what: 'Threading (also called khite, in Arabic meaning "thread") uses a twisted doubled thread to trap and remove hairs by the root as the thread rolls across the skin; two hairs of the thread rotate in opposite directions, catching hairs in the twist and pulling them out; one of the most precise hair removal methods available for the brows',
    origin: 'Threading originated in ancient South Asia and Central Asia; it is an ancient technique with thousands of years of history in South Asian (Indian, Pakistani) beauty culture; it spread through the Middle East (where it is called khite) and to Central Asia; threading salons spread to Western countries primarily through South Asian and Middle Eastern diaspora communities in the 1980s-2000s',
    advantages: ['Extremely precise line definition — threads can remove one hair at a time', 'No chemicals applied to skin (suitable for sensitive and reactive skin)', 'No risk of lifting or burning skin (unlike wax)', 'Very effective on all hair textures including coarser South Asian and Middle Eastern brow hair', 'Relatively affordable', 'Very fast once the technique is mastered'],
    technique: 'The threading practitioner holds one end of the thread with their teeth or ties it; the double loop catches hairs as the thread moves; experienced threaders can shape an entire eyebrow in under 2 minutes with surgical precision; it is a highly skilled technique that takes significant practice to learn correctly',
    sensation: 'Threading causes a stinging or scratching sensation as multiple hairs are pulled simultaneously; most people find it comparable to or slightly less painful than waxing; the upper lip is significantly more sensitive than the brows; the sensation diminishes with repeated sessions as hair regrowth becomes finer',
    aftercare: 'Avoid makeup, SPF, and heavy skincare on threaded areas for at least 6-12 hours; the open follicles are susceptible to infection and irritation; aloe vera gel or a gentle soothing mist is suitable immediately after threading'
  },
  waxing: {
    what: 'Applying warm (or cold strip) wax to brow area, pressing a strip of fabric or paper on top, and pulling the strip off quickly against the hair growth direction, removing multiple hairs from the root simultaneously',
    types: {
      softWax: 'Applied warm, removed with fabric or paper strips; used most commonly for brows; the heated wax opens the follicle slightly for smoother removal; harder to be precise because the wax spreads',
      hardWax: 'Applied warm, hardens on the skin without a strip, and is removed when hard by pulling from an edge; harder wax grips the hair more than the skin, reducing skin trauma; generally gentler than soft wax and better for sensitive skin; does not require a strip'
    },
    advantages: ['Fast — shapes both brows in 5-10 minutes', 'Results last 3-6 weeks as the hair must regrow from the root', 'Very effective on fine, sparse hair that threading struggles to catch', 'Widely available at both professional salons and for at-home use'],
    risks: {
      skinLifting: 'Waxing on skin using retinoids (tretinoin, retinol), AHAs/BHAs, or accutane can cause the wax to lift the outer layer of skin, causing a chemical burn-type wound; these ingredients make skin more fragile; ALWAYS disclose any retinoid or acid use to a wax technician; discontinue retinoids in the brow area 1 week before waxing',
      darkSkinConcern: 'Post-waxing hyperpigmentation is more common in Fitzpatrick III-VI skin tones; the trauma of wax removal can trigger PIH; warm compress, aloe, and avoiding sun on waxed areas immediately after reduces risk',
      irritation: 'Wax reactions (redness, bumps, irritation) are common in sensitive skin; a patch test 48 hours before is recommended for first-time waxing'
    }
  },
  tweezing: {
    what: 'Individual hair removal using tweezers to grip and pull each hair from the root one at a time; the most precise and controllable method for personal brow maintenance between professional shaping sessions',
    technique: {
      preparation: 'Apply a warm compress or steam the face to open follicles and reduce pain; apply a tiny amount of witch hazel or toner to clean the skin; stretch the skin taut between two fingers before pulling',
      grip: 'Grip the hair as close to the skin as possible; pull in the direction of hair growth in a smooth, swift motion; pulling against the direction of growth can break the hair at the surface rather than removing it from the root (causing faster regrowth and potential ingrowns)',
      lighting: 'Good lighting (natural light or a well-lit magnifying mirror) is essential for precise tweezing; bathroom mirror lighting pointing from below creates shadows that make precision difficult'
    },
    maintenance: 'Tweezing is ideal for maintaining shape between professional sessions; only remove single stray hairs outside the established shape; avoid tweezing the inner corner of the brow (creates an unnatural gap) or the top line of the brow (disrupts the natural arch)'
  },
  razorShaving: {
    what: 'Using a razor blade or precision brow razor (also called a dermaplaning razor or brow razor) to shave the brow hair at the skin surface; unlike tweezing or threading, shaving does not remove the hair from the root — the follicle remains and the hair regrows within days',
    advantages: 'Completely painless; very fast; no specialist required; no risk of PIH from follicle trauma; good for precise shape editing',
    disadvantages: 'Regrowth is visible within 2-3 days as stubble; requires very frequent maintenance; regrowth appears stubbly rather than tapered',
    eastAsianBrows: 'Shaving (including complete brow shaving and redrawing) is a popular technique in East Asian beauty culture; the ability to completely redesign the brow shape by shaving and redrawing with brow pencil or powder gives maximum flexibility; the naturally darker and straighter East Asian brow hair draws very cleanly when redrawn'
  },
  laserPermanent: {
    what: 'Laser hair removal uses targeted light pulses to destroy the hair follicle and prevent regrowth; applied to brows provides very long-lasting to permanent reduction; the treated follicles no longer produce hair or produce only very fine vellus hair',
    warnings: {
      permanentDecision: 'Laser removal of brows is a very permanent decision — beauty trends for brow shape change significantly (thin brows were fashionable in the 1990s-2000s; full brows in the 2010s-present); removing brow follicles permanently locks in a shape based on current trends',
      darkSkin: 'Nd:YAG 1064nm laser is the safest option for Fitzpatrick IV-VI skin for brow laser; Alexandrite and IPL should be avoided on dark skin as they risk burns and permanent PIH; see the body hair laser guide for full dark skin laser guidance',
      eyeProtection: 'Eye protection during brow laser treatment is absolutely critical; special metal eye shields (not just goggles) placed inside the eyelid are used for brow-area laser to protect the eye directly'
    }
  },
  microblading: {
    what: 'A semi-permanent tattoo technique using a hand tool with tiny needles to deposit pigment into the superficial dermis in hair-like strokes; creates the appearance of fuller, more defined brows that look like real brow hair; lasts 12-24 months with proper care before fading',
    procedure: 'A topical numbing cream is applied 30-60 minutes before; the technician draws the desired brow shape; the microblading tool deposits pigment in fine strokes following the natural hair growth direction; a touch-up appointment 4-6 weeks later is included in the initial fee',
    healing: 'Brows appear very dark and bold immediately after the procedure; they fade significantly (30-40%) over 10-14 days as the skin heals; the final result is visible after 6-8 weeks',
    skinToneConsiderations: {
      fitzpatrickItoIII: 'Heals predictably; standard microblading technique works well',
      fitzpatrickIVtoVI: {
        concern: 'Microblading on Fitzpatrick IV-VI skin carries significant risk of hyperpigmentation (PIH) because the microblading needles create controlled micro-wounds in the skin; darker skin types are more prone to post-traumatic hyperpigmentation',
        powder: 'Powder brow (ombre brow) technique — using a machine tattoo device to create a soft, powdery filled-in brow appearance — causes less skin trauma than microblading hair strokes and is recommended for Fitzpatrick IV-VI skin by most experienced brow technicians',
        technician: 'It is critical to choose a technician experienced with darker skin tones; ask to see healed results on clients with similar Fitzpatrick scale rating; melanin-rich skin requires different technique and pigment selection'
      }
    }
  }
};

export const BROW_FILLING_PRODUCTS = {
  title: 'Brow Filling, Shaping, and Enhancement Products',
  pencils: {
    description: 'Fine-tipped pencils for drawing individual hair strokes or filling sparse areas; the finest-tipped pencils (often called "micro" brow pencils) create the most realistic hair-stroke effect; available in wide colour ranges',
    bestFor: 'Sparse brow areas; creating defined hair-stroke textures; filling gaps; suitable for all brow shapes and types',
    technique: 'Use feather-light strokes in the direction of hair growth; never draw a single solid line — it looks drawn-on and unnatural; build up with multiple short strokes',
    recommendations: ['Anastasia Beverly Hills Brow Wiz: ultra-fine tip; very pigmented; wide shade range', 'NYX Micro Brow Pencil: affordable with impressive precision', 'Benefit Precisely My Brow Pencil: excellent for beginners with forgiving tip size']
  },
  powders: {
    description: 'Pressed powder or loose powder applied with a small angled brush to fill in and define brows; creates a softer, more diffused effect than pencil; excellent for filling large areas',
    bestFor: 'Fuller brows that just need definition; those who prefer a softer, natural brow look; photographing well (powder brows look more natural in photos than hair-stroke pencil)',
    technique: 'Use a small angled brush; apply in short upward strokes; build coverage gradually; set with clear or coloured brow gel',
    recommendations: ['Anastasia Beverly Hills Dipbrow Pomade: the professional favourite; intense pigment; long-lasting', 'NYX Micro Brow Powder: buildable, blendable, affordable', 'e.l.f. Cosmetics Brow Lift Clear Brow Gel: excellent drugstore clear setting gel']
  },
  pomade: {
    description: 'A cream-to-powder formula with high pigment and long-lasting wear; typically applied with an angled brush; extremely popular for bold, defined, dramatic brow looks',
    bestFor: 'Bold, defined brow looks; those who want maximum longevity; very sparse brows needing significant fill; dramatic makeup looks',
    recommendations: ['Anastasia Beverly Hills Dipbrow Pomade: the original gold standard', 'MAC Eye Brows Styler: professional standby', 'Maybelline TattooStudio Brow Pomade: drugstore option with excellent longevity']
  },
  gels: {
    clear: 'Clear brow gels set brow hairs in place and add a slight laminated look; essential finishing step for groomed brows; also used to "soap brow" effect (which uses glycerin-based soap to slick hairs upward for a trendy brushed-up laminated look)',
    tinted: 'Tinted brow gels fill and set simultaneously; great for fuller natural brows that just need definition and colour; less precise than pencil or pomade',
    lamination: 'Soap brows technique: a wet spoolie and clear brow gel (or glycerin-containing soap) brushed through brow hairs and combed straight up creates a trendy "laminated" brow look without permanent lamination treatment'
  },
  colourMatching: {
    guidance: 'Brow product colour should generally match the natural brow colour exactly or be one shade lighter; darker products create a harsh, drawn-on appearance; those with very dark brows (common in South Asian, Arab, and East Asian communities) may find cool-toned dark brown a better choice than pure black, which can look harsh; grey brows look most natural with a light-to-medium taupe or grey-toned brow product rather than the person\'s original dark colour'
  }
};

export const ETHNIC_EYEBROW_GUIDES = {
  'west-african': {
    naturalBrows: 'West African brows are typically dark, often with relatively dense and coarser hair; natural brow shapes vary from arched to flatter; many West African women have naturally strong, full brows that require minimal enhancement but benefit from grooming',
    popularStyles: ['Defined, groomed natural brows cleaned up with threading or waxing', 'Bold filled-in dramatic brows for fashion and evening looks', 'Feathered, fluffy natural brow styles in contemporary West African fashion', 'Strong arched brow shapes as a statement beauty element in Nigerian and Ghanaian beauty'],
    challenges: 'Thicker, coarser brow hair can create a less defined natural shape and may benefit from professional threading or waxing every 3-4 weeks; the deeper skin tone means PIH risk from wax trauma should be considered; threading is generally the safest option for maintaining shape',
    microblading: 'If microblading or tattooed brows are desired, powder brow technique is strongly recommended over traditional microblading hair strokes to minimise PIH risk; must seek a technician experienced with West African skin tones'
  },
  'south-asian': {
    naturalBrows: 'Many South Asian brows grow dark, dense and defined; full, arched brows are a valued beauty feature; natural brow colour is often very dark brown to black',
    threadingCulture: 'Threading is the quintessential South Asian brow technique; threading salons and threading as a cultural practice originated in South Asia; many South Asian women are threaded from a young age; threading practitioners within South Asian communities are highly skilled; the threading technique is particularly effective on coarser South Asian brow hair',
    bridal: 'Elaborate brow shaping and definition is a critical part of South Asian bridal beauty preparation; brows are professionally threaded, then filled with precision; bold arched brow shapes that frame the detailed eye makeup are traditional for South Asian bridal looks',
    monobrow: {
      cultural: 'The unibrow (connected brows without a gap) has complex cultural history in South Asia; it was traditionally considered a beauty mark in some South Asian traditions (Frida Kahlo, while Mexican, also represents the cultural valuing of the unibrow as a beauty feature); in contemporary South Asian beauty, most women choose to thread the space between the brows, but there is a growing movement reclaiming the unibrow as a beauty statement',
      modern: 'Young South Asian women globally are increasingly reclaiming the unibrow as an anti-mainstream beauty statement; influencer movements challenging conventional brow standards'
    }
  },
  caribbean: {
    naturalBrows: 'Caribbean brow characteristics vary with the diverse genetic heritage of Caribbean communities; Afro-Caribbean brows tend to be dark and dense with coarser hair; Indo-Caribbean brows reflect South Asian heritage with typically dark, full brows; mixed-heritage brows encompass a wide range',
    popularStyles: ['Well-groomed, defined brow arches that frame the face', 'Bold filled brows for makeup looks', 'Natural brow maintenance with threading or waxing to clean the shape'],
    threading: 'Threading is popular among Indo-Caribbean communities carrying South Asian beauty traditions; waxing is widely available and popular; many Caribbean women in diaspora communities frequent threading salons'
  },
  arab: {
    naturalBrows: 'Arab brows are characteristically dark, dense, and often naturally arched; Middle Eastern women are widely recognised for having some of the most naturally beautiful and defined brows; the natural brow colour is very dark brown to black',
    khite: 'Threading is called "khite" in Arabic and is the traditional Arab brow technique; it has been practised in the Arab world for centuries as a core beauty ritual; Arab women typically maintain precisely threaded brow shapes with clean lower edges and defined arches',
    shape: 'Arab beauty standards have traditionally favoured a defined, strong arch; contemporary Arab brow trends shift between high arches and the modern laminated/fluffy brow',
    microblading: 'Brow tattooing and microblading are popular in the Gulf Arab market; the trend for very precisely shaped, defined brows makes semi-permanent brow techniques appealing; Gulf Arab women spend significantly on beauty enhancements including brow treatments',
    monobrow: 'Like South Asian culture, the unibrow has historical beauty significance in Arab culture; it was traditionally considered a sign of beauty and good fortune in some Arab traditions; this cultural history is complex and varies by region and time period'
  },
  latina: {
    naturalBrows: 'Latina brow characteristics vary with the enormously diverse genetic heritage across Latin America; Indigenous Latin American heritage often produces dark, full, well-defined brows; Caribbean-Latina heritage brings African ancestry brow characteristics; Spanish colonial heritage adds European variation',
    boldBrows: 'Bold, strong brows are a celebrated Latina beauty element; the "Latina brow" is often described as full, defined, arched; Frida Kahlo\'s iconic connected brows and their reclamation as a beauty statement have particular resonance in Mexican and Chicana communities',
    fridaKahlo: {
      significance: 'Frida Kahlo\'s unibrow is one of the most recognisable beauty statements in art history; Kahlo wore her natural brows and emphasised them as a defiant statement against European beauty standards; in Mexican-American and Chicana communities, Kahlo\'s brows are a symbol of cultural pride, body autonomy, and reclaiming indigenous Mexican identity',
      movement: 'The social media "Unibrow Challenge" and Latina beauty influencers celebrating full, even connected brows draw directly on the Kahlo aesthetic legacy'
    },
    threading: 'Threading salons in Latina communities; waxing is also very popular; brow shaping services are a significant part of the Latina beauty routine'
  },
  'east-asian': {
    naturalBrows: 'East Asian brows typically have a distinctive horizontal (less arched) natural growth pattern; the follicle angle in East Asian skin creates hairs that tend to grow more straight outward than angled upward; this creates a characteristically different natural brow shape from South Asian or Arab brows; the natural colour varies from medium brown to very dark',
    razorTechnique: 'Shaving the brow with precision razors and redrawing is particularly popular in East Asian beauty culture because the natural brow shape can be completely redesigned; this gives East Asian makeup artists and beauty enthusiasts extraordinary creative freedom over brow shape',
    koreaBrowTrends: {
      straightBrow: 'The straight "puppy brow" or "Korean straight brow" was a major Korean beauty trend that directly contradicted the arched Western brow ideal; a straight horizontal brow with minimal arch creates a more youthful, fresh appearance; this trend was widely adopted globally from Korean beauty',
      naturalFullBrow: 'More recent K-beauty brow trends favour natural, fluffy, brushed-up full brows with a straight-to-slight arch; the "soap brow" or "laminated" brushed-up look is popular',
      feathered: 'Feathered, natural brows with defined hairs rather than a solid filled-in look reflect the K-beauty emphasis on natural, skin-first aesthetics'
    },
    japanBrows: 'Japanese brow trends track closely with overall Japanese beauty trends: can range from very natural and undone in casual fashion to dramatic and precise in gyaru (Japanese glamour) and specific subcultures; Japanese brow product quality (particularly from brands like Eyebrow Styling Palette by Kanebo, excel, and UZU) is excellent',
    sparseness: 'East Asian brows may be naturally sparser in some individuals; filling with light strokes using fine-tipped pencils or powders to create the appearance of natural hair is a common technique in East Asian beauty routines'
  },
  'east-african': {
    naturalBrows: 'East African brow characteristics vary across the Horn of Africa\'s diverse ethnicities; Somali and Ethiopian brows are often dark, well-defined, with natural arch; the natural brow shape tends to be well-defined; brow care is part of overall face grooming traditions',
    popularStyles: ['Natural groomed brows cleaned up at the edges', 'Defined filled brows for occasion makeup', 'Threading for precise shape maintenance'],
    threading: 'Threading salons serve East African diaspora communities in Scandinavia, UK, and North America; many East African women maintain brows through threading',
    microblading: 'Growing interest in microblading and powder brows in East African communities; powder brow technique is recommended over traditional microblading for Fitzpatrick V-VI skin tones to reduce PIH risk'
  },
  'south-african': {
    naturalBrows: 'South African brow characteristics reflect the country\'s diverse population; Black South African brows are often dark, coarser-textured, and vary in natural density; Indian South African brows reflect South Asian heritage; Cape Coloured community brows reflect mixed heritage; Afrikaans European-heritage brows reflect Dutch and German settler ancestry',
    popularStyles: ['Well-maintained natural brows for everyday wear', 'Bold, defined brows for special occasions and fashion', 'Growing interest in brow lamination and microblading services in major cities (Cape Town, Johannesburg, Durban) where these services are increasingly available'],
    threading: 'Threading is available in South African cities particularly in areas with South Asian and Middle Eastern communities; waxing more widely available'
  },
  'black-american': {
    naturalBrows: 'Black American brow characteristics typically include dark, coarser hair with a range of natural shapes; natural brow density and arch vary widely; many Black American women have naturally striking brow shapes that are enhanced rather than dramatically reshaped',
    popularStyles: ['Full, defined brows — bold arched shapes have been popular in Black American beauty for decades', 'Perfectly groomed and filled, high-arched statement brows for glam looks', 'More recently: natural, fluffy, brushed-up brows reflecting the global trend toward natural beauty', '90s thin pencil brow revival in some contemporary styling (a direct reference to 90s Black and Latina beauty)'],
    products: 'The beauty industry\'s historical failure to produce brow products in deep shades led to Black-owned brands filling the gap; products for brow hair that ranges from very dark brown to black (most standard brow pencils were made for lighter brow hair); ABH (Anastasia Beverly Hills), founded by Anastasia Soare (a Romanian immigrant), built her brand on brow expertise and has long produced excellent deep shade ranges',
    microblading: 'Microblading is popular in Black American beauty communities but PIH risk is significant for Fitzpatrick V-VI skin; finding a technician experienced with dark skin is critical; powder brow technique reduces PIH risk; proper consultation before any semi-permanent brow treatment is essential'
  }
};

export function getEyebrowAnatomy(section) {
  const map = {
    structure: EYEBROW_ANATOMY.structure,
    mapping: EYEBROW_ANATOMY.mapping
  };
  return map[section] || EYEBROW_ANATOMY;
}

export function getShapingTechnique(technique) {
  const map = {
    threading: SHAPING_TECHNIQUES.threading,
    waxing: SHAPING_TECHNIQUES.waxing,
    tweezing: SHAPING_TECHNIQUES.tweezing,
    razor: SHAPING_TECHNIQUES.razorShaving,
    laser: SHAPING_TECHNIQUES.laserPermanent,
    microblading: SHAPING_TECHNIQUES.microblading
  };
  return map[technique] || SHAPING_TECHNIQUES;
}

export function getBrowFillingProducts(type) {
  const map = {
    pencils: BROW_FILLING_PRODUCTS.pencils,
    powders: BROW_FILLING_PRODUCTS.powders,
    pomade: BROW_FILLING_PRODUCTS.pomade,
    gels: BROW_FILLING_PRODUCTS.gels,
    colour: BROW_FILLING_PRODUCTS.colourMatching
  };
  return map[type] || BROW_FILLING_PRODUCTS;
}

export function getEthnicEyebrowGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_EYEBROW_GUIDES['west-african'],
    'south-asian': ETHNIC_EYEBROW_GUIDES['south-asian'],
    caribbean: ETHNIC_EYEBROW_GUIDES.caribbean,
    arab: ETHNIC_EYEBROW_GUIDES.arab,
    latina: ETHNIC_EYEBROW_GUIDES.latina,
    'east-asian': ETHNIC_EYEBROW_GUIDES['east-asian'],
    'east-african': ETHNIC_EYEBROW_GUIDES['east-african'],
    'south-african': ETHNIC_EYEBROW_GUIDES['south-african'],
    'black-american': ETHNIC_EYEBROW_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

