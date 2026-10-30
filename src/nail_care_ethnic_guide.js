/**
 * MIRRR — Nail Care Guide for Ethnic Communities
 * Nail health, nail art traditions, and ethnic-specific nail care considerations.
 */

export const NAIL_CARE_SCIENCE = {
  title: 'Nail Biology and Health',
  structure: {
    nailPlate: 'The nail plate is composed of approximately 25 layers of dead, keratinised cells (onychocytes); the protein keratin forms the structural backbone; the nail plate is approximately 0.3-0.65mm thick; it is translucent which is why the pink of the underlying nail bed (vascularised living tissue) shows through as the "pink" of a healthy nail',
    nailBed: 'The nail bed is the vascularised skin underlying the nail plate; nail bed colour reflects circulatory and systemic health; pale/white nail beds (leukonychia) can indicate anaemia, liver disease, or malnutrition; blue nail beds indicate cyanosis (reduced oxygen); Terry\'s nails (white with narrow pink band at tip) associated with liver disease; yellow nail syndrome (lymphatic obstruction)',
    nailMatrix: 'The nail matrix is the growth zone at the base of the nail beneath the lunula (the half-moon-shaped white area at the nail base); all new nail cells are produced here; damage to the nail matrix → permanent nail deformity; the speed and quality of nail growth is determined by matrix health; average growth rate: fingernails 3mm/month; toenails 1mm/month; growth is faster in summer (better circulation), in pregnancy (increased circulation and nutrients), and in youth',
    cuticle: 'The cuticle (eponychium) is the thin layer of skin that seals the space between the nail plate and the surrounding skin; it serves as the waterproof, bacterial, and fungal barrier protecting the nail matrix; cutting or aggressively pushing back the cuticle damages this barrier and creates a pathway for bacterial and fungal infections; gentle softening and pushing back is acceptable; cutting is not recommended',
    hyponychium: 'The hyponychium is the skin under the free edge of the nail; it also forms a seal protecting the nail bed from pathogens; disrupting it (as in aggressive cleaning under the nails) can cause onycholysis (nail separation from the nail bed) or infection'
  },
  growth: {
    factors: 'Nail growth is influenced by: age (growth slows with age); nutrition (severe protein deficiency — Beau\'s lines as horizontal ridges); circulation (cold and poor circulation slow growth); hormones (pregnancy and hyperthyroidism accelerate growth); dominant hand (grows slightly faster); health status (chronic illness slows growth)',
    nailsAsHealthDiagnostic: 'Nails as a diagnostic window: Mees\' lines (horizontal white lines) — arsenic poisoning or renal failure; pitting — psoriasis (the most specific nail sign); koilonychia (spoon nails) — iron deficiency anaemia; clubbing — chronic hypoxia (lung or heart disease); yellow-green discolouration — fungal infection (onychomycosis); horizontal ridges — previous illness, nutritional deficiency; nail pitting and separation (onycholysis) in psoriasis is particularly relevant for women of South Asian and Arab heritage where psoriasis is common'
  }
};

