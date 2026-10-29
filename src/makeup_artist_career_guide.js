/**
 * MIRRR — Makeup Artist Career Guide
 * From building a kit to building a brand: the complete guide to makeup artistry
 * as a profession, with a focus on ethnic beauty expertise as a specialisation.
 */

export const MUA_CAREER_OVERVIEW = {
  title: 'Makeup Artist Career Overview',
  summary: 'Makeup artistry is a skilled trade with multiple specialisations, from bridal to editorial to film and TV; it combines technical skill with interpersonal skill, business acumen, and increasingly, digital content expertise. The makeup artist profession is one of the few beauty careers where deep knowledge of ethnic skin tones and diverse hair textures represents a genuine and significant market differentiator.',
  specialisations: {
    bridal: {
      description: 'Wedding makeup for brides, wedding parties, and related events; the largest and most stable segment of the freelance makeup market; high ticket value per client; requires consultation skills and the ability to create lasting, photograph-well makeup',
      ethnicSpecialisation: 'South Asian bridal makeup is its own extensive specialisation (mehendi, sangeet, nikah, reception — multiple events with different looks); West African, Nigerian-American, and Ghanaian-American wedding makeup is a growing specialisation with specific traditional aesthetics; Caribbean wedding makeup; Black American bridal makeup with expertise in Fitzpatrick V-VI skin'
    },
    editorial: {
      description: 'Magazine, advertising, and commercial photography makeup; collaborative work with photographers, creative directors, and stylists; requires ability to execute a brief rather than personal preference; fast-paced and team-based',
      ethnicSpecialisation: 'The persistent underrepresentation of dark-skinned models and models of colour in editorial work has meant that relatively few editorial artists have developed deep expertise in Fitzpatrick V-VI skin; this gap means artists with genuine expertise in darker skin tones have significant editorial market value'
    },
    filmTV: {
      description: 'Film, television, and streaming content makeup; often unionised (IATSE Local 706 in the US, BECTU in the UK); requires knowledge of on-camera makeup behaviour (what shows and doesn\'t in HD, under film lighting), continuity skills, and the ability to replicate a look identically across shooting days',
      ethnicSpecialisation: 'As streaming platforms expand globally and diverse representation in film increases, expertise in makeup for diverse skin tones is increasingly valued; the natural light and continuity requirements of television differ from bridal and editorial'
    },
    theatrical: {
      description: 'Stage, theater, and performing arts makeup; needs to "read" from a distance (much heavier than other makeup); character and prosthetics work; often involves stage makeup application training (Greasepaint, cream foundation techniques)',
      ethnicSpecialisation: 'Theatrical makeup for diverse skin tones requires understanding how theatrical products interact differently with melanin-rich skin; the stage makeup industry historically had very limited dark shade ranges — a major gap partially addressed by brands like Kryolan and Ben Nye expanding their ranges'
    },
    contentCreator: {
      description: 'Social media content creation, YouTube tutorials, brand partnerships, online courses; increasingly intertwined with traditional MUA work; requires camera-ready skills AND content production skills (filming, editing, presenting)',
      ethnicSpecialisation: 'Some of the most successful makeup artist content creators built their audiences specifically by serving communities underserved by mainstream beauty content — natural hair and dark skin makeup tutorials for Black American women, South Asian bridal techniques, West African beauty content; ethnic specialisation has built large and loyal audiences in this space'
    },
    specialEffects: {
      description: 'Prosthetics, injury simulation, aging, creature effects; specialised training required (prosthetics making, silicone application, dental acrylic); film and television focused',
      note: 'SFX makeup for diverse skin tones requires specific knowledge of how prosthetic blending works differently on darker skin'
    }
  }
};

