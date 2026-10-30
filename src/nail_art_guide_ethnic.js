/**
 * MIRRR — Nail Art & Care Guide (Multicultural Traditions)
 * Nail biology, care, art techniques, cultural traditions,
 * press-on vs gel vs acrylic, and community-specific styles.
 */

export const NAIL_BIOLOGY_OVERVIEW = {
  title: 'Nail Biology and Health',
  structure: {
    nail_plate: 'The visible hard structure; made of keratin (same protein as hair); translucent — pink appearance from underlying blood vessels',
    nail_matrix: 'Root of the nail; produces new nail cells; damage here can permanently alter nail shape or growth',
    nail_bed: 'Skin beneath the nail plate; rich in blood vessels giving nails their pink colour',
    lunula: 'White crescent at nail base; the visible part of the matrix',
    cuticle: 'Thin layer of skin at nail base; seals the gap between nail plate and skin; prevents infection',
    eponychium: 'The proximal nail fold (the actual skin fold); different from the cuticle proper',
    hyponychium: 'Seal between nail plate and fingertip skin at the free edge; prevents infection under nail',
    paronychium: 'Skin bordering the nail on the sides'
  },
  growthFacts: {
    rate: 'Fingernails grow approximately 3mm per month; toenails 1mm per month',
    full_regrowth: 'Full fingernail regrowth: 6 months; toenail: 12-18 months',
    factors_affecting_growth: ['Dominant hand grows faster (increased blood flow from use)', 'Summer (warmer = faster)', 'Pregnancy (oestrogen effect)', 'Age (slows with age)', 'Nutrition (biotin, iron, zinc, protein)', 'Health conditions (thyroid, circulatory)'],
    record: 'Longest fingernails in history: Lee Redmond (US) grew nails for 30 years to combined length of 8.65m'
  },
  nailHealth: {
    healthy_appearance: 'Smooth, uniform pink colour, strong without excessive brittleness, firm white free edge, no pitting or grooves',
    warning_signs: {
      clubbing: 'Nails curve over fingertips like upside-down spoon — can indicate lung, heart, or liver disease',
      spoon_nails: 'Koilonychia — concave nails that hold a water drop — iron deficiency anaemia',
      pitting: 'Small holes in nail surface — psoriasis, alopecia areata, Reiter\'s syndrome',
      yellow_nails: 'Fungal infection, yellow nail syndrome, respiratory conditions, smoking',
      white_spots: 'Leukonychia — commonly (incorrectly) attributed to calcium deficiency; usually minor trauma to nail matrix',
      horizontal_ridges: 'Beau\'s lines — severe illness, high fever, chemotherapy causing temporary halt in nail growth',
      vertical_ridges: 'Very common; usually normal ageing; occasionally anaemia or kidney disease if new/worsening',
      dark_streak: 'Longitudinal melanonychia — streak of pigment; may be normal variant (especially Fitzpatrick IV-VI); can indicate melanoma (subungual) — always check with dermatologist',
      nail_separation: 'Onycholysis — nail lifts from bed; fungal infection, psoriasis, hyperthyroidism, trauma, gel nail damage'
    }
  }
};