export const NAIL_CONDITIONS_ETHNIC = {
  fungalInfection: {
    name: 'Onychomycosis (Fungal Nail Infection)',
    
    ethnicConsiderations: 'Humid climates (Sub-Saharan Africa, South Asia, Caribbean, South-East Asia, Latin America) have higher rates of dermatophyte infections; wearing tight shoes in hot, humid conditions creates the ideal environment (warm, dark, moist) for dermatophyte growth; lack of footwear in some traditional contexts (mosques, Hindu temples, beaches) can increase exposure',
    treatment: 'Topical antifungals (efinaconazole, tavaborole) — effective for mild to moderate infections; oral antifungals (terbinafine 250mg/day for 6-12 weeks is the gold standard; itraconazole) — necessary for severe or widespread infection; complete cure takes 12-18 months even with effective treatment (because the new nail must grow out to replace the infected nail at 1mm/month for toenails); nail lacquer antifungals (ciclopirox) are less effective but useful as preventive after treatment',
    culturalNote: 'In Muslim communities, wudu (ablution) requires wet water to reach the nails; thick, lacquered nails with heavy gel or acrylic may prevent water from reaching the nail; the use of "breathable" halal nail polish is a significant issue in Muslim beauty communities — genuine water permeability of these polishes is debated; some scholars say any nail polish must be removed for wudu; others accept breathable polishes; this practical concern drives significant interest in the Muslim beauty community'
  },
  melanonychia: {
    name: 'Melanonychia (Dark Nail Streaks)',
    description: 'Melanonychia refers to the appearance of longitudinal brown or black streaks (bands) running from the nail base to the tip; caused by melanocytes in the nail matrix producing melanin (unlike white skin where melanocyte activity in the nail matrix is usually inactive)',
    
    warningSign: 'HOWEVER: Subungual melanoma (a rare but serious nail cancer) also presents as a dark nail streak; the rule: any NEW or CHANGING dark streak (particularly one that: is getting wider; extends into the skin fold beside the nail/periungual; has irregular borders or multiple colours; appears in a middle-aged or older person without a history of melanonychia) should be evaluated by a dermatologist; the ABCDE rule for nails: A — age 20-90; B — brown to black; C — change in colour or diameter; D — digit (thumb, index finger, and great toenail are highest risk); E — extension to nail fold (Hutchinson\'s sign)',
    differentialDiagnosis: 'Causes of dark nail streaks: normal ethnic variation (most common by far in dark-skinned individuals); trauma (blood under the nail — usually resolves as nail grows out); medication side effects (hydroxychloroquine, chemotherapy, AZT); systemic diseases (Addison\'s disease, HIV); nail fungal infections (rare cause of darkening); subungual naevus (melanocyte lesion — benign); subungual melanoma (rare but must be excluded in new, changing, or concerning lesions)'
  },
  psoriasisNails: {
    name: 'Nail Psoriasis',
    
    signs: 'Pitting (small depressions in the nail plate — the most specific sign; from psoriatic involvement of the proximal nail matrix); onycholysis (nail separation from the nail bed — oil drop sign — amber-coloured area visible under the nail; from distal nail matrix/nail bed involvement); subungual hyperkeratosis (build-up of skin under the nail from nail bed involvement); leukonychia (white patches); splinter haemorrhages'
  }
};

export const NAIL_ART_TRADITIONS = {
  henna: {
    tradition: 'Henna (Lawsonia inermis — mehndi) nail application',
    communities: 'South Asian, Arab, North African, East African, West African',
    method: 'Henna paste is applied to the nails and allowed to develop for several hours; the longer the contact time and the higher the quality of the henna, the deeper the stain; henna stains the keratin of the nail plate orange-brown to deep mahogany; the colour deepens on nails compared to skin due to the greater keratin content',
    significance: 'Henna nails are applied for all major celebrations: Eid (Muslim communities globally); Diwali and Karva Chauth (Hindu South Asian communities); weddings across South Asian, Arab, North African, and Sub-Saharan African communities; the application of henna to hands (including nails) by family members or a professional mehndi artist is one of the most globally widespread beauty ceremonies',
    warning: 'BLACK HENNA ON NAILS: "Black henna" nail dye may contain PPD (para-phenylenediamine); PPD application to nails and surrounding skin can cause severe allergic contact dermatitis; sensitisation to PPD also prevents future use of any permanent hair dye (which contains PPD); this is the same warning as for black henna skin application; natural henna is always orange-brown, NEVER jet black'
  },
  koelNails: {
    tradition: 'Traditional kohl/kajal nail application',
    communities: 'Some Middle Eastern and South Asian communities',
    method: 'In some traditional contexts, kohl or dark pigments have been applied to fingertips and nails as decorative traditions during celebrations',
    modernVersion: 'This tradition connects to the modern aesthetic of very dark nail colours (black, deep navy, deep plum) which are increasingly mainstream in global beauty but have specific roots in Middle Eastern and South Asian traditional aesthetics'
  },
  nailBinding: {
    tradition: 'Prolonged nail growth as beauty and status symbol',
    communities: 'Historical: Chinese imperial court tradition; some South Asian royal court traditions; modern manifestation in long artificial nails in many Black American and Caribbean communities',
    historical: 'In the Chinese imperial court, the Empress and high-ranking women grew very long nails (sometimes several inches) as a symbol of their social status — people who had to do manual work could not grow very long nails; they used elaborate gold and jewelled nail guards to protect the nails; the practice continued into the Qing dynasty and is depicted in many historical artworks',
    modern: 'Long artificial nails (acrylic, gel) have become a significant cultural aesthetic in Black American, Caribbean, Latina, and West African diasporic communities; highly decorative long nails (with 3D art, jewels, rhinestones, elaborate painted designs) are an art form; the "nail tech" as beauty artist is a culturally significant professional role in these communities'
  }
};

