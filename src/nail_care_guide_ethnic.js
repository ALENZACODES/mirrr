/**
 * MIRRR — Nail Care Guide (Ethnic Perspectives)
 * Complete nail anatomy, health, care techniques, nail art traditions,
 * and ethnic nail care specifics across all 9 communities.
 */

export const NAIL_ANATOMY = {
  title: 'Nail Anatomy and Biology',
  structure: {
    nailPlate: 'The visible hard part of the nail; composed of layers of a protein called keratin (the same protein as hair); the nail plate is translucent — the pink colour comes from the nail bed visible through it; contains no living cells',
    nailBed: 'The skin beneath the nail plate; richly supplied with blood vessels (providing the pink colour) and nerve endings; the nail plate adheres to the nail bed as it grows',
    matrix: 'The root of the nail; located beneath the skin at the base of the nail; contains the only living nail cells; produces the cells that become the nail plate; the whitish crescent visible at the base of many nails (the lunula) is the visible portion of the matrix',
    lunula: 'The white crescent visible at the base of the nail (most visible on thumbs); part of the nail matrix showing through the nail plate; appears white because the matrix cells here have not yet completed keratinisation',
    cuticle: 'A thin layer of dead skin cells that seals the gap between the nail plate and the skin; critically important as a bacterial and fungal barrier — pushing cuticles back or cutting them aggressively breaks this seal and significantly increases infection risk',
    nailtissue: 'Skin that grows up from the sides of the nail; distinct from the cuticle; can be trimmed when it creates hangnails',
    hyponychium: 'The sealed junction between the free edge of the nail and the fingertip skin; seals out bacteria and fungi; should not be disturbed with cleaning implements',
    freeedge: 'The portion of the nail plate that extends beyond the fingertip; what is cut when trimming nails'
  },
  growth: {
    rate: 'Fingernails grow approximately 3-4mm per month; toenails grow approximately 1.5mm per month — roughly half the speed of fingernails; complete nail replacement takes approximately 6 months for fingernails and 12-18 months for toenails',
    factors: 'Nail growth is affected by: age (growth slows with age), season (faster in summer due to increased circulation), dominant hand (nails grow slightly faster on the dominant hand), health conditions, and nutrition',
    nutrition: {
      biotin: 'Biotin (Vitamin B7) is often marketed for nail strength; evidence is limited to people with a biotin deficiency (rare in people with adequate diet); biotin 2.5mg/day is the standard supplementation dose; results take 3-6 months minimum as the nail must grow out',
      protein: 'Nails are protein; adequate dietary protein is necessary for healthy nail growth; deficiency causes soft, thin nails',
      iron: 'Iron deficiency (anaemia) causes nails to become concave (koilonychia) or spoon-shaped; a classic clinical sign of iron deficiency',
      zinc: 'Zinc deficiency can cause white spots (leukonychia) and slow nail growth'
    }
  },
  commonConcerns: {
    ridges: {
      vertical: 'Vertical ridges (running from cuticle to tip) are extremely common and generally harmless; they increase with age as the nail matrix\'s cell reproduction becomes less uniform; often mistaken for dehydration but primarily structural',
      horizontal: 'Horizontal ridges (Beau\'s lines) are more significant clinically; a single horizontal groove across the nail indicates a period of stress, illness, or trauma that disrupted nail matrix function; multiple parallel ridges in all nails simultaneously can indicate systemic illness'
    },
    whiteSpots: 'White spots (leukonychia punctata) are caused by minor trauma to the nail matrix during formation; not a sign of calcium or zinc deficiency as commonly believed; the spots grow out over several months',
    yellowNails: 'Yellow nails are most commonly caused by: nail polish staining (very common), fungal nail infection (onychomycosis), heavy smoking, or in rare cases systemic conditions; a base coat significantly reduces polish staining',
    spoonNails: 'Concave (spoon-shaped) nails called koilonychia; iron deficiency anaemia is the most common cause; seen more often in communities with higher rates of iron deficiency',
    brittleNails: 'Brittle nails that split or peel easily are extremely common and usually caused by: repeated wetting and drying cycles (most common cause — hands in water for housework, washing up, hair washing), acetone-based nail polish remover overuse, or nutritional factors'
  }
};

