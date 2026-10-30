/**
 * MIRRR — Hair Growth and Hair Loss Guide (Ethnic Focus)
 * Alopecia, telogen effluvium, traction alopecia, and growth for ethnic hair.
 */

export const HAIR_GROWTH_SCIENCE = {
  title: 'The Biology of Hair Growth',
  hairFollicle: {
    
    structure: 'The follicle consists of: bulb (the deepest part; contains the dermal papilla and hair matrix cells); matrix (rapidly dividing cells that produce hair); inner root sheath; outer root sheath; sebaceous gland (opens into the follicular canal); arrector pili muscle (makes hair stand up in cold or fear — goosebumps)',
    papilla: 'The dermal papilla is the control centre of the follicle; it is richly vascularised and innervated; it signals to the matrix cells when to grow, stop, and shed; the papilla contains androgen receptors (sensitivity to DHT drives hair loss in androgenetic alopecia); the size and metabolic activity of the dermal papilla determines hair thickness'
  },
  hairCycle: {
    anagen: {
      name: 'Anagen (Active Growth Phase)',
      
      mechanism: 'Rapid mitotic division of matrix cells in the bulb; cells push upward, differentiate, and keratinise to form the hair shaft; growth rate approximately 0.35mm per day (approximately 6 inches or 15cm per year on average)'
    },
    catagen: {
      name: 'Catagen (Regression Phase)',
      
      mechanism: 'Programmed cell death (apoptosis) in the follicle; the lower follicle involutes; the hair shaft is no longer being produced; the hair club forms (a mass at the base of the hair)'
    },
    telogen: {
      name: 'Telogen (Resting Phase)',
      
      mechanism: 'The follicle is at rest; the club hair (dead hair) remains anchored in the follicle but is ready to shed; normal daily shedding of 50-100 hairs represents telogen hairs being pushed out by the new anagen hair growing beneath them'
    },
    exogen: {
      name: 'Exogen (Shedding Phase)',
      duration: 'Active shedding of the telogen hair; can be separate from or part of the late telogen phase',
      mechanism: 'Proteases break down the anchoring structures of the club hair; it sheds; the follicle enters new anagen'
    }
  },
  normalLoss: '50-100 hairs per day shed is normal; higher counts on wash days (hairs that would have shed during dry days are retained by hair dryness then release together when wet); very curly hair (Type 4) may appear to shed more because shed hairs tangle within the coil rather than falling to the floor; what looks like excessive shedding on wash day may be accumulated normal daily shed'
};