export const GEL_ACRYLIC_SAFETY = {
  title: 'Gel and Acrylic Nail Safety',
  gel: {
    description: 'Gel nails: a gel polymer is applied to the nail and cured (hardened) by UV or LED light; gel nails last 2-3 weeks and are more flexible than acrylic',
    risks: {
      
      HEMA: 'HEMA (hydroxyethyl methacrylate) and related acrylates in gel products: HEMA is a common sensitiser — repeated contact without gloves can cause HEMA allergic contact dermatitis; this is a particular risk for nail technicians; once sensitised to HEMA, the person cannot safely have future gel nails or other acrylate-containing dental and medical products',
      removal: 'Gel removal: acetone soaking is the standard method; acetone is a severe dehydrant; it removes both the gel and the lipids from the nail plate and surrounding skin; proper technique (cotton acetone wrapped under foil for 10-15 minutes rather than prolonged soaking or filing/scraping) minimises but does not eliminate nail damage'
    },
    safety: 'For melanin-rich skin: UV lamps do not affect the nail plate colour; gel is colour-safe for all skin tones; the UV lamp concern is for the skin around the nail'
  },
  acrylic: {
    description: 'Acrylic nails: a liquid monomer (usually ethyl methacrylate — EMA) and polymer powder are mixed to create a hard, durable nail extension; acrylic is the most durable and longest-lasting nail enhancement method',
    risks: {
      MMA: 'MMA (methyl methacrylate monomer) liquid is banned for nail use in many US states and the FDA has warned against it, due to its severe risks: excessively hard acrylics that do not break on impact (causing nail avulsion injury); inhalation toxicity; skin sensitisation; however, MMA products still circulate in some professional and DIY contexts; MMA-based products are cheap and may be used in discount nail salons; EMA-based products are the safe professional standard',
      
      infection: 'The space between an acrylic or gel nail and the natural nail is a warm, moist environment ideal for bacterial (particularly Pseudomonas, which causes the characteristic "green nail" — a green stain from pyocyanin and pyoverdine pigments) and fungal growth; proper prep, application, and infill technique minimise the risk; any lifting between the natural nail and the enhancement should be addressed promptly rather than ignored'
    }
  },
  pressOn: {
    safety: 'Press-on nails: no chemical exposure; no UV; affordable; increasingly high quality with gel-finish options; attach with nail glue or adhesive tabs; the safest enhancement option for infrequent use; the adhesive tabs are the safest (no harsh removal required); nail glue removal should use acetone carefully'
  }
};

