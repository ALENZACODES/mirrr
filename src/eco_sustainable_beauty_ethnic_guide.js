/**
 * Eco Sustainable Beauty Ethnic Guide
 * A comprehensive guide to sustainable and eco-conscious beauty practices
 * rooted in traditional knowledge across nine cultural communities.
 *
 * Central thesis: Traditional beauty practices across cultures were inherently
 * sustainable long before colonialism introduced synthetic, extractive, and
 * plastic-laden products. Reclaiming these traditions is both an act of
 * cultural sovereignty and environmental stewardship.
 */

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SUSTAINABLE BEAUTY PRINCIPLES
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_ECO_BEAUTY_PRINCIPLES = {
  plasticFreeSwaps: {
    title: 'Plastic-Free Beauty Swaps',
    philosophy: 'Single-use plastic in beauty is a 20th-century invention, not a necessity.',
    swaps: [
      {
        conventional: 'Liquid shampoo in plastic bottle',
        sustainable: 'Shampoo bar wrapped in paper or compostable film',
        impact: 'A single shampoo bar replaces up to 3 plastic bottles; lasts 60–80 washes.',
        tip: 'Transition period: hair may feel waxy for 2–4 weeks as it adjusts from silicone buildup.',
      },
      {
        conventional: 'Plastic face wash pump',
        sustainable: 'Solid cleansing bar or powder cleanser in glass jar',
        impact: 'Concentrated powders ship at a fraction of the weight, cutting transport emissions.',
        tip: 'Rub bar between palms to lather, or dissolve a pinch of powder with a few drops of water.',
      },
      {
        conventional: 'Plastic moisturizer tub',
        sustainable: 'Refillable aluminum tin or glass jar from a zero-waste brand',
        impact: 'Aluminum is infinitely recyclable; glass is reusable without quality loss.',
        tip: 'Many indie brands offer refill programs; save your jar and order a refill pouch.',
      },
      {
        conventional: 'Disposable cotton rounds',
        sustainable: 'Reusable organic cotton rounds or muslin cloths',
        impact: 'One set of 20 reusable rounds replaces 3,600+ disposable pads over 5 years.',
        tip: 'Wash in a mesh laundry bag on cold; line dry to extend life.',
      },
      {
        conventional: 'Plastic razor',
        sustainable: 'Safety razor with replaceable stainless steel blades',
        impact: 'One razor handle lasts decades; only the blade (fully recyclable) is replaced.',
        tip: 'Return blades to a blade bank (often at zero waste shops) for safe metal recycling.',
      },
      {
        conventional: 'Plastic toothbrush',
        sustainable: 'Bamboo toothbrush with plant-based bristles',
        impact: '3.5 billion plastic toothbrushes enter landfills globally each year.',
        tip: 'Remove bristles before composting the handle; some brands use compostable bristles.',
      },
      {
        conventional: 'Aerosol dry shampoo',
        sustainable: 'Loose powder dry shampoo in cardboard or glass',
        impact: 'Eliminates propellant gases and metal aerosol cans.',
        tip: 'Rice flour, arrowroot powder, or cocoa powder (for dark hair) work as DIY alternatives.',
      },
    ],
  },

  zeroWasteRoutine: {
    title: 'Zero-Waste Beauty Routine Framework',
    steps: [
      'Audit current products: identify plastic, single-use, and synthetic items.',
      'Use up what you have before switching — discarding usable product wastes resources.',
      'Replace items one at a time as they run out, choosing zero-waste alternatives.',
      'Learn to make one or two staples at home (body scrub, face mask, lip balm).',
      'Store homemade products in reused glass jars; label with date and ingredients.',
      'Compost fruit/vegetable-based scrub residues.',
      'Track ingredient lists: shorter is usually lower footprint.',
    ],
  },

  refillableContainers: {
    title: 'Refillable and Reusable Container Strategies',
    types: [
      { material: 'Glass', pros: 'Inert, reusable indefinitely, widely recyclable', cons: 'Heavy (transport emissions), breakable' },
      { material: 'Aluminum', pros: 'Infinitely recyclable, lightweight, durable', cons: 'Energy-intensive to produce initially' },
      { material: 'Stainless steel', pros: 'Durable, non-reactive, long lifespan', cons: 'Not widely curbside-recyclable in all regions' },
      { material: 'Bamboo', pros: 'Fast-growing, biodegradable', cons: 'Often combined with plastic; check composition' },
      { material: 'Paper/Cardboard', pros: 'Widely recyclable, compostable', cons: 'Not ideal for wet products; limited barrier protection' },
    ],
    refillPrograms: [
      'Loop (reusable packaging platform)',
      'Kjaer Weis (luxury refillable makeup compacts)',
      'Ethique (solid bars, no packaging beyond paper)',
      'Plaine Products (aluminum refill system)',
      'Aether Beauty (fully recyclable packaging)',
    ],
  },

  solidProducts: {
    title: 'Solid Beauty Products: The Original Zero-Waste Format',
    overview: 'Before liquid formulations became dominant in the 20th century, most beauty products were solid: pomades, wax-based balms, powdered pigments, and dried herb preparations. Solid products require no preservative systems, lighter packaging, and produce fewer emissions in shipping.',
    categories: [
      { product: 'Solid shampoo bar', benefit: 'No water content means no preservatives needed; lasts longer per gram' },
      { product: 'Solid conditioner bar', benefit: 'Concentrated; one bar equals 2–3 bottles of liquid conditioner' },
      { product: 'Solid facial serum', benefit: 'Wax and oil base; self-preserving; no plastic pump' },
      { product: 'Solid perfume', benefit: 'No alcohol evaporation; lasts longer on skin; travel-friendly' },
      { product: 'Solid sunscreen stick', benefit: 'No aerosol; reef-safe mineral formulas more common in solid form' },
      { product: 'Powder foundation', benefit: 'No emulsifiers, water, or preservatives; minimal packaging' },
      { product: 'Beeswax or plant-wax lip balm tin', benefit: 'Metal tin reusable; formula simple enough to make at home' },
    ],
  },

  ethicalSourcing: {
    title: 'Ethical Sourcing: Beyond Greenwashing',
    certifications: [
      { name: 'Fair Trade Certified', what: 'Ensures fair wages, safe conditions, and community investment for farmers' },
      { name: 'Rainforest Alliance', what: 'Covers biodiversity, ecosystem, and worker welfare standards' },
      { name: 'COSMOS Organic/Natural', what: 'European standard for organic and natural cosmetic ingredients' },
      { name: 'Ecocert', what: 'French certification for organic and natural ingredients in cosmetics' },
      { name: 'B Corp', what: 'Holistic business certification covering environment, workers, community, governance' },
      { name: 'Leaping Bunny', what: 'Cruelty-free certification; no animal testing at any supply chain stage' },
      { name: 'Wild-Harvested certification', what: 'Verifies sustainable wild collection without overharvesting ecosystems' },
    ],
    redFlags: [
      'Vague "natural" or "eco-friendly" claims without certification',
      '"Biodegradable" packaging that requires industrial composting, not home compostable',
      'Carbon-neutral claims based solely on offsets rather than emission reductions',
      'Brands owned by large conglomerates using sustainability as marketing for a subsidiary',
      'No supply chain transparency on where key ingredients are sourced',
    ],
  },

  climateChangeAndBeauty: {
    title: 'Climate Change and Beauty Ingredient Supply Chains',
    overview: 'Climate change is already disrupting the supply of key beauty ingredients. Rising temperatures, shifting rainfall patterns, and extreme weather events threaten crop yields and wild populations of plants that entire beauty economies depend on.',
    threats: [
      {
        ingredient: 'Argan oil',
        threat: 'Argan trees (Argania spinosa) in Morocco face desertification as the Sahara expands northward. Higher temperatures reduce fruiting; water scarcity stresses groves.',
        response: 'Support cooperatives investing in reforestation and water management.',
      },
      {
        ingredient: 'Shea butter',
        threat: 'Shea trees (Vitellaria paradoxa) take 15–20 years to bear fruit. Prolonged droughts in the Sahel reduce yields; land-use change is fragmenting shea parkland.',
        response: 'Buy from cooperatives with regenerative agroforestry programs.',
      },
      {
        ingredient: 'Rose water / rose otto',
        threat: 'Bulgarian and Turkish rose harvests are highly sensitive to temperature. Late frosts and early heat waves can wipe out an entire season\'s bloom.',
        response: 'Support small-scale distilleries; diversify to other floral waters (neroli, orange blossom).',
      },
      {
        ingredient: 'Frankincense resin',
        threat: 'Boswellia trees in Ethiopia, Somalia, and Eritrea are under stress from over-tapping, invasive insects, and erratic rainfall. Many trees die before reproducing.',
        response: 'Buy only from suppliers with verified sustainable tapping protocols; limit consumption.',
      },
      {
        ingredient: 'Sea moss',
        threat: 'Warming ocean temperatures and ocean acidification affect seaweed growth. Sargassum blooms (a different algae) are increasing due to nutrient runoff.',
        response: 'Source from certified aquaculture farms rather than wild-harvest during stress periods.',
      },
      {
        ingredient: 'Baobab oil',
        threat: 'Some of Africa\'s oldest baobab trees have died suddenly; researchers link this to climate stress. Baobabs are slow-growing and cannot be quickly replaced.',
        response: 'Use baobab oil sparingly; support community conservation programs.',
      },
      {
        ingredient: 'Cocoa butter',
        threat: 'Cocoa trees require specific temperature and rainfall bands. West Africa\'s cocoa belt is projected to shift significantly southward by 2050.',
        response: 'Support agroforestry cocoa farming; buy certified fair trade and shade-grown.',
      },
    ],
    adaptations: [
      'Brands are reformulating to reduce dependence on climate-vulnerable single sources.',
      'Fermentation technology allows cultivating beauty actives without agricultural land.',
      'Biotech ingredients (bakuchiol instead of retinol; beta-glucan instead of hyaluronic acid from rooster combs) reduce pressure on natural systems.',
      'Local sourcing reduces supply chain vulnerability to global climate disruptions.',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY GUIDES
// ─────────────────────────────────────────────────────────────────────────────

export const ETHNIC_ECO_BEAUTY_GUIDES = {

  // ─── WEST AFRICAN ──────────────────────────────────────────────────────────
  'west-african': {
    communityId: 'west-african',
    title: 'West African Eco Sustainable Beauty',
    tagline: 'Beauty as commons: cooperative, regenerative, and rooted in the land.',

    historicalContext: {
      preColonialSustainability: 'West African beauty traditions developed over millennia in harmony with the savanna, forest, and coastal ecosystems. Shea butter, palm oil, baobab, moringa, and black soap were produced through labor-intensive but ecologically sound methods. Women controlled these production systems; they were not extractive industries but community economies embedded in seasonal rhythms and land stewardship.',
      colonialDisruption: 'European colonialism introduced synthetic emollients, bleaching creams containing mercury and hydroquinone, and industrial palm oil operations that cleared forest for monoculture. The beauty ideal shifted toward lighter skin and European features, creating demand for harmful products while eroding the market for traditional alternatives. The industrial palm oil economy displaced the small-scale women-run palm fruit enterprises that had been ecologically sustainable.',
      reclamation: 'Contemporary West African and diaspora consumers are driving a return to shea, black soap, baobab, and other traditional ingredients — often reformulated into modern textures and sold through both local cooperatives and global natural beauty brands.',
    },

    keyIngredients: [
      {
        name: 'Shea Butter',
        botanicalName: 'Vitellaria paradoxa',
        sustainabilityProfile: 'High when sourced from women\'s cooperatives using traditional gathering methods',
        origin: 'Shea tree nuts, hand-collected from the ground after natural drop; trees are never cut',
        ecoNotes: 'Shea trees are integral to parkland agroforestry systems across the Sahel. They grow among crops, providing shade, preventing erosion, and sequestering carbon. Women\'s cooperatives in Ghana, Burkina Faso, Nigeria, and Mali gather, boil, dry, crack, roast, and grind nuts using methods passed down across generations — an entirely solar-powered, zero-chemical process. The byproduct (shea cake) is used as fuel or fertilizer.',
        cooperativeEconomy: {
          overview: 'Women-owned shea cooperatives represent one of the most successful examples of sustainable beauty economies in the world. The Global Shea Alliance (GSA) estimates that 16 million women across 21 African countries depend on shea for income.',
          examples: [
            'KAMBAA (Burkina Faso): 6,000 women, organic-certified, exports to European cosmetics companies',
            'Savannah Fruits Company (Ghana): 10,000 women farmers, fair trade, hand-processed butter',
            'Alaffia (Togo/USA): cooperative producer-to-consumer model, funds local community projects',
          ],
          whyItMatters: 'Buying from these cooperatives keeps value in the producing community, incentivizes tree protection, and funds girls\' education, healthcare, and food security programs tied to shea income.',
        },
        beautyUses: ['Deep moisturizer for natural hair and scalp', 'Body butter for melanin-rich skin', 'Baby skin care', 'Lip balm base', 'Carrier oil for essential oil blends'],
        climateVulnerability: 'Medium-High. Sahel droughts stress shea trees; deforestation for agriculture is the primary threat.',
      },
      {
        name: 'African Black Soap (Ose Dudu / Alata Samina)',
        botanicalName: 'N/A (processed product)',
        sustainabilityProfile: 'Very high when made traditionally',
        origin: 'Plantain skins, cocoa pod husks, palm kernel oil, shea butter — all agricultural byproducts',
        ecoNotes: 'Authentic black soap is a masterpiece of zero-waste chemistry. Plantain skins and cocoa pod husks would otherwise be discarded; instead they are sun-dried and burned to ash, which is mixed with water to extract alkalis for saponification. The result is a biodegradable cleanser with no synthetic surfactants, no preservatives, and packaging that can be simple paper or leaf wrap.',
        beautyUses: ['Face wash for oily and acne-prone skin', 'Body wash', 'Shampoo for natural hair', 'Shaving soap'],
        sustainabilityTip: 'Buy raw, unrefined black soap in chunks rather than pre-liquefied versions in plastic dispensers. A small block dissolves easily with water and lasts weeks.',
      },
      {
        name: 'Neem',
        botanicalName: 'Azadirachta indica',
        sustainabilityProfile: 'Very high',
        origin: 'Widely naturalized across West Africa; thrives in degraded soils without irrigation',
        ecoNotes: 'Neem is called the "village pharmacy" across West Africa, South Asia, and the Caribbean. It requires no inputs — no fertilizer, no pesticides — and actually improves soil health. Every part of the tree is used: leaves for steam facials and hair rinses, twigs as toothbrushes (chew sticks), seeds pressed for neem oil. It is a living example of zero-waste beauty in a single tree. Neem is also allelopathic — it naturally suppresses weeds — making it excellent for agroforestry.',
        beautyUses: ['Anti-acne face mask', 'Scalp treatment for dandruff', 'Insect-repellent body oil', 'Natural toothbrush (fresh twig)'],
        zeroWasteUses: ['Leaf: dried and powdered for face masks', 'Seed: cold-pressed for oil', 'Bark: decocted for scalp rinse', 'Twig: chew stick dental hygiene'],
      },
      {
        name: 'Palm Oil (Sustainable)',
        botanicalName: 'Elaeis guineensis',
        sustainabilityProfile: 'Variable — highly dependent on sourcing',
        origin: 'Indigenous to West and Central African tropical forests',
        ecoNotes: 'Palm oil is the world\'s most contested beauty and food ingredient. Small-scale West African producers — particularly women — have cultivated oil palms sustainably for centuries, harvesting from trees integrated into diverse agroforestry systems. This is categorically different from industrial Southeast Asian palm oil plantations that drive deforestation and biodiversity loss. Red palm oil from traditional producers is nutrient-dense and ecologically sound. The challenge for consumers is identifying the source.',
        ethicsDebate: {
          industrialPalm: 'Accounts for 85% of global palm oil supply; linked to deforestation in Indonesia and Malaysia, peatland destruction, and orangutan habitat loss.',
          traditionalWestAfrican: 'Women-managed, integrated into diverse forests, lower yield but dramatically higher biodiversity and lower carbon footprint.',
          certification: 'RSPO (Roundtable on Sustainable Palm Oil) certification helps but is imperfect; "smallholder certified" labels indicate traditional producers.',
        },
        beautyUses: ['Red palm oil as vitamin-E-rich skin treatment', 'Palm kernel oil as hair treatment', 'Soap-making base (traditional black soap)'],
        recommendation: 'Look for "African red palm oil" from smallholder or cooperative sources with RSPO or fair-trade certification.',
      },
      {
        name: 'Baobab Oil',
        botanicalName: 'Adansonia digitata',
        sustainabilityProfile: 'High when harvested without harming the tree',
        origin: 'Seeds collected from fallen fruit of ancient baobab trees',
        ecoNotes: 'The baobab is called the "tree of life" — it can live 2,000+ years, stores thousands of liters of water in its trunk, and provides food, fiber, medicine, and beauty ingredients. Baobab fruit falls naturally; no cutting or climbing is required. Seeds are cold-pressed into an oil rich in omega-3, -6, and -9 fatty acids. However, some of Africa\'s oldest baobabs are dying — possibly linked to climate change — making their conservation urgent.',
        beautyUses: ['Lightweight facial oil', 'Anti-aging treatment for mature skin', 'Scalp and hair shine oil', 'Stretch mark prevention during pregnancy'],
      },
    ],

    sustainablePractices: [
      {
        practice: 'Shea cooperative purchasing',
        description: 'Buy shea butter directly from women-run cooperatives or brands that source exclusively from them. This keeps the economic value in West Africa and incentivizes sustainable tree management.',
        action: 'Look for cooperatives certified by the Global Shea Alliance or partnered with fair-trade organizations.',
      },
      {
        practice: 'Traditional steam facial (ugiri/steam pot)',
        description: 'A clay pot of herbal water — neem leaves, hibiscus, lemon grass — brought to a boil and used for facial steaming. Zero packaging, zero synthetic ingredients, completely biodegradable.',
        action: 'Source herbs locally or grow them in a pot; reuse the water for watering plants.',
      },
      {
        practice: 'Black soap bulk buying',
        description: 'Purchase raw black soap in 500g–1kg blocks rather than individual bars. Cuts packaging waste dramatically.',
        action: 'Store in a cool dry place; cut off what you need and wrap the block in cloth or paper.',
      },
      {
        practice: 'Neem chew sticks',
        description: 'Fresh neem twigs as toothbrushes are still widely used across West Africa and the broader Muslim world. Entirely biodegradable; antibacterial properties demonstrated in clinical studies.',
        action: 'Source fresh neem twigs from African or South Asian grocery stores; use within a day or two of cutting.',
      },
    ],

    blackOwnedSustainableRecommendations: [
      { brand: 'Alaffia', note: 'Togo-based cooperative, West African fair-trade ingredients, community programs' },
      { brand: 'Shea Moisture', note: 'Founded by Sofi Tucker in Sierra Leone 1912; now mainstream but cooperative-sourced shea' },
      { brand: 'Nubian Heritage', note: 'African heritage ingredients, fair trade sourcing' },
      { brand: 'Adwoa Beauty', note: 'Baomint line uses baobab oil from sustainable sources' },
    ],
  },

  // ─── SOUTH ASIAN ───────────────────────────────────────────────────────────
  'south-asian': {
    communityId: 'south-asian',
    title: 'South Asian Eco Sustainable Beauty',
    tagline: 'Ayurveda: 5,000 years of sustainable beauty science before "clean beauty" was a trend.',

    historicalContext: {
      preColonialSustainability: 'Ayurveda — the ancient Indian system of medicine and beauty — is fundamentally a sustainable framework. It prescribes plants grown locally, processed minimally, and used in harmony with seasonal cycles (Ritucharya). Ubtan (scrubs), tailas (herbal oils), and lepas (pastes) were made fresh from kitchen-garden ingredients. The kitchen and the pharmacy were the same room.',
      colonialDisruption: 'British colonialism introduced imported European cosmetics and, crucially, the idea that "modern" meant synthetic and Western. Fair & Lovely (now Glow & Lovely) — a skin-lightening cream — became emblematic of how colonialism weaponized beauty standards against South Asian women, creating a multi-billion-dollar bleaching market with no traditional precedent.',
      reclamation: 'The global clean beauty movement has rediscovered Ayurvedic ingredients (ashwagandha, tulsi, turmeric, neem), but South Asian women have been using these for generations. The reclamation is partly about ensuring economic benefit flows back to Indian farmers and cooperatives rather than to Western brands appropriating the knowledge.',
    },

    keyIngredients: [
      {
        name: 'Turmeric (Haldi)',
        botanicalName: 'Curcuma longa',
        sustainabilityProfile: 'Very high — home-grown, minimal processing',
        ecoNotes: 'Turmeric is one of the most sustainable beauty crops. It grows in backyard gardens across South Asia with minimal inputs, requires no pesticides in traditional cultivation, and the entire plant is used — rhizomes for beauty and cooking, leaves for wrapping food. The haldi ceremony (turmeric paste applied to bride and groom before a wedding) is a completely zero-waste beauty ritual that predates the synthetic cosmetics industry by millennia.',
        beautyUses: ['Brightening face mask (with yogurt and honey)', 'Anti-inflammatory treatment for hyperpigmentation', 'Pre-wedding body polish', 'Scalp treatment for dandruff'],
        homeGrowing: 'Turmeric grows in containers in any warm, humid climate. Plant rhizomes in spring; harvest after 8–10 months when leaves yellow. Dry and grind at home for zero-packaging beauty.',
        zeroWaste: 'Leftover haldi paste from cooking becomes a face mask; turmeric-stained fingers from cooking double as a cuticle treatment.',
      },
      {
        name: 'Tulsi (Holy Basil)',
        botanicalName: 'Ocimum tenuiflorum',
        sustainabilityProfile: 'Very high — sacred plant grown in every home',
        ecoNotes: 'Tulsi is the most home-grown beauty plant in South Asian tradition. A potted tulsi plant in a household requires no supply chain, no packaging, no transport. Leaves are picked fresh as needed. The plant purifies air, has antimicrobial properties, and its cultivation is a spiritual practice in Hinduism — ensuring it is grown with care rather than as a commodity. This is the ideal closed-loop beauty resource.',
        beautyUses: ['Acne-fighting face steam', 'Scalp tonic for hair growth', 'Anti-fungal skin treatment', 'Toner (tulsi water)'],
        homeGrowing: 'Grows easily in pots on a balcony or windowsill in warm climates; bring indoors in winter. Water daily; harvest leaves as needed.',
      },
      {
        name: 'Neem',
        botanicalName: 'Azadirachta indica',
        sustainabilityProfile: 'Very high',
        ecoNotes: 'Neem is to South Asian beauty what shea butter is to West African beauty — foundational, sustainable, and deeply traditional. Neem twigs are the original toothbrush; neem oil the original anti-acne treatment; neem water the original antiseptic rinse. It grows across India and is considered a gift tree — planted communally, freely used by all.',
        beautyUses: ['Anti-acne face wash', 'Scalp oil for dandruff and lice prevention', 'Dental hygiene (chew sticks)', 'Insect-repellent body oil'],
      },
      {
        name: 'Coconut Oil',
        botanicalName: 'Cocos nucifera',
        sustainabilityProfile: 'High when from small-scale tropical producers',
        ecoNotes: 'In South Asian beauty, coconut oil is primarily used for hair — champi (head massage) is a centuries-old practice of warm oil massage applied to the scalp and hair. The oil is cold-pressed; the coconut shell becomes a vessel or is burned as fuel; the husk becomes coir fiber. Coconut cultivation in Kerala and Tamil Nadu has historically been a small-farmer enterprise using every part of the tree.',
        beautyUses: ['Pre-shampoo hair oil treatment', 'Deep conditioning mask', 'Skin moisturizer', 'Makeup remover', 'Oil pulling for oral health'],
        sustainabilityNote: 'Buy virgin coconut oil from single-origin small-farm producers; avoid mass-market refined varieties that may use chemical processing.',
      },
      {
        name: 'Amla (Indian Gooseberry)',
        botanicalName: 'Phyllanthus emblica',
        sustainabilityProfile: 'High',
        ecoNotes: 'Amla trees grow across the Indian subcontinent and are revered in Ayurveda as the richest plant source of vitamin C. Hair oils with amla have been used for centuries to prevent premature greying and strengthen hair. Amla is harvested by hand; the fruit is dried or pressed without chemical solvents.',
        beautyUses: ['Hair oil for strength and shine', 'Anti-greying scalp treatment', 'Brightening face mask', 'Antioxidant supplement for skin health from within'],
      },
    ],

    ayurvedaAsSustainableSystem: {
      principles: [
        'Local sourcing (Desha): use plants that grow in your region, adapted to local climate',
        'Seasonal alignment (Kala): adapt beauty routines to seasons — heavier oils in winter, cooling plants in summer',
        'Minimal processing (Ahimsa): gentle extraction preserves efficacy; synthetic processing wastes resources',
        'Whole-plant use (Zero waste): bark, leaf, flower, root, seed — every part has application',
        'Individual constitution (Prakriti): personalized beauty avoids the overuse of mass-market products',
      ],
      modernApplications: [
        'Making ubtan at home (gram flour, turmeric, rosewater, milk) instead of buying exfoliant in a plastic tube',
        'Growing a balcony herb garden of tulsi, neem, curry leaf, and aloe for DIY beauty',
        'Using sesame oil (tila taila) as a traditional body oil instead of synthetic lotion',
        'Triphala powder (three fruits) as a hair rinse for scalp health — zero packaging if bought in bulk',
      ],
    },

    zerWasteBeautyPractices: [
      {
        practice: 'Homemade ubtan',
        ingredients: 'Gram flour, turmeric, rosewater, raw milk or yogurt',
        use: 'Body and face scrub/mask',
        waste: 'Zero — all food-grade, fully biodegradable, no packaging if made from pantry staples',
      },
      {
        practice: 'Used tea leaves as eye treatment',
        ingredients: 'Cooled spent green or black tea bags',
        use: 'De-puff under eyes; antioxidant application',
        waste: 'Zero — repurposes a waste product; compost after use',
      },
      {
        practice: 'Coconut shell as beauty vessel',
        ingredients: 'Half coconut shell',
        use: 'Mix face masks, store solid soap, use as oil bowl for champi',
        waste: 'Zero — entirely natural, biodegradable vessel',
      },
    ],

    climateImpact: 'Climate change threatens several key Ayurvedic ingredients. Ashwagandha, now globally in demand, is grown in dry Rajasthan — water scarcity is intensifying. Saffron from Kashmir (used for brightening) faces warming temperatures that reduce yields. Sandalwood (chandan) is critically endangered from over-harvesting; sustainable alternatives are needed.',
  },

  // ─── CARIBBEAN ─────────────────────────────────────────────────────────────
  'caribbean': {
    communityId: 'caribbean',
    title: 'Caribbean Eco Sustainable Beauty',
    tagline: 'Island abundance, zero-waste wisdom, and the sea\'s gifts — ethically harvested.',

    historicalContext: {
      preColonialSustainability: 'Indigenous Taíno, Kalinago, and Arawak peoples developed rich beauty traditions using the Caribbean\'s extraordinary biodiversity. Sea moss, coconut, aloe vera, annatto seeds (for body paint and hair color), and cacao were central to personal care. These traditions valued the relationship between body care and the health of the island ecosystem.',
      colonialDisruption: 'Plantation slavery disrupted but did not destroy these traditions. Enslaved Africans merged their own plant knowledge with Indigenous Caribbean traditions, creating a hybrid of West African and Caribbean herbalism. After emancipation, synthetic imported products gradually replaced traditional ones, but oral knowledge survived in grandmothers\' kitchens across the region.',
      reclamation: 'Caribbean diaspora communities are reclaiming these traditions, and a wave of Caribbean-owned natural beauty brands is emerging, emphasizing island-sourced ingredients, traditional knowledge, and eco-packaging.',
    },

    keyIngredients: [
      {
        name: 'Sea Moss (Irish Moss)',
        botanicalName: 'Chondrus crispus / Gracilaria spp.',
        sustainabilityProfile: 'Variable — wild harvest requires careful management',
        ecoNotes: 'Sea moss has been used in the Caribbean for centuries as a nutritive tonic and skin treatment. It is exceptionally rich in minerals, collagen-supporting nutrients, and carrageenan (a natural thickener). The sustainability of sea moss depends entirely on how it is harvested: wild harvesting at scale can deplete coastal seaweed beds that provide critical fish nursery habitat. Aquaculture (farm-grown sea moss) — particularly in St. Lucia, Jamaica, and Trinidad — is emerging as the preferred model.',
        harvestingEthics: {
          wildHarvest: 'Sustainable at small scale with proper rotation; problematic when demand outstrips regrowth rates',
          aquaculture: 'Preferred for commercial supply; rope-culture in ocean farms requires no freshwater, no feed, sequesters carbon',
          certifications: 'Look for brands that state farm-grown or sustainably wild-harvested with specific origin and rotation practices',
        },
        beautyUses: ['Face mask (gel applied directly)', 'Hair gel and scalp treatment', 'Body lotion base', 'Anti-aging skin treatment'],
        climateNote: 'Ocean warming and acidification affect seaweed growth rates; sargassum bloom events (a different alga, driven by agricultural nutrient runoff) are disrupting Caribbean coastlines.',
      },
      {
        name: 'Coconut',
        botanicalName: 'Cocos nucifera',
        sustainabilityProfile: 'Very high — zero-waste plant',
        ecoNotes: 'The coconut tree is the defining zero-waste beauty plant of the Caribbean. In traditional Caribbean practice, no part of the coconut is wasted: the water hydrates and tones skin; the flesh is pressed for oil; the husk fiber (coir) is used as a scrubbing tool; the shell becomes a bowl or storage vessel; the dried shell is burned as fragrant fuel; the palm fronds are woven into baskets. This represents a complete closed-loop material system from a single plant.',
        zeroWasteMap: [
          { part: 'Coconut water', beauty: 'Hydrating toner, setting spray, hair rinse' },
          { part: 'Coconut flesh / milk', beauty: 'Deep conditioning hair mask, body moisturizer' },
          { part: 'Coconut oil (cold-pressed)', beauty: 'Hair oil, skin moisturizer, makeup remover, oil pulling' },
          { part: 'Coconut shell', beauty: 'Mixing bowl, storage vessel, charcoal (activated) for teeth' },
          { part: 'Coir (husk fiber)', beauty: 'Natural exfoliating mitt, nail brush' },
          { part: 'Palm fronds', beauty: 'Fan for air drying, weave for storage basket' },
        ],
        beautyUses: ['Deep hair conditioning', 'Skin moisturizer', 'Scalp massage oil', 'Makeup remover', 'Body scrub base (with sugar or salt)'],
      },
      {
        name: 'Aloe Vera',
        botanicalName: 'Aloe barbadensis miller',
        sustainabilityProfile: 'Very high when home-grown',
        ecoNotes: 'Aloe grows abundantly across the Caribbean, requiring minimal water and no fertilizer in the tropical climate. A single aloe plant in a pot provides years of gel — a completely on-demand, zero-packaging, zero-transport beauty resource. The gel is self-preserving for short-term use in the fridge. Barbados was once the world\'s largest aloe exporter — it is deeply embedded in Caribbean heritage.',
        beautyUses: ['Sunburn treatment', 'Hair gel and detangler', 'After-shave soother', 'Face moisturizer for oily skin', 'Scalp treatment'],
        homeGrowing: 'Grows outdoors in tropical climates; excellent container plant. Harvest outer leaves; the plant continues to grow. Refrigerate fresh gel for up to a week.',
      },
      {
        name: 'Annatto (Achiote)',
        botanicalName: 'Bixa orellana',
        sustainabilityProfile: 'High',
        ecoNotes: 'Annatto seeds provide the vibrant red-orange dye used by Indigenous Caribbean peoples for body painting — one of the world\'s oldest cosmetic colorants. The tree grows easily in Caribbean conditions; seeds are simply dried and used. It is a safe, biodegradable alternative to synthetic red pigments and is still used in Caribbean cooking (giving rice its yellow color) — a true kitchen-to-beauty dual-use ingredient.',
        beautyUses: ['Natural lip and cheek tint', 'Hair color (red-orange tones)', 'Body paint for festivals', 'Natural food coloring in edible beauty'],
      },
    ],

    islandBiodiversityConservation: {
      overview: 'Caribbean islands have extraordinary biodiversity per unit area — among the highest in the world. Many beauty plants are endemic (found nowhere else), making conservation of Caribbean ecosystems directly connected to the future of these beauty traditions.',
      threats: [
        'Coastal resort development destroying mangrove ecosystems where sea moss grows',
        'Agricultural pesticide runoff damaging coral reefs and nearshore ecology',
        'Hurricane intensity increases damaging coconut groves and herb gardens',
        'Tourism monoculture replacing food and beauty forests with resort lawns',
      ],
      actions: [
        'Support Caribbean-owned farms and cooperatives that maintain biodiversity',
        'Buy sea moss and other marine ingredients from producers with environmental commitments',
        'Support Caribbean reef conservation organizations as a beauty consumer',
        'Choose reef-safe sunscreen in Caribbean waters — conventional oxybenzone harms coral',
      ],
    },

    sustainablePractices: [
      { practice: 'Fresh sea moss gel at home', method: 'Soak dried sea moss overnight; blend with water; refrigerate up to 2 weeks; no packaging needed when bought in bulk' },
      { practice: 'Coconut oil pulling', method: 'Swish 1 tbsp coconut oil for 10–15 min; promotes oral health; zero-waste dental care alternative' },
      { practice: 'Banana peel face mask', method: 'Rub inner side of banana peel on face; antioxidants and silica soften skin; repurposes food waste' },
      { practice: 'Papaya enzyme exfoliant', method: 'Mash fresh papaya; apply to face for 10 min; natural papain enzymes dissolve dead cells; zero packaging' },
    ],
  },

  // ─── ARAB ──────────────────────────────────────────────────────────────────
  'arab': {
    communityId: 'arab',
    title: 'Arab Eco Sustainable Beauty',
    tagline: 'Ancient knowledge, cooperative economics, and the scented wisdom of desert and garden.',

    historicalContext: {
      preColonialSustainability: 'Arab beauty traditions flourished in medieval Islamic civilization, which made major advances in distillation technology, creating the rose water and aromatic waters that form the backbone of traditional Arab beauty. Henna, argan oil, kohl, ghassoul clay, olive oil, and hammam rituals were all deeply sustainable — locally sourced, minimally processed, and embedded in communal culture.',
      colonialDisruption: 'The introduction of European and American beauty products across MENA (Middle East and North Africa) in the 20th century created a synthetic beauty market that displaced many traditional products. Paradoxically, Western brands then commodified Arab beauty secrets — argan oil, rose water, black seed — often without crediting or paying fairly to the communities of origin.',
      reclamation: 'A strong movement of Arab and MENA beauty entrepreneurs is reclaiming these traditions, and the argan oil cooperative model has become a global case study in sustainable beauty economics.',
    },

    keyIngredients: [
      {
        name: 'Argan Oil',
        botanicalName: 'Argania spinosa',
        sustainabilityProfile: 'High when sourced from Moroccan women\'s cooperatives',
        origin: 'Nuts of the argan tree, endemic to the Sous Valley of Morocco',
        ecoNotes: 'Argan oil is the most celebrated example of cooperative beauty economics. The argan tree grows only in a small region of southwestern Morocco and is a UNESCO Biosphere Reserve. Trees are never cut — goats famously climb the trees to eat fruit, and nuts are collected from goat droppings or the ground. The hand-cracking and pressing process is labor-intensive but entirely chemical-free.',
        cooperativeModel: {
          overview: 'Moroccan women\'s cooperatives have been central to argan oil production since the 1990s. Supported by NGOs and the Moroccan government, these cooperatives gave women economic agency in a traditionally male-dominated economy. They now employ thousands of Berber women, fund education for girls, and reinvest in tree planting.',
          howItWorks: 'Women cooperatives buy argan fruits from local tree owners, crack nuts by hand (using stone tools, a skill passed through families), cold-press the kernels, and sell unrefined oil directly to brands or consumers. Profits are shared among cooperative members.',
          certifications: 'Look for cooperatives certified by UCFA (Union of Argan Cooperatives) or fair-trade organizations; "pure argan oil from Morocco" alone is insufficient — check for cooperative sourcing.',
          climateRisk: 'Argan trees are under pressure from over-grazing, urbanization, and the Sahara\'s northward advance. The cooperative model gives communities financial incentive to protect trees.',
        },
        beautyUses: ['Facial serum for all skin types', 'Hair oil for shine and frizz control', 'Cuticle and nail treatment', 'Anti-aging eye oil'],
      },
      {
        name: 'Rose Water (Ma\' Warad)',
        botanicalName: 'Rosa damascena',
        sustainabilityProfile: 'High when from traditional small-scale distilleries',
        ecoNotes: 'Rose water is produced by steam distillation of rose petals — one of the oldest distillation processes in human history, refined by Arab chemists like Ibn Sina (Avicenna) in the 11th century. Traditional distillation uses copper stills heated by wood or gas; the condensed water captures the volatile aromatics. The spent rose petals are composted or used as animal feed. Morocco\'s Valley of Roses (Dadès Valley) produces most of the world\'s rose water for beauty, and the harvest season employs tens of thousands of workers for a few weeks each year.',
        traditionalDistillation: {
          process: 'Fresh petals are packed into copper stills with water; steam carries volatiles through a coiled copper tube; condensate is collected as rose water (hydrosol) and rose oil (otto)',
          waterEfficiency: 'Traditional distillation reuses process water; modern plants are increasingly closed-loop',
          byproducts: 'Spent petals → compost or animal feed; rose oil (otto) → luxury perfumery',
        },
        beautyUses: ['Facial toner', 'Setting spray', 'Eye compress for tiredness', 'Hair rinse for shine', 'Mood-lifting room and pillow mist'],
        climateThreat: 'Late spring frosts and early heat waves in Morocco can devastate the rose harvest in a single week.',
      },
      {
        name: 'Black Seed Oil (Habbatus Sauda)',
        botanicalName: 'Nigella sativa',
        sustainabilityProfile: 'High',
        ecoNotes: 'Black seed has been used in Arab and Islamic medicine for over 2,000 years — the Prophet Muhammad reportedly called it "a cure for everything except death." It grows as an annual herb in dry climates with minimal inputs, is cold-pressed for oil, and the entire seed is used in both culinary and beauty applications. It is a perfect example of a dual-use kitchen and beauty crop.',
        beautyUses: ['Anti-inflammatory scalp oil', 'Acne treatment', 'Eczema and psoriasis soothing oil', 'Hair growth treatment'],
      },
      {
        name: 'Ghassoul Clay (Rhassoul)',
        botanicalName: 'N/A (mineral)',
        sustainabilityProfile: 'Very high — mineral extraction, no agriculture required',
        ecoNotes: 'Ghassoul is a clay mineral mined from the Atlas Mountains of Morocco and has been used in hammam beauty rituals for over 1,400 years. It is a natural ion-exchange material that adsorbs oils, toxins, and impurities without synthetic surfactants. It is essentially a one-ingredient cleanser and mask that requires only water, generates no chemical byproducts, and is entirely biodegradable.',
        beautyUses: ['Facial cleanser and mask', 'Hair mask (clarifying, no-poo method)', 'Body exfoliant in hammam ritual', 'Scalp detox treatment'],
      },
      {
        name: 'Henna (Lawsonia)',
        botanicalName: 'Lawsonia inermis',
        sustainabilityProfile: 'Very high when 100% natural',
        ecoNotes: 'Henna is a drought-tolerant shrub that grows across North Africa and the Middle East. Leaves are dried and ground to a powder — no chemical processing. The dye molecule (lawsone) is entirely plant-derived and biodegradable. Traditional henna is applied in paste form and is the world\'s oldest hair colorant. "Black henna" — marketed in tourist markets — contains PPD (a coal-tar chemical) and is NOT sustainable or safe; avoid it entirely.',
        beautyUses: ['Natural hair color (red-auburn tones)', 'Body art and hand decorating', 'Scalp treatment for dandruff and hair strengthening'],
        importantNote: 'Always buy body-quality henna: 100% Lawsonia inermis powder, no metallic salts, no PPD, no synthetic dye additives. Triple-bodied or sifted henna from Rajasthan or Yemen is highest quality.',
      },
    ],

    hammamSustainability: {
      title: 'The Hammam as Sustainable Wellness Ritual',
      overview: 'The public hammam (bathhouse) is a master class in shared resource efficiency. Rather than each household heating its own bathtub, a community shares one source of hot water and steam — dramatically lower energy use per person. Modern hammam culture extends this principle.',
      waterReuse: 'Traditional hammams used thermal natural springs or wood-fired boilers with elaborate water recirculation systems. Wastewater was channeled into city garden irrigation systems in Fez and Marrakech.',
      communalVsPrivate: 'The hammam model — shared facility, communal ritual — inherently reduces per-person energy and water use compared to private bathrooms. Community beauty is sustainable beauty.',
      rituals: [
        { step: 'Kessa (exfoliation)', tool: 'Kessa mitt (woven viscose glove)', sustainability: 'Reusable; lasts months; replaces plastic exfoliation gloves and single-use scrub pads' },
        { step: 'Ghassoul mask', tool: 'Ghassoul clay mixed with rose water', sustainability: 'Two natural ingredients; no packaging if bought in bulk' },
        { step: 'Savon beldi (black soap)', tool: 'Olive oil-based Moroccan black soap', sustainability: 'All-natural; sold in bulk tubs; zero plastic' },
        { step: 'Argan oil massage', tool: 'Pure argan oil', sustainability: 'Single-ingredient; glass bottle; cooperative-sourced' },
      ],
    },
  },

  // ─── LATINA ────────────────────────────────────────────────────────────────
  'latina': {
    communityId: 'latina',
    title: 'Latina Eco Sustainable Beauty',
    tagline: 'The milpa, the market, and the marigold: beauty rooted in land and community.',

    historicalContext: {
      preColonialSustainability: 'Pre-Columbian Mesoamerican and South American cultures developed highly sophisticated beauty traditions rooted in the same agricultural systems that fed their civilizations. The Aztec, Maya, Inca, and other peoples used cacao, avocado, copal, agave, nopal, and natural dyes from insects and plants. These were not extractive but regenerative — beauty came from the same ecosystems that produced food, medicine, and fiber.',
      colonialDisruption: 'Spanish colonization replaced Indigenous beauty knowledge with European products and imposed Eurocentric beauty standards that persisted into the modern era. The knowledge survived in curandera traditions, market herbalists, and household practices — particularly among Indigenous and mestiza communities.',
      reclamation: 'Latina beauty entrepreneurs and herbalists are increasingly reclaiming this knowledge, integrating Aztec and Maya botanical wisdom with modern formulation science. The global demand for avocado oil, cacao butter, and agave has created both opportunity and risk of commodification without community benefit.',
    },

    keyIngredients: [
      {
        name: 'Avocado',
        botanicalName: 'Persea americana',
        sustainabilityProfile: 'Variable — large-scale industrial farming is water-intensive',
        ecoNotes: 'Avocado originated in Mexico and Central America and has been used in beauty by Mesoamerican peoples for millennia. The flesh, oil, and seed are all useful in beauty. However, the global avocado boom has made industrial avocado farming a significant environmental issue — particularly in Mexico, where avocado monocultures consume enormous volumes of water and have replaced native forests in Michoacán and Jalisco.',
        sustainableApproach: 'For beauty use, repurpose avocado that has already been used for food: mash the leftover flesh as a face mask; save avocado pit to dry and grate as a gentle exfoliant; use avocado oil from sustainably-farmed sources.',
        zeroWasteMap: [
          { part: 'Flesh (ripe)', beauty: 'Deep conditioning hair mask, rich face mask' },
          { part: 'Flesh (overripe, not eaten)', beauty: 'Skin-softening body treatment' },
          { part: 'Avocado oil (cold-pressed)', beauty: 'Facial oil, body lotion, carrier for essential oils' },
          { part: 'Pit (dried and grated)', beauty: 'Gentle scrub exfoliant, natural brown dye for hair' },
          { part: 'Skin (outer)', beauty: 'Dried and burned as incense/copal alternative' },
        ],
        beautyUses: ['Deep hair mask', 'Rich face moisturizer', 'Eye cream base', 'Nail strengthening treatment'],
      },
      {
        name: 'Nopal Cactus',
        botanicalName: 'Opuntia ficus-indica',
        sustainabilityProfile: 'Exceptional — drought-resistant beauty plant',
        ecoNotes: 'Nopal (prickly pear cactus) is one of the most sustainable beauty crops that exists. It requires virtually no water — using CAM photosynthesis, it opens its stomata only at night to minimize water loss. It grows in the driest, most degraded soils. It actually restores soil fertility and prevents erosion. In a world facing water scarcity, nopal represents the future of sustainable beauty agriculture. The pads (nopales) produce mucilage — a viscous, hydrating gel used in beauty; the fruit produces the world\'s most expensive essential oil (prickly pear seed oil).',
        waterEfficiency: 'Nopal requires 1/10th the water of conventional vegetable crops. In Mexico, where water scarcity is increasingly severe, nopal cultivation offers an economically viable and ecologically restorative alternative.',
        beautyUses: [
          'Nopal gel (mucilage) as natural skin hydrator and wound healer',
          'Prickly pear seed oil — among the richest sources of linoleic acid and vitamin E',
          'Nopal extract in moisturizers and serums',
          'Prickly pear fruit as brightening face mask',
        ],
      },
      {
        name: 'Cacao / Cocoa Butter',
        botanicalName: 'Theobroma cacao',
        sustainabilityProfile: 'Variable — dependent on farming method',
        ecoNotes: 'Cacao is native to Mesoamerica and has deep cultural significance in Maya and Aztec traditions — used not only as food and drink but as currency and in beauty rituals. Theobroma means "food of the gods." Cocoa butter, the fat pressed from cacao beans, is deeply moisturizing and has been used on skin for centuries. Sustainable cacao cultivation under shade canopy (agroforestry) preserves biodiversity; sun-grown monoculture plantations degrade soil and displace wildlife.',
        sustainableApproach: 'Choose fair-trade, shade-grown cocoa butter; support Bean to Bar brands sourcing from family farms in Mexico, Guatemala, and Peru that maintain traditional agroforestry methods.',
        beautyUses: ['Body butter and skin moisturizer', 'Stretch mark prevention', 'Lip balm', 'Hair mask', 'DIY solid lotion bars'],
      },
    ],

    milpaFarmingSystem: {
      title: 'The Milpa: Beauty from the Three Sisters System',
      overview: 'The milpa is a Mesoamerican polyculture farming system that grows corn, beans, and squash together in the same field — the "Three Sisters." This intercropping system is one of the most sustainable agricultural systems ever developed: corn provides structure for beans to climb; beans fix nitrogen for corn and squash; squash leaves shade the ground, preventing water loss and weed growth. No synthetic fertilizers, no monoculture vulnerability.',
      beautyConnection: [
        'Corn (maize) provides masa for exfoliating treatments; corn silk for hair care and diuretic beauty teas; corn starch as dry shampoo and skin softener',
        'Beans provide bean flour as a gentle facial cleanser and exfoliant (similar to gram flour in South Asian beauty)',
        'Squash provides seeds rich in zinc (pressed into oil for acne-prone skin); flesh as a vitamin A-rich face mask',
        'The milpa system also grows herbs — epazote, hierba santa, chiles — with beauty and medicinal applications',
      ],
    },

    traditionalDyes: {
      title: 'Natural Dyes as Sustainable Beauty: Cochineal and Indigo',
      cochineal: {
        scientificName: 'Dactylopius coccus',
        overview: 'Cochineal is a scale insect that lives on nopal cactus and produces carmine — one of the most brilliant and stable red colorants in nature. Used by Aztec and Maya peoples for textiles, body paint, and lip color for centuries. Carmine (E120) is still used in cosmetics today, making cochineal one of the oldest continuously used beauty colorants.',
        sustainability: 'Cochineal farming (cochiniculture) is practiced in Oaxaca, Peru, and the Canary Islands. It requires no pesticides, no synthetic inputs, and the nopal host plant is itself sustainable. However, carmine is not vegan.',
        use: 'Natural lip and cheek tint; fabric dye for makeup brushes and tools; food-grade coloring',
      },
      indigo: {
        scientificName: 'Indigofera tinctoria',
        overview: 'Indigo has been used across Mesoamerica and South America for textile dyeing and ceremonial body painting. It is grown as an annual crop, requires minimal inputs in tropical climates, and fixes nitrogen in the soil.',
        beautyApplication: 'Indigo powder mixed with henna provides a blue-black hair color — a 100% natural alternative to synthetic hair dye. This combination (henna + indigo) is the foundation of "plant-based hair coloring."',
      },
    },

    blackAndBrownOwnedLatinaBrands: [
      { brand: 'Tata Harper', note: 'Chilean-Canadian founder; farm-to-face philosophy; all natural formulations' },
      { brand: 'Rizos Curls', note: 'Mexican-American owned; curl care with natural ingredients; sustainable packaging commitment' },
      { brand: 'Cocokind', note: 'Founder Michelle Ranavat; sustainability-forward; transparent pricing and supply chain' },
    ],
  },

  // ─── EAST ASIAN ────────────────────────────────────────────────────────────
  'east-asian': {
    communityId: 'east-asian',
    title: 'East Asian Eco Sustainable Beauty',
    tagline: 'Fermentation, minimalism, and the beauty of less: ancient practices for a planet under pressure.',

    historicalContext: {
      preColonialSustainability: 'East Asian beauty traditions — across China, Japan, Korea, and Vietnam — developed within Confucian, Buddhist, and Taoist frameworks that emphasized balance, minimal intervention, and respect for natural cycles. Rice, green tea, camellia oil, and silk proteins were refined through centuries of use into beauty staples. Traditional packaging was ceramic, bamboo, lacquered wood, or silk — no plastic in sight.',
      fermentationTradition: 'Korean beauty\'s signature fermentation technology is not a modern innovation — it is a 1,000-year-old food preservation technique applied to beauty. Makgeolli (rice wine) and kimchi fermentation cultures were historically applied to skin care. Fermented ingredients are more bioavailable, require less raw material for the same effect, and the fermentation process itself uses minimal water and energy.',
      modernChallenge: 'The K-beauty boom of the 2010s created enormous consumer demand but also generated a massive increase in plastic packaging — the 10-step routine means 10 bottles. The industry is reckoning with this contradiction between traditional minimalist philosophy and modern marketing excess.',
    },

    keyIngredients: [
      {
        name: 'Rice Bran',
        botanicalName: 'Oryza sativa',
        sustainabilityProfile: 'Very high — beauty byproduct of food production',
        ecoNotes: 'Rice bran is the outer layer of the rice grain, removed during milling to produce white rice. For centuries, Japanese millers noted that their hands — constantly immersed in bran — were remarkably soft and youthful-looking. This observation led to rice bran becoming a cornerstone of Japanese beauty. Rice bran oil (nuka oil) is one of the most nutrient-dense and eco-friendly beauty oils: it is a byproduct of food production, so its carbon footprint is allocated to the primary rice crop. Using it in beauty is fundamentally zero-waste upcycling.',
        historicalNotes: 'Japanese geishas traditionally used rice water (the starchy liquid from washing rice) to cleanse their faces and soften their famously long black hair. This practice persists today in Huangluo village in China, where the women of the Red Yao ethnic group have floor-length hair maintained entirely with fermented rice water — one of the first examples of a community beauty practice receiving global viral attention.',
        zeroWasteApplication: 'Save the water from rinsing rice; allow to ferment 24–48 hours at room temperature; use as a facial toner or hair rinse. No product, no packaging, no cost.',
        beautyUses: ['Facial cleanser and exfoliant (rice bran powder)', 'Skin brightening oil (rice bran oil)', 'Hair rinse for shine (rice water)', 'Anti-aging treatment'],
      },
      {
        name: 'Green Tea (Matcha)',
        botanicalName: 'Camellia sinensis',
        sustainabilityProfile: 'High when from small-scale shade-grown farms',
        ecoNotes: 'Traditional Japanese matcha cultivation (tencha tea for stone-grinding into matcha powder) uses shade-growing — bamboo frames covered with black cloth for weeks before harvest increase L-theanine and chlorophyll content while reducing the need for inputs. Shade-grown tea requires minimal artificial irrigation in humid regions. The entire leaf is consumed (stone-ground to powder), eliminating waste. Spent matcha in a face mask or bath goes back to the earth.',
        beautyUses: ['Antioxidant face mask', 'Eye depuffing treatment', 'Scalp treatment for inflammation', 'Body scrub (mixed with sugar or salt)', 'Bath soak'],
        sustainabilityTip: 'Use culinary-grade matcha (not ceremonial) for beauty applications — it is more affordable and has a lower carbon footprint per gram of antioxidants.',
      },
      {
        name: 'Camellia Oil (Tsubaki)',
        botanicalName: 'Camellia japonica',
        sustainabilityProfile: 'Very high',
        ecoNotes: 'Camellia oil from the seeds of Camellia japonica has been used in Japan for hair and skin care for over 1,000 years. It is traditionally associated with the women of the Oshima Islands, famous for their long, lustrous black hair. Camellia trees are long-lived, low-input, and productive. Seeds are cold-pressed; the cold-pressing byproduct (camellia cake) is used as a garden fertilizer and soil amendment — complete zero-waste use of the plant.',
        beautyUses: ['Hair oil for shine and split-end prevention', 'Facial oil for all skin types', 'Massage oil', 'Cuticle oil'],
      },
      {
        name: 'Fermented Ingredients (Sake Kasu, Miso, Makgeolli)',
        botanicalName: 'N/A (fermented food byproducts)',
        sustainabilityProfile: 'Very high — byproducts of food fermentation',
        ecoNotes: 'Some of East Asian beauty\'s most powerful actives are byproducts of food fermentation — making them inherently zero-waste. Sake kasu (sake lees, the solid residue from sake brewing) was used by Japanese sake brewery workers who noticed their hands appeared decades younger than their faces. Makgeolli (Korean rice wine) is fermented with wild yeast and bacteria; the active cultures in fermented beauty products require less synthetic preservative system.',
        fermentationBenefits: [
          'Reduced molecular size: fermented molecules penetrate skin more deeply',
          'Probiotic activity: live cultures support the skin microbiome',
          'pH optimization: fermentation brings products to skin-compatible pH naturally',
          'Reduced water use: concentrated active requires less product per application',
          'Less raw material: fermentation amplifies the potency of base ingredients',
        ],
        beautyUses: ['Sake kasu face mask (brightening, softening)', 'Makgeolli toner', 'Fermented soybean extract (hydrating)', 'Kombucha toner (K-beauty trend)'],
      },
    ],

    traditionalPackaging: {
      title: 'Traditional East Asian Beauty Packaging: The Original Sustainable Container',
      overview: 'Before plastic, East Asian beauty was packaged in materials that were beautiful, functional, and ecologically sound. These traditions are being actively revived by eco-conscious brands.',
      examples: [
        { material: 'Ceramic (porcelain)', tradition: 'Chinese and Japanese face powder and ointment vessels; infinitely reusable; kiln-fired ceramics are durable for generations', modernApplication: 'Refillable ceramic compacts for powder and cream products' },
        { material: 'Lacquered wood', tradition: 'Japanese lacquerware (urushi) boxes for storing combs, beauty tools, and solid perfumes; lacquer is a natural resin from the lacquer tree', modernApplication: 'Limited-edition sustainable beauty packaging; reusable storage for beauty tools' },
        { material: 'Bamboo', tradition: 'Bamboo tubes and cases for cosmetics, makeup brushes, and storing beauty oils in East Asian villages', modernApplication: 'Bamboo handles for brushes and applicators; bamboo tube packaging for mascara and lip balm' },
        { material: 'Silk pouches', tradition: 'Silk storage bags for gemstone face rollers, jade tools, and perfumed resins', modernApplication: 'Silk pillowcase (anti-crease beauty sleep); silk scrunchies (low-friction hair accessories)' },
      ],
    },

    minimalistBeautyAsEcoPhilosophy: {
      overview: 'The traditional Japanese concept of ma (negative space) and the Korean concept of jeong (harmony) both support a minimalist approach to beauty — using fewer, better products rather than accumulating many. This aligns perfectly with low-waste beauty.',
      principles: [
        'One multi-use product replaces many single-purpose ones: camellia oil works on face, hair, cuticles, and body',
        'Double-cleansing uses oil first (removes makeup with no harsh cleansers) then a gentle water-based wash — two steps, each with minimal product',
        'Skin preparation (skin prep) is emphasized over coverage — hydrated skin needs less makeup',
        'Sheet masks are the major eco-contradiction in K-beauty: even rice paper or bamboo fiber masks create waste; home-made masks in reusable bowls are more sustainable',
      ],
    },
  },

  // ─── EAST AFRICAN ──────────────────────────────────────────────────────────
  'east-african': {
    communityId: 'east-african',
    title: 'East African Eco Sustainable Beauty',
    tagline: 'Ancient trees, ethical resins, and climate-resilient beauty from the Horn of Africa to the Great Lakes.',

    historicalContext: {
      preColonialSustainability: 'East African beauty traditions span an enormous geographic and cultural range — from the Habesha culture of Ethiopia and Eritrea to the Swahili coastal culture of Kenya, Tanzania, and Mozambique to the Great Lakes cultures of Uganda and Rwanda. Frankincense and myrrh from Ethiopia and Somalia were traded across the ancient world. Moringa, baobab, and shea are central across the region. Body oiling with animal fats and plant oils, hair braiding art, and skin-darkening henna are all ancient traditions.',
      frankincenseHeritage: 'The frankincense trade route — the ancient "incense road" — linked Ethiopia, Somalia, and the Arabian Peninsula to the Mediterranean world. This trade sustained entire civilizations. Today, frankincense trees are under threat, and the beauty industry\'s growing demand for frankincense essential oil in luxury serums is accelerating the problem unless ethically sourced.',
      reclamation: 'Ethiopian, Kenyan, and Tanzanian beauty entrepreneurs are reclaiming heritage ingredients and bringing them into modern formulations, while advocacy organizations work to ensure that communities of origin benefit economically from the global demand for these ingredients.',
    },

    keyIngredients: [
      {
        name: 'Moringa',
        botanicalName: 'Moringa oleifera',
        sustainabilityProfile: 'Exceptional — among the most sustainable beauty crops',
        ecoNotes: 'Moringa is called the "miracle tree" and for good reason from a sustainability standpoint. It grows rapidly in degraded soils with minimal water; its roots fix nitrogen, restoring fertility to depleted land. Every part is used: leaves are the most nutrient-dense food known (used also as hair and skin treatments); seeds are pressed for oil and also have water-purifying properties; seed cake (after oil pressing) purifies drinking water by causing clay particles to aggregate and settle. Moringa is used in some East African communities to purify water in a completely natural, chemical-free process — the same plant purifies water and beautifies skin.',
        climateResilience: 'Moringa is one of the most climate-resilient crops. It tolerates drought, poor soil, and heat — thriving in precisely the conditions that will become more common under climate change. Supporting moringa-based beauty helps build the climate-resilient agricultural economy that East Africa needs.',
        beautyUses: ['Moringa oil as lightweight facial serum', 'Leaf powder face mask (anti-inflammatory, antioxidant)', 'Hair growth oil', 'Scalp treatment', 'Anti-aging treatment rich in zeatin (plant growth hormone)'],
        zeroWasteMap: [
          { part: 'Leaves (fresh)', beauty: 'Blended into face mask paste; juiced as toner' },
          { part: 'Leaves (dried and powdered)', beauty: 'Face mask, hair mask, antioxidant supplement' },
          { part: 'Seeds', beauty: 'Cold-pressed into Ben oil (moringa oil); seed paste for skin treatment' },
          { part: 'Seed cake (after oil pressing)', beauty: 'Water purification; composted as garden fertilizer' },
          { part: 'Bark', beauty: 'Traditional anti-inflammatory skin remedy (bark decoction)' },
        ],
      },
      {
        name: 'Frankincense (Olibanum)',
        botanicalName: 'Boswellia sacra / serrata / papyrifera',
        sustainabilityProfile: 'Critical concern — endangered by over-tapping',
        origin: 'Resin from Boswellia trees in Ethiopia, Somalia, Eritrea, Sudan, Oman, India',
        ecoNotes: 'Frankincense is one of the oldest traded beauty and aromatic ingredients in human history — used for at least 5,000 years. It is produced by tapping Boswellia trees: cuts made in the bark allow resin to ooze and harden. The problem is that over-tapping — driven by global demand for frankincense essential oil in luxury beauty, yoga studios, and churches — is killing the trees. Tapping wounds never fully heal; over-tapped trees produce fewer seeds; seedling survival rates are declining. Research published in Nature Sustainability projects that Boswellia populations in Ethiopia will decline by 50% over the next two decades if current tapping rates continue.',
        ethicalHarvestingProtocol: {
          recommended: 'Maximum 3 taps per tree per year; rest intervals of at least 5 years between tapping seasons; no tapping of trees under 40cm diameter; leaving seed-producing trees untapped',
          violating: 'Some suppliers tap trees 12 or more times per season, leaving them unable to recover',
          certification: 'Currently no universal frankincense sustainability certification exists — this is a gap. Buy from brands that can name specific Ethiopian or Somali cooperatives with documented tapping protocols.',
        },
        beautyUses: ['Anti-aging facial oil (boswellic acids reduce inflammation)', 'Scar and stretch mark treatment', 'Meditation and ritual aromatherapy', 'Skin tightening treatment'],
        consumerAction: 'Reduce frankincense consumption; use rarely and intentionally; choose blends that use a small percentage of frankincense; support brands funding Boswellia reforestation.',
      },
      {
        name: 'Baobab Oil',
        botanicalName: 'Adansonia digitata',
        sustainabilityProfile: 'High — collected from fruit fallen naturally',
        ecoNotes: 'The baobab tree is a symbol of resilience across sub-Saharan Africa. Individual trees can live 2,000 years. Fruit falls naturally from the tree; it does not need to be cut or climbed. Seeds inside the fruit are cold-pressed into baobab oil. The pulp is consumed as food. The bark is used in traditional medicine. The leaves are eaten as vegetables. It is a zero-waste plant that sustains both human communities and wildlife.',
        beautyUses: ['Lightweight facial oil (absorbs quickly, non-greasy)', 'Anti-aging treatment', 'Hair oil for natural textures', 'Pregnancy stretch mark oil', 'After-sun treatment'],
        climateNote: 'Several of Africa\'s ancient baobabs have died in recent years, potentially linked to climate stress. Conservation of baobab trees is both a cultural and biodiversity imperative.',
      },
      {
        name: 'Tej / Honey (Ethiopian and East African)',
        botanicalName: 'Apis mellifera scutellata (African honeybee)',
        sustainabilityProfile: 'High when from traditional beekeeping',
        ecoNotes: 'East Africa has some of the world\'s richest honey cultures. Ethiopian log hive beekeeping is a 3,000-year-old practice that maintains native African honeybee populations (which are more resistant to Varroa mite than European species). Honey from these traditional systems is used in beauty — as a face mask, hair mask, and wound treatment — and in tej (honey wine). Buying Ethiopian and East African single-origin honey supports both traditional beekeeping and pollinator conservation.',
        beautyUses: ['Hydrating face mask', 'Wound and burn healer (Manuka-equivalent function)', 'Hair conditioning mask', 'Lip balm ingredient', 'Exfoliating honey scrub'],
      },
    ],

    habeshaBeautyTraditions: {
      title: 'Ethiopian and Eritrean (Habesha) Sustainable Beauty Traditions',
      practices: [
        { practice: 'Teff flour face mask', description: 'Teff grain flour — the staple of Ethiopian injera bread — makes a gentle exfoliating and brightening face mask. Kitchen staple repurposed as zero-waste beauty.' },
        { practice: 'Butter (tesmi/spiced butter) hair treatment', description: 'Ethiopian spiced butter (tesmi) — clarified butter with rue, koseret, and other herbs — is traditionally applied to hair and skin. A food-grade, fully biodegradable treatment.' },
        { practice: 'Coffee grounds exfoliant', description: 'Ethiopia is the birthplace of coffee. Spent coffee grounds from the traditional Ethiopian coffee ceremony (buna) are repurposed as a body exfoliant — the ultimate food-waste-to-beauty upcycle.' },
        { practice: 'Incense smoke beauty (etan)', description: 'In Ethiopian and Eritrean culture, perfuming the body with incense smoke — standing over a censers with cloth or a dress to trap the smoke — is an ancient beauty ritual. It is a form of solid perfumery that leaves no liquid waste.' },
      ],
    },
  },

  // ─── SOUTH AFRICAN ─────────────────────────────────────────────────────────
  'south-african': {
    communityId: 'south-african',
    title: 'South African Eco Sustainable Beauty',
    tagline: 'Fynbos, ubuntu, and indigenous plant wisdom: the world\'s most biodiverse beauty landscape.',

    historicalContext: {
      preColonialSustainability: 'Southern Africa hosts one of the world\'s six floral kingdoms — the Cape Floral Kingdom (fynbos biome) — in a fraction of the area of other kingdoms, yet contains more plant species per square kilometer than the Amazon. Indigenous San, Khoikhoi, Zulu, Xhosa, Sotho, and other peoples developed intricate knowledge of these plants for food, medicine, and beauty over tens of thousands of years. Rooibos, buchu, marula, mongongo, and fynbos plants are all part of these traditions.',
      colonialDisruption: 'Apartheid\'s land dispossession removed indigenous communities from their ancestral plants and disrupted oral knowledge transmission. The commercialization of South African indigenous plants in the 20th century frequently benefited commercial interests without acknowledging or compensating the communities that held the knowledge. The rooibos ABS (Access and Benefit Sharing) agreement of 2019 was a landmark case of correcting this imbalance.',
      rooibosAgreement: 'In 2019, South Africa implemented a landmark Access and Benefit Sharing (ABS) agreement for rooibos — the first of its kind for a plant under the Nagoya Protocol. It provides that Khoikhoi and San communities receive a share of revenue from rooibos exports, acknowledging their role in identifying and developing the plant\'s uses. This is a model for how sustainable beauty can respect Indigenous knowledge rights.',
    },

    keyIngredients: [
      {
        name: 'Rooibos',
        botanicalName: 'Aspalathus linearis',
        sustainabilityProfile: 'High — endemic plant grown sustainably in limited geographic range',
        ecoNotes: 'Rooibos grows only in the Cederberg region of the Western Cape — a small area of fynbos that is globally unique. It is a nitrogen-fixing legume that actually improves soil health. It requires minimal irrigation in its native habitat. The plant is harvested by hand; fermentation (oxidation) of the needle-like leaves produces the characteristic red color and nutty flavor. It has been used by Khoisan peoples for generations as a calming tea and skin treatment.',
        indigenousRights: 'The 2019 ABS agreement requires beauty brands using rooibos to contribute to a trust fund benefiting Khoikhoi and San communities. Ensure the brands you buy from are compliant with this agreement.',
        beautyUses: ['Anti-aging facial toner and mist', 'Antioxidant-rich face mask (rooibos tea + honey)', 'Bath soak for sensitive skin', 'After-sun soothing treatment', 'Anti-inflammatory scalp rinse'],
      },
      {
        name: 'Marula Oil',
        botanicalName: 'Sclerocarya birrea',
        sustainabilityProfile: 'High when from community-harvesting programs',
        ecoNotes: 'Marula is a magnificent African tree — called the "marriage tree" in some traditions because its male and female trees grow near each other. The fruit falls naturally; nuts are collected and cold-pressed for oil. The oil is extraordinarily stable (high in oleic acid) and deeply moisturizing. Marula fruit is also fermented by elephants (fermented marula is famously intoxicating for wildlife), making the tree central to its entire ecosystem. Wild collection programs in Namibia, Botswana, and South Africa provide income for rural women.',
        beautyUses: ['Facial oil for dry and mature skin', 'Hair oil for natural textures', 'Anti-aging body oil', 'Scalp treatment', 'Nail and cuticle oil'],
        communityProgrammes: 'Liz Earle, Drunk Elephant, and other brands source marula through community harvest programs in Namibia — look for brands that specify community-harvest origin.',
      },
      {
        name: 'Buchu',
        botanicalName: 'Agathosma betulina',
        sustainabilityProfile: 'Moderate concern — wild harvesting under pressure',
        ecoNotes: 'Buchu is a fynbos endemic plant with a distinctive sharp, fruity scent. It has been used by Khoikhoi peoples as a medicine and beauty treatment for centuries — applied as an oil infused with animal fat. It is now commercially wild-harvested for essential oil used in beauty products and flavors. Demand has increased significantly; wild populations are under pressure, and sustainable cultivation programs are needed to reduce wild-harvest pressure.',
        beautyUses: ['Anti-inflammatory skin treatment', 'Deodorant ingredient (antibacterial)', 'Bruise and muscle soothing oil', 'Aromatic addition to body oils'],
        caution: 'Buy only from suppliers with verified sustainable sourcing; avoid wild-harvest buchu unless from a certified sustainable program.',
      },
      {
        name: 'Fynbos Botanicals',
        botanicalName: 'Various endemic species',
        sustainabilityProfile: 'Variable — fynbos biome is critically threatened',
        ecoNotes: 'The Cape Floral Kingdom is one of the most biodiverse places on Earth and one of the most threatened. Fynbos (including protea, leucadendron, helichrysum, and hundreds of other genera) is endemic — found nowhere else. Urban sprawl, agriculture, invasive species, and climate change threaten this irreplaceable biodiversity. Beauty ingredients sourced from fynbos are intrinsically tied to the conservation of this unique biome.',
        beautyIngredients: [
          { plant: 'Helichrysum (everlasting)', use: 'Anti-aging and skin-repairing essential oil; powerful anti-inflammatory', sustainability: 'Wild-harvest pressure; cultivated versions preferred' },
          { plant: 'Protea honey', use: 'Wound-healing and antibacterial face mask', sustainability: 'High — nectar collected by bees from protected protea plants' },
          { plant: 'Pelargonium (cape geranium)', use: 'Aromatic oil used in natural perfumery and skin care', sustainability: 'Mostly cultivated; manageable pressure on wild populations' },
        ],
        conservationAction: 'Support WWF South Africa\'s fynbos conservation program; choose brands that donate to the Cape Floristic Region Partnership.',
      },
    ],

    indigenousKnowledgeRights: {
      overview: 'South Africa has pioneered legal frameworks for Indigenous knowledge protection in the beauty and food industry. The Nagoya Protocol implementation, the rooibos ABS agreement, and ongoing bioprospecting legislation require companies to obtain prior informed consent from indigenous knowledge holders before commercializing their practices.',
      implications: 'When buying South African beauty products that use indigenous plants or practices (rooibos, buchu, hoodia, marula), verify the brand respects ABS agreements and contributes to communities who held this knowledge.',
      ubuntu: 'The Nguni Bantu concept of ubuntu — "I am because we are" — provides a philosophical framework for beauty that is inherently communal and sustainable. Beauty that exploits plants or communities undermines the web of relationships that sustains life.',
    },

    sustainablePractices: [
      { practice: 'Rooibos tea compress', method: 'Brew strong rooibos; cool; soak cotton reusable pad; apply to irritated skin or under eyes. No packaging; uses spent tea.' },
      { practice: 'Marula oil multi-tasking', method: 'One bottle of marula oil replaces separate facial oil, hair serum, and body oil. Concentrated multi-use products radically reduce packaging waste.' },
      { practice: 'African black soap or home-ground grain cleanser', method: 'Use raw rye, oat, or sorghum flour as a gentle cleanser — South African grain-based beauty traditions that avoid synthetic surfactants.' },
    ],
  },

  // ─── BLACK AMERICAN ────────────────────────────────────────────────────────
  'black-american': {
    communityId: 'black-american',
    title: 'Black American Eco Sustainable Beauty',
    tagline: 'DIY resilience, community gardens, and the movement to build sustainable Black beauty from the ground up.',

    historicalContext: {
      preColonialRoots: 'Black American beauty traditions draw from West African, Caribbean, and Indigenous American roots — all brought together through the forced migration of the transatlantic slave trade. Despite brutal attempts to erase African culture, enslaved African Americans maintained beauty knowledge: scalp oiling, natural hair care, herbal medicine, and DIY beauty preparations from available plants and kitchen ingredients. This resilient tradition of making-do with natural resources is fundamentally sustainable.',
      postEmancipation: 'After emancipation, Black entrepreneurs built America\'s first beauty economy. Madam C.J. Walker became America\'s first self-made female millionaire selling hair care products formulated for Black hair. Annie Turbo Malone, Garrett Morgan, and others built beauty businesses that served a community the mainstream industry ignored. This tradition of Black-owned beauty business is a direct ancestor of today\'s sustainable indie beauty movement.',
      naturalHairMovement: 'The natural hair movement — accelerating since the late 1990s and exploding after the 2010s — has driven a massive shift toward natural, chemical-free hair care for Black women. This movement is inherently aligned with sustainable beauty: avoiding chemical relaxers (which contain sodium hydroxide or ammonium thioglycolate, both environmentally concerning), choosing plant-based oils and butters, and embracing DIY hair care.',
    },

    keyIngredients: [
      {
        name: 'Castor Oil (Jamaican Black Castor Oil)',
        botanicalName: 'Ricinus communis',
        sustainabilityProfile: 'High',
        ecoNotes: 'Jamaican Black Castor Oil (JBCO) is produced by roasting castor beans before cold-pressing — a process that gives the oil its characteristic dark color and nutty scent. It has been central to Black American hair care for generations and connects to Caribbean traditions. Castor plants grow easily in tropical and subtropical climates with minimal inputs; the plant is also used for biodiesel.',
        beautyUses: ['Thick hair growth oil for edges and eyebrows', 'Scalp treatment for natural hair', 'Eyelash growth serum', 'Moisturizing heel treatment'],
        sustainabilityTip: 'Buy in glass bottles; JBCO from small Jamaican producers often has more sustainable production methods than large-scale Indian castor oil operations.',
      },
      {
        name: 'Shea Butter',
        botanicalName: 'Vitellaria paradoxa',
        sustainabilityProfile: 'High when from West African cooperatives',
        ecoNotes: 'See West African guide for full detail. For Black Americans, shea butter is both a beauty staple and a cultural connection to West African heritage. Buying from cooperatives maintains that cultural and economic link.',
        beautyUses: ['Body butter', 'Natural hair sealant (LOC/LCO method)', 'Scalp moisturizer', 'Lip balm', 'Baby skin care'],
      },
    ],

    diyNaturalBeautyTradition: {
      title: 'DIY Natural Beauty: Sustainable Beauty as Black Resilience',
      overview: 'Making beauty products at home — from kitchen and garden ingredients — is a deeply embedded tradition in Black American households. This is not a trend; it is a survival strategy refined over generations. It is also one of the most sustainable approaches to beauty: no packaging, no synthetic preservatives, no supply chains, no corporate markup.',
      classicDIYRecipes: [
        {
          name: 'Olive Oil and Egg Hair Mask',
          ingredients: ['2 eggs', '4 tbsp olive oil', '1 tbsp honey'],
          method: 'Mix; apply to damp hair from roots to ends; cover with shower cap 30 minutes; rinse with cool water.',
          sustainability: 'Three ingredients, all from the kitchen; no packaging; biodegradable.',
        },
        {
          name: 'Brown Sugar and Coconut Oil Body Scrub',
          ingredients: ['1/2 cup brown sugar', '1/4 cup coconut oil', 'Optional: a few drops essential oil'],
          method: 'Mix; scrub on damp skin in circular motions; rinse well.',
          sustainability: 'Repurposes kitchen staples; zero-waste if stored in a reused jar; biodegradable.',
        },
        {
          name: 'Avocado and Honey Face Mask',
          ingredients: ['1/2 ripe avocado', '1 tbsp raw honey', '1 tsp lemon juice'],
          method: 'Mash and mix; apply to clean face 15–20 minutes; rinse with warm water.',
          sustainability: 'Uses ripe avocado that might otherwise be wasted; no packaging; entirely biodegradable.',
        },
        {
          name: 'Apple Cider Vinegar Scalp Rinse',
          ingredients: ['2 tbsp apple cider vinegar', '1 cup water'],
          method: 'Mix in a spray bottle; apply after shampooing; leave 2–3 minutes; rinse or leave in.',
          sustainability: 'Single-ingredient (diluted) solution that replaces commercial clarifying treatment; glass bottle reusable.',
        },
      ],
    },

    communityGardenBeautyHerbs: {
      title: 'Community Garden Beauty Herbs: Growing Sustainable Beauty in Black Neighborhoods',
      overview: 'Community gardens in historically Black neighborhoods — particularly in urban areas of the American South, Chicago, Detroit, and NYC — are increasingly incorporating beauty herbs alongside food crops. This reclaims both green space and traditional plant knowledge.',
      herbs: [
        { herb: 'Rosemary', beautyUse: 'Hair growth rinse; rosemary oil rivals minoxidil in some studies for hair growth stimulation', growingTip: 'Perennial in USDA zones 8+; grows in containers in colder climates; drought-tolerant' },
        { herb: 'Lavender', beautyUse: 'Calming sleep spray; acne-fighting toner; soothing after-sun treatment', growingTip: 'Grows in full sun; drought-tolerant once established; deadhead to encourage blooming' },
        { herb: 'Aloe vera', beautyUse: 'Sunburn soother; natural hair gel; face moisturizer', growingTip: 'Container-friendly; bring indoors in winter; minimal water' },
        { herb: 'Calendula', beautyUse: 'Anti-inflammatory skin salve; wound healer; gentle oil infusion', growingTip: 'Easy annual; grows quickly from seed; harvest flowers regularly to encourage more' },
        { herb: 'Nettles', beautyUse: 'Hair growth tea rinse; scalp tonic; iron-rich supplement for hair health from within', growingTip: 'Grow in a contained bed (spreads); harvest with gloves; cooking and drying removes sting' },
        { herb: 'Hibiscus (Sorrel / Zobo)', beautyUse: 'Hair growth rinse; vitamin C-rich face mask; natural dye for dark hair', growingTip: 'Tropical perennial or annual; full sun; deep red flowers; cultural connection to West African and Caribbean heritage' },
      ],
    },

    supportingBlackOwnedSustainableBeauty: {
      title: 'Black-Owned Indie Beauty Brands: Sustainable and Community-Centered',
      overview: 'The most direct way to build a sustainable Black beauty economy is to support Black-owned indie brands — particularly those with explicit commitments to natural ingredients, sustainable packaging, and community investment. These brands are often founded by women who learned traditional beauty knowledge from family members and formalized it into businesses.',
      brands: [
        { brand: 'Bolden', note: 'Black-owned; clean, science-backed skincare for melanin-rich skin; sustainable practices' },
        { brand: 'Undefined Beauty', note: 'Clean hair and skin care; minimal packaging; refillable options' },
        { brand: 'Alikay Naturals', note: 'Florida-based; natural hair care; community-focused founder Rochelle Graham-Campbell' },
        { brand: 'Briogeo', note: 'Founded by Nancy Twine; clean ingredients; award-winning sustainability practices' },
        { brand: 'Pholk Beauty', note: 'Plant-based; nutrient-rich formulas; founder is herbalist and healer; community-building focus' },
        { brand: 'LYS Beauty', note: 'Clean makeup for deeper skin tones; sustainable packaging commitments' },
        { brand: 'Hyper Skin', note: 'Hyperpigmentation-focused; clean ingredients; eco-conscious packaging' },
      ],
      howToSupport: [
        'Buy directly from brand websites rather than through third-party retailers (more revenue reaches the founder)',
        'Subscribe to monthly or quarterly replenishment to give brands predictable revenue',
        'Leave reviews — Black-owned brands need social proof to compete with large marketing budgets',
        'Share products authentically on social media — word of mouth is the most powerful (and free) marketing',
        'Support Black beauty incubators and pitch competitions: New Voices Foundation, Fearless Fund, 15 Percent Pledge',
      ],
    },

    plasticFreeHairCare: {
      title: 'Plastic-Free Natural Hair Care',
      overview: 'Natural hair care has a plastic problem — the same product diversity that has enabled Black women to embrace their natural textures has also generated enormous plastic waste. The LOC method (Liquid, Oil, Cream) might mean three products in three separate plastic containers. Transitioning to low-waste natural hair care requires creativity.',
      solutions: [
        { product: 'Shampoo bar', recommendation: 'Choose sulfate-free shampoo bars formulated for natural hair; Ethique and Ruka are good options; avoid bars that contain heavy sulfates that strip moisture' },
        { product: 'Conditioner bar', recommendation: 'Concentrated conditioner in bar form; takes adjustment; less effective for very thick 4C hair types — test first' },
        { product: 'Bulk shea butter', recommendation: 'Buy 500g–2kg of raw shea in a bulk container rather than many small tubs; portion into reused glass jars' },
        { product: 'DIY leave-in spray', recommendation: 'Water + aloe vera gel + a few drops of oils in a reusable spray bottle; replaces commercial leave-in in plastic bottles' },
        { product: 'Scalp oil in glass roller', recommendation: 'Transfer castor oil or scalp oil blend into a glass roller bottle for easy application; eliminates plastic dropper bottles' },
      ],
    },
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getEcoSustainableBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_ECO_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_ECO_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_ECO_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_ECO_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_ECO_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_ECO_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_ECO_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_ECO_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_ECO_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTARY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_BEAUTY_COMMUNITY_IDS = [
  'west-african',
  'south-asian',
  'caribbean',
  'arab',
  'latina',
  'east-asian',
  'east-african',
  'south-african',
  'black-american',
];

export const ECO_BEAUTY_INGREDIENT_INDEX = {
  'shea-butter': ['west-african', 'black-american'],
  'neem': ['west-african', 'south-asian', 'caribbean'],
  'palm-oil': ['west-african'],
  'baobab-oil': ['west-african', 'east-african'],
  'black-soap': ['west-african'],
  'turmeric': ['south-asian', 'caribbean'],
  'tulsi': ['south-asian'],
  'coconut-oil': ['south-asian', 'caribbean', 'east-asian'],
  'amla': ['south-asian'],
  'sea-moss': ['caribbean'],
  'aloe-vera': ['caribbean', 'latina', 'black-american'],
  'annatto': ['caribbean', 'latina'],
  'argan-oil': ['arab'],
  'rose-water': ['arab'],
  'black-seed-oil': ['arab'],
  'ghassoul': ['arab'],
  'henna': ['arab', 'south-asian'],
  'avocado': ['latina'],
  'nopal': ['latina'],
  'cacao': ['latina'],
  'cochineal': ['latina'],
  'indigo': ['latina', 'south-asian'],
  'rice-bran': ['east-asian'],
  'green-tea': ['east-asian'],
  'camellia-oil': ['east-asian'],
  'sake-kasu': ['east-asian'],
  'moringa': ['east-african', 'south-asian'],
  'frankincense': ['east-african', 'arab'],
  'marula-oil': ['south-african', 'east-african'],
  'rooibos': ['south-african'],
  'buchu': ['south-african'],
  'castor-oil': ['black-american', 'caribbean'],
};

export const SUSTAINABILITY_RATINGS = {
  exceptional: 'Very high sustainability — minimal inputs, zero-waste production, climate-resilient, regenerative',
  high: 'High sustainability — low inputs, mostly sustainable sourcing, well-managed harvesting',
  variable: 'Sustainability depends heavily on sourcing — look for certifications and cooperative origins',
  moderate: 'Some sustainability concerns — wild-harvest pressure or water-intensive farming',
  critical: 'Significant sustainability concern — endangered species, over-harvesting, or destructive farming',
};

export const ECO_BEAUTY_GLOSSARY = {
  'zero-waste beauty': 'A beauty practice that eliminates all waste going to landfill or ocean — no single-use plastics, no non-recyclable materials, all product used completely',
  'solid beauty': 'Beauty products formulated without water, in solid bar or powder form, requiring minimal packaging and no preservative system',
  'ABS agreement': 'Access and Benefit Sharing — a legal framework requiring that companies using indigenous biological resources share benefits with the communities that stewarded those resources',
  'cooperative sourcing': 'Purchasing ingredients from producer cooperatives where farmers or harvesters collectively own and manage production and share profits equitably',
  'upcycling in beauty': 'Using byproducts of food or agricultural processing — rice bran from milling, coffee grounds from cafes, fruit pomace from juicing — as beauty ingredients',
  'agroforestry': 'Agricultural system that integrates trees with crops or livestock, increasing biodiversity and carbon storage while providing food and beauty ingredients',
  'fermented beauty': 'Beauty products using ingredients that have been fermented by beneficial microorganisms, increasing bioavailability, reducing need for synthetic preservatives',
  'bioregional beauty': 'A beauty practice that prioritizes ingredients grown or harvested within one\'s own geographic region, reducing transport emissions and supporting local economies',
  'phytoremediation': 'The use of plants to clean contaminated soil or water — some beauty crops (moringa, vetiver) have this quality, meaning they can be grown on degraded land',
  'CAM photosynthesis': 'Crassulacean Acid Metabolism — a water-efficient photosynthetic pathway used by drought-resistant plants like nopal cactus and aloe vera, making them ideal for low-water beauty agriculture',
  'Nagoya Protocol': 'An international agreement under the Convention on Biological Diversity governing access to genetic resources and the fair sharing of benefits with source communities',
  'wild-harvest': 'Collection of plants or plant materials from their natural habitat rather than farmed — can be sustainable at low scale but destructive at industrial scale',
  'bioprospecting': 'The systematic search for biological organisms and compounds with potential commercial applications — ethically requires community consent and benefit sharing',
  'carbon sequestration': 'The capture and storage of atmospheric CO2 by plants, soils, or oceans — beauty ingredient source plants like shea, baobab, and argan trees are significant carbon stores',
  'regenerative agriculture': 'Farming practices that restore soil health, biodiversity, and water cycles rather than simply sustaining current conditions — the highest standard for sustainable beauty sourcing',
  'waterless formulation': 'A beauty product formulated without water as a primary ingredient — solid bars, anhydrous oils, and dry powders — requiring no synthetic preservatives and less packaging weight',
  'cold-press extraction': 'Mechanical extraction of oils from seeds or nuts without heat or chemical solvents — preserves heat-sensitive nutrients and produces no chemical waste streams',
  'saponification': 'The chemical reaction between fats/oils and an alkali (lye or plant ash) that produces soap — the traditional basis of all natural soap-making worldwide',
  'biome': 'A large-scale ecological community defined by its dominant plant life — fynbos, savanna, tropical forest — beauty ingredient diversity maps onto biome diversity',
};

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-COMMUNITY ECO BEAUTY THEMES
// ─────────────────────────────────────────────────────────────────────────────

export const CROSS_COMMUNITY_THEMES = {

  colonialismAndSyntheticBeauty: {
    title: 'How Colonialism Introduced Unsustainable Beauty',
    thesis: 'The introduction of synthetic, extractive, and plastic-packaged beauty products was not inevitable — it was a specific outcome of colonial economic systems that prioritized industrial profit over ecological and community well-being.',
    mechanisms: [
      {
        mechanism: 'Destruction of local beauty economies',
        detail: 'Colonial trade policies made imported synthetic products cheaper than locally produced natural alternatives, undermining the economic viability of women-run shea cooperatives, traditional herbalists, and small-scale oil pressers.',
      },
      {
        mechanism: 'Cultural devaluation of traditional knowledge',
        detail: 'Colonial education systems taught that "modern" meant European — leading generations to view traditional plant-based beauty as primitive or backwards, accelerating adoption of synthetic products.',
      },
      {
        mechanism: 'Skin-lightening industry',
        detail: 'The colonial beauty ideal of lighter skin created a multi-billion-dollar market for hydroquinone, mercury, and steroid-containing bleaching products — products with no traditional precedent and significant health and environmental risks. Mercury from skin lighteners enters waterways through wash water.',
      },
      {
        mechanism: 'Plastic packaging introduction',
        detail: 'Before mass industrialization, beauty products were sold in ceramic, glass, metal, or cloth packaging. The shift to cheap disposable plastic was driven by post-WWII petrochemical industry expansion — not consumer preference.',
      },
      {
        mechanism: 'Knowledge extraction without benefit sharing',
        detail: 'Western cosmetic companies systematically studied traditional beauty practices and commercialized ingredients — argan oil, neem, turmeric, sea moss — without compensating the communities that developed the knowledge over generations.',
      },
    ],
    reclamation: 'Sustainable beauty is therefore an inherently decolonial project. Choosing traditionally produced, cooperatively sourced, minimally packaged beauty is simultaneously an environmental act and a political one — redirecting economic power toward the communities that originated beauty knowledge.',
  },

  waterAndBeauty: {
    title: 'Water, Beauty, and Planetary Boundaries',
    overview: 'The beauty industry is a significant consumer of freshwater — both in ingredient production (agriculture) and product formulation (most liquid products are 70–90% water). As freshwater scarcity intensifies under climate change, sustainable beauty must become water-conscious at every level.',
    waterInBeautyProducts: {
      problem: 'Most liquid skincare (lotions, serums, toners, shampoos) lists "aqua" or "water" first — meaning it is the primary ingredient. This water must be purified, requires preservatives to remain safe, and ships at full weight (increasing transport emissions).',
      solution: 'Waterless and solid formulations concentrate active ingredients without water, requiring less packaging, no aqueous preservatives, and lighter shipping. When you add water at home (from your own tap), you control the quality and it costs nothing.',
    },
    agriculturalWater: [
      { ingredient: 'Cotton (conventional)', waterUse: '10,000 liters per kg of fiber — for cotton rounds, pads, and wipes', alternative: 'Organic cotton (uses 90% less water) or bamboo; reusable rounds eliminate ongoing water burden' },
      { ingredient: 'Rose oil (traditional)', waterUse: '5 tons of petals per kg of rose otto oil; petals need irrigation in dry climates', alternative: 'Rose water (hydrosol) is a byproduct of distillation; uses same water, produces more beauty product per batch' },
      { ingredient: 'Aloe vera (farmed)', waterUse: 'Low water use — aloe is semi-arid adapted; home-grown aloe requires minimal irrigation', alternative: 'Grow your own; wild-harvested desert aloe requires no irrigation' },
      { ingredient: 'Avocado', waterUse: '70 liters per avocado; large scale farming depletes aquifers in Chile and Mexico', alternative: 'Repurpose avocado used for food; buy avocado oil only from certified water-responsible farms' },
      { ingredient: 'Rice (for rice bran)', waterUse: 'Rice paddies are water-intensive but rice bran is a byproduct — its water footprint is allocated to the rice, making bran oil essentially zero additional water burden', alternative: 'Rice bran oil is among the most water-efficient beauty oils per unit of benefit' },
    ],
    waterConservationPractices: [
      'Wash face with a small bowl of water rather than running tap continuously',
      'Use micellar water or cleansing oil (no-rinse cleansing) for daytime cleanse to save water',
      'Take shorter showers; turn off water while applying shampoo and conditioner',
      'Collect hair rinse water (plain water used for final rinse) for watering plants',
      'Choose concentrated products — one pump of a concentrate diluted with a small amount of water replaces a full bottle of pre-diluted product',
    ],
  },

  beautyAndBiodiversity: {
    title: 'Beauty as Biodiversity: Why the Beauty Industry Must Protect Ecosystems',
    overview: 'The beauty industry depends on biodiversity — it sources ingredients from thousands of plant, animal (beeswax, honey, lanolin, silk), and mineral sources. This dependence is both the industry\'s vulnerability and its potential strength: if beauty companies invested in protecting the ecosystems that generate their ingredients, they would simultaneously protect their supply chains and global biodiversity.',
    threatMatrix: [
      { ecosystem: 'Tropical rainforest', beautyIngredients: 'Cacao butter, palm oil, Brazil nut oil, vanilla, ylang-ylang essential oil', threat: 'Deforestation for agriculture and logging', beautyAction: 'Buy certified deforestation-free palm; support rainforest-sourced ingredients with verified conservation commitments' },
      { ecosystem: 'Cape Floristic Region (fynbos)', beautyIngredients: 'Rooibos, buchu, helichrysum, protea honey, pelargonium', threat: 'Urban expansion, invasive species, climate change', beautyAction: 'Support South African fynbos conservation; buy ABS-compliant rooibos; verify sustainable harvesting of buchu' },
      { ecosystem: 'Argan forest (arganeraie)', beautyIngredients: 'Argan oil', threat: 'Desertification, overgrazing, urbanization', beautyAction: 'Buy cooperative-sourced argan; support tree-planting programs' },
      { ecosystem: 'Ethiopian highlands (Boswellia groves)', beautyIngredients: 'Frankincense, myrrh', threat: 'Over-tapping, invasive beetle, land conversion', beautyAction: 'Reduce frankincense use; buy only from suppliers with documented sustainable tapping protocols' },
      { ecosystem: 'Caribbean coastal marine', beautyIngredients: 'Sea moss, coral-reef-dependent algae, ocean-derived minerals', threat: 'Coral bleaching, tourism development, agricultural runoff', beautyAction: 'Use reef-safe sunscreen; buy farm-grown sea moss; support Caribbean coastal conservation' },
      { ecosystem: 'West African shea parkland', beautyIngredients: 'Shea butter, néré (locust bean), baobab', threat: 'Agricultural conversion, Sahel droughts, fuelwood cutting', beautyAction: 'Buy cooperative shea with agroforestry commitments; support Sahel reforestation programs' },
    ],
    positiveExamples: [
      'Weleda (Switzerland): sources plants from biodynamic farms and protected wild populations; conservation covenants with plant communities',
      'Dr. Bronner\'s: funds regenerative organic agriculture in Sri Lanka (coconut), Ghana (palm), and India (peppermint); invests millions in ecosystem restoration',
      'Lush Cosmetics: funds grassroots conservation through the Lush Spring Prize; prioritizes solid formats to reduce packaging and water use',
      'The Body Shop: Community Trade program for over 20 ingredients; invests in supplier community development',
    ],
  },

  packagingWasteAudit: {
    title: 'The Beauty Packaging Problem: A Community-by-Community Waste Audit',
    overview: 'The global cosmetics industry produces an estimated 120 billion units of packaging annually — most of which ends up in landfill. However, different beauty traditions have very different packaging footprints, and communities with strong traditional beauty practices generate far less packaging waste.',
    comparison: [
      {
        approach: 'Conventional Western mass-market beauty',
        packaging: 'Plastic pumps, spray bottles, non-recyclable multi-layer tubes, blister packs, single-use sachets',
        wastePerPerson: 'High — the average American generates 4.5 lbs of bathroom waste per year, most from beauty packaging',
        recyclability: 'Low — most beauty packaging is too small or contaminated to recycle; pumps and caps are usually non-recyclable',
      },
      {
        approach: 'West African traditional beauty (shea, black soap, neem)',
        packaging: 'Block soap in paper; bulk shea in cloth or paper bag; neem twigs with no packaging',
        wastePerPerson: 'Very low',
        recyclability: 'Paper and cloth are compostable; no plastic',
      },
      {
        approach: 'South Asian traditional Ayurveda (homemade ubtan, oils)',
        packaging: 'Zero packaging when made at home from kitchen staples; bulk oils in glass or stainless steel',
        wastePerPerson: 'Near zero',
        recyclability: 'Glass infinitely recyclable; home-made generates no packaging',
      },
      {
        approach: 'Arab hammam tradition (ghassoul, savon beldi, argan)',
        packaging: 'Ghassoul in paper bag; black soap in bulk; argan in glass dropper',
        wastePerPerson: 'Low',
        recyclability: 'Paper compostable; glass recyclable',
      },
      {
        approach: 'K-beauty 10-step routine',
        packaging: 'Ten separate plastic or glass vessels, many with non-recyclable pumps and mixed materials',
        wastePerPerson: 'High when routine is fully maintained',
        recyclability: 'Mixed — some glass recyclable; plastic pumps rarely recyclable',
      },
    ],
    solutionFramework: [
      'Consolidate: replace multiple single-use products with one multi-use product (oil replaces serum, moisturizer, and makeup remover)',
      'Concentrate: buy concentrated formulas and dilute at home; less water = smaller bottle',
      'Contain: choose glass, aluminum, or stainless steel containers; refuse black plastic (not recyclable in most streams)',
      'Complete: use up every last drop; use spatulas; store upside down; warm to release the last of thick products',
      'Community: participate in beauty brand take-back programs; use shared/public package return points',
    ],
  },

  beautyActivism: {
    title: 'Beauty Activism: From Individual Choices to Systemic Change',
    overview: 'Sustainable beauty is not only a matter of individual purchasing decisions. The structures that make synthetic, plastic-packaged beauty the cheapest and most accessible option require policy change, corporate accountability, and community organizing.',
    levels: [
      {
        level: 'Individual',
        actions: [
          'Audit current beauty products for packaging and ingredient sustainability',
          'Transition gradually to lower-waste alternatives as products run out',
          'Make one or two beauty staples at home',
          'Support Black-owned, Indigenous-owned, and minority-owned natural beauty brands',
          'Talk about sustainable beauty choices with friends and family',
        ],
      },
      {
        level: 'Community',
        actions: [
          'Organize a beauty swap: trade unused products to prevent waste',
          'Start or join a community herb garden that includes beauty plants',
          'Host a DIY beauty workshop using traditional cultural recipes',
          'Support local herbalists, natural soap makers, and zero-waste beauty shops',
          'Advocate for a beauty supply store with refill options in your neighborhood',
        ],
      },
      {
        level: 'Industry',
        actions: [
          'Support brands that publish full ingredient transparency and supply chain maps',
          'Demand that beauty companies disclose their packaging recyclability rates',
          'Support legislation requiring extended producer responsibility for beauty packaging',
          'Advocate for fair pay and land rights for ingredient-source communities',
          'Support the Responsible Beauty Initiative and similar industry coalitions',
        ],
      },
      {
        level: 'Policy',
        actions: [
          'Support plastic reduction legislation (bans on single-use plastic in cosmetics)',
          'Advocate for international ABS agreements for more beauty ingredients beyond rooibos',
          'Support trade policies that benefit small-scale cooperative producers in the Global South',
          'Advocate for climate finance for regions where beauty ingredient crops are threatened',
          'Support legislation restricting mercury and hydroquinone in cosmetics globally',
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL ECO BEAUTY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export const SEASONAL_ECO_BEAUTY_CALENDAR = {
  spring: {
    season: 'Spring',
    theme: 'Renewal, light oils, fresh herbs, lighter routines',
    practices: [
      'Transition from heavy winter butters to lighter oils (jojoba, rosehip, squalane)',
      'Start a balcony or window herb garden: tulsi, rosemary, lavender, calendula',
      'Prepare rosewater for the year during spring rose bloom (May–June)',
      'Begin DIY scrubs with seasonal spring produce (strawberry, lemon)',
      'Plant annuals that will provide summer beauty: sunflowers (petals for oil), marigolds (calendula), cucumbers (eye treatment)',
    ],
    communityFocus: 'Arab rose harvest; South Asian holi season (natural color traditions)',
  },
  summer: {
    season: 'Summer',
    theme: 'Sun protection, cooling plants, harvest and preserve, water conservation',
    practices: [
      'Harvest herbs at peak potency (morning, after dew dries, before flowering)',
      'Make sun-protective face oils (non-nano zinc oxide DIY, or karanja/raspberry seed oil blends)',
      'Brew and freeze green tea or rooibos as antioxidant ice cube facial treatment',
      'Harvest and dry excess garden herbs for winter use',
      'Use waterless cleansing (micellar cotton, cleansing oil) to save water during drought periods',
      'Make summer body oil with seasonal citrus (bergamot, orange peel infused in jojoba)',
    ],
    communityFocus: 'Caribbean summer sea moss harvest; East African summer moringa leaf harvest; Latina nopal harvest',
  },
  autumn: {
    season: 'Autumn',
    theme: 'Richer oils, transition to warming treatments, harvest preservation',
    practices: [
      'Transition to heavier moisturizers: shea, cocoa butter, marula oil',
      'Harvest final herbs and dry or infuse in oil for winter beauty',
      'Make an oil infusion with dried calendula (harvest in summer) in olive or jojoba oil — ready in 4–6 weeks for winter skin',
      'Prepare bulk supply of body butter for winter: shea + coconut + jojoba in wide-mouth glass jar',
      'Collect autumn rose hips for vitamin C-rich face serum',
    ],
    communityFocus: 'West African shea nut collection season; South African fynbos flowering season',
  },
  winter: {
    season: 'Winter',
    theme: 'Protection, warmth, rich butters, slow rituals, indoor herb care',
    practices: [
      'Switch to heavier plant-based oils and butters for deep winter hydration',
      'Enjoy a DIY hammam-style steam facial at home: hot water + neem leaves or lavender in a bowl, face tent with towel',
      'Use honey-based face masks more frequently — humectant properties combat dry indoor heat',
      'Make a warming scalp oil: castor oil + peppermint + rosemary (supports circulation during cold months)',
      'Bring herb plants indoors; maintain tulsi, aloe, and rosemary on sunny windowsills',
      'Use the long evenings for batch-making beauty products to last the season',
    ],
    communityFocus: 'South Asian winter sesame oil season (sesame is warming in Ayurveda); East Asian camellia oil tradition in cold months',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ECO BEAUTY STARTER KITS BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_BEAUTY_STARTER_KITS = {
  'west-african': {
    communityId: 'west-african',
    title: 'West African Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Raw unrefined shea butter (500g block)', use: 'Body moisturizer, hair sealant, lip balm', packaging: 'Paper-wrapped or bulk' },
      { product: 'African black soap (raw block)', use: 'Face and body wash, shampoo', packaging: 'Paper-wrapped' },
      { product: 'Neem oil', use: 'Scalp treatment, acne treatment, insect repellent', packaging: 'Dark glass bottle' },
      { product: 'Baobab oil', use: 'Facial oil, hair oil', packaging: 'Glass dropper' },
      { product: 'Hibiscus powder', use: 'Hair rinse, face mask', packaging: 'Paper bag' },
    ],
    totalPackaging: '1 glass bottle, 1 glass dropper, paper bags and wraps — zero single-use plastic',
    estimatedCost: '$45–75 CAD for a full season of beauty',
    diyRecipe: {
      name: 'West African Body Butter',
      ingredients: '200g shea butter, 50ml baobab oil, optional: 10 drops lavender essential oil',
      method: 'Melt shea in a bowl over hot water; let cool until almost solid; whip with hand mixer until fluffy; fold in baobab oil and essential oil; store in reused glass jar.',
    },
  },
  'south-asian': {
    communityId: 'south-asian',
    title: 'South Asian Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Turmeric powder (organic)', use: 'Face mask, scalp treatment', packaging: 'Paper bag or bulk' },
      { product: 'Chickpea/gram flour (besan)', use: 'Gentle cleanser, ubtan base', packaging: 'Paper or cloth bag' },
      { product: 'Cold-pressed sesame oil', use: 'Body oil (abhyanga), scalp oil', packaging: 'Glass bottle' },
      { product: 'Amla powder', use: 'Hair oil treatment, scalp health', packaging: 'Paper bag' },
      { product: 'Rose water', use: 'Toner, face mist, hair rinse', packaging: 'Glass spray bottle' },
      { product: 'Tulsi plant (living)', use: 'Fresh leaves for steams, toners', packaging: 'No packaging — a living plant' },
    ],
    totalPackaging: '2 glass vessels, paper bags — zero single-use plastic; the living plant is the most sustainable beauty product possible',
    estimatedCost: '$35–55 CAD; most ingredients dual-purpose with kitchen staples',
    diyRecipe: {
      name: 'Classic Ubtan Scrub',
      ingredients: '3 tbsp besan (chickpea flour), 1/2 tsp turmeric, 1 tbsp raw milk or yogurt, 1 tsp rosewater, 1 tsp honey',
      method: 'Mix to paste; apply to face and body; massage gently in circular motions; leave 10 minutes; rinse with warm water. Use weekly.',
    },
  },
  'caribbean': {
    communityId: 'caribbean',
    title: 'Caribbean Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Dried sea moss (whole)', use: 'Gel for hair, skin, and face masks', packaging: 'Paper bag' },
      { product: 'Virgin coconut oil', use: 'Hair oil, skin moisturizer, makeup remover', packaging: 'Glass jar' },
      { product: 'Aloe vera plant (living)', use: 'Fresh gel for skin, hair, burns', packaging: 'No packaging' },
      { product: 'Caribbean black castor oil', use: 'Scalp and hair growth treatment', packaging: 'Glass bottle' },
      { product: 'Raw cane sugar', use: 'Body scrub base', packaging: 'Paper bag' },
    ],
    totalPackaging: '1 glass jar, 1 glass bottle, paper bags, living plant — zero single-use plastic',
    estimatedCost: '$40–60 CAD',
    diyRecipe: {
      name: 'Sea Moss Gel for Hair',
      ingredients: '50g dried sea moss, 2 cups filtered water',
      method: 'Soak sea moss 24 hours in cold water; drain; blend with fresh 2 cups water until silky smooth; refrigerate up to 2 weeks; use a tablespoon as leave-in gel or scalp treatment.',
    },
  },
  'arab': {
    communityId: 'arab',
    title: 'Arab Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Cooperative argan oil', use: 'Facial serum, hair oil', packaging: 'Glass dropper' },
      { product: 'Rose water (bulk glass bottle)', use: 'Toner, face mist, hair rinse', packaging: 'Glass' },
      { product: 'Ghassoul clay', use: 'Facial cleanser, hair mask, body', packaging: 'Paper bag' },
      { product: 'Savon beldi (Moroccan black soap)', use: 'Body wash, hair wash', packaging: 'Bulk / minimal' },
      { product: 'Black seed oil', use: 'Scalp treatment, anti-inflammatory skin care', packaging: 'Dark glass bottle' },
    ],
    totalPackaging: '3 glass vessels, 1 paper bag — zero single-use plastic',
    estimatedCost: '$50–80 CAD; argan oil is the premium item — buy in larger size to reduce cost per ml',
    diyRecipe: {
      name: 'Hammam Facial Ritual',
      ingredients: 'Ghassoul clay (2 tbsp), rose water (enough to form paste), optional: 1 tsp argan oil',
      method: 'Mix ghassoul with rose water until paste forms; apply to face after steam; leave 10 minutes (do not let dry completely); rinse with warm water; follow with a drop of argan oil on damp skin.',
    },
  },
  'latina': {
    communityId: 'latina',
    title: 'Latina Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Nopal (fresh or canned without salt)', use: 'Mucilage gel for skin', packaging: 'Fresh: no packaging; canned: glass jar' },
      { product: 'Avocado (repurposed from food)', use: 'Face and hair mask', packaging: 'No packaging — repurposed food' },
      { product: 'Prickly pear seed oil', use: 'Luxury facial oil', packaging: 'Glass dropper' },
      { product: 'Cocoa butter (raw)', use: 'Body and hair moisturizer', packaging: 'Paper-wrapped block' },
      { product: 'Corn masa flour (masa harina)', use: 'Gentle facial exfoliant', packaging: 'Paper bag' },
    ],
    totalPackaging: '1 glass dropper, paper bags — majority zero-packaging (food repurpose)',
    estimatedCost: '$30–55 CAD; avocado and nopal are kitchen staples',
    diyRecipe: {
      name: 'Nopal Hydrating Skin Gel',
      ingredients: '1 fresh nopal pad (thorn-free), blender, fine sieve',
      method: 'Peel and dice nopal; blend with 1/4 cup water until smooth; strain through sieve to remove fiber; refrigerate the clear mucilaginous gel up to 5 days; apply to face as a hydrating mask or toner base.',
    },
  },
  'east-asian': {
    communityId: 'east-asian',
    title: 'East Asian Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Camellia (tsubaki) oil', use: 'Hair oil, facial oil', packaging: 'Glass dropper' },
      { product: 'Green tea / matcha (culinary grade)', use: 'Face mask, toner, eye compress', packaging: 'Paper tin or bag' },
      { product: 'Rice (for bran and water)', use: 'Rinse water for face and hair; bran as cleanser', packaging: 'Paper bag' },
      { product: 'Sake kasu (sake lees)', use: 'Brightening face mask', packaging: 'Often sold frozen in glass or compostable film' },
      { product: 'Jade roller or gua sha (stone tool)', use: 'Facial massage, lymphatic drainage', packaging: 'Stone lasts decades — zero ongoing packaging' },
    ],
    totalPackaging: '1 glass dropper, paper bags, 1 long-lasting stone tool — minimal ongoing waste',
    estimatedCost: '$50–80 CAD initial; very low ongoing cost (rice and tea from kitchen)',
    diyRecipe: {
      name: 'Fermented Rice Water Toner',
      ingredients: '1/2 cup uncooked rice, 2 cups water',
      method: 'Rinse rice briefly; soak 30 minutes in clean water; drain and reserve water; let rice water sit at room temperature 24–48 hours to ferment slightly (will smell slightly sour); dilute 1:10 with fresh water before using as facial toner; refrigerate remainder up to 1 week.',
    },
  },
  'east-african': {
    communityId: 'east-african',
    title: 'East African Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Moringa powder (organic)', use: 'Face mask, hair mask, nutritive supplement', packaging: 'Paper bag' },
      { product: 'Baobab oil', use: 'Facial oil, body oil', packaging: 'Glass dropper' },
      { product: 'Ethiopian honey (raw)', use: 'Face mask, wound healer, hair mask', packaging: 'Glass jar' },
      { product: 'Teff flour', use: 'Gentle facial cleanser and mask', packaging: 'Paper bag' },
      { product: 'Spent coffee grounds (saved from morning coffee)', use: 'Body exfoliant', packaging: 'No packaging — repurposed waste' },
    ],
    totalPackaging: '1 glass dropper, 1 glass jar, paper bags — zero single-use plastic; coffee grounds generate no additional packaging',
    estimatedCost: '$40–65 CAD; coffee grounds are free (repurposed kitchen waste)',
    diyRecipe: {
      name: 'Moringa and Honey Face Mask',
      ingredients: '1 tsp moringa powder, 1 tsp raw honey, 1 tsp rosewater or plain water',
      method: 'Mix to smooth paste; apply to clean face; leave 15 minutes; rinse with warm water. Use 2x per week for brightening and anti-inflammatory effect.',
    },
  },
  'south-african': {
    communityId: 'south-african',
    title: 'South African Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Rooibos tea (loose leaf)', use: 'Toner, compress, face mask base', packaging: 'Paper bag or tin' },
      { product: 'Marula oil', use: 'Facial oil, hair oil, body oil', packaging: 'Glass dropper' },
      { product: 'Aloe ferox gel', use: 'After-sun, skin soother, hair gel', packaging: 'Glass jar' },
      { product: 'Fynbos honey', use: 'Face mask, antimicrobial treatment', packaging: 'Glass jar' },
      { product: 'Buchu-infused oil (if sustainably sourced)', use: 'Body massage oil, deodorant base', packaging: 'Glass bottle' },
    ],
    totalPackaging: '3 glass vessels, 1 paper bag — zero single-use plastic',
    estimatedCost: '$55–85 CAD; marula oil is premium but a little goes a long way',
    diyRecipe: {
      name: 'Rooibos Antioxidant Face Toner',
      ingredients: '2 rooibos tea bags, 1 cup boiling water, 1 tsp aloe vera gel, optional: 3 drops lavender essential oil',
      method: 'Steep rooibos 10 minutes; cool completely; mix with aloe gel and essential oil; pour into glass spray bottle; refrigerate; use morning and evening after cleansing. Lasts 1 week refrigerated.',
    },
  },
  'black-american': {
    communityId: 'black-american',
    title: 'Black American Eco Beauty Starter Kit',
    coreProducts: [
      { product: 'Jamaican black castor oil (JBCO)', use: 'Scalp oil, edge treatment, eyebrow growth', packaging: 'Glass bottle' },
      { product: 'Raw shea butter (bulk)', use: 'Hair sealant, body butter, lip balm', packaging: 'Paper or cloth bag' },
      { product: 'Apple cider vinegar', use: 'Scalp clarifying rinse, skin toner', packaging: 'Glass bottle' },
      { product: 'Bentonite or kaolin clay', use: 'Deep conditioning hair mask, face mask', packaging: 'Paper bag' },
      { product: 'Rosemary (fresh or dried, or essential oil)', use: 'Scalp rinse for hair growth, toner', packaging: 'Zero (fresh from garden) or small glass bottle (essential oil)' },
    ],
    totalPackaging: '2 glass bottles, paper bags — zero single-use plastic',
    estimatedCost: '$35–55 CAD; most ingredients multi-purpose and long-lasting',
    diyRecipe: {
      name: 'Natural Hair LOC Method (Low-Waste Version)',
      ingredients: 'L: Aloe vera gel or rose water (spray bottle), O: JBCO or coconut oil, C: whipped shea butter',
      method: 'On damp hair after washing: spray liquid (aloe water) to saturate; seal with thin layer of oil (JBCO); apply cream (shea butter) to lock in moisture. All three products from glass or bulk containers — no plastic pumps.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIMATE RESILIENT BEAUTY INGREDIENT RANKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const CLIMATE_RESILIENT_INGREDIENTS = [
  {
    rank: 1,
    ingredient: 'Moringa',
    communityOrigin: 'east-african',
    climateResilience: 'Exceptional',
    reason: 'Thrives in degraded, drought-stressed soils with minimal water. One of the fastest-growing trees. Grows in conditions that will become more widespread under climate change.',
    beautyUse: 'Leaf powder and seed oil for skin and hair',
  },
  {
    rank: 2,
    ingredient: 'Nopal Cactus',
    communityOrigin: 'latina',
    climateResilience: 'Exceptional',
    reason: 'CAM photosynthesis requires 10x less water than conventional crops. Grows in eroded soils. Carbon-sequestering. Drought-proof.',
    beautyUse: 'Mucilage gel as skin hydrator; prickly pear seed oil',
  },
  {
    rank: 3,
    ingredient: 'Aloe Vera',
    communityOrigin: 'caribbean, south-african',
    climateResilience: 'Very High',
    reason: 'Desert-adapted; requires virtually no irrigation once established. Grows in poor soils. Produces gel year-round without harvesting the whole plant.',
    beautyUse: 'Skin soother, hair gel, after-sun treatment',
  },
  {
    rank: 4,
    ingredient: 'Neem',
    communityOrigin: 'west-african, south-asian',
    climateResilience: 'Very High',
    reason: 'Drought-tolerant; grows in degraded soils; nitrogen-fixing; zero inputs required. Has survived thousands of years in hot, semi-arid climates.',
    beautyUse: 'Anti-acne, scalp treatment, dental hygiene',
  },
  {
    rank: 5,
    ingredient: 'Rooibos',
    communityOrigin: 'south-african',
    climateResilience: 'Moderate-High',
    reason: 'Adapted to the fynbos climate; nitrogen-fixing legume. However, its geographic range is very limited — endemic to one small region of Western Cape — making it vulnerable to localized climate shifts.',
    beautyUse: 'Antioxidant toner, anti-inflammatory skin treatment',
  },
  {
    rank: 6,
    ingredient: 'Baobab',
    communityOrigin: 'east-african, south-african, west-african',
    climateResilience: 'Historically High (currently under threat)',
    reason: 'Can store thousands of liters of water in trunk; has survived African droughts for millennia. However, recent unexplained die-offs of ancient baobabs may be climate-related.',
    beautyUse: 'Facial and body oil, anti-aging treatment',
  },
  {
    rank: 7,
    ingredient: 'Hibiscus',
    communityOrigin: 'black-american, caribbean, west-african',
    climateResilience: 'High',
    reason: 'Fast-growing tropical annual; thrives in heat; adapts to a range of conditions. Responds well to warmth that climate change is increasing in subtropical regions.',
    beautyUse: 'Hair growth rinse, face mask, natural dye for dark hair',
  },
  {
    rank: 8,
    ingredient: 'Tulsi (Holy Basil)',
    communityOrigin: 'south-asian',
    climateResilience: 'High',
    reason: 'Adapted to South Asian monsoon-and-drought cycles. Grows well in containers. Fast-growing annual that reseeds itself easily.',
    beautyUse: 'Antibacterial face steam, scalp tonic',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getAllEcoBeautyCommunityIds() {
  return ECO_BEAUTY_COMMUNITY_IDS;
}

export function getIngredientCommunities(ingredientSlug) {
  return ECO_BEAUTY_INGREDIENT_INDEX[ingredientSlug] || [];
}

export function getStarterKit(communityId) {
  return ECO_BEAUTY_STARTER_KITS[communityId] || null;
}

export function getClimateResilientIngredients(limit = 5) {
  return CLIMATE_RESILIENT_INGREDIENTS.slice(0, limit);
}

export function getUniversalPrinciples() {
  return UNIVERSAL_ECO_BEAUTY_PRINCIPLES;
}

export function searchIngredientsByProfile(sustainabilityRating) {
  const results = [];
  for (const [communityId, guide] of Object.entries(ETHNIC_ECO_BEAUTY_GUIDES)) {
    if (guide.keyIngredients) {
      for (const ingredient of guide.keyIngredients) {
        if (
          ingredient.sustainabilityProfile &&
          ingredient.sustainabilityProfile.toLowerCase().includes(sustainabilityRating.toLowerCase())
        ) {
          results.push({
            communityId,
            ingredientName: ingredient.name,
            botanicalName: ingredient.botanicalName,
            sustainabilityProfile: ingredient.sustainabilityProfile,
          });
        }
      }
    }
  }
  return results;
}

export function getCrossTheme(themeKey) {
  return CROSS_COMMUNITY_THEMES[themeKey] || null;
}

export function getSeasonalCalendar(season) {
  return SEASONAL_ECO_BEAUTY_CALENDAR[season?.toLowerCase()] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECO BEAUTY INGREDIENT DEEP DIVES
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_INGREDIENT_DEEP_DIVES = {

  sheaButterDeepDive: {
    ingredient: 'Shea Butter',
    botanicalFamily: 'Sapotaceae',
    geographicOrigin: 'Sub-Saharan Africa, shea belt stretching from Senegal to Uganda',
    harvestCycle: {
      timing: 'Shea nuts fall naturally from June to September across the shea belt',
      collection: 'Women and children collect fallen nuts from the ground — no tools needed, no trees are damaged',
      processing: [
        'Boiling: nuts boiled to stop germination',
        'Drying: sun-dried for 1–4 weeks',
        'Cracking: shells cracked by hand or stone',
        'Roasting: kernels dry-roasted in clay pots over fire',
        'Grinding: roasted kernels ground to paste on stone or electric mill',
        'Churning: paste churned with water until fat separates',
        'Washing: butter washed and re-washed to remove impurities',
        'Boiling: refined by boiling until clear',
        'Cooling: poured into moulds; sets into solid butter',
      ],
      energyUse: 'Traditional processing uses wood or charcoal fire for roasting and boiling only; solar energy for drying. Carbon footprint of traditional shea is minimal per kg of product.',
    },
    gradeSystem: [
      { grade: 'A (Unrefined Raw)', description: 'Ivory to cream colored; nutty scent; highest nutrient retention; no chemicals used', bestFor: 'Hair and body; some find scent too strong for facial use' },
      { grade: 'B (Refined)', description: 'White, odorless; hexane solvent extraction removes scent and color but also some actives', bestFor: 'Products where scent-free is required; lower eco-profile due to solvent use' },
      { grade: 'C (Highly Refined)', description: 'Industrial-grade; heavily processed; loses most beneficial properties', bestFor: 'Industrial applications; not recommended for conscious beauty' },
    ],
    skinBenefits: [
      'Triterpene alcohols (lupeol, butyrospermol): anti-inflammatory, promote collagen synthesis',
      'Oleic acid (40–60%): deeply moisturizing, enhances ingredient absorption',
      'Stearic acid (20–50%): forms protective barrier on skin surface',
      'Vitamin E (tocopherols): antioxidant protection',
      'Allantoin: cell proliferation and wound healing',
      'Phenolic compounds: anti-inflammatory and antibacterial',
    ],
    cooperativeDirectory: [
      { name: 'KAMBAA Women\'s Cooperative', country: 'Burkina Faso', certification: 'Organic, Fair Trade', members: 6000 },
      { name: 'Savannah Fruits Company', country: 'Ghana', certification: 'Fair Trade, hand-processed', members: 10000 },
      { name: 'Alaffia Cooperative', country: 'Togo', certification: 'Fair Trade', members: 'Multiple villages' },
      { name: 'Global Mamas', country: 'Ghana', certification: 'Fair Trade', members: 558 },
    ],
  },

  arganOilDeepDive: {
    ingredient: 'Argan Oil',
    botanicalFamily: 'Sapotaceae',
    geographicOrigin: 'Sous Valley, Anti-Atlas Mountains, and Draa Valley of Morocco; nowhere else on Earth',
    tree: {
      age: 'Argan trees live 150–200 years; some specimens are 400+ years old',
      unescoStatus: 'The Arganeraie Biosphere Reserve was designated by UNESCO in 1998',
      ecosystem: 'Argan woodland (arganeraie) supports high biodiversity including endemic lizards, insects, and migratory birds. Trees prevent desertification by stabilizing soils.',
      mythicRole: 'Goats climbing argan trees to eat fruit are a famous sight; they excrete the nuts, which are collected for processing. Goat-excreted nuts make the traditional process but most commercial production uses mechanically harvested nuts.',
    },
    oilProfile: {
      oleicAcid: '43–49%',
      linoleicAcid: '29–36%',
      vitaminE: 'Highest tocopherol content of any plant oil — up to 620 mg/kg',
      polyphenols: 'High — explains the oil\'s exceptional oxidative stability',
      scent: 'Unroasted (cosmetic grade): light, subtle; Roasted (culinary grade): nutty, rich',
    },
    sustainabilityMechanisms: [
      'No trees are cut for production — argan trees are protected by law in Morocco',
      'Nuts fall naturally or are harvested by hand — no mechanized equipment needed',
      'Cooperative model keeps profits in producing communities',
      'Commercial value of argan gives communities financial incentive to protect the forest from clearing',
      'UNESCO Biosphere Reserve status provides international legal protection',
      'Women cooperatives reinvest profits in schooling, healthcare, and infrastructure',
    ],
  },

  riceWaterHairCare: {
    ingredient: 'Rice Water',
    origins: 'Red Yao women of Huangluo village, Guangxi, China; Japanese geisha beauty traditions; widespread across Southeast and East Asia',
    science: {
      inositol: 'Carbohydrate molecule that penetrates the hair shaft and repairs damage from the inside; particularly notable because inositol remains in hair even after rinsing, providing ongoing protection',
      ferulic acid: 'Antioxidant that protects against UV damage; abundant in rice bran and fermented rice water',
      allantoin: 'Soothing compound that reduces scalp irritation; present in rice water',
      amino acids: 'Trace proteins from the rice grain coat the hair shaft, reducing porosity and improving smoothness',
    },
    fermentationBenefit: 'Fermenting rice water for 24–48 hours at room temperature allows beneficial bacteria to produce additional lactic acid and ferulic acid, lower the pH to match skin (around 4.5–5.5), and break down starches into more bioavailable sugars. The result is more potent and skin-compatible than plain rice water.',
    diyProtocol: {
      plainRiceWater: 'Rinse 1/4 cup rice with clean water; soak in 2 cups clean water 30 min; strain; use within 24 hours',
      fermentedRiceWater: 'Follow plain method; leave at room temperature 24–48 hours (until it smells slightly sour); strain; dilute 1:5 with fresh water before use on hair or skin; refrigerate; use within 1 week',
      application: 'Apply to hair after shampooing as a leave-in treatment or rinse; leave 20–30 min then rinse; use weekly',
    },
    zeroCost: 'Rice water is entirely free — a byproduct of cooking rice, which you are already doing. It represents perhaps the most accessible zero-cost, zero-waste beauty treatment available.',
  },

  coconutComplexUse: {
    ingredient: 'Coconut — Complete Use Guide',
    philosophy: 'The coconut palm is called the "tree of life" across the tropics because every part of it sustains human life. In beauty, the same principle applies: every part of the coconut has a beauty application. If you buy a whole coconut from a grocery store, you have acquired several hundred dollars\' worth of beauty ingredients by market value.',
    fullUseMap: {
      coconutWater: { beautyUse: 'Natural toner: isotonic, rich in cytokinins that may reduce signs of aging; hair rinse for shine and scalp health', application: 'Pour cooled coconut water into a glass spray bottle; spritz on face or hair; no rinsing needed' },
      coconutMilk: { beautyUse: 'Deep conditioning hair mask; bath soak for dry skin; gentle cleanser for sensitive skin', application: 'Apply to dry hair, cover 30 min, rinse; or add 1 cup to warm bath' },
      coconutFlesh: { beautyUse: 'Moisturizing face mask; body treatment', application: 'Blend flesh smooth; apply to face or body; rinse after 15 min' },
      coconutOil: { beautyUse: 'Multi-use: skin moisturizer, hair oil, makeup remover, lip balm, massage oil, oil pulling', application: 'Solid below 24°C; melts on contact with skin; apply thin layer' },
      coconutShell: { beautyUse: 'Storage vessel (halved shell); charcoal ingredient (shell burned to activated charcoal for teeth whitening)', application: 'Sand shell interior smooth for use as mixing bowl; burn shell for DIY charcoal toothpaste' },
      coconutHusk: { beautyUse: 'Coir fiber for natural exfoliating mitt or scrub pad; natural scrubbing material', application: 'Tease apart coconut husk fibers; knot into a scrubbing pad; use for body exfoliation in shower' },
      coconutShellCharcoal: { beautyUse: 'Activated charcoal in DIY charcoal toothpaste; oil-pulling booster; face mask ingredient for pore cleansing', application: 'Mix activated coconut shell charcoal with coconut oil and a pinch of fine sea salt for toothpaste' },
    },
    wasteGenerated: 'When fully used: zero. The fibrous outer husk composts; the inner shell can be repurposed; all liquid and flesh fully used. The only "waste" is the plastic bag it may have come in at the store — shop for loose coconuts to avoid this.',
  },

  moringa360: {
    ingredient: 'Moringa — The 360-Degree Sustainable Beauty Tree',
    whyMoringa: 'Moringa oleifera occupies a unique position in sustainable beauty: it is simultaneously one of the most nutrient-dense plants known to science, one of the most climate-resilient crops, a soil-restorer, a water purifier, and a source of one of the finest beauty oils. It is the poster child for what sustainable beauty can look like in a warming world.',
    nutritionalProfile: {
      vitaminC: '7x more than oranges per gram',
      vitaminA: '4x more than carrots',
      calcium: '4x more than milk',
      potassium: '3x more than bananas',
      protein: 'All 9 essential amino acids — rare for a plant',
      relevance: 'Internally consumed moringa (in tea, food, or supplement) supports skin, hair, and nail health from within — the original inside-out beauty approach',
    },
    beautyOilProfile: {
      name: 'Ben oil (behenic acid oil)',
      behenic acid: '~8%: unusual long-chain fatty acid providing exceptional oxidative stability — moringa oil does not go rancid for years',
      oleic acid: '~70%: deeply moisturizing; similar profile to olive oil but lighter texture',
      palmitic acid: '~6%',
      linoleic acid: '~2%',
      zeatin: 'Plant cytokinin that may delay skin aging; bioactive compound found in few other beauty oils',
    },
    growingMoringa: {
      climate: 'Tropical and subtropical; can be container-grown in warm climates; dies at frost',
      soil: 'Tolerates very poor, sandy, and compacted soils — an advantage over most crops',
      water: 'Drought-tolerant once established; excessive watering is more harmful than drought',
      speed: 'One of the fastest-growing trees — can grow 3 meters in the first year from seed',
      harvest: 'Leaves can be harvested from 2 months after planting; fresh leaves for masks; dried and ground for powder',
      containerGrowing: 'Grows in a large pot on a sunny balcony in warm climates; brings indoors before frost; can be kept small by pruning',
    },
    waterPurification: 'Moringa seeds contain positively charged proteins that bind to negatively charged particles (clay, silt, bacteria) in turbid water, causing them to clump and settle. This natural water purification function means that communities growing moringa for beauty are simultaneously accessing a clean water technology — illustrating the holistic sustainability of this plant.',
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// ECO BEAUTY CERTIFICATIONS GUIDE — DETAILED
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_CERTIFICATIONS_DETAILED = [
  {
    name: 'COSMOS Organic',
    body: 'COSMOS (Cosmetics Organic and Natural Standard)',
    what: 'European standard for organic cosmetics; requires minimum 95% organically produced agro-ingredients; restricts petrochemical ingredients, synthetic fragrances, GMOs, and irradiation',
    logoText: 'COSMOS ORGANIC',
    relevantCommunities: ['south-asian', 'east-asian', 'arab'],
    limitations: 'Water and mineral ingredients are excluded from organic percentage calculation — can inflate the apparent organic content of a product',
  },
  {
    name: 'Fair Trade Certified (Fair Trade USA / Fairtrade International)',
    body: 'Fair Trade USA / Fairtrade International',
    what: 'Ensures minimum prices for farmers, fair wages, safe working conditions, community development funds (10% of product price goes to community-decided projects)',
    logoText: 'FAIR TRADE CERTIFIED',
    relevantCommunities: ['west-african', 'east-african', 'latina', 'caribbean'],
    limitations: 'Does not require organic production; covers social but not always full ecological standards',
  },
  {
    name: 'Rainforest Alliance',
    body: 'Rainforest Alliance',
    what: 'Covers biodiversity conservation, worker rights, community well-being, and farm management. The green frog logo signals farms have been audited against the Rainforest Alliance Sustainable Agriculture Standard.',
    logoText: 'RAINFOREST ALLIANCE CERTIFIED',
    relevantCommunities: ['latina', 'caribbean', 'east-african'],
    limitations: 'Farms can be certified even if they meet only some standards; critics argue the bar is too low for some categories',
  },
  {
    name: 'B Corp Certification',
    body: 'B Lab',
    what: 'Holistic business certification measuring environmental and social performance across five categories: governance, workers, community, environment, customers. Requires legal accountability to all stakeholders, not just shareholders.',
    logoText: 'CERTIFIED B CORPORATION',
    relevantCommunities: ['black-american', 'south-african'],
    limitations: 'Assesses the company\'s practices, not specific ingredients — a B Corp can still use unsustainable ingredients if the overall score qualifies',
  },
  {
    name: 'Global Shea Alliance (GSA) Member',
    body: 'Global Shea Alliance',
    what: 'Membership in the GSA signals that a brand sources from the GSA\'s network of certified cooperative producers in the African shea belt. GSA members commit to fair pricing, sustainable harvesting, and quality standards.',
    logoText: 'GLOBAL SHEA ALLIANCE',
    relevantCommunities: ['west-african', 'black-american'],
    limitations: 'Membership is not the same as third-party verification; brands should be asked about specific cooperatives',
  },
  {
    name: 'Nagoya Protocol ABS Compliance',
    body: 'UN Convention on Biological Diversity',
    what: 'Companies using ingredients derived from indigenous biological resources in source countries that have implemented the Nagoya Protocol must obtain Prior Informed Consent and establish Mutually Agreed Terms for Benefit Sharing.',
    logoText: 'No single logo — compliance is declared',
    relevantCommunities: ['south-african', 'east-african', 'latina'],
    limitations: 'Many companies are unaware of or non-compliant with ABS requirements; no centralized global enforcement',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRADITIONAL BEAUTY RITUALS AS SUSTAINABLE FRAMEWORKS
// ─────────────────────────────────────────────────────────────────────────────

export const TRADITIONAL_RITUAL_SUSTAINABILITY = [
  {
    ritual: 'Hammam (Arab / North African)',
    communityId: 'arab',
    sustainabilityFeatures: [
      'Shared infrastructure: one heat source serves the entire community — inherently energy-efficient',
      'Minimalist product line: ghassoul, savon beldi, kessa mitt, argan oil — four items replace twenty',
      'Reusable tools: kessa mitt washed and reused; copper basins used for decades',
      'Water recirculation: traditional hammams were designed with multi-stage water use — hot for bathing, cooling water for rinsing, tepid runoff channeled to garden irrigation',
      'Social function: hammam is a social gathering space — community building with no additional resource cost',
    ],
    modernLesson: 'The hammam model demonstrates that luxurious, effective beauty care can be resource-efficient when it is designed as a shared community system rather than an individual private ritual.',
  },
  {
    ritual: 'Ayurvedic Abhyanga (South Asian)',
    communityId: 'south-asian',
    sustainabilityFeatures: [
      'Single ingredient (sesame or coconut oil) replaces body lotion, massage oil, and scalp treatment',
      'Self-massage requires no practitioner, no electricity, no device',
      'Warm oil from kitchen practice — no additional appliances',
      'Seasonal adjustment: heavier oils in winter, lighter in summer — natural rotation prevents waste accumulation',
      'Digestive and systemic benefits mean fewer pharmaceutical or supplement purchases',
    ],
    modernLesson: 'A single high-quality plant oil, applied daily in a mindful self-massage ritual, delivers more benefit than a cabinet full of fragmented specialty products.',
  },
  {
    ritual: 'Haldi Ceremony (South Asian)',
    communityId: 'south-asian',
    sustainabilityFeatures: [
      'All food-grade ingredients: turmeric, chickpea flour, milk, rosewater — dual purpose with kitchen',
      'Fresh application: made immediately before use, no preservatives needed',
      'Community practice: family members apply together — social ritual that does not require purchasing anything commercial',
      'Zero packaging: ingredients already in kitchen; no beauty product packaging needed',
      'Biodegradable: all ingredients fully compostable',
    ],
    modernLesson: 'The most meaningful beauty rituals — weddings, celebrations, rites of passage — are sustainable by nature when they use traditional formulations. Modern "luxury" wedding beauty packages often generate significant waste in contrast.',
  },
  {
    ritual: 'Ethiopian Coffee Ceremony Beauty',
    communityId: 'east-african',
    sustainabilityFeatures: [
      'Spent coffee grounds from the three rounds of ceremony coffee repurposed as exfoliant — zero waste',
      'Frankincense burned in ceremony (etan) perfumes the body without synthetic fragrance',
      'Community gathering: beauty and wellness embedded in social ritual, not solitary commercial consumption',
      'Clay coffee ceremony vessels (jebena) are reused indefinitely — no disposable cups',
    ],
    modernLesson: 'The Ethiopian coffee ceremony demonstrates how beauty can be a byproduct of community ritual rather than a separate consumer category — embedding wellness in shared cultural practice.',
  },
  {
    ritual: 'Natural Hair Wash Day (Black American)',
    communityId: 'black-american',
    sustainabilityFeatures: [
      'DIY culture: generations of Black women have made their own hair products, avoiding commercial dependency',
      'Multi-step process encourages intentionality: each product is carefully chosen and applied thoughtfully, not quickly',
      'Community knowledge sharing: techniques passed through families, YouTube tutorials, community salons — preserving knowledge without commercial gatekeeping',
      'Flexible product choices: many wash day routines can be completed with 3–4 multi-use products',
    ],
    modernLesson: 'The natural hair care community\'s deep commitment to product knowledge, DIY recipes, and shared expertise is a model for sustainable beauty culture across all communities — community knowledge as infrastructure.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MICROPLASTICS IN BEAUTY: COMMUNITY IMPACT
// ─────────────────────────────────────────────────────────────────────────────

export const MICROPLASTICS_AND_BEAUTY = {
  overview: 'Microplastics — plastic particles smaller than 5mm — have been detected in every ocean, every freshwater body, in the air, and in human blood. The beauty industry is a significant source: plastic microbeads (now banned in many countries), glitter, and the fragmentation of plastic packaging all contribute. Communities close to water — Caribbean, coastal East African, Pacific Islander — are disproportionately impacted.',

  sourcesInBeauty: [
    { source: 'Exfoliating microbeads (polyethylene)', status: 'Banned in rinse-off products in US, UK, Canada, EU, Australia', alternative: 'Sugar, salt, coffee grounds, jojoba beads (biodegradable), ground walnut shell, apricot kernel powder' },
    { source: 'Glitter in makeup and nail products', status: 'Biodegradable plant-based glitter emerging but conventional glitter remains widespread', alternative: 'Mica (natural mineral; ethical sourcing concerns but not plastic), plant-based cellulose glitter, no-glitter aesthetics' },
    { source: 'Synthetic polymers in foundation, mascara, sunscreen', status: 'Legal but under increasing scrutiny in EU', alternative: 'Polymer-free formulations; mineral-only sunscreens; natural wax-based mascaras' },
    { source: 'Fragmentation of plastic beauty packaging', status: 'Occurs throughout product lifespan and disposal', alternative: 'Glass, aluminum, refillable systems; reducing total plastic packaging volume' },
    { source: 'Synthetic fibers from exfoliating cloths, loofah replacements', status: 'Polyester and nylon cloths shed fibers in every wash', alternative: 'Natural fiber alternatives: cotton muslin, linen, bamboo, natural loofah (luffa sponge), coir coconut fiber' },
  ],

  communityImpact: [
    { community: 'Caribbean', impact: 'Microplastics concentrate in coral reef ecosystems and in the small fish populations that Caribbean communities consume and that support fishing livelihoods; sea moss grows in polluted plastic-laden water near tourist areas' },
    { community: 'East African', impact: 'East African coast and great lakes are receiving increasing microplastic pollution from imported consumer goods; traditional fishing communities impacted by fish consuming plastic particles' },
    { community: 'West African', impact: 'West African coastal cities, particularly Accra and Lagos, have significant plastic waste issues; secondhand clothing and beauty product imports contribute to local plastic pollution' },
  ],

  avoidanceStrategies: [
    'Read INCI ingredient lists: avoid polyethylene (PE), polypropylene (PP), polymethyl methacrylate (PMMA), polyethylene terephthalate (PET) in rinse-off products',
    'Use the Beat the Microbead app to scan product barcodes for microplastic ingredients',
    'Switch exfoliants to physical natural alternatives: sugar, salt, oat flour, coffee grounds',
    'Choose natural fiber face cloths and exfoliating mitts',
    'Avoid biodegradable glitter claims without third-party certification (many are greenwashing)',
    'Reduce overall beauty product use — fewer products means fewer potential plastic exposures',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ECO BEAUTY READING LIST AND RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_BEAUTY_RESOURCES = {

  books: [
    { title: 'The Conscious Closet', author: 'Elizabeth L. Cline', relevance: 'Fashion and beauty industry sustainability overlap; supply chain transparency' },
    { title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', relevance: 'Indigenous plant relationships and reciprocal knowledge — applicable to all beauty herb relationships' },
    { title: 'Ingredients: The Strange Chemistry of What We Put on Our Bodies', author: 'George Zaidan', relevance: 'Science of beauty ingredients; informed consumerism' },
    { title: 'African Beauty Secrets', author: 'Zipporah Gateru', relevance: 'Traditional East and West African beauty knowledge from a Kenyan perspective' },
    { title: 'The Green Beauty Guide', author: 'Julie Gabriel', relevance: 'Practical guide to identifying and replacing harmful beauty ingredients with natural alternatives' },
  ],

  certificationBodies: [
    { name: 'Global Shea Alliance (GSA)', url: 'globalshea.com', focus: 'Shea sourcing standards; West African cooperative certification' },
    { name: 'Soil Association (UK)', url: 'soilassociation.org', focus: 'COSMOS organic certification in UK; sustainable farming standards' },
    { name: 'Ecocert (France)', url: 'ecocert.com', focus: 'Organic and natural cosmetic certification; global reach' },
    { name: 'B Lab', url: 'bcorporation.net', focus: 'B Corp certification for holistic business sustainability' },
    { name: 'Fair Trade USA', url: 'fairtradecertified.org', focus: 'Fair trade certification for beauty ingredient producers' },
  ],

  communityOrganizations: [
    { name: 'African Women in Agribusiness Network', focus: 'Supports women in shea, cocoa, and other agribusiness supply chains across Africa' },
    { name: 'UCFA (Union des Cooperatives Féminines Arganières)', focus: 'Umbrella organization for Moroccan argan cooperatives; advocates for community rights' },
    { name: 'San and Khoikhoi Council (South Africa)', focus: 'Advocates for Indigenous knowledge rights including rooibos ABS agreement benefits' },
    { name: 'Boswellia Conservation Alliance (proposed)', focus: 'Emerging initiative to develop frankincense sustainable harvest standards' },
    { name: 'Caribbean Sea Moss Growers Association', focus: 'Developing standards for sustainable sea moss aquaculture across the Caribbean' },
  ],

  apps: [
    { name: 'Think Dirty', description: 'Ingredient safety scanner; scans product barcodes; rates toxicity of ingredients' },
    { name: 'EWG Skin Deep', description: 'Environmental Working Group database of 87,000+ cosmetic products with safety ratings' },
    { name: 'Beat the Microbead', description: 'Scans products for microplastic ingredients; available in multiple languages' },
    { name: 'Good On You', description: 'Brand ethics rating app covering beauty brands; rates labor, environment, and animal welfare' },
    { name: 'CoProduct', description: 'Tracks packaging recyclability by material and region' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY BEAUTY ECONOMIES — ECONOMICS OF SUSTAINABLE SOURCING
// ─────────────────────────────────────────────────────────────────────────────

export const COMMUNITY_BEAUTY_ECONOMIES = {

  sheaEconomy: {
    title: 'The Shea Economy: Scale, Stakes, and Sovereignty',
    marketSize: 'Global shea market valued at approximately $2.5 billion USD and growing at ~6% annually (2024 estimates)',
    producerIncome: 'A cooperative member in Burkina Faso earning from shea may receive the equivalent of $400–900 USD per year from shea — significant supplementary income in a region where average income is low',
    valueChain: [
      { stage: 'Nut collection', location: 'Sub-Saharan Africa', valueCapture: 'Women collectors; 5–10% of final product value' },
      { stage: 'Processing (traditional)', location: 'Sub-Saharan Africa', valueCapture: 'Women cooperatives; additional 10–15%' },
      { stage: 'Export', location: 'Ports in Ghana, Burkina Faso, Nigeria', valueCapture: 'Export companies; 15–20%' },
      { stage: 'Refining (industrial)', location: 'Europe, North America', valueCapture: 'Industrial processors; 15–20%' },
      { stage: 'Formulation', location: 'Europe, North America', valueCapture: 'Cosmetic manufacturers; 20–30%' },
      { stage: 'Retail', location: 'Global', valueCapture: 'Retailers; 20–40%' },
    ],
    cooperativeDifference: 'When a brand sources from a women\'s cooperative and pays fair prices, a greater percentage of the value stays in the production community. The cooperative also provides collective negotiating power, quality control, and social support systems that individual smallholders lack.',
    consumerAction: 'Paying a premium for cooperative-sourced shea is not charity — it is correctly pricing the labor, expertise, and ecosystem stewardship that women in the shea belt provide. The "cheap" shea in mass-market products transfers wealth from producing communities to multinational corporations.',
  },

  arganCooperativeModel: {
    title: 'The Argan Cooperative Model: Lessons for Sustainable Beauty Economics',
    history: 'Prior to the 1990s, argan oil was produced at subsistence scale by Berber women for local consumption. NGO intervention in the early 1990s organized women into formal cooperatives, enabling collective marketing, fair pricing, and income stability.',
    socialImpact: [
      'Girls\' school enrollment in cooperative communities increased as families could afford school fees',
      'Women\'s decision-making power in households increased with independent income',
      'Child marriage rates declined in cooperative communities',
      'Healthcare access improved as cooperative health funds were established',
      'Tree planting programs expanded as communities recognized economic value of living trees',
    ],
    replication: 'The argan cooperative model has been studied and replicated with shea in West Africa, moringa in East Africa, and sea moss in the Caribbean. It demonstrates that sustainable ingredient sourcing and community development are not competing goals but mutually reinforcing ones.',
  },

  blackBeautyEconomy: {
    title: 'The Black Beauty Economy: From Exploitation to Empowerment',
    historicalExploitation: 'The U.S. beauty industry generated billions selling to Black consumers while largely excluding them as business owners. Black women are 14% of the U.S. female population but represent 22% of beauty spending — and historically only a fraction of 1% of beauty brand ownership.',
    currentShift: [
      'The "15 Percent Pledge" (founded 2020) calls on retailers to dedicate 15% of shelf space to Black-owned brands',
      'Sephora became the first major retailer to commit to the Pledge in 2020',
      'Venture funding for Black beauty brands increased significantly post-2020, though gaps remain large',
      'Black beauty consumers are increasingly directing purchasing toward Black-owned brands',
    ],
    sustainableBlackBeautyIntersection: 'Many Black-owned indie beauty brands founded in the 2010s–2020s built sustainability into their DNA from the start — using natural ingredients, minimal packaging, and ethical sourcing as core values rather than afterthoughts. This cohort represents the intersection of sustainable beauty and economic justice.',
    spendingPower: 'U.S. Black consumers spend an estimated $9 billion annually on beauty products. If even 20% of that shifted to Black-owned sustainable brands, it would fund a transformative wave of businesses combining cultural authenticity, ingredient quality, and ecological responsibility.',
  },

  indigenousBeautyRights: {
    title: 'Indigenous Beauty Rights: Sovereignty Over Plants and Knowledge',
    principle: 'Indigenous and traditional communities that developed beauty knowledge over generations have inherent rights to economic benefit when that knowledge is commercialized. The commercialization of turmeric, neem, argan, rooibos, and sea moss without community consent or benefit sharing is a form of biopiracy.',
    keyCases: [
      {
        case: 'Turmeric patent (US)',
        detail: 'In 1995, the US Patent Office granted a patent for turmeric\'s wound-healing properties to two US researchers. India successfully challenged and revoked the patent in 1997, demonstrating that turmeric\'s uses were documented in ancient Sanskrit texts and were therefore prior art — not novel inventions.',
        lesson: 'Traditional knowledge, even when thousands of years old, is intellectual property that deserves protection and recognition.',
      },
      {
        case: 'Rooibos ABS Agreement (South Africa)',
        detail: 'In 2019, South Africa implemented an ABS agreement for rooibos under the Nagoya Protocol. Khoikhoi and San communities receive a payment per kilogram of exported rooibos, acknowledging their historical role in identifying the plant\'s uses. This has generated millions of rand for indigenous communities.',
        lesson: 'Legal frameworks can be established to compensate communities for their traditional knowledge — but require advocacy, political will, and international support.',
      },
      {
        case: 'Neem — European patent challenge',
        detail: 'In the 1990s and 2000s, European companies obtained multiple patents for neem-derived products. Indian activists, scientists, and the Indian government challenged many of these patents, arguing they were based on traditional Indian uses of neem without acknowledgment or compensation.',
        lesson: 'International patent systems remain biased against traditional knowledge holders; ongoing vigilance and legal challenges are necessary.',
      },
    ],
    consumerResponsibility: [
      'Research whether brands using indigenous plant ingredients have community benefit-sharing agreements',
      'Support brands that partner directly with indigenous communities',
      'Advocate for international implementation of the Nagoya Protocol',
      'Challenge brands that appropriate traditional beauty knowledge in marketing without acknowledging communities of origin',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL EXPORTS CONVENIENCE MAP
// ─────────────────────────────────────────────────────────────────────────────

export const ECO_BEAUTY_MODULE_SUMMARY = {
  version: '1.0.0',
  communities: ECO_BEAUTY_COMMUNITY_IDS,
  totalGuides: 9,
  mainExports: [
    'ETHNIC_ECO_BEAUTY_GUIDES',
    'UNIVERSAL_ECO_BEAUTY_PRINCIPLES',
    'CROSS_COMMUNITY_THEMES',
    'SEASONAL_ECO_BEAUTY_CALENDAR',
    'ECO_BEAUTY_STARTER_KITS',
    'CLIMATE_RESILIENT_INGREDIENTS',
    'ECO_INGREDIENT_DEEP_DIVES',
    'ECO_CERTIFICATIONS_DETAILED',
    'TRADITIONAL_RITUAL_SUSTAINABILITY',
    'MICROPLASTICS_AND_BEAUTY',
    'ECO_BEAUTY_RESOURCES',
    'COMMUNITY_BEAUTY_ECONOMIES',
    'ECO_BEAUTY_INGREDIENT_INDEX',
    'ECO_BEAUTY_GLOSSARY',
  ],
  mainFunctions: [
    'getEcoSustainableBeautyGuide(communityId)',
    'getAllEcoBeautyCommunityIds()',
    'getIngredientCommunities(ingredientSlug)',
    'getStarterKit(communityId)',
    'getClimateResilientIngredients(limit)',
    'getUniversalPrinciples()',
    'searchIngredientsByProfile(sustainabilityRating)',
    'getCrossTheme(themeKey)',
    'getSeasonalCalendar(season)',
  ],
};