export const NAIL_CARE_BASICS = {
  title: 'Nail Care Fundamentals',
  manicureBasics: {
    frequency: 'A basic manicure (file, push cuticles, apply nail care product or colour) every 2-3 weeks is sufficient for most people; toenails every 4-6 weeks',
    tools: {
      files: {
        glass: 'Glass (crystal) nail files are the gold standard; they file in both directions without traumatising the nail edge; easy to sanitise (soak in isopropyl alcohol); last indefinitely if not dropped; highly recommended for all nail types especially brittle nails',
        emery: 'Emery boards (paper files) are inexpensive but traumatise the nail edge if used in a sawing back-and-forth motion; always file in one direction only; replace frequently as they wear down',
        grit: 'Lower grit number = more abrasive; 80-100 grit for thick nails/acrylics; 180-240 grit for natural nail shaping; 400+ grit for buffing'
      },
      buffers: 'Nail buffers have multiple sides of progressively finer grit; used to smooth nail ridges and create shine; buffing too aggressively thins the nail plate over time; a light buff once a month maximum',
      cuticlePusher: 'Used to gently push back the cuticle after softening; rubber-tipped (orange wood sticks) are gentler than metal; should never be used with force as it can damage the matrix',
      nippers: 'Cuticle nippers should only be used for hangnails (torn nail tissue) not for cutting cuticles themselves; biting hangnails always makes them worse by creating a ragged wound'
    },
    filingTechnique: 'File from the outer corner toward the centre, then from the other outer corner toward the centre; never use a saw-back-and-forth motion as this frays and weakens the nail edge; file the nail shape in the preferred shape (square, round, oval, squoval, almond, stiletto) before any other nail care step',
    cuticleCare: 'Soak fingers in warm (not hot) water for 5 minutes to soften the cuticle; apply a cuticle remover product (contains potassium hydroxide which dissolves dead skin) for 30-60 seconds; gently push back with a rubber-tipped tool; rinse thoroughly; cuticle cutting is not recommended as it damages the protective seal and increases infection risk',
    oilApplication: 'Cuticle oil (jojoba, sweet almond, vitamin E, or argan oil are most effective) applied daily to the cuticle and nail plate improves nail flexibility and reduces breakage; the cuticle folds absorb oil and transfer it to the nail matrix where it nourishes forming cells; the nail plate itself cannot absorb oil molecules but the surrounding tissue benefits significantly'
  },
  nailStrengthening: {
    proteinTreatments: 'Nail hardeners and protein treatments deposit a layer of strengthening protein (typically keratin) on the nail plate surface; Nailtiques Formula 2 and OPI Nail Envy are highly regarded; apply once or twice weekly on bare nails',
    baseCoats: 'A good base coat is the most important step for nail colour longevity; it provides adhesion, prevents staining (especially important with red and dark polishes), and can provide strengthening benefits; ridge-filling base coats smooth the nail surface before colour',
    hydration: 'Nail hydration — specifically, keeping the cuticle and surrounding skin moisturised — is the single most impactful thing for nail health; repeated exposure to water and detergents dehydrates nails; wearing gloves for household cleaning and washing up is highly recommended for anyone with brittle nails'
  },
  commonProducts: {
    strengtheners: ['OPI Nail Envy: the gold standard strengthening base coat; original formula good for most nails; sensitive and peeling formula for severely damaged nails', 'Nailtiques Formula 2: protein nail formula for soft, damaged nails', 'duri Rejuvacote: popular strengthening base coat with strong following'],
    cuticleOils: ['CND SolarOil: jojoba and vitamin E in a penetrating base; industry favourite', 'Essie Apricot Cuticle Oil: light oil suitable for frequent use', 'pure jojoba oil: an excellent affordable alternative as jojoba closely mimics human skin sebum'],
    baseCoats: ['Orly Bonder: excellent adhesion, extends colour wear', 'Essie Here to Stay: good for gel-effect topcoats', 'OPI Natural Nail Base Coat: classic professional choice']
  }
};