export const NAIL_CARE_GUIDE = {
  title: 'Complete Nail Care Guide',
  basicCare: {
    trimming: {
      fingernails: 'Trim after bathing (softer, less likely to split); cut straight across then gently round the corners; use sharp nail scissors or clippers',
      toenails: 'Cut straight across — rounding increases ingrown toenail risk; cut to end of toe, not below; use toenail clippers (larger and flat-edged)',
      frequency: 'Fingernails every 1-2 weeks; toenails every 3-4 weeks',
      tools: 'Sharp clippers or scissors (dull ones crush the nail edge and cause splitting); glass nail file for shaping (gentler and more precise than emery boards)'
    },
    filing: {
      direction: 'File in one direction from edge to centre; back-and-forth sawing weakens the nail edge and causes peeling',
      grit: '180 grit or higher for natural nails; never use coarse grit (80-100) on natural nail',
      glass_file: 'Ideal — seals the nail edge, longer lasting, can be sterilised, gentler on weak nails'
    },
    cuticle_care: {
      push_back: 'After softening with warm water or cuticle remover (alpha hydroxy acid based); use orangewood stick or rubber-tipped pusher; push gently back, don\'t cut',
      cutting: 'Only the dead tissue (cuticle proper) should be cut if at all; cutting the living eponychium increases infection risk',
      cuticle_oil: 'Apply cuticle oil (jojoba, vitamin E, argan) daily; massages into nail base improve circulation and growth speed; key for maintaining elasticity'
    },
    hydration: {
      
      products: ['Cuticle oil (jojoba oil most closely mirrors the skin\'s natural sebum)', 'Nail cream or hand cream applied to nails', 'Urea-based nail conditioner (10-20% urea) for brittle nails'],
      habits: 'Apply hand cream after every hand wash; apply cuticle oil before bed; wear gloves for wet work (dishwashing)'
    },
    protection: {
      gloves: 'Rubber or nitrile gloves for cleaning, gardening, prolonged water exposure',
      base_coat: 'A base coat (even without colour) protects the nail plate from staining and helps polish adhere',
      avoid: ['Biting nails (damages matrix, introduces bacteria)', 'Using nails as tools (opens)', 'Peeling off gel polish (removes layers of nail plate)']
    }
  },
  nutritionForNails: {
    biotin: {
      role: 'B vitamin that supports nail keratin structure; most studied nail supplement',
      
      food_sources: 'Eggs, nuts, seeds, salmon, sweet potato, avocado',
      supplement: '2500mcg (2.5mg) daily; note: biotin can interfere with thyroid and troponin lab tests'
    },
    protein: 'Nails are primarily keratin protein; adequate protein intake (0.8-1.0g/kg body weight) supports nail structure',
    iron: 'Deficiency causes spoon nails (koilonychia) and brittle, thin nails; check ferritin levels if nails are thin/ridged',
    zinc: 'Deficiency causes white spots (Leukonychia), nail growth issues, and Beau\'s lines',
    silicon: 'Trace mineral that supports collagen; found in bamboo, oat straw; some evidence for nail and hair strength',
    omega_3: 'Prevents brittle nails and dry cuticles; 1-2g EPA+DHA daily',
    vitamin_E: 'Antioxidant; deficiency linked to yellow nail syndrome; topical application to cuticles also beneficial'
  }
};

export const NAIL_ENHANCEMENT_GUIDE = {
  title: 'Nail Enhancements: Gel, Acrylic, and Press-On Guide',
  gel_nails: {
    types: {
      soft_gel: 'UV/LED-cured gel polish (Shellac, Gelish, OPI Gel); sits on natural nail; must be soaked off in acetone; lasts 2-3 weeks',
      hard_gel: 'Stronger gel used for nail extensions; cannot be soaked off, must be filed; more durable than soft gel',
      builder_gel: 'Thick, self-levelling gel used to build nail structure; can strengthen weak nails; popular alternative to acrylic'
    },
    application: {
      preparation: 'Lightly buff nail surface to remove shine; apply dehydrator then primer; thin base coat; cure 30-60 seconds; apply colour in thin layers curing each; top coat; cure; wipe sticky inhibition layer with cleanser',
      LED_vs_UV: 'LED lamps cure in seconds; UV lamps take 2 minutes per layer; LED more energy efficient; both effective. BIFL UV exposure concern: UV nail lamps emit UVA that penetrates to the nail matrix. Using SPF 30+ on hands and/or UV-protective gloves before sessions is recommended.',
      removal: 'File off shiny top coat; soak cotton in pure acetone; wrap each finger with foil; 10-15 minutes; slide off; never peel or force off'
    },
    pros: ['Natural appearance', 'Thinner and lighter than acrylic', 'Less odour than acrylic', 'Easier removal than acrylic', 'Builder gel can strengthen without extensions'],
    cons: ['UV exposure from curing lamp', 'Acetone removal dries nails', 'Nail damage if peeled off', 'Less durable than acrylic for long nails']
  },
  acrylic_nails: {
    description: 'Two-component system: liquid monomer (ethyl methacrylate) + powder polymer (acrylic); self-hardens without lamp; most common for long extensions',
    application: 'Apply tip or form; mix liquid and powder into bead; apply to nail in two strokes; file and shape after hardening; apply gel top coat and cure',
    removal: 'Cut length, file surface, soak in acetone 20-30 minutes, gently push off with orange stick — never force',
    pros: ['Most durable enhancement', 'Ideal for long nail extensions', 'Strong — less likely to break', 'Most affordable in salon'],
    cons: ['Strong chemical odour (monomer)', 'More difficult to remove', 'Can cause allergic contact dermatitis to monomer', 'Risk of MMA (methyl methacrylate) in cheap products — banned in US/EU professional use due to extreme damage potential'],
    MMA_warning: 'Methyl methacrylate (MMA) is banned in many countries for professional nail use — it adheres so strongly it can rip the nail plate off rather than break under pressure. Warning signs: extremely hard acrylic, very low price, no distinctive odour of ethyl methacrylate. Choose salons carefully.'
  },
  press_on_nails: {
    description: 'Pre-made nail shapes applied with adhesive glue or tabs; significant quality improvement in last decade with salon-quality resin nails now available',
    types: {
      adhesive_tab: 'Double-sided sticky tab; gentlest for nails; lasts 1-3 days; no damage on removal; ideal for special events',
      nail_glue: 'Cyanoacrylate glue; lasts 1-2 weeks; more secure; requires acetone for removal',
      gel_x: 'Gel adhesive system; salon quality; lasts up to 3 weeks; requires UV/LED curing',
      DIY_custom: 'Many makers now custom-press nails to order; wide variety of lengths, shapes, designs'
    },
    shapes: ['Square', 'Rounded', 'Oval', 'Almond', 'Stiletto (coffin)', 'Ballerina', 'Flare/Duck (popular for art)'],
    pros: ['No chemical damage to nails', 'Reusable', 'Affordable', 'Instant nail art at home', 'Easy to change', 'No UV exposure'],
    cons: ['Less durable than salon enhancements', 'Can pop off unexpectedly', 'Size fitting can be tricky', 'Less natural-looking under close inspection'],
    popularBrands: ['Static Nails', 'imPRESS', 'Kiss', 'Oh My Nails (custom)', 'Olive & June', 'Makartt']
  },
  dip_powder: {
    description: 'Acrylic polymer powder applied via layered bonding liquid rather than monomer; hybrid of gel and acrylic',
    application: 'Apply base coat; dip into powder; activate with liquid; repeat; seal with top coat; file and shape',
    durability: '3-4 weeks',
    pros: ['No UV lamp needed for cure', 'Stronger than gel', 'Good for natural nail strengthening', 'Less odour than acrylic'],
    cons: ['Hygiene concerns with shared dip pots (bacteria growth)', 'Difficult removal requires filing', 'Can build up thickness awkwardly'],
    hygiene: 'Insist on individual decanted powder at salon, not dipping directly into shared jar'
  }
};