export const ETHNIC_NAIL_GUIDES = {
  'west-african': {
    community: 'West African',
    nailTraditions: 'West African nail culture spans traditional and contemporary aesthetics: henna nail application for celebrations (particularly in Sahelian West Africa — Mali, Niger, Senegal, Nigeria — where henna culture is strong from Arabic-Islamic influence); elaborate artificial nail art in West African diaspora communities (particularly Yoruba diaspora in Lagos, London, and New York where long, decorated nails are a significant fashion statement)',
    melanonychia: 'Longitudinal melanonychia (dark streaks in the nails) is extremely common and completely normal in West African women; it requires no treatment and no concern unless a streak is new, changing, or expanding into the surrounding skin; West African women should not be alarmed by nail streaks and should educate themselves on the warning signs of the rare nail cancer that can mimic them',
    commonConditions: 'Higher humidity and heat in West Africa and diaspora communities → higher rates of dermatophyte nail fungal infections; proper foot hygiene and shoe breathability are important preventive factors; the custom of removing shoes at the entrance to mosques and some homes increases communal exposure to dermatophytes on tiled floors',
    culturalBeauty: 'The Afro-nail art aesthetic in West African diaspora communities — particularly in cities like Lagos, Accra, Abuja — features long lengths, dramatic 3D elements, African print-inspired designs, intricate geometric patterns drawn from traditional West African textile and art traditions (Kente, Adinkra, Ankara); this is an art form as much as a beauty treatment',
    recommendations: 'Shea butter cuticle care (apply daily; shea butter is an ideal cuticle oil substitute — rich in vitamins A and E and fatty acids); jojoba oil for nail plate hydration; ensure nail technician uses EMA-based (not MMA-based) acrylic products; check for and promptly treat any fungal nail infection'
  },
  'south-asian': {
    community: 'South Asian',
    mehndiTradition: 'Mehndi (henna) on hands and nails is central to South Asian celebration culture: the mehendi ceremony the night before the wedding (mendhi wali raat) is one of the most joyful pre-wedding celebrations in Desi culture; the henna applied to the hands extends to the fingertips and nails; the depth of colour achieved on the nails is often deeper than on the skin; South Asian henna designs are characteristically intricate with fine line work, floral motifs, paisleys, and geometric patterns',
    nailAndAyurveda: 'Ayurvedic nail health approach: the state of nails is considered a reflection of the doshas (constitutional types) and overall health in Ayurveda; dry, brittle nails indicate Vata imbalance; soft, pale nails indicate Pitta or Kapha imbalance; Ayurvedic remedies include: massaging warm sesame oil into nails and cuticles (sesame oil is Vata-balancing); eating almond, walnut, and sesame seeds for nail-strengthening nutrients; triphala powder as a digestive tonic affecting nail quality; bhringraj oil applied to nails and cuticles',
    wuduConsideration: 'For South Asian Muslim women: the intersection of nail polish and wudu (ablution) is a significant practical concern; most scholars agree that standard nail polish prevents water from reaching the nail (invalidating wudu); water-permeable "breathable" halal nail polishes exist but their genuine permeability is debated; some women remove nail polish for wudu; others use breathable polishes and accept the debate',
    recommendations: 'Warm sesame or coconut oil daily cuticle and nail massage; mehndi application for celebrations with natural (orange-brown) henna only — no black henna; regular filing in one direction only (not sawing back and forth — damages nail plate layers); biotin-rich foods (dals, nuts, eggs) for nail strength'
  },
  caribbean: {
    community: 'Caribbean',
    nailCulture: 'Nail art is a major cultural aesthetic in Caribbean communities — particularly in the Caribbean diaspora in the UK (notably in London where Black British nail art culture is globally influential), New York, Toronto, and South Florida; long acrylic or gel nails with intricate designs, ombre, chrome, and elaborate 3D art are mainstream',
    carnival: 'Carnival-coordinated nail art: Trinidad and Tobago Carnival, Barbados Crop Over, and London Notting Hill Carnival all inspire elaborate nail art that matches or complements the elaborate masquerade costuming; "costume nails" — nail art specifically designed to complement the Carnival costume — is a Caribbean diasporic beauty tradition',
    naturalRemedies: 'Caribbean natural nail care traditions: coconut oil as a cuticle and nail treatment (widely available; effective occlusive); lime juice as a nail whitening treatment (CAUTION: prolonged lime juice contact can dehydrate the nail plate; rinse off and apply oil after); aloe vera gel for cuticle softening and nail bed moisturisation',
    melanonychia: 'As with West African women, melanonychia (dark nail streaks) is completely normal and common in Caribbean women of African descent; no treatment needed; awareness of warning signs for the rare nail cancer',
    humidity: 'High humidity in the Caribbean → fungal nail infections are common; breathable footwear, keeping nails dry, and regular nail hygiene are important'
  },
  arab: {
    community: 'Arab',
    nailAndHalal: 'The halal nail polish debate is most prominent in Arab Muslim communities: conventional nail polish creates a waterproof film that prevents water penetration to the nail plate, which Islamic scholars generally consider to invalidate wudu (ablution before prayer); water-permeable "breathable" halal nail polishes are marketed to Muslim women; the scientific evidence for genuine permeability sufficient to satisfy the conditions of wudu is debated; practical solutions adopted by Arab Muslim women include: removing polish for wudu; using breathable polishes; going polish-free; applying polish only between menstruation (when prayer is not performed)',
    hennaNails: 'Henna nails in Arab communities: applying henna paste to the nails is a tradition at Eid, weddings, and other celebrations across the Arab world; in Gulf Arab communities (UAE, Saudi Arabia, Kuwait, Qatar), henna is applied in Gulf-style patterns characterised by bold geometric designs contrasting with the South Asian floral intricate style; henna on nails for Muslim women is particularly elegant because it washes off from skin (not a barrier) and there is no question about prayer validity',
    nailAndOil: 'Argan oil (from Morocco — Amazigh tradition) is used in North African Arab communities for nail and cuticle care: applied nightly to nails and cuticles; argan oil is rich in vitamin E (8000mg/100g), oleic acid (43-49%), linoleic acid (29-36%), and squalene — an excellent nail and cuticle nourishment oil',
    professionalism: 'In many Gulf Arab women\'s professional and social contexts, well-groomed nails are expected; nude, French, and conservative nail colours are preferred for conservative professional and family contexts; elaborate nail art is reserved for private celebrations; this context-appropriateness is a cultural norm',
    recommendations: 'Argan oil nightly nail and cuticle massage; natural henna for celebrations (traditional and prayer-compatible); halal breathable polish for daily wear if desired; keep nails clean and well-shaped as a standard of personal presentation'
  },
  latina: {
    community: 'Latina',
    nailCulture: 'Nail care is a significant part of Latina beauty culture: well-manicured nails are considered a standard of personal presentation in many Latin American communities; the nail salon is a regular beauty appointment alongside hair and makeup; "having your nails done" is not a luxury but an expected personal care standard',
    colours: 'Latina nail aesthetics traditionally favour: bold red (a classic forever; deeply connected to Latina passionate aesthetic); hot pink and bright fuchsia; terracotta and warm earth tones (connecting to Latin American ceramic and textile traditions); chrome and metallic gold (reflecting Spanish colonial gold aesthetic and festival culture)',
    abuelaNailWisdom: 'Abuela nail remedies: olive oil (European Latina heritage — apply warm olive oil to nails weekly for strengthening); avocado oil (Mexican tradition — rich in oleic acid and vitamin E; excellent nail oil); lemon juice and salt (traditional nail whitening scrub; use briefly then rinse and moisturise); aloe vera gel from the plant for cuticle softening',
    quinceañera: 'Quinceañera nail art: the nails are a significant detail in the quinceañera presentation; typically a French manicure or soft pink/nude for traditional styles; increasingly elaborate designs for modern quinceañeras',
    recommendations: 'Avocado or olive oil cuticle treatment nightly; bold classic red nail for cultural confidence; maintain length that allows dexterity (the practical test for the right length); proper nail file technique (file in one direction only); biotin from avocado, eggs, and nuts for nail growth and strength'
  },
  'east-asian': {
    community: 'East Asian',
    
    koreanNailTrends: 'Korean nail trends that have achieved global adoption: "glass nails" (extremely shiny, chrome, translucent-looking nails that appear to be made of glass — achieved with iridescent or chrome powders); jelly nails (sheer, translucent, "jelly" appearance using gel); "milk" or "butter" nails (very pale, milky white or neutral tones that give a sophisticated minimalist look); aura nails (gradient, holographic); Korean nail culture values technical innovation, precision, and skin-flattering aesthetics',
    
    imperialLegacy: 'The Chinese imperial long nail tradition (discussed above) is the historical antecedent of the modern long nail aesthetic that is now global beauty.',
    nailHealthObsession: 'The K-beauty approach to nail health: just as K-beauty emphasises skin health as the foundation of beauty, the K-nail approach emphasises natural nail health; nail strengtheners; base coats; regular cuticle oil application; treating natural nails with care rather than masking damage with heavy acrylics',
    recommendations: 'Daily cuticle oil application (jojoba oil; camellia oil; rice bran oil — East Asian beauty ingredient); glass nail chrome powder for the K-beauty trend; gentle nail strengthener base coat; proper removal with acetone rather than peeling (peeling gel nails removes the top layers of the natural nail plate causing thinning and surface damage); rice water soak for nails (connects to East Asian rice beauty tradition)'
  },
  'east-african': {
    community: 'East African',
    hennaTradition: 'Henna nail application is practised in East African communities with Muslim populations (Somalia, Djibouti, Eritrea, and the significant Muslim communities of Ethiopia and Kenya); Somali henna designs on hands include nail application; the henna tradition provides an Islamic-compatible nail colour option',
    kohl: 'Some traditional East African communities use kohl-derived dark pigments for nail decoration in celebratory contexts; this is less common than henna but represents a distinctly East African cosmetic tradition',
    naturalCare: 'East African natural nail care: sesame oil (simsum in Somali and Amharic contexts) for nail and cuticle nourishment; frankincense oil (from the Boswellia papyrifera trees of Ethiopia and Somalia) as an antimicrobial nail treatment; the antimicrobial properties of boswellic acids may provide some preventive effect against nail fungal infections',
    urbanTrends: 'In urban East African capitals (Nairobi, Addis Ababa, Dar es Salaam, Mogadishu), nail salons and nail art culture mirror global trends; Korean and American nail art influences are significant in the young professional class',
    recommendations: 'Frankincense oil for nail cuticle antimicrobial care; sesame oil for nail plate nourishment; natural henna for celebrations; breathable footwear for fungal infection prevention in humid climates; meladine or similar anti-melanonychia awareness (dark streaks are normal — know the warning signs)'
  },
  'south-african': {
    community: 'South African',
    beadworkNails: 'South African Ndebele and Zulu beadwork is one of the most distinctive visual aesthetics in the world: bold geometric patterns in bright primary colours; this aesthetic is directly relevant to nail art; many South African nail artists create Ndebele-inspired geometric nail designs that translate this art tradition to the nail canvas; this is cultural art on a miniature scale',
    rooibosNails: 'Rooibos tea for nail care: rooibos strong tea as a nail soak (5 minutes in strong cooled rooibos tea) provides antioxidant flavonoids to the nail; rooibos extract is beginning to appear in nail care products; the South African botanical heritage applied to nail care',
    marulaNails: 'Marula oil (from Sclerocarya birrea — indigenous to sub-Saharan Africa including South Africa) for nail and cuticle care: high oleic acid (78%) content; vitamin C (skin around the nail); antioxidant; marula oil is particularly effective as a cuticle oil — it absorbs quickly and deeply nourishes without feeling heavy',
    diversity: 'The diverse South African beauty landscape means nail aesthetics span everything from the bold geometric Ndebele-inspired designs to French manicure and minimalist gel aesthetics; there is no single South African nail aesthetic but the African-inspired geometric and colourful nail art is distinctively South African',
    recommendations: 'Marula oil as a luxury South African cuticle oil (apply daily to cuticles and nails); Ndebele-inspired geometric nail art as cultural celebration; rooibos soak as a nail treatment ritual; consistent hydration of the nail and surrounding skin (South African winter can be very dry, causing nail brittleness)'
  },
  'black-american': {
    community: 'Black American',
    nailArtCulture: 'Nail art in Black American communities is one of the most artistically sophisticated and culturally specific beauty practices: long nails as a cultural aesthetic (long acrylics became associated with Black American urban aesthetic in the 1990s and remain a signature); elaborate designs including airbrushed art, 3D elements, custom hand-painted scenes, rhinestones, and sculptural elements; the "nail tech" as a skilled artist and community professional',
    tuskegeeNails: 'The history of long nails in Black American beauty is connected to self-expression and cultural identity in contexts where natural hair and other Black beauty aesthetics were suppressed; elaborate nails became a space for self-expression when other avenues were limited',
    melanonychia: 'As with all dark-skinned communities, longitudinal melanonychia (dark streaks in the nail) is completely normal and extremely common in Black American women; the cultural awareness that it is normal prevents unnecessary distress and unnecessary unnecessary cosmetic treatment; however, awareness of when it becomes a concern (new streak; growing streak; streak spreading to the surrounding skin) is the important health literacy',
    independence: 'Black nail tech community: the nail salon industry in the US has historically been dominated by Vietnamese-American nail technicians; there is a growing "Black nail tech" movement of Black American nail artists who bring specific expertise in long nails, elaborate designs, and care for deep complexion clients who may have specific concerns (melanonychia; dark pigmentation around the nails); supporting Black nail techs is both a community economic choice and a practical one for clients with specific knowledge needs',
    recommendations: 'EMA-based acrylics (never MMA); long nails with proper structural support (apex — the highest point of the nail should be at the correct location to prevent breakage); cuticle oil daily (jojoba, vitamin E); Shea butter for hands and nails after washing; prompt treatment of any greenish nail (likely Pseudomonas requiring antibiotic treatment); SPF on hands for PIH prevention (the knuckles of dark-skinned individuals may develop hyperpigmentation from UV exposure)'
  }
};

export function getNailCareGuide(communityId) {
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