export const GEL_AND_ACRYLIC = {
  title: 'Gel Nails, Acrylic, and Nail Enhancement',
  gelNails: {
    what: 'Gel nail polish is a type of nail coating that requires UV or LED light to cure (harden); unlike regular polish which air-dries, gel polish cures to a hard, glossy, chip-resistant finish; gel manicures typically last 2-4 weeks without chipping',
    types: {
      softGel: 'Regular gel polish (shellac, gel polish): applied in thin coats like regular polish over the natural nail; cures under UV/LED; requires professional acetone removal or soak-off at home; adds no significant length',
      hardGel: 'Hard gel (builder gel): thicker formulation used to extend nail length or reinforce the nail structure; cannot be removed with acetone alone; must be filed off; stronger than soft gel',
      gelX: 'Gel X (Apres, Kiara Sky, etc.): pre-formed soft gel nail tips bonded to the natural nail with gel adhesive; offers length without acrylic monomer odour; growing in popularity',
      BIAB: 'Builder In A Bottle (BIAB): a thicker gel formula applied in one step to reinforce the natural nail and provide colour; popular in UK especially'
    },
    UVExposure: {
      concern: 'UV nail curing lamps (both UVA-emitting UV lamps and LED lamps that emit a narrowband UV) do emit UV radiation that can damage skin; a 2023 study in Nature Communications found that repeated gel manicures under UV lamps caused DNA damage and cell death in cultured human cells',
      mitigation: 'Applying SPF 30+ broad-spectrum sunscreen to the hands and fingers before curing reduces UV exposure to the skin surrounding the nails; UV-protective gloves with open fingertip design are commercially available specifically for gel manicures',
      perspective: 'The absolute UV dose from gel curing is low compared to sun exposure; a few sessions a year is a much lower risk than regular hand UV damage; for people who get gel manicures frequently (weekly or bi-weekly), UV protection during curing is advisable'
    },
    removal: {
      method: 'Proper gel removal: buff the topcoat gently; soak cotton pads in 100% acetone; place a pad on each nail; wrap each finger in aluminium foil; wait 10-15 minutes; the softened gel should slide off gently; never force or scrape gel from the nail as this removes nail plate layers with it',
      damage: 'The most common cause of gel-related nail damage is improper removal (picking, peeling, or aggressive scraping); correct removal technique is essential; temporary nail thinning immediately after gel removal is normal as the cells that were covered are dehydrated'
    },
    darkSkinConsiderations: 'Gel and dark nail polish colours show differently on darker skin tones; rich jewel tones (emerald, sapphire, burgundy), deep berries, bright corals, and vibrant reds often look more striking on deeper skin tones than pale pastels; nudes and neutrals require careful matching — a nude for Fitzpatrick I-II skin looks grey or ashy on Fitzpatrick V-VI skin'
  },
  acrylic: {
    what: 'Acrylic nails are created by combining a liquid monomer (methyl methacrylate or safer ethyl methacrylate) with a powder polymer; the mixture is applied to the nail with a brush and hardens through a chemical polymerisation reaction in air (no lamp needed); can be used to extend length significantly or to strengthen the natural nail',
    removal: 'Acrylic must be soaked in 100% acetone (usually 30-45 minutes) or filed down; professional removal is recommended as improper DIY removal causes significant nail damage',
    mmaWarning: 'Methyl methacrylate (MMA) acrylic is cheaper than EMA (ethyl methacrylate) but is harder, less flexible, bonds more aggressively to the nail, releases formaldehyde fumes, and can cause severe nail damage on removal; MMA was banned for nail use in the US and many other countries but is still used in some discount salons; if an acrylic nail will not come off with acetone, it may be MMA'
  },
  pressOnNails: {
    what: 'Pre-shaped nail tips applied with nail glue or adhesive tabs; enormous quality improvement in the 2010s-2020s; modern press-on nails can look identical to salon sets; short-term wear (a few days) with tabs; longer wear (1-2 weeks) with nail glue',
    benefits: 'No UV exposure; no monomer fumes; no professional appointment needed; no damage if properly removed (soak in warm soapy water or pure acetone for tab-applied; acetone soak for glue-applied); much more affordable than salon gel or acrylic; available in every shape, length, and design',
    popularity: 'Press-on nails have experienced a major cultural rehabilitation from "cheap" to accessible luxury; significant adoption in Black American beauty culture particularly; press-on nail small businesses (custom hand-painted sets) are a significant niche in Black entrepreneurship on platforms like Etsy and Instagram'
  }
};