export const NAIL_ART_TECHNIQUES = {
  title: 'Nail Art Techniques by Skill Level',
  beginner: {
    dotticure: {
      description: 'Polka dots made with dotting tool, toothpick, or bobby pin',
      technique: 'Apply base colour; dry; dip dotting tool in accent colour; dot onto nail in desired pattern',
      variations: 'Gradient dots (light to dark), scattered, ordered grid'
    },
    negative_space: {
      description: 'Strategic bare or lightly polished areas creating a design',
      technique: 'Apply base coat; place sticker or tape in desired negative space shape; apply colour; remove sticker while wet for clean lines',
      looks: 'Half-moon, geometric cut-out, striped, window pane'
    },
    tape_nail_art: {
      description: 'Surgical tape or striping tape creates sharp geometric lines',
      technique: 'Fully cure base colour; apply tape in desired geometry; apply second colour; remove tape immediately while wet'
    },
    gradient_ombre: {
      description: 'Two or more colours blending on the nail',
      sponge_method: 'Stripe colours side by side on makeup sponge; dab onto nail in tapping motion; build up; clean around nail; top coat',
      brush_method: 'Blend colours on nail with flat brush while both colours are slightly wet; fast technique needed'
    }
  },
  intermediate: {
    marble: {
      description: 'Mimics marble stone veining',
      water_marble: 'Drop different polish colours onto water surface; swirl with toothpick; dip nail into design; remove; clean edges',
      dry_marble: 'Apply white base; use grey and black thin brush to draw veining; blur with small brush; add shimmer highlights'
    },
    stamping: {
      description: 'Metal image plates transfer intricate designs to nail via stamping process',
      technique: 'Apply special stamping polish to plate design; scrape excess; pick up with stamper; transfer to nail; remove plate design from nail edge; top coat',
      advantage: 'Intricate designs without freehand skill; consistent results'
    },
    chrome_mirror: {
      description: 'Reflective metallic mirror finish achieved with chrome powder',
      technique: 'Apply black or dark gel base; cure; rub chrome powder with sponge applicator in circular motion; seal with no-wipe top coat; cure',
      colours: 'Silver, gold, rose gold, holographic, iridescent'
    },
    nail_foils: {
      description: 'Metallic or patterned foils transferred to nail',
      technique: 'Apply foil transfer gel (or tacky top coat); cure to specific "not quite dry" stage; press foil shiny-side down; rub; peel off; colour transfers to nail'
    }
  },
  advanced: {
    '3D_nail_art': {
      description: 'Dimensional designs using acrylic, gel, resin, or decorative elements',
      types: ['Acrylic flowers modelled by hand', 'Gel embossing designs', 'Resin charms embedded', 'Crystals and rhinestones (Swarovski and alternatives)', 'Dried flowers encapsulated in gel', 'Baroque sculpted designs'],
      technique: 'Requires gel builder to embed 3D elements; seal thoroughly to prevent elements lifting'
    },
    freehand_nail_art: {
      description: 'Painting designs directly on nail using nail art brushes',
      brushes: ['Liner/striping brush (fine lines)', 'Flat art brush (fills)', 'Fan brush (gradients)', 'Detail brush (tiny elements)'],
      practice_tip: 'Practice on artificial tips or silicone mat before working on nails; thin nail art paints more controllable than regular polish'
    },
    gel_sculpting: {
      description: 'Building full 3D structures in hard gel or acrylic — flowers, jewellery, bows, architectural elements',
      training: 'Requires professional training; widely available as YouTube tutorial series and salon courses'
    }
  }
};