export const KIT_BUILDING = {
  title: 'Building a Professional Makeup Kit',
  summary: 'A professional makeup kit is a capital investment; building it intelligently starts with fundamentals and expands with client specialisation. The single biggest kit gap for most new makeup artists is insufficient depth in foundation shades — particularly in deep and dark ranges (Fitzpatrick IV-VI).',
  essentials: {
    foundations: {
      shadeRange: 'A professional kit must include shade ranges from Fitzpatrick I to VI (very fair to very deep); most new artists underinvest in deep shades because the majority of professional training focuses on lighter skin; having no shade match for a client is unprofessional and limits client acceptance',
      professionalLines: {
        'MAC Pro': 'MAC Pro Studio Fix and Pro Longwear Nourishing Waterproof Foundations have extensive shade ranges; widely used by professionals; 40+ shades',
        'Kryolan': 'Professional makeup brand used globally in film/TV and theater; specific ranges for various skin tones; HD Micro Foundation range covers extremely deep shades',
        'Graftobian': 'Professional camera makeup brand with HD Glamour Creme foundation in a very wide shade range including very deep shades',
        'RCMA': 'Classic professional brand; iconic No-Color Powder (used by virtually all professional makeup artists); foundation in wide shade ranges',
        'Ben Nye': 'Professional and theatrical makeup brand; broad shade ranges; widely available',
        'Mehron': 'Professional brand popular for special effects and theatrical work; depth of shade range'
      },
      mixing: 'Professional artists typically have fewer individual bottles but mix shades to create custom matches; a shade mixer (colour-correcting foundation in deep rich tones or very light) allows accurate colour matching across the range'
    },
    concealers: {
      range: 'As with foundation, full-depth concealer range is essential; under-eye concealer for deep skin requires peach or orange colour correction (to counteract blue-grey undertones in dark under-eye circles on melanin-rich skin) followed by a shade that matches or is slightly lighter than the skin',
      orangeCorrector: 'Orange, red-orange, and deep peach colour-correcting concealers are essential for any kit serving darker skin tones; they counteract the blue-purple colour of hyperpigmentation and dark circles on Fitzpatrick IV-VI skin'
    },
    contour: {
      deepSkinContour: 'Contour shades for Fitzpatrick V-VI skin must be significantly deeper than what most contour kits provide; the contour shade should be 2-3 shades deeper than the skin tone with a cooler, ashier undertone (cool brown, not warm orange-brown); warm orange-brown contour on very dark skin looks muddy',
      products: 'Professional artists serving diverse clients need both warm and cool-toned contour options; cream contour tends to be easier to blend on deeper skin tones than powder'
    },
    powders: {
      RCMA: 'RCMA No-Color Powder (translucent, clear-setting) is the industry standard for HD camera makeup; it sets without shifting colour or adding white cast — critical for deep skin tones where most white translucent powders create a grey or chalky cast',
      looseVsPressed: 'Professional kits typically include loose translucent powder (for all-over baking and setting) and pressed powder (for touch-ups, more portable)',
      mattifyingVsLuminous: 'A range of both mattifying (for oily skin clients) and luminous/blurring (for dry skin or on-camera glow) setting powder options serve diverse clients'
    },
    lips: {
      range: 'A professional lip kit includes: nude shades across the full skin tone range (what is "nude" is completely different for Fitzpatrick I vs VI); red family (cool reds to warm reds to berry reds — each reads differently on different skin tones); deep shades (plum, burgundy, oxblood); pink family (hot pink, bubblegum, mauve)',
      ethnicNude: 'The "nude lip" for dark skin requires brown, rose-brown, or mauve tones — what the makeup industry historically called a "nude lip" (light pink, beige) appears garish and unnatural on Fitzpatrick V-VI skin; any professional kit must include deep nude options'
    }
  },
  tools: {
    brushes: ['Fluffy face brush (powder, blush, setting powder)', 'Dense kabuki brush (foundation blending)', 'Fan brush (highlighter, setting powder)', 'Flat contour brush', 'Small blending brush (under-eye)', 'Eye shadow blending brush (large dome)', 'Eye shadow flat packing brush', 'Crease brush', 'Liner brush (fine pointed and angled)', 'Spoolie/brow brush'],
    sponges: ['Beauty Blender or equivalent (essential for flawless foundation blending, particularly on textured or mature skin)', 'Mini sponge (precise under-eye concealer blending)', 'Dry sponge (can be used to press-set powder)'],
    other: ['Lash curler', 'Tweezers (fine-pointed for lash application)', 'Scissors (for lash trimming)', 'Disposables: mascara wands, lip applicators, brow wands, sponge applicators (essential for sanitation in professional kit)', 'Sanitising spray for brushes between clients (isopropyl alcohol-based)']
  },
  sanitation: {
    importance: 'Professional kit sanitation is both legally required in most jurisdictions and ethically essential for client safety; applying used products or unsanitised brushes to multiple clients spreads infection, bacteria, and viruses',
    standards: ['Brushes must be cleaned with 70% isopropyl alcohol spray between clients and deep-cleaned (with brush cleaner or gentle shampoo) regularly', 'All palette products must be sprayed with 70% isopropyl alcohol after use on each client', 'Single-use applicators (disposable wands, sponge applicators, lip applicators) must be used once and discarded — never double-dipped', 'Cream and liquid products must be decanted onto a clean palette — never apply directly from the tube or pot to the client and then back to the product', 'False lashes are single-use for hygiene; never recycle from one client to another']
  }
};