export const NAIL_ART_TRADITIONS = {
  title: 'Nail Art Traditions and Cultural History',
  history: {
    ancient: 'Nail decoration is ancient; ancient Egyptians used henna to tint nails and fingertips; the colour of one\'s nails signified social status in ancient China (Ming dynasty records describe gold and silver nail coatings for royalty; dark red and black for upper classes); ancient Babylonians used kohl to colour nails before battle',
    modernHistory: {
      firstPolish: 'Modern nail polish was developed in the 1920s, inspired by automobile paint; the Revlon brand was founded in 1932 specifically on a new range of nail polish colours; the first major nail polish colour was red',
      fragileFashion: 'For much of the 20th century, nail polish was associated with feminine grooming norms; the nail extension industry grew significantly in the US from the 1970s; Vietnamese-American nail salon culture began in the 1970s when actress Tippi Hedren helped Vietnamese refugees enter the nail industry',
      vietnameseAmerican: 'Vietnamese-American nail technicians now own approximately 51% of nail salons in the US and up to 80% in California; a remarkable entrepreneurial and cultural story; the nail technician industry became an economic pathway for Vietnamese refugees and immigrants'
    }
  },
  hennaOnNails: {
    what: 'Applying henna paste to nails creates a rich orange-brown stain; used in South Asian and Middle Eastern/Arab cultures; the nail absorbs the lawsone dye from the henna plant (Lawsonia inermis); the result is a natural, non-toxic nail stain that lasts 2-4 weeks as the nail grows out',
    technique: 'Henna paste is applied to clean, oil-free nails; left for 1-6 hours (longer = deeper colour); removed dry; the stain intensifies over the first 24-48 hours; no topcoat needed; stains the nail in a natural gradient from the base outward as it grows',
    southAsian: 'In South Asian tradition, mehndi (henna) for weddings extends to the nails; the colour of the bride\'s henna and the nail staining is associated with the strength of the husband\'s love in folk tradition',
    arab: 'Arab henna tradition similarly encompasses nail staining as part of the pre-wedding and Eid beauty preparations; Yemeni and Moroccan henna traditions have particularly elaborate nail and fingertip patterns'
  },
  blackAmericanNailCulture: {
    history: 'Black American nail culture has its own distinct aesthetic history: long nails (seen as a luxury and a statement that one does not do manual labour) have cultural significance; elaborate nail art (painted scenes, 3D embellishments, rhinestones, foils) were popular in Black American culture decades before mainstream adoption; the "nail tech" as a respected skilled professional has deep roots in Black American beauty communities',
    airbrush: 'Airbrush nail art was a major trend in 1990s-2000s Black American beauty culture; detailed painted nail art scenes using airbrush guns; a highly specialised skill',
    longNails: 'Very long acrylic or gel nails (stiletto, coffin/ballerina shapes) have deep roots in Black American beauty; stiletto nails were popularised in Black and Latina beauty culture before becoming a mainstream trend; the skill of typing, texting, and performing daily tasks with long nails is a learned dexterity many Black and Latina women develop from teenage years'
  }
};