export const ETHNIC_NAIL_CULTURE = {
  'west-african': {
    culturalSignificance: 'Long decorative nails are celebrated in many West African communities, particularly among Yoruba, Igbo, and Akan peoples. Nail decoration is part of adornment culture. Modern Nigerian nail art is internationally influential, especially "Lagos nails" with bold rhinestone and 3D designs.',
    popularStyles: ['Long coffin and stiletto nails', 'Heavy rhinestone and crystal embellishment', 'Bold color blocking in vibrant red, orange, and yellow', 'African kente-inspired geometric prints', 'Gold chrome accents reflecting gold jewellery traditions'],
    celebrations: 'Elaborate nail art is expected for owambe (Yoruba celebration/party) culture — elaborate outfits including nails and gele (headwrapping)',
    notable: 'Nigerian nail artists are celebrated globally on Instagram and TikTok; brands like Nails by Ama are internationally recognised',
    traditionalBeauty: 'Henna nail tipping (applied to fingertips) was historically practiced alongside full hand henna in West African Islamic communities'
  },
  'south-asian': {
    culturalSignificance: 'Henna on hands and nails has a history of over 5000 years; intricate mehndi designs are integral to Hindu and Muslim celebration culture. Sindoor-red nail colour is auspicious in Hindu tradition. Nail length moderate in many traditional contexts.',
    henna_traditions: {
      mehndi: 'Applied for weddings (bride and female guests), Eid, Diwali, Teej festival; applied the night before or day of celebration; designs can take 2-8 hours to apply',
      designs: 'South Indian mehndi: thicker blocks and fills with peacocks, temple motifs; North Indian: finer lace-like patterns, hidden groom\'s name in design; Pakistani: heavy hands and feet coverage with intricate lacework; Arabic influence in Gulf South Asian communities: more space and bold single motifs',
      blackHenna_warning: 'Black henna contains PPD (p-phenylenediamine) which can cause severe allergic contact dermatitis and permanent scarring. Natural henna is red-brown, not black. Never use black henna.',
      postApply: 'Leave henna paste on 4-8 hours; the longer it stays, the darker the stain; remove with butter or oil, never water; avoid water for 24 hours to let stain oxidise to its deepest colour; stain lasts 1-3 weeks'
    },
    modernStyle: 'Bollywood-inspired nail art: glitter, mirror chrome, elaborate embellishment for weddings; minimalist nudes for corporate wear',
    bridalnails: 'Bridal mehndi extends to nails; some brides also have elaborate gel nail art under the mehndi; nail gems secured with gel overlay'
  },
  caribbean: {
    culturalSignificance: 'Bold, expressive nail art is embedded in Caribbean beauty culture. Carnival especially drives elaborate nail art — matching costume glam.',
    popularStyles: ['Vibrant tropical colours: turquoise, coral, mango, lime', 'Caribbean flag nail art (Jamaica, Trinidad, Barbados, Haiti flag designs)', 'Carnival glitter and sequin nails', 'Ombre in sunset palettes (orange-pink-purple)', 'Long almond nails as classic Caribbean aesthetic'],
    celebrations: 'Carnival (Trinidad and Tobago, Barbados, Jamaica), Jouvert, Crop Over — nail art is part of full masquerade beauty look'
  },
  arab: {
    culturalSignificance: 'Nail care and adornment is important in Arab beauty culture; Arabic henna (mehndi) is distinct in style — bolder, more geometric, more spaced than Indian mehndi. Gold nail accents reflect gold jewellery prominence in culture.',
    hennaStyle: 'Arabic henna: large bold motifs with significant negative space; leaves space for the skin to show; intricate single flower/mandala centre motif; geometric borders; often covers back of hand more than palm',
    celebrationNails: 'Weddings, Eid al-Fitr, Eid al-Adha — elaborate mehndi and nail art; matching kaftan and nail colour coordination important',
    popularColours: ['Deep red and burgundy', 'Nude and champagne for formal wear', 'Gold chrome', 'Jewel tones: emerald, sapphire, amethyst'],
    modernTrends: 'Gulf Arab nail art scene (Dubai, Abu Dhabi, Riyadh) is internationally sophisticated — Valentino nail salons, Nails & Brows Mayfair-inspired luxury services',
    islamicNote: 'For observant Muslim women, nail varnish can be an issue for wudu (ablution) as water may not reach the nail. "Breathable" or permeable nail polish (claimed to allow water through) is debated among Islamic scholars. Henna is accepted as it is natural and temporary.'
  },
  latina: {
    culturalSignificance: 'Bold nail art is celebrated across Latin American cultures. Long, colourful, and expressive nails are mainstream beauty, not exceptional. Nail art is deeply embedded in Quinceañera (15th birthday) culture.',
    quinceañera: 'Elaborate matching nail art for the 15th birthday celebration; often matching the ball gown colour; rhinestones and 3D art popular',
    popularStyles: ['Bright Talavera tile-inspired geometric designs', 'Frida Kahlo floral motifs', 'Mexico/Brazil/Colombia flag colours', 'Tropical flowers: hibiscus, bougainvillea', 'Deep reds and corals (references to Latin passion in beauty culture)', 'Snake skin print'],
    notable: 'Latin American nail artists particularly celebrated for 3D and elaborate sculptural work; Colombian and Brazilian nail art internationally influential',
    traditional: 'Some indigenous Latin American communities historically used plant-derived stains on nails as adornment; e.g. cochineal (carmine dye from Dactylopius coccus) used by Aztec and Maya peoples for red colour on body and textiles'
  },
  'east-asian': {
    
    japanese_nail_art: {
      description: 'Japanese nail art (ネイルアート) is globally revered for precision and innovation. Known for hand-painted detail, 3D gel art, kawaii (cute) motifs, and seasonal designs.',
      styles: ['Kawaii (cat, bear, floral, pastel)', 'Traditional Japanese: sakura (cherry blossom), koi, crane, Mount Fuji, matcha', 'Ultra-detailed miniature paintings', 'Fluffy/velvet texture nails', 'Jelly nails (translucent with embedded elements)'],
      tradition: 'Long aristocratic nails in Heian period (794-1185); gold and lacquer nail adornment documented in Japanese historical art'
    },
    korean_nail_art: {
      description: 'Korean nail art (네일 아트) focuses on minimal, sophisticated aesthetics alongside elaborate event nails. K-beauty "quiet luxury" nail trends globally influential.',
      styles: ['Glass nails (aura/translucent)', 'Milk bath (floral botanicals in pale milky base)', 'Aurora/holographic iridescent', 'Minimal beige with single accent', 'Butter yellow', 'Cherry glazed donut (inspired by Hailey Bieber\'s "strawberry donut" nail)'],
      kdrama_influence: 'Korean dramas drive global nail trends — nail art worn by K-drama lead actresses creates worldwide imitation'
    },
    chinese_nail_art: {
      history: 'Chinese royal nail adornment has a documented 3000-year history. Ming Dynasty (1368-1644) long nail guards (hùzhǐ) worn by royals as symbols of leisure class — impractically long nails proved one did not perform manual labour.',
      modern: 'Contemporary Chinese nail art is boundary-pushing 3D and ultra-luxury; nail artists in cities like Shanghai and Beijing are globally sought after'
    },
    traditional: 'Balsam (garden balsam) flower used in East Asia to stain nails pink-red — traditional natural nail colour; process involves applying crushed flower petals and alum mixture overnight'
  },
  'east-african': {
    culturalSignificance: 'Henna use widespread across East Africa, particularly in Muslim communities of Somalia, Ethiopia (Harari community), Djibouti, Kenya coast. Nail adornment increasingly part of contemporary East African beauty culture.',
    hennaStyle: 'East African henna blends Arabic and Indian styles; Harari Ethiopian henna distinct regional style',
    modernStyle: 'Contemporary East African nail art influenced by global trends via Nairobi, Addis Ababa, and diaspora beauty communities',
    colours: 'Earth tones and jewel tones; matching traditional dress fabrics (habesha kemis fabric prints for nail art)'
  },
  'south-african': {
    culturalSignificance: 'Nail art is popular across South African communities. Vibrant beadwork traditions of Zulu, Ndebele, and Xhosa peoples historically influence colour palette and geometric pattern sensibility in nail art.',
    ndebele_influence: 'Ndebele (amaNdebele) geometric wall art — bold black outlines with vivid primary colour infill — is referenced in nail art designs; strong geometric lines in red, yellow, blue, green on white or black base',
    colours: ['Zulu flag colours (black, red, gold)', 'Ndebele-inspired primary brights', 'National flag colours (green, gold, black, white, red, blue)', 'African print fabric-inspired patterns'],
    henna: 'South African Indian communities (KwaZulu-Natal especially) maintain mehndi traditions brought from India in the 19th century',
    modern: 'Johannesburg and Cape Town nail art salons offer world-class work; South African nail artists competitive globally'
  },
  'black-american': {
    culturalSignificance: 'Long, elaborate nails are a significant part of Black American beauty culture and identity — an assertion of femininity, creativity, and style.',
    history: 'Long decorative nails in Black American beauty trace through blues and jazz-era aesthetics; Josephine Baker documented with painted long nails in 1920s Paris.',
    popularStyles: ['Long stiletto and coffin nails as the dominant aesthetic', 'Intricate nail art as wearable expression/statement', 'Influence on mainstream: "bad and boujee" nails, "trap" nail art', 'Cultural references: flag colours, portraits, name nails, prayer hands, money, roses', 'Modern: glazed donut (by Hailey Bieber but attributed Black beauty influence), French tip reimagined in colour, chrome powder'],
    nail_community: 'Black nail artists and nail influencers drive global trends — Fleek Nails, celebrity nail artists like Tom Bachik serving Black celebrity clients create mainstream trends',
    jewellery: 'Nail jewellery (rings on nails, gold nail caps) common in hip-hop influenced aesthetics; traces to gold fingertip caps in African royal traditions',
    acrylicReality: 'Access to affordable nail services has been democratised by nail shops in Black communities; but workers in these establishments often face chemical exposure (see clean beauty concerns); supporting Vietnamese-Black-owned nail shops with better ventilation is advocacy issue'
  }
};