export const BUILDING_A_MUA_BRAND = {
  title: 'Building a Makeup Artist Brand',
  niche: {
    importance: 'The most successful independent makeup artists have a clearly defined niche or specialisation; a generic "all makeup" positioning competes against everyone; a specific specialisation builds authority and attracts the ideal client',
    ethnicSpecialisation: {
      opportunity: 'Deep expertise in ethnic beauty represents a genuine and significant market opportunity: South Asian bridal makeup requires specific knowledge that many Western-trained artists lack; West African and Nigerian-American wedding makeup is an underserved niche; natural hair and dark skin makeup tutorial content reaches underserved audiences; expertise in Fitzpatrick V-VI skin is valued in editorial and commercial work',
      authenticity: 'Artists from within an ethnic community have authentic knowledge and cultural fluency that outside artists must work harder to develop; this lived experience is a genuine business asset, not just a talking point'
    }
  },
  portfolio: {
    importance: 'The portfolio is the primary marketing material for a makeup artist; a portfolio that shows authentic skill across diverse skin tones demonstrates range; a portfolio showing only one skin tone limits perceived expertise',
    documentation: ['Always photograph finished looks in good light (natural light near a window or a ring light specifically for beauty photography)', 'Include before photos (with client permission) to show the transformation work', 'For ethnic beauty specialisation: a portfolio showing exceptional work on Fitzpatrick V-VI skin, or showing culturally specific looks (South Asian bridal, West African traditional), communicates the specialisation immediately'],
    digital: 'Digital portfolio is essential; Instagram, TikTok, and a website or Squarespace portfolio site; a dedicated beauty photography session to build the initial portfolio is a worthwhile investment'
  },
  clientAcquisition: {
    initialPhase: ['Build on personal network: friends and family as first models; photography students as collaborators for portfolio shoots; trade photography collaborations', 'Bridal shows and vendor fairs are effective for bridal artists', 'Ethnic beauty specialisations: partnership with South Asian wedding vendors, African bridal vendors; presence at culturally specific events'],
    ongoingClients: 'Referrals are the primary ongoing source of clients for established makeup artists; every client is a potential referral source; follow-up after the job and asking satisfied clients for referrals or reviews is standard practice',
    social: 'Social media is both portfolio and marketing; consistency of posting matters more than frequency; quality over quantity; behind-the-scenes content (process and technique videos) generates engagement; tutorial content builds authority'
  },
  pricing: {
    structure: ['Flat rate per service (bridal makeup: single rate; airbrush additional)', 'Hourly rate (editorial and commercial)', 'Day rate (film and TV; usually negotiated as 8-hour day rate)'],
    ethnic: 'Ethnic beauty specialisation often commands a premium rate; South Asian bridal makeup is priced significantly higher than standard bridal makeup due to the complexity and duration of bridal looks across multiple events; there is an argument that deep dark skin expertise should be priced commensurately with its rarity',
    travelFees: 'Makeup artists typically charge travel time and transport beyond a base radius; any wedding or editorial job outside the local area includes a day-of or advance travel fee'
  }
};