export const NAIL_COLOUR_BY_SKIN_TONE = {
  title: 'Nail Colour for Every Skin Tone',
  philosophy: 'Nail colour is entirely personal — there are no rules that must be followed; however, understanding how colours interact with different skin undertones helps make informed choices; nail colour that "disappears" into the skin tone (too similar) or creates jarring contrast can be deliberate aesthetic choices or something to consider when making selections',
  byTone: {
    deepDark: {
      skinTones: 'Fitzpatrick V-VI (dark brown to deep blue-black skin)',
      excellent: ['Rich jewel tones: emerald green, sapphire, amethyst, ruby — create stunning contrast', 'Deep berries: plum, blackberry, deep burgundy', 'Vibrant brights: neon orange, electric blue, hot fuchsia — pop dramatically', 'Pure white: creates a striking graphic contrast', 'Black: classic and elegant', 'Warm metallics: gold, copper, bronze — complement warm deep undertones', 'Coral and terracotta: warm tones that harmonise'],
      nudeConsiderations: 'True "nude" for Fitzpatrick V-VI is a deep caramel, warm brown, or deep terracotta — not the pale pink nude developed for fair skin; many mainstream "nude" polishes look ashy or grey on dark skin; look for warm brown-based nudes',
      avoid: 'Pale lilac, pale pink, and very light pastel colours tend to look ashy or stark on very deep skin tones unless deliberately chosen for graphic contrast'
    },
    medium: {
      skinTones: 'Fitzpatrick III-IV (medium beige to olive to warm brown)',
      excellent: ['Warm terracotta and burnt orange', 'Rich reds and wine tones', 'Olive and khaki greens', 'Warm nudes in peach-beige range', 'Bright cobalt blue', 'Deep forest green', 'Mauve and dusty rose'],
      nudeConsiderations: 'Nudes in the peach-beige, warm sand range work beautifully on medium skin tones'
    },
    fair: {
      skinTones: 'Fitzpatrick I-II (very fair to light skin)',
      excellent: ['Pastel shades: baby pink, lavender, mint — soft and delicate on lighter skin', 'Classic reds: look very traditional and beautiful on lighter skin', 'Navy and dark colours: strong contrast', 'Pale nude: nearly-there nails look chic on fair skin'],
      nudeConsiderations: 'True pale nude "my nails but better" looks most natural on fair skin tones'
    }
  },
  undertone: {
    warm: 'Golden, yellow, peachy undertones; warm gold metallics, terracotta, coral, peach, warm reds, warm nudes look harmonious',
    cool: 'Pink, rosy, blue undertones; silver metallics, berry, plum, cool reds, pink-based nudes look harmonious',
    neutral: 'Balance of warm and cool; can wear both warm and cool nail colours equally well'
  }
};