export function getNailBiologyOverview() {
  return NAIL_BIOLOGY_OVERVIEW;
}

export function getNailCareGuide(section = null) {
  if (section === 'trimming') return NAIL_CARE_GUIDE.basicCare.trimming;
  if (section === 'nutrition') return NAIL_CARE_GUIDE.nutritionForNails;
  if (section === 'cuticle') return NAIL_CARE_GUIDE.basicCare.cuticle_care;
  return NAIL_CARE_GUIDE;
}

export function getNailEnhancementGuide(type = null) {
  if (!type) return NAIL_ENHANCEMENT_GUIDE;
  const t = type.toLowerCase();
  if (t.includes('gel')) return NAIL_ENHANCEMENT_GUIDE.gel_nails;
  if (t.includes('acrylic')) return NAIL_ENHANCEMENT_GUIDE.acrylic_nails;
  if (t.includes('press') || t.includes('press-on')) return NAIL_ENHANCEMENT_GUIDE.press_on_nails;
  if (t.includes('dip') || t.includes('powder')) return NAIL_ENHANCEMENT_GUIDE.dip_powder;
  return NAIL_ENHANCEMENT_GUIDE;
}

export function getNailArtTechniques(level = null) {
  if (!level) return NAIL_ART_TECHNIQUES;
  const l = level.toLowerCase();
  if (l.includes('beginner')) return NAIL_ART_TECHNIQUES.beginner;
  if (l.includes('intermediate')) return NAIL_ART_TECHNIQUES.intermediate;
  if (l.includes('advanced')) return NAIL_ART_TECHNIQUES.advanced;
  return NAIL_ART_TECHNIQUES;
}

export function getEthnicNailCulture(communityId) {
  const key = communityId.replace(/-/g, '_');
  const id = communityId.includes('_') ? communityId.replace(/_/g, '-') : communityId;
  return ETHNIC_NAIL_CULTURE[id] || ETHNIC_NAIL_CULTURE[communityId] || null;
}