export const HAIR_LOSS_TYPES = {
  androgenetic: {
    name: 'Androgenetic Alopecia (AGA) — Pattern Hair Loss',
    
    mechanism: 'DHT (dihydrotestosterone — converted from testosterone by 5α-reductase enzyme in hair follicles) binds to androgen receptors in the dermal papilla; in genetically susceptible follicles, DHT signalling causes progressive miniaturisation of the follicle; each anagen cycle produces a shorter, finer, lighter hair (vellus); eventually the follicle stops producing terminal hair',
    pattern: {
      male: 'Male pattern: typically begins with bitemporal recession (receding hairline at the temples); progresses to vertex thinning; Hamilton-Norwood scale grades severity I-VII',
      female: 'Female pattern: diffuse thinning over the crown maintaining the frontal hairline (Ludwig scale I-III); less commonly, frontal recession (which looks more like male pattern — may indicate higher androgen levels/PCOS)'
    },
    
    treatment: 'FDA-approved treatments: Minoxidil (topical 2% women, 5% men; OTC; mechanism unclear — likely prolongs anagen; may increase follicle size; also available as oral 0.25-2.5mg/day — off-label but widely used); Finasteride (5α-reductase inhibitor oral; FDA-approved for men only; evidence in post-menopausal women off-label; absolutely contraindicated in pregnancy — causes male foetal genital abnormalities); Spironolactone (anti-androgen; widely used off-label in women for AGA and hormonal acne); PRP (platelet-rich plasma injections — evidence growing); hair transplant'
  },
  telogenEffluvium: {
    name: 'Telogen Effluvium (TE)',
    
    mechanism: 'A disruption to the hair cycle causing a proportion of anagen follicles to prematurely enter telogen; approximately 3 months later, those follicles shed their resting hair simultaneously → visibly excessive hair shedding; the trigger is usually 3 months before the shedding begins — this is why the timing seems puzzling',
    triggers: 'Major triggers of TE: significant physiological stress (surgery, major illness, significant fever, COVID-19); significant nutritional deficiency (iron deficiency anaemia — the most common; zinc deficiency; protein deficiency in crash dieting); thyroid dysfunction (both hyper- and hypothyroidism); significant hormonal change (childbirth — postpartum TE typically begins 2-4 months postpartum and peaks at 3-6 months; stopping combined oral contraceptive pill; starting or stopping certain medications); very significant psychological stress',
    course: 'Acute TE: resolves when the trigger resolves; most cases of postpartum TE resolve completely by 12 months postpartum; chronic TE (>6 months): may indicate ongoing subclinical trigger',
    treatment: 'Treat the underlying trigger; iron supplementation for iron deficiency; thyroid treatment; time (most acute TE is self-limiting); minoxidil can help maintain density during the recovery period; address nutritional status'
  },
  alopeciaAreata: {
    name: 'Alopecia Areata (AA)',
    mechanism: 'An autoimmune condition where T-lymphocytes attack the hair follicle; the follicle is damaged but not destroyed — potential for regrowth when inflammation resolves; classified as: alopecia areata (patchy); alopecia totalis (complete scalp loss); alopecia universalis (total body hair loss)',
    
    ethnicNotes: 'Alopecia areata in darker skin types: exclamation mark hairs (tapered at the root — a diagnostic sign) and black dots may be less visible on dark scalps; dermoscopy by an experienced dermatologist is important for diagnosis; the autoimmune connection means it occurs alongside other autoimmune conditions (thyroid disease, vitiligo, rheumatoid arthritis)'
  },
  tractionAlopecia: {
    name: 'Traction Alopecia (TA)',
    mechanism: 'Hair loss caused by chronic tension on the hair follicles from tight hairstyles; repeated mechanical stress on follicle → inflammation around follicle → damage to follicle → miniaturisation → eventual permanent scarring alopecia if continued long-term',
    pattern: 'Predominantly affects the frontal and temporal hairline (where hair is pulled tightest in braids, weaves, and tight ponytails); fringe sign — small "baby hairs" at the affected hairline that survive because they are too short to be included in the style',
    
    earlyVsLate: {
      early: 'Early TA: reversible; the follicle is damaged but not scarred; removing the tension allows recovery; signs: papules (bumps) at the hairline; small pustules; breakage; scaling',
      late: 'Late TA: irreversible; follicles are replaced by scar tissue; the hairline permanently recedes; treatment options are limited; surgical hair restoration is possible'
    },
    prevention: 'Vary hairstyles to avoid chronic tension in the same direction; avoid leaving braids/weaves in for more than 6-8 weeks; wear styles loose enough to insert a finger between the scalp and style; give the hair "rest days" or weeks between installation of tight styles; treat the scalp if inflammation signs appear (papules, scaling)'
  },
  ccia: {
    name: 'Central Centrifugal Cicatricial Alopecia (CCCA)',
    
    mechanism: 'Premature desquamation (peeling) of the inner root sheath of the hair follicle; inflammation around the follicle; eventual scarring and permanent follicle destruction; starts at the crown and spreads centrifugally outward',
    causes: 'The exact cause is debated; associations with: hair relaxers (sodium hydroxide causes direct cellular damage); hot combs; bacterial infections; possibly genetic susceptibility; some research implicates PADI3 gene mutations; the condition is seen in women who have never used chemical processes, suggesting genetics plays a role beyond just hairstyling practices',
    symptoms: 'Begins with itching, burning, or tenderness at the crown; hair breakage at the crown; progressive thinning that starts at the crown and spreads outward; if seen under dermoscopy: peripilar casts; hair shaft irregularities; fibrosis',
    treatment: 'Cannot reverse scarred follicles; can halt progression with: tetracycline antibiotics (anti-inflammatory, not for infection); topical corticosteroids; minoxidil to maintain remaining follicles; discontinuing any potentially damaging chemical or mechanical practices; early detection and treatment are critical'
  }
};