export const ETHNIC_NAIL_GUIDES = {
  'west-african': {
    culturalContext: 'West African nail aesthetics favour bold, statement-making nails as an extension of the vibrant colour and pattern sensibility of West African fashion (Ankara fabric, kente cloth colours); nail art that incorporates West African geometric patterns, kente-inspired designs, and bold colour combinations is part of contemporary West African fashion identity; long nails with elaborate designs are a beauty statement across many West African cultures',
    popularStyles: ['Elaborate French tip variations with coloured tips in Ankara-inspired colour combinations', 'Detailed nail art incorporating West African geometric motifs', 'Long coffin or stiletto shapes', 'Coloured stone and rhinestone embellishments', 'Chrome and metallic finishes in gold tones'],
    healthConsiderations: 'West African skin tones (predominantly Fitzpatrick V-VI) mean that nail care products and base coats should be assessed for their impact on the surrounding skin; some nail hardeners contain formaldehyde which can irritate and darken the cuticle area; formaldehyde-free strengtheners are recommended; the cuticle area on deeper skin tones is susceptible to hyperpigmentation from trauma, so gentle cuticle care is especially important'
  },
  'south-asian': {
    culturalContext: 'South Asian nail traditions have ancient roots in henna staining of the nails and fingertips; modern South Asian nail culture encompasses both traditional mehndi on nails for weddings and celebrations, and contemporary gel/acrylic nail art; bridal nail art for South Asian weddings is an elaborate art form',
    bridalNails: {
      what: 'Bridal nail preparation for South Asian weddings typically involves gel or acrylic nails in a shape suitable for wearing glass bangle (choorhaan) and applying mehndi; very long nails can be impractical for bangle-wearing; medium length oval or almond shapes are common',
      henna: 'Traditional mehndi extends to the nails as part of the bridal ritual; the stain covers the nails in a rich orange-brown; some brides choose to have gel colour applied after the mehndi event',
      design: 'South Asian bridal nail designs draw on traditional motifs: paisley, lotus, peacock, floral patterns that complement the bridal mehndi design'
    },
    popularColours: 'Rich reds and deep berries are culturally significant in South Asian bridal traditions (red is the colour of bridal wear); gold accents; jewel tones that complement sari and lehenga colours'
  },
  caribbean: {
    culturalContext: 'Caribbean nail culture reflects the vibrancy and colour of Caribbean fashion and culture; bright, happy, tropical colour combinations are characteristic; Caribbean carnival culture has developed spectacular nail art traditions that extend the body art of carnival costumes to the fingertips; nail designs inspired by tropical flowers, fruits, and the ocean are common',
    popularStyles: ['Bright tropical colour combinations: coral + turquoise, mango + lime', 'Tropical flower nail art (hibiscus, plumeria)', 'Ombre/gradient in sunset colour combinations', 'Ocean blue and sea glass tones', 'Carnival-inspired metallic and glitter designs'],
    bayRumConnection: 'Bay rum (the traditional Caribbean aromatic) contains antiseptic properties and was historically used as a cuticle and nail treatment alongside its use as aftershave and hair tonic'
  },
  arab: {
    culturalContext: 'Arab nail culture is sophisticated and beauty-positive; elaborate nail care and nail art are significant in Arab beauty culture particularly in the Gulf; gold nail art, intricate Arabic geometric patterns, and arabesque designs in nail art are common; traditional henna staining of nails and fingertips is practised particularly for Eid celebrations, weddings, and other significant occasions',
    halal: {
      concern: 'An important cultural and religious consideration in nail care for Muslim women is the permissibility of nail polish during prayer (salah); in Islamic practice, wudu (ritual washing before prayer) must allow water to reach all parts of the skin; conventional nail polish creates a waterproof barrier, which many Muslim scholars consider to invalidate wudu',
      breathablePolish: 'Several brands produce "breathable" or "water-permeable" nail polishes marketed as halal, including Inglot O2M, ORLY Breathable, and various smaller brands; the water permeability of these products is debated among Islamic scholars',
      alternatives: 'Many Muslim women choose to go without nail colour during prayer times, apply and remove polish between prayers, or use nail colour only on gel-free non-prayer periods (menstruation is a time when prayer is not performed)'
    },
    patterns: 'Arabesque and geometric Islamic art patterns (drawn from the tradition that iconic figures in Islamic art led to an extraordinary development of geometric and arabesque decoration) translated into nail art: intricate gold line work on dark backgrounds; symmetrical patterns'
  },
  latina: {
    culturalContext: 'Latina nail culture celebrates bold colour, vibrant expression, and elaborate nail art; the nail salon is a significant social space in many Latina communities; long nails are embraced as a beauty statement; elaborate gel and acrylic nail art with rhinestones, 3D elements, and detailed painting has deep roots in Latina beauty aesthetics; Chicana and Mexican-American nail culture has distinctive artistic traditions',
    popularStyles: ['Coffin nails (also called "Latinx nails" as the shape was popularised in Latina communities)', 'Elaborate mixed-media nail art: rhinestones, metallic foil, painted designs', 'Bright colour combinations inspired by Mexican folk art: cobalt + coral, pink + lime', 'Mexican talavera tile-inspired geometric nail art', 'Guadalupe and religious iconography nail art in Mexican-American traditions'],
    chileanNails: 'Coffin-shaped nails are also called "ballerina nails" in some Latin American countries; the shape (tapered sides with a flat, squared-off tip) became strongly associated with Latina beauty aesthetics before mainstream adoption'
  },
  'east-asian': {
    culturalContext: 'East Asian nail culture is extraordinarily sophisticated and artistically advanced; Japanese nail art (ジェルネイル / gel nail) is among the most technically advanced in the world; Korean nail art (네일아트) is globally influential; Chinese nail design traditions are rich; East Asian nail technicians are among the most skilled and technically innovative nail artists globally',
    japanese: {
      culture: 'Japanese nail art is an elaborate art form; Japanese nail magazines, nail art salons, and nail competition culture have driven extraordinary technical innovation; complex 3D nail art using hard gel sculpting, miniature objects, dried flowers, and intricate hand-painting are Japanese nail art specialties; nail art length and elaborateness tends to peak for celebrations and performances, with more practical everyday designs'
    },
    korean: {
      culture: 'Korean nail art (K-nails as part of broader K-beauty) emphasises clean, elegant aesthetics often with subtle detail; a significant K-nail trend is minimalist negative space designs, geometric accents, and nail art inspired by everyday objects; Korean nail art has been enormously influential globally; ASMR nail content is a Korean YouTube speciality'
    },
    popularStyles: ['Japanese: highly elaborate 3D gel sculptural art; tiny sculptured flowers, fruits, animals', 'Korean: minimalist negative space designs; delicate line work; "glass nails" gel technique', 'Chinese: traditional Chinese patterns; ink wash painting aesthetic translated to nails', 'Gradient/ombre nails originated in East Asian nail art before global mainstream adoption']
  },
  'east-african': {
    culturalContext: 'East African nail aesthetics vary significantly across the region\'s diverse cultures; Somali, Ethiopian, Eritrean, Kenyan, and Tanzanian nail traditions each have distinct characteristics; henna staining of the nails and fingertips is particularly common among Muslim East African women; Swahili coast fashion and Somali beauty traditions include elaborate henna hand and nail art for celebrations',
    henna: 'Henna on the nails is a significant tradition across East Africa\'s Muslim communities; Somali bridal henna (often applied by a specialist called a "henna lady") includes detailed fingernail staining; the designs are often floral and arabesque, influenced by Arab and South Asian henna traditions through trade route cultural exchange',
    popularStyles: ['Bold bright colours on Fitzpatrick V-VI skin: jewel tones, vibrant brights', 'Gold and metallic designs with cultural pattern inspiration', 'Natural henna staining for traditional occasions', 'Long nails with embellishments in diaspora communities (UK, US, Scandinavia)']
  },
  'south-african': {
    culturalContext: 'South African nail culture reflects the country\'s extraordinary cultural diversity; Zulu, Xhosa, Sotho, Cape Malay, and Afrikaans nail traditions exist alongside globally influenced contemporary nail culture; South Africa has a significant nail salon industry; the bold colours of traditional African beadwork and textiles inspire nail art designs',
    zulu: 'Zulu beadwork (with its intricate colour-coded geometric patterns) is a rich source of nail art inspiration; geometric patterns in the traditional Zulu colour system (black, white, red, yellow, green, blue) translated into nail art',
    capeMalay: 'Cape Malay tradition (Muslim South Africans) incorporates henna use for Eid and wedding celebrations; nail staining with henna is part of Cape Malay bridal and festive beauty tradition',
    popularStyles: ['Bold geometric patterns inspired by African beadwork', 'Earthy warm tones that complement warm brown skin tones', 'Gold and bronze metallics', 'Vibrant colour combinations from traditional textile patterns']
  },
  'black-american': {
    culturalContext: 'Black American nail culture is one of the most dynamic, creative, and trend-setting nail cultures globally; Black American nail aesthetics pioneered styles (long nails, elaborate art, coffin/stiletto shapes) that mainstream beauty eventually adopted; the nail salon is a significant social space in many Black American communities; Black-owned nail businesses are a significant niche in Black entrepreneurship',
    history: 'Long decorative nails have been part of Black American beauty culture since at least the 1980s; airbrush nail art scenes were created in Black and Latina urban salons in the 1990s before becoming mainstream; Black American nail culture on Instagram and TikTok has been the primary driver of nail trends for the past decade',
    popularStyles: ['Long coffin, stiletto, and square shapes', 'Elaborate rhinestone and gem embellishments', '3D nail art', 'Press-on nail art as an accessible and creative business model', 'French tips in dark or coloured variations', 'Almond nails with detailed painted designs'],
    nudeShades: 'The mainstream nail industry\'s historical failure to produce true nude shades for dark skin tones drove Black-owned brands and beauty entrepreneurs to fill the gap; OPI\'s Tickle My France-y and similar "nudes" read pink on dark skin; true nudes for dark skin tones are warm caramel, deep mocha, or rich terracotta; brands like Mented Cosmetics and Beauty Bakerie have addressed this gap'
  }
};