export const ETHNIC_MUA_SPECIALISATION = {
  title: 'Ethnic Beauty Specialisations in Makeup Artistry',
  southAsianBridal: {
    overview: 'South Asian bridal makeup is one of the most technically demanding and economically valuable ethnic bridal specialisations; South Asian weddings often involve multiple events (mehendi, sangeet, nikkah/baraat, reception) each requiring different makeup looks; the bridal market in the UK South Asian community alone is estimated at over £1 billion annually',
    keyTechniques: ['Cut crease for Indian bridal (sharp-edged crease in deep rich tones: rust, burgundy, gold)', 'Contouring South Asian Fitzpatrick III-V skin to enhance bone structure under photography lighting', 'Dupatta pinning and hair integration skills', 'Knowledge of sindoor, maangtikka, and other traditional adornments and how they interact with makeup', 'Bindi placement and different bindi styles across Hindu, Sikh, and regional traditions'],
    productKnowledge: ['Kohl/kajal for waterline (traditional and functional)', 'Hindi and Urdu cosmetic brand knowledge (Lakme, Kay Beauty, Sugar Cosmetics) for South Asian community authenticity', 'Knowledge of traditional mehendi and how to work around henna application on the hands for the bridal party'],
    marketStrategy: 'South Asian bridal makeup artists market through South Asian wedding expos (in the UK, US, Canada, Australia), South Asian wedding publications and blogs, and Instagram with South Asian bridal hashtags'
  },
  westAfricanBridal: {
    overview: 'West African and African-American (particularly Nigerian-American and Ghanaian-American) wedding makeup is a growing specialisation; Nigerian weddings in particular are known for their scale, multiple-day celebrations, and high investment in beauty; Lagos is one of the world\'s major fashion and beauty capitals',
    keyTechniques: ['Full-coverage glam makeup for Fitzpatrick V-VI skin that photographs well under Nigerian celebration lighting', 'Knowledge of aso-ebi fashion and how makeup should harmonise with the rich colours and fabrics', 'Gele headwrapping coordination (awareness of how the head wrap frames the face affects makeup decisions)', 'Traditional Yoruba, Igbo, and Hausa bridal looks where applicable'],
    productKnowledge: ['Deep foundation shade matching for Fitzpatrick V-VI skin', 'Orange and red colour correction for under-eye and hyperpigmentation on dark skin', 'Makeup that survives tropical heat and humidity (common when Nigerian weddings are held in Nigeria)'],
    marketStrategy: 'West African bridal makeup artists market through Nigerian wedding publications (Bella Naija, etc.), West African diaspora social networks, and events'
  },
  blackAmericanBeauty: {
    overview: 'Black American beauty expertise covers the full range of beauty services for clients with Fitzpatrick IV-VI skin and a very wide range of hair textures; this market is large, historically underserved by mainstream beauty, and has developed its own extensive beauty culture with specific norms and preferences',
    keyTechniques: ['Colour correction with deep orange and red correctors for hyperpigmentation and under-eye circles on Fitzpatrick V-VI skin', 'Flawless full-coverage base makeup that doesn\'t oxidise or turn ashy on deep skin', 'Brow techniques that work for the natural brow shapes common in Black American women', 'Natural hair styling basics (knowledge of natural hair is expected in Black American beauty spaces)', 'Melanin-friendly highlight placement (Fitzpatrick V-VI skin requires warm, rich highlighter colours rather than icy or white-toned highlight)'],
    productKnowledge: ['Foundation shade ranges that extend to N65-N70 equivalents and deeper', 'Setting products that don\'t create white cast under flash (RCMA No-Color Powder, Huda Beauty Easy Bake)', 'Bronzers appropriate for dark skin (warm deep-brown, not orange)'],
    marketStrategy: 'Black American beauty specialisation requires a strong social media presence (Instagram, TikTok) because the Black American beauty community is highly social-media active; before/after transformations on dark skin are very shareable content; natural hair integration with bridal makeup is a particularly underserved niche'
  },
  arabBeauty: {
    overview: 'Arab beauty — from Gulf-inspired heavy glamour to Levantine fresh beauty — is a significant specialisation; Arab weddings are often large-scale celebrations with high investment in beauty; the Gulf beauty market is one of the highest-spending per-capita luxury beauty markets in the world',
    keyTechniques: ['Heavy contouring techniques that "sculpt" without looking heavy on camera', 'Dramatic eye looks (traditional Arab beauty prioritises dramatic kohl-lined eyes)', 'Ombre lip gradient technique', 'Long-lasting makeup for hot climates (Gulf weddings in summer require maximum longevity products)'],
    productKnowledge: ['Fragrance-free options for those with sensitivities', 'Perfume layering with beauty (oud and musk fragrances are a significant cultural component of Arab beauty)'],
    marketStrategy: 'Arabic-speaking beauty creators have a significant following across the Arab world and diaspora; Gulf Arabic and Levantine Arabic beauty have distinct aesthetic preferences; Instagram is the primary platform for Arab beauty'
  }
};