export const ETHNIC_HAIR_GROWTH_GUIDES = {
  'west-african': {
    community: 'West African',
    hairType: 'Predominantly Type 4 (4A, 4B, 4C) tightly coiled hair; the S-shaped or Z-shaped coil pattern creates structural vulnerability at the bends',
    structuralChallenges: 'Type 4 hair: lower lipid content than straight hair; the coiled structure creates points of mechanical stress at each bend; sebum cannot travel from scalp to tip through the tight coil; inherently more fragile and prone to breakage than straight hair; not necessarily slower growing (growth rate is similar) but retaining length is harder due to breakage',
    growthMythDebunking: 'Type 4 hair grows at the same rate as other hair types (approximately 6 inches per year on average); the appearance of "not growing" is usually breakage from the ends losing length at the same rate as new growth emerges; length retention is the goal, not growing faster',
    lengthRetention: 'Key length retention practices for West African hair: LOC method (Liquid, Oil, Cream — layer moisture then seal); low manipulation styling; protective styles with tension monitoring (avoid tight braids); regular trims (counterintuitive but removes split ends before they travel up the shaft); satin/silk pillowcase or bonnet at night (cotton absorbs moisture and causes friction); deep conditioning weekly',
    commonConditions: 'Scalp concerns: seborrhoeic dermatitis; tinea capitis (fungal — requires oral antifungal); folliculitis; central centrifugal cicatricial alopecia (CCCA) in women; traction alopecia from tight styles',
    oilsForGrowth: 'Castor oil (jamaican black castor oil — widely used in West African hair community; high ricinoleic acid content; anecdotal and some research for hair growth stimulation; prostaglandin effect on follicles proposed); peppermint oil (RCT 2014 showed significant hair growth in a mouse model; diluted in carrier oil as scalp treatment); rosemary oil (2015 RCT showed similar efficacy to minoxidil 2% for AGA at 6 months — diluted in carrier oil as scalp treatment)'
  },
  'south-asian': {
    community: 'South Asian',
    hairType: 'Predominantly Type 1 (straight) to Type 2 (wavy); some Type 3 curl in South Indian and Sri Lankan communities; South Asian hair is often very thick with high density per follicle and large follicle calibre',
    strengthAndLength: 'South Asian hair is structurally strong (round cross-section, intact cuticular layers, natural hydrophilicity); the tradition of oiling and massage contributes to length retention; South Asian hair often grows very long without the significant breakage experienced by curlier hair types',
    ayurvedicHairOils: 'Ayurvedic hair oils are among the most culturally embedded hair traditions globally: amla oil (Indian gooseberry — vitamin C, antioxidants; evidence for reducing premature greying through antioxidant protection of melanocytes; DHT-inhibiting effects proposed); bhringraj oil (Eclipta alba — "king of herbs" in Ayurveda; evidence from rat studies for hair growth; mechanistic evidence for prolonging anagen phase); neem oil (antimicrobial; anti-dandruff; reduces scalp inflammation); brahmi oil (Bacopa monnieri — Ayurvedic nerve tonic; scalp circulation improvement proposed)',
    
    
  },
  caribbean: {
    community: 'Caribbean',
    hairType: 'Caribbean hair types span the full range: Type 1-2 in lighter-skinned communities (Dominican, Cuban, Puerto Rican with European heritage); Type 3 in mixed-heritage communities; Type 4 in Afro-Caribbean communities; the diverse range reflects the genetic complexity of Caribbean populations',
    jamaicanBlackCastorOil: 'JBCO (Jamaican Black Castor Oil) is one of the most culturally specific hair products of the Caribbean — particularly associated with Jamaican beauty traditions; made by roasting, grinding, and extracting oil from castor seeds (producing darker, ashier oil than regular castor oil); high in ricinoleic acid; used for scalp massage, edge definition, and dry hair treatment; the "roasted" process may preserve some additional bioactive compounds vs cold-pressed regular castor oil',
    naturalHairMovement: 'The Caribbean natural hair movement (strongly connected to the broader Black diaspora natural hair movement) reclaims natural hair from the European straight-hair standard; in Caribbean contexts this connects to Rastafarian identity (locs), African heritage pride, and anti-colourism; Caribbean-founded YouTube channels (HairCrush, MahoganyCurls) have been influential in natural hair education',
    commonConditions: 'Traction alopecia from tight styles (cornrows, box braids, weaves); heat damage from blow-dryers and flat irons (particularly relevant in humid Caribbean climates where straightening is culturally practised); chemical relaxer damage; chlorine damage from swimming pools (common in Caribbean communities)'
  },
  arab: {
    community: 'Arab',
    hairType: 'Predominantly Type 1 (straight) to Type 2 (wavy); some Type 3 in North African Arab communities with Berber or Sub-Saharan heritage; Gulf Arab hair is often very thick and dark with strong tensile strength',
    arganOilHair: 'Argan oil is the most culturally embedded Arab (particularly Moroccan) hair oil; produced from the fruit of the endemic Argania spinosa tree; high in oleic acid, linoleic acid, and vitamin E; penetrates the hair shaft; reduces protein loss from chemical and thermal damage; reduces frizz; widely regarded as one of the best natural hair oils for normal-to-curly hair',
    blackSeedForHair: 'Black seed oil (Nigella sativa) is used both internally (immune-modulating; anti-inflammatory) and topically for hair in Arab communities; the thymoquinone in black seed oil may have antifungal activity (relevant to seborrhoeic dermatitis) and some evidence for hair growth stimulation; applied as scalp treatment mixed with a carrier oil',
    hammamHairCare: 'Traditional Arab hammam includes hair care: steaming the hair and scalp (opens cuticle for treatment absorption; softens build-up); applying argan or olive oil hair mask; rinsing with warm water; wrapping in a hot towel; scalp massage during the hammam; this traditional treatment is essentially a hot oil deep conditioning treatment validated by modern hair science',
    commonConditions: 'Gulf Arab hair: dandruff (seborrhoeic dermatitis) worsened by air conditioning that dries the scalp; traction alopecia from tight cultural hairstyles in women; male pattern hair loss (androgenetic alopecia); the dry desert climate and indoor air conditioning create scalp dryness without adequate oil compensation'
  },
  latina: {
    community: 'Latina/Latin American',
    hairType: 'Enormous diversity: Type 1 straight (Mexican and Andean indigenous; European descent Argentine); Type 2 wavy; Type 3 curly (Caribbean Latina; Afro-Latina); Type 4 (Afro-Brazilian, Afro-Dominican; Afro-Puerto Rican); the "curly girl method" has strong adoption among Latina communities with wavy/curly hair',
    telogenEffluvium: 'Postpartum telogen effluvium is extremely common (affects most women); begins 2-4 months postpartum; peaks 3-6 months; typically resolves by 12 months; cultural awareness: "el pelo que se cae despues del parto" is well-known in Latina communities; iron supplementation, protein-rich diet, gentle hair handling, and time are the main management approaches',
    stressHairLoss: 'Stress-related telogen effluvium in Latina immigrant communities: immigration stress, acculturation stress, and discrimination are documented causes of elevated cortisol; cortisol chronically disrupts the hair cycle; stress-related diffuse hair loss is a real and underappreciated dimension of hair health in immigrant Latina communities',
    caseitAAloe: 'Traditional Latina hair remedies: aloe vera (raw aloe gel applied to scalp and hair — anti-inflammatory, scalp soothing, mild proteolytic enzyme papain in some aloe preparations); rosemary rinse (rosemary tea rinsed through hair — see rosemary evidence under West African section); eggs as protein treatment (whole egg protein and fatty acids — a traditional hair mask); onion juice (some evidence for hair growth in alopecia areata from a small study); mayonnaise mask (egg yolk + oil — provides protein and fatty acids; traditional Latina hair treatment)'
  },
  'east-asian': {
    community: 'East Asian',
    hairType: 'Predominantly Type 1 straight to 1C very slightly wavy; East Asian hair has the largest hair shaft diameter of any hair type (80-100μm vs ~60μm for Black hair and ~70μm for European hair); the large shaft and round cross-section make East Asian hair extremely strong; East Asian hair also has the highest natural tensile strength',
    longestHair: 'The Guinness World Record for longest hair is held by Xie Qiuping (China) at 5.627m (18ft 5.5 in); many East Asian women grow extremely long hair due to: long anagen phase (up to 7+ years — longer than most other populations); round strong hair shaft; traditional cultural practices emphasising hair care and length',
    ricewaterTraditional: 'Fermented rice water for hair growth is a tradition traced to the Yao women of Huangluo Village, Guangxi, China — famous for hair that averages 1.4-2m in length; the rice water treatment (soaking rice, fermenting, applying to hair) provides: inositol — a carbohydrate that penetrates the hair shaft and remains after rinsing, reducing surface friction and improving elasticity; ferulic acid; B vitamins; amino acids; the inositol residual effect on hair shaft is documented and explains part of the benefit',
    dandruffPrevention: 'Scalp health maintenance in East Asian hair care: frequent shampooing (daily is common in Japan and Korea — appropriate for straight oily hair types); anti-dandruff actives (zinc pyrithione, selenium sulfide, ketoconazole) for seborrhoeic dermatitis; scalp scalers (exfoliating scalp serums popular in K-beauty market); the Korean "glass scalp" trend mirrors the glass skin trend — a clean, healthy, visible scalp through the hair'
  },
  'east-african': {
    community: 'East African',
    hairType: 'Type 4 (4A, 4B, 4C) tightly coiled for most East African communities (Ethiopian, Eritrean, Ugandan, Kenyan Bantu groups); some Nilotic groups (Masai, Dinka, Nuer) have very fine, delicate tight coils; Somali and coastal Swahili communities may have Type 3-4 range from various ancestry influences',
    butterTradition: 'Ethiopian and Eritrean traditional hair care using clarified butter (tesmi — a spiced clarified butter similar to ghee, or plain clarified butter): used as a pre-shampoo treatment or leave-in; the saturated fat provides occlusive moisture sealing; the practice has been continuous for centuries and is a powerful cultural connector to Ethiopian identity',
    ethiopianHairstyles: 'Traditional Ethiopian/Eritrean hairstyles: chibo (tight cylindrical plait worn horizontally in rows — Habesha bridal style); various plaited styles that are protective; the habesha kemis (traditional white dress) is traditionally worn with a specific hairstyle that reflects ethnic and regional identity; maintaining these styles while supporting hair health requires balanced approach to tension',
    diasporaAccess: 'East African diaspora in Scandinavia, UK, and North America face severe lack of access to appropriate hair products and stylists; major cities have growing Afro hair salons (London, Minneapolis, Toronto) but smaller cities have almost no resources; online communities and African natural hair YouTube creators (increasingly East African-focused) have filled some of this gap',
    ironDeficiency: 'Iron deficiency is prevalent in East African communities (partly from limited red meat access in diaspora on lower income; partly from vegetarian traditions in Ethiopian Orthodox Christianity — extensive fasting periods with no animal products); iron deficiency is one of the most common reversible causes of diffuse hair thinning (telogen effluvium); serum ferritin below 40ng/mL is associated with hair shedding in women even without full anaemia'
  },
  'south-african': {
    community: 'South African',
    hairType: 'Black South African communities: predominantly Type 4 (4A, 4B, 4C); Cape Coloured communities: may be Type 3-4 range from the diverse genetic ancestry; Afrikaner and Anglo-South African: predominantly Type 1-2',
    ccia: 'Central Centrifugal Cicatricial Alopecia (CCCA) is highly prevalent in Black South African women; it is the most common cause of scarring alopecia in this community globally; the PADI3 gene mutation has been identified as a risk factor; South African dermatology research has contributed to the understanding of CCCA; early detection and cessation of potentially causative styling practices are critical',
    umngqusho: 'The growing South African natural hair movement (inspired by the global movement) has deep ties to post-apartheid identity politics: Afros and natural styles were associated with the anti-apartheid Black Consciousness movement; the natural hair movement in South Africa explicitly connects hair to decolonisation and racial identity; brands like Mielle Organics, Cantu, and Shea Moisture (all now internationally available) are widely embraced by South African natural hair communities',
    zuluBeauty: 'Zulu traditional hair care: red ochre (umhlophe — used to dress and colour hair traditionally); hair styling for ceremonies communicates social status; young unmarried women\'s hair styled differently from married women; the isicholo (wide hat made from grass and beads) is traditionally worn by married Zulu women in ceremonial contexts',
    commonConditions: 'CCCA (most prevalent scarring alopecia); traction alopecia from tight styles; telogen effluvium from nutritional deficiencies; tinea capitis in children and adults (fungal scalp infection requiring oral antifungal)'
  },
  'black-american': {
    community: 'Black American',
    hairType: 'Predominantly Type 4 (4A, 4B, 4C) with representation across all curl types due to the African American diaspora\'s diverse genetic heritage; Black American hair is the most researched ethnic hair type in the cosmetic science and dermatology literature',
    naturalHairMovement: 'The Black American natural hair movement has a rich political history: the Afro of the 1960s-70s Black Power era; the chemical relaxer era of the 1980s-2000s; the post-2009 "good hair" documentary (Chris Rock; following a conversation with his daughter about "good hair" — straight European-type hair — vs natural Black hair) and YouTube natural hair creators sparking the modern natural hair movement; the acceptance of natural hair in professional settings (CROWN Act — Creating a Respectful and Open World for Natural Hair — passed in California 2019, now passed in 24 states) remains an ongoing civil rights issue',
    crownAct: 'The CROWN Act: prohibits discrimination based on hair texture and protective hairstyles (locs, twists, braids, Bantu knots, Afros) in workplaces and schools; has passed in 24 US states as of 2024; still pending at the federal level; represents the intersection of hair, race, and civil rights',
    relaxerAndHealth: 'Chemical relaxers (sodium or potassium hydroxide — "lye"; guanidine hydroxide — "no-lye"): permanently straighten hair by breaking the S-S disulfide bonds in the hair\'s protein structure; a 2022 NIH (NIEHS Sister Study) analysis linked frequent use of hair straighteners to a higher risk of uterine cancer; the relaxer transition (transitioning from relaxed to natural hair) requires managing the line of demarcation (where natural meets relaxed — the weakest point) and protecting hair during the process'
  }
};

export function getHairGrowthGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HAIR_GROWTH_GUIDES['west-african'],
    'south-asian': ETHNIC_HAIR_GROWTH_GUIDES['south-asian'],
    caribbean: ETHNIC_HAIR_GROWTH_GUIDES.caribbean,
    arab: ETHNIC_HAIR_GROWTH_GUIDES.arab,
    latina: ETHNIC_HAIR_GROWTH_GUIDES.latina,
    'east-asian': ETHNIC_HAIR_GROWTH_GUIDES['east-asian'],
    'east-african': ETHNIC_HAIR_GROWTH_GUIDES['east-african'],
    'south-african': ETHNIC_HAIR_GROWTH_GUIDES['south-african'],
    'black-american': ETHNIC_HAIR_GROWTH_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