export function getNailAnatomy(section) {
  const map = {
    structure: NAIL_ANATOMY.structure,
    growth: NAIL_ANATOMY.growth,
    concerns: NAIL_ANATOMY.commonConcerns
  };
  return map[section] || NAIL_ANATOMY;
}

export function getNailCareBasiscs(section) {
  const map = {
    manicure: NAIL_CARE_BASICS.manicureBasics,
    strengthening: NAIL_CARE_BASICS.nailStrengthening,
    products: NAIL_CARE_BASICS.commonProducts
  };
  return map[section] || NAIL_CARE_BASICS;
}

export function getGelAndAcrylic(type) {
  const map = {
    gel: GEL_AND_ACRYLIC.gelNails,
    acrylic: GEL_AND_ACRYLIC.acrylic,
    pressOn: GEL_AND_ACRYLIC.pressOnNails
  };
  return map[type] || GEL_AND_ACRYLIC;
}

export function getNailColourBySkinTone(tone) {
  const map = {
    deep: NAIL_COLOUR_BY_SKIN_TONE.byTone.deepDark,
    medium: NAIL_COLOUR_BY_SKIN_TONE.byTone.medium,
    fair: NAIL_COLOUR_BY_SKIN_TONE.byTone.fair
  };
  return map[tone] || NAIL_COLOUR_BY_SKIN_TONE;
}