export const PROFESSIONAL_DEVELOPMENT = {
  title: 'Professional Development for Makeup Artists',
  training: {
    formalSchools: 'Makeup artistry schools include: Joe Blasco Makeup Center (US), The Institute of Makeup Artistry (UK), Blanche Macdonald (Canada), NMAA (UK/Europe); formal training provides foundational techniques and industry networking',
    selfTrained: 'Many highly successful professional makeup artists are self-trained through intensive practice, mentorship, and assisting on sets; formal school is not required for entry into the profession in most markets',
    assisting: 'Assisting an established makeup artist is one of the most effective paths to professional development; working on sets as a makeup assistant exposes you to professional workflows, client management, and kit organisation that school doesn\'t fully replicate'
  },
  continuousLearning: {
    masterclasses: 'Online and in-person masterclasses from established artists are widely available; brands (Charlotte Tilbury, NARS, MAC) offer professional masterclasses; independent artists teach privately',
    darkSkinTraining: 'There is a significant lack of dark skin training in mainstream makeup artistry schools; artists seeking to specialise in ethnic beauty or darker skin tones often have to actively seek additional training beyond standard curriculum; seek out educators who specialise specifically in dark skin techniques (Dr. Rendi, Danessa Myricks, Sam Fine are well-known black makeup artist educators in the US)',
    brandEducation: 'Major professional makeup brands (MAC, NARS, Kryolan) offer education programs for professional makeup artists including application techniques and product knowledge'
  },
  businessSkills: {
    contracts: 'Professional makeup artists need standard contracts covering: service scope, pricing, cancellation policy, travel fee policy, image usage rights (for portfolio and social media), and deposit requirements; using a contract protects both artist and client',
    insurance: 'Professional liability insurance is important for makeup artists; if a client has a reaction to a product, insurance protects the artist from claims; professional associations often provide insurance access',
    bookingTools: 'Online booking tools (Acuity Scheduling, Fresha, GlossGenius) allow clients to book appointments and pay deposits online; they reduce administrative overhead and no-show rates'
  }
};

export const ETHNIC_INDUSTRY_LANDSCAPE = {
  title: 'The Ethnic Beauty Industry Landscape',
  marketSize: 'The ethnic beauty market is a significant and growing segment of the global beauty industry; Nielsen reported that Black American consumers spend approximately 9 times more on beauty products as a percentage of income than white consumers; the US Black hair and beauty market alone is estimated at $2.7-3 billion annually; global ethnic beauty markets including South Asian, East Asian diaspora, and African markets represent a multi-billion dollar opportunity',
  representation: {
    historical: 'Mainstream beauty has historically underserved and underrepresented ethnic consumers; foundation shades did not extend to Fitzpatrick V-VI until Fenty Beauty\'s 2017 launch made the "40-shade range" a new industry standard; this market gap has driven the success of brands that prioritised diverse shade ranges from the beginning',
    currentState: 'Since the "Fenty effect" (2017), most major mainstream brands have expanded their shade ranges; however, genuine expertise in formulating for and serving diverse skin tones remains rarer than shade expansion alone; the beauty professional market has been slower to catch up than the consumer product market',
    opportunity: 'Makeup artists with genuine, deep expertise in ethnic beauty occupy a market position that is both underserved and growing; the demand for skilled artists who can authentically serve diverse skin tones across bridal, editorial, and personal beauty far exceeds the supply'
  },
  notableArtists: {
    context: 'The makeup artistry field has a significant number of ethnic beauty pioneers who built careers partly through their expertise and visibility in serving communities that mainstream beauty overlooked',
    educators: 'Sam Fine (pioneering Black American beauty artist and author), Reggie Wells (Oprah\'s makeup artist for 20 years), Pat McGrath (British-born Black makeup artist who became one of the most influential in the world), Pablo Rodriguez (worked with Beyoncé, developed techniques for deep dark skin)'
  }
};