export function getEthnicNailGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_NAIL_GUIDES['west-african'],
    'south-asian': ETHNIC_NAIL_GUIDES['south-asian'],
    caribbean: ETHNIC_NAIL_GUIDES.caribbean,
    arab: ETHNIC_NAIL_GUIDES.arab,
    latina: ETHNIC_NAIL_GUIDES.latina,
    'east-asian': ETHNIC_NAIL_GUIDES['east-asian'],
    'east-african': ETHNIC_NAIL_GUIDES['east-african'],
    'south-african': ETHNIC_NAIL_GUIDES['south-african'],
    'black-american': ETHNIC_NAIL_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const NAIL_CARE_STATS = {
  moduleId: 'nail_care_guide_ethnic',
  version: '1.0.0',
  topics: ['nail anatomy matrix lunula', 'gel nails UV exposure', 'acrylic MMA warning', 'press-on nails', 'cuticle care infection risk', 'nail colour by skin tone', 'henna nail staining', 'halal nail polish breathable', 'Vietnamese-American nail salon industry', 'Black American nail culture history', 'Japanese 3D nail art', 'Korean K-nail minimalist', 'South Asian bridal nails', 'West African nail aesthetics', 'coffin stiletto nail shapes', 'nude nails deep skin tones', 'nail brittleness hydration', 'biotin nail growth myth'],
  communitiesSupported: 9,
  keyFacts: [
    'Vietnamese-American nail technicians own approximately 51% of nail salons in the United States and up to 80% in California — a remarkable economic community story that began in 1975 when actress Tippi Hedren helped Vietnamese refugees enter the nail industry at a Sacramento salon',
    'Cutting cuticles is not recommended by professional dermatologists: the cuticle is a waterproof seal that protects the gap between the nail plate and the skin from bacterial and fungal infection; cutting it breaks this seal and significantly increases the risk of nail infection (paronychia)',
    'Conventional nail polish creates a waterproof barrier that many Islamic scholars consider to invalidate wudu (ritual washing before prayer); breathable/water-permeable nail polishes (Inglot O2M, ORLY Breathable) are marketed as halal alternatives, though their actual water permeability is debated among scholars',
    'Long decorative nails, elaborate nail art, coffin and stiletto shapes, and rhinestone embellishments have deep roots in Black American and Latina beauty cultures and were adopted by mainstream beauty years or decades after their creation in these communities',
    'Most white spots (leukonychia punctata) on nails are caused by minor trauma to the nail matrix during nail formation — not by calcium or zinc deficiency as is commonly believed; a single white spot represents a specific moment of minor trauma that will grow out over several months'
  ]
};