export function getMUACareerOverview() {
  return MUA_CAREER_OVERVIEW;
}

export function getKitBuilding(section) {
  const map = {
    essentials: KIT_BUILDING.essentials,
    tools: KIT_BUILDING.tools,
    sanitation: KIT_BUILDING.sanitation
  };
  return map[section] || KIT_BUILDING;
}

export function getMUABrandBuilding(section) {
  const map = {
    niche: BUILDING_A_MUA_BRAND.niche,
    portfolio: BUILDING_A_MUA_BRAND.portfolio,
    clients: BUILDING_A_MUA_BRAND.clientAcquisition,
    pricing: BUILDING_A_MUA_BRAND.pricing
  };
  return map[section] || BUILDING_A_MUA_BRAND;
}

export function getEthnicMUASpecialisation(specialisation) {
  const map = {
    'south-asian': ETHNIC_MUA_SPECIALISATION.southAsianBridal,
    'west-african': ETHNIC_MUA_SPECIALISATION.westAfricanBridal,
    'black-american': ETHNIC_MUA_SPECIALISATION.blackAmericanBeauty,
    arab: ETHNIC_MUA_SPECIALISATION.arabBeauty
  };
  return map[specialisation] || ETHNIC_MUA_SPECIALISATION;
}

export function getProfessionalDevelopment(section) {
  const map = {
    training: PROFESSIONAL_DEVELOPMENT.training,
    learning: PROFESSIONAL_DEVELOPMENT.continuousLearning,
    business: PROFESSIONAL_DEVELOPMENT.businessSkills
  };
  return map[section] || PROFESSIONAL_DEVELOPMENT;
}

export function getEthnicIndustryLandscape() {
  return ETHNIC_INDUSTRY_LANDSCAPE;
}

export const MAKEUP_ARTIST_CAREER_STATS = {
  moduleId: 'makeup_artist_career_guide',
  version: '1.0.0',
  topics: ['makeup artist career', 'MUA kit building', 'professional makeup kit', 'ethnic beauty specialisation', 'South Asian bridal makeup', 'West African wedding makeup', 'Black American beauty industry', 'Arab beauty market', 'RCMA No-Color Powder', 'bridal makeup artist', 'editorial makeup', 'film TV makeup', 'makeup artistry training', 'MUA brand building', 'ethnic beauty market', 'Fenty effect shade range', 'makeup kit sanitation', 'MUA pricing', 'orange colour corrector dark skin', 'Sam Fine Pat McGrath'],
  communitiesSupported: 9,
  keyFacts: [
    'Nielsen reported that Black American consumers spend approximately 9 times more on beauty products as a percentage of income than white consumers; the US Black hair and beauty market is estimated at $2.7-3 billion annually — a massive market historically underserved by mainstream professional beauty',
    'RCMA No-Color Powder (truly translucent, truly clear-setting) is the industry standard for professional makeup artists working on camera because it sets without shifting colour or adding white cast — a critical property for Fitzpatrick V-VI skin where most "translucent" translucent powders create a chalky or grey cast',
    'The "Fenty Effect" (Rihanna\'s Fenty Beauty launch in 2017 with a 40-shade foundation range) permanently changed the industry standard for shade inclusivity; before 2017, most foundation ranges ended at 5-8 shades of brown; after, the 40+ shade range became expected by consumers across the industry',
    'South Asian weddings frequently involve multiple makeup looks across multiple events (mehendi, sangeet, nikah or baraat, reception); this multi-event structure means South Asian bridal makeup is among the highest per-client revenue of any bridal specialisation',
    'Deep expertise in Fitzpatrick V-VI skin has become a genuine market differentiator for professional makeup artists; in editorial and commercial photography, as representation of darker-skinned models grows, artists who can deliver flawless results on deep skin are sought after for their rarity'
  ]
};
