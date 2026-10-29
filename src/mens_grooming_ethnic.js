/**
 * MIRRR — Men's Grooming for Ethnic Communities
 * Skincare, beard care, hair grooming, and grooming traditions
 * across all 9 ethnic communities.
 */

export const MENS_SKIN_BASICS = {
  title: 'Men\'s Skin Biology and Basic Care',
  biology: {
    thickness: 'Men\'s skin is approximately 25% thicker than women\'s skin due to higher androgen (testosterone) levels; testosterone stimulates collagen production (men\'s skin retains collagen density for longer than women\'s, which is why the visible signs of ageing in men tend to appear later but then progress more rapidly); thicker skin means some treatment products work differently on men',
    sebum: 'Men produce significantly more sebum than women due to androgens; sebaceous glands in men are larger and more active; this contributes to: more oiliness; more frequent acne (particularly in teen years and into the 20s); larger visible pores; potentially greater tolerance for some actives without dryness',
    collagen: 'Men\'s skin contains more collagen than women\'s same-age skin for most of adulthood; however, men\'s collagen loss is more linear with age (women\'s accelerates dramatically at menopause); men who use SPF and basic skincare maintain their collagen density advantage into old age',
    beard: 'Men with facial hair have a physical exfoliation barrier (beard hair) on much of the face; beard hairs are anchored in large follicles that require different care from scalp or eyebrow hair; ingrown hairs (pseudofolliculitis barbae) are a major concern for men with coily beard hair'
  },
  basics: {
    cleanser: 'A gentle face wash appropriate for skin type is the single most important grooming product; many men overwash with harsh soap or body wash on the face, disrupting the skin barrier; for oily/acne skin: salicylic acid or niacinamide cleanser; for dry or sensitive skin: cream or gel cleanser with no surfactant stripping',
    moisturiser: 'Moisturiser after cleansing; men\'s skin, despite higher sebum, still needs hydration (sebum is not the same as water-based hydration); lighter gel moisturisers for oily skin; cream moisturisers for dry skin; many men prefer moisturisers with SPF for a one-step morning routine',
    SPF: 'Sunscreen is the most skipped grooming step by men globally; skin cancer rates are higher in men than women, partly due to chronic lower SPF use; men are less likely to see a dermatologist; SPF 30+ daily is the single most evidence-backed skincare product for any gender',
    shaving: 'For men who shave: proper shaving technique dramatically reduces razor burn, ingrown hairs, and irritation; the shaving prep (softening the beard with warm water or a pre-shave oil) is as important as the razor and shaving cream'
  }
};

export const BEARD_GUIDE = {
  title: 'Beard Care — The Complete Guide',
  biology: {
    growth: 'Beard hair grows approximately 0.5 inches (1.27 cm) per month; influenced by genetics, testosterone levels, nutrition, and age; beard growth potential is largely determined by genetics (androgen receptor sensitivity) and varies enormously by individual and by ethnic background',
    ethnicGrowth: {
      dense: 'Mediterranean, Middle Eastern, South Asian, and some Latin American men tend to have the densest beard growth capability; genetic androgen receptor sensitivity in these populations often produces fuller beards',
      lighter: 'Many East Asian men (particularly Korean, Japanese, Chinese) have naturally lighter beard growth; this is not a deficiency — different androgen receptor expression; some East Asian men can grow full beards while others have minimal growth',
      coily: 'West African, East African, and Black American men have coily beard hair that follows the same curl pattern as scalp hair; coily beard hair requires different care and is significantly more prone to pseudofolliculitis barbae (PFB/razor bumps)'
    },
    lifecycle: 'Like scalp hair, beard hair has anagen (growth), catagen (transition), and telogen (resting/shedding) phases; beard hair phases are shorter than scalp hair, which is why beard hair doesn\'t grow as long as scalp hair without deliberate growth'
  },
  beardCare: {
    washing: 'Beard should be washed 2-4 times per week (not daily with harsh shampoo); the skin under the beard needs care too — sebum, dead skin cells, and product buildup accumulate; a gentle beard wash or facial cleanser works better than regular shampoo (which can be too harsh for facial skin)',
    conditioning: 'Beard conditioner or beard oil used after washing keeps beard hair soft and moisturised; reduces beard itch (particularly during the early growth phase when new beard hairs can scratch the skin and surrounding skin areas)',
    oil: {
      what: 'Beard oil is the cornerstone of beard grooming; typically contains carrier oils (jojoba, argan, sweet almond, grapeseed, vitamin E) with optional essential oils for fragrance; primarily conditions the beard hair and the skin underneath; reduces beard dandruff (seborrhoeic dermatitis under beard)',
      application: 'Applied to a slightly damp beard after washing; warm a few drops in the palm; work through the beard from skin to ends; follow with a beard comb or brush to distribute evenly',
      popular: 'Jack Black Beard Oil; Baxter of California Beard Oil; Scotch Porter Beard Oil; Bossman Jelly Beard Oil; many independent Black-owned grooming brands'
    },
    balm: 'Beard balm contains similar ingredients to beard oil plus waxes (beeswax, shea butter) for hold and styling; more styling control than beard oil; particularly useful for longer or fuller beards where shape maintenance is important',
    brush: 'Boar bristle beard brushes distribute oil through the beard and exfoliate the skin underneath; particularly useful for longer beards; for shorter coily beards, a soft-bristle brush or beard comb with appropriate tooth spacing for coily beard texture'
  },
  pseudofolliculitis: {
    what: 'Pseudofolliculitis barbae (PFB), commonly called "razor bumps" or "shaving bumps," occurs when shaved or cut hairs curl back and re-enter the skin or grow sideways under the skin surface, causing a foreign body inflammatory reaction; the result is raised, sometimes pus-filled bumps that can be mistaken for acne; they can cause significant PIH in darker skin tones',
    prevalence: 'PFB affects up to 45-83% of Black men who shave; it also affects men of any ethnicity with coily/curly beard hair; it is significantly less common in men with straight beard hair (where the hair grows straight out of the follicle after cutting and does not re-enter the skin)',
    mechanism: 'Coily beard hair has a curved follicle; when cut at an angle (as with a razor blade), the pointed hair tip can pierce back into the skin as it curls; the immune system treats the hair as a foreign body and mounts an inflammatory response',
    prevention: {
      technique: ['Single-blade razor or electric clippers (not multi-blade razors which pull the hair before cutting, leaving a very sharp angled tip that more easily re-enters the skin)', 'Shave in the direction of hair growth (with the grain), not against it', 'Do not pull the skin taut while shaving (reduces the sub-surface cutting that leaves an inward-curving sharp tip)', 'Shave less frequently (every other day minimum, allowing more hair growth before cutting)', 'Use warm water and a shaving cream/soap to soften the beard thoroughly before shaving', 'Rinse with cool water after shaving; apply soothing product'],
      products: ['Pre-shave oil or cream softens beard before shaving', 'Tend Skin Solution or PFB Vanish (both contain isopropyl alcohol and salicylic acid to prevent and treat ingrown hairs)', 'Chemical exfoliant (2% salicylic acid) after shaving to prevent ingrown hairs', 'Glycolic acid toner on shaved area to reduce ingrown hair formation'],
      growing: 'For men with severe PFB, growing a beard entirely (stopping shaving) eliminates the razor-related cause; many men opt to keep a short beard rather than shave'
    },
    treatment: 'For existing PFB/razor bumps: topical retinoids (tretinoin); salicylic acid to dissolve blocked follicles; niacinamide for PIH; see a dermatologist for severe cases; laser hair removal (Nd:YAG 1064nm for Fitzpatrick V-VI skin) can permanently reduce beard growth in problematic areas, eliminating PFB'
  }
};

export const MENS_HAIR_GROOMING = {
  title: 'Men\'s Hair Grooming by Ethnic Community',
  basics: {
    scalp: 'Men\'s scalp care follows the same principles as women\'s but with some differences: men are more susceptible to androgenetic alopecia (male pattern baldness); shorter hair means the scalp is more exposed to sun (scalp sunscreen or a hat is important); short hair means scalp health is more directly visible',
    MPB: {
      what: 'Male pattern baldness (androgenetic alopecia) affects approximately 50% of men by age 50; 25% of men start losing hair before 21; driven by genetic sensitivity to DHT (dihydrotestosterone, a testosterone derivative); the classic pattern: receding hairline at temples and/or thinning at the crown',
      treatment: ['Minoxidil (Rogaine): OTC topical or oral (prescription); the most accessible treatment; promotes hair growth by extending the anagen phase; stops hair loss in the majority of users and regrows hair in many; must be used indefinitely (hair loss returns when stopped)', 'Finasteride (Propecia): oral prescription medication; blocks DHT conversion (a more targeted mechanism than minoxidil); more effective than minoxidil for most men; sexual side effects in a minority of users; must be used indefinitely', 'Low-level laser therapy (LLLT): FDA-cleared for hair loss; some evidence of benefit; no safety concerns', 'Hair transplant: FUE (follicular unit extraction) and FUT (follicular unit transplant) are surgical options; best for those with stable hair loss; works by relocating DHT-resistant follicles from the back of the head to balding areas']
    },
    haircutFrequency: 'Most men maintain hair length with cuts every 2-6 weeks depending on style; edges and fade maintenance more frequent (every 1-2 weeks for a sharp fade); men with natural hair may go longer between cuts'
  }
};

export const ETHNIC_MENS_GROOMING_GUIDES = {
  'west-african': {
    hair: 'West African men\'s hair care spans a wide range: from very short cuts to locs, twists, fades, and natural styling; the traditional low fade with a sharp edge-up is an iconic barbershop style across West African communities and diaspora; barber culture is significant in West African communities — the barbershop is a social institution',
    skin: 'West African men have Fitzpatrick V-VI skin; PIH from razor bumps (PFB) and acne scarring is a primary grooming concern; niacinamide and SPF 30+ are the most important skincare priorities; African black soap is a traditional cleansing option; shea butter is widely used as an all-purpose moisturiser',
    beard: 'Beard care is important for West African men who choose to grow beards; coily beard hair requires beard oil and careful shaving technique to prevent PFB; the "waves" hairstyle (360 waves, 720 waves) is an iconic West African-American and Black American men\'s style achieved by brushing short hair with a wave brush and using pomade',
    barbershop: 'The Black and West African barbershop is a cultural institution; in diaspora communities (UK, US, Europe), West African and Black barbershops are community gathering spaces; the barber-client relationship is significant; getting a fresh cut is deeply connected to confidence and presentation in West African and Black male beauty culture'
  },
  'south-asian': {
    hair: 'South Asian men\'s hair is typically dark, thick, and with a tendency to be straight to wavy; high hair density is common; hair grooming priorities include managing volume and maintaining healthy shine; traditional champi (head massage with oil) is historically as common for South Asian men as for women',
    beard: 'Beard culture is extremely significant for many South Asian men; Sikh men (who do not cut their hair or beard as part of their faith — the kesh principle) have elaborate beard care practices including regular oiling, combing, and wrapping the dastar (turban); non-Sikh South Asian men often maintain short beards or are clean-shaven depending on cultural and professional context',
    dasturWinding: 'The Sikh turban (dastar) is an article of faith; winding the turban is a sacred and skilled practice; different communities (Nihang Sikhs, Namdhari Sikhs, urban Sikh men) have different turban styles; care for the hair beneath includes regular oiling with coconut oil and tying the hair in a joora (bun)',
    skin: 'South Asian men have Fitzpatrick III-V skin; PIH from acne is a concern; brightening ingredients (vitamin C, niacinamide) are popular in South Asian men\'s grooming; SPF is increasingly adopted but historically less consistently used than in female South Asian beauty culture',
    traditional: 'Paan (betel leaf preparations) staining of teeth and lips is declining but historically significant; natural grooming preparations using coconut oil, rose water, and Ayurvedic herbs are traditional in South Asian men\'s grooming'
  },
  caribbean: {
    hair: 'Caribbean men\'s hair spans the same Type 1-4 range as Caribbean women\'s; Afro-Caribbean men in the UK, US, and Canada have popularised the "skin fade" with natural texture top; cane rows (cornrows) on men are both traditional and contemporary fashion statements',
    skin: 'Afro-Caribbean men share the Fitzpatrick V-VI PIH concerns; PFB from shaving is a major grooming challenge; Caribbean men\'s grooming culture has been influenced by Jamaican and wider Caribbean masculinity norms; sportsman and dancer aesthetics drive grooming trends',
    beard: 'The full beard is increasingly popular across Caribbean male communities; JBCO (Jamaican Black Castor Oil) for beard and scalp care; the Rastafarian locs tradition (originating in Jamaica) is one of the most globally recognisable Caribbean male hair traditions; Bob Marley\'s locs became a global icon',
    rasta: 'Rastafarian dreadlocks are a spiritual practice for devout Rastafarians (locs should not be cut; natural loc formation encouraged); for many Caribbean men, locs have cultural rather than strictly religious significance; loc grooming including retwisting, washing, and loc butter maintenance is an important grooming practice'
  },
  arab: {
    hair: 'Arab men\'s grooming is highly sophisticated; hair and beard grooming are taken very seriously across Arab cultures; classic short styles with pomade; the "Arab fade" (skin fade with longer top); historically, the moustache was a significant symbol of masculinity in many Arab cultures; the well-groomed beard is associated with religious practice (following the Sunnah for Muslim men) and masculinity',
    beard: 'Beard grooming is extremely important in Arab male culture: regular oiling (argan oil, black seed oil); trimming for shape; some Arab men grow full beards for religious reasons; the beard is groomed meticulously; Arabic beard care products (oud-scented beard oils, perfumed beard balms) are a significant market',
    sunnah: 'For Muslim Arab men, maintaining a beard is Sunnah (following the example of the Prophet Muhammad); length preferences vary by scholarly opinion but many Muslim men maintain beards of varying lengths; the beard represents religious identity and pride; it is cared for with particular attention',
    oudGrooming: 'Oud-scented grooming products (hair pomade, beard oil, aftershave) are extremely popular in Arab male grooming; oud is associated with wealth, prestige, and masculinity in Arab culture; high-end Arab grooming brands incorporate oud into virtually every grooming product category',
    eyebrowMen: 'Eyebrow grooming for Arab men is common practice; threading or trimming to neaten the brows; the monobrow (unibrow) that is celebrated in some South Asian contexts is typically groomed out in Arab male beauty culture; very groomed brows are associated with style-consciousness'
  },
  latina: {
    hair: 'Latino men\'s hair spans the full Type 1-4 spectrum depending on heritage; the classic "Edgar cut" (blunt fringe with fade, also called a "takuache cut") originated in Mexican-American youth culture and became a global barbershop trend in the 2010s-2020s; comb-over fades with textured tops are popular across Latin American communities',
    edgar: 'The Edgar cut (Edgar haircut) is one of the most culturally specific hair trends to emerge from Chicano/Mexican-American youth culture in the US Southwest; the blunt straight fringe with a high skin fade became recognised globally as a distinctive Chicano style; TikTok and social media amplified its spread globally; it is both a hairstyle and a cultural identity marker',
    skin: 'Latino men span Fitzpatrick III-VI skin tones; PIH concerns are present for many; acne is a common concern; SPF use is improving but historically low; traditional male grooming included applying brillantina (brilliantine/hair pomade — petroleum/oil-based pomade for slick styling) — still used for certain traditional styles',
    machismo: 'Traditional Latin American machismo ideals historically discouraged male skincare adoption; this is changing significantly, particularly in urban Latin American cities and in US Latino communities; younger Latino men are significant consumers of skincare and grooming products; the term "metro" (metrosexual influenced) describes style-conscious Latino men who invest in grooming'
  },
  'east-asian': {
    hair: 'East Asian men\'s hair care and styling is highly sophisticated; Korean and Japanese men\'s hair trends are globally influential; popular styles: Korean "bowl cut" (mushroom cut) adapted into a soft modern version; bleached tips; textured perms; the "two-block" haircut (cropped sides, longer textured top) is one of the most globally-copied Korean men\'s hairstyles',
    kPop: 'K-pop male idol grooming is enormously globally influential; skin care, well-groomed brows, subtle skin tint (BB cream or foundation), bleached or coloured hair are normalised for K-pop idols; this has shifted global male grooming norms, particularly among younger generations; BTS\'s grooming and beauty product endorsements (they became L\'Oréal ambassadors) have been industry-defining',
    skin: 'East Asian men, particularly Korean and Japanese men, are among the most skincare-aware male consumers globally; K-beauty and J-beauty have normalised skincare for men in East Asian cultures more than in many Western cultures; toner, serum, and moisturiser use by men is commonplace in South Korea; male BB cream and cushion foundation use is significantly more normalised in Korea than in Western markets',
    grooming: 'K-beauty male grooming trends include: "glass skin" for men (focus on hydration and radiance); targeted dark eye circle treatment (very prevalent in East Asian male consumers due to high rates of sleep deprivation from work culture); eyebrow grooming to create a soft, clean shape (significantly different from Western male brow grooming norms); men\'s BB cream and skin tint are widely used in South Korea',
    anime: 'Anime and manga aesthetic influences East Asian male hair styling; dramatic, gravity-defying styles with colour; these have moved from subculture to mainstream in Japan particularly'
  },
  'east-african': {
    hair: 'East African men\'s hair varies by community: Ethiopian and Eritrean men often have Type 3b-3c loose coils or waves; Somali men may have similar or slightly tighter patterns; Kenyan and Tanzanian men may have Type 3c-4b depending on heritage; short natural cuts, fades, and locs are popular',
    skin: 'East African men have Fitzpatrick IV-VI skin with similar PIH concerns to West African men; SPF is important in the intensely UV-rich Horn of Africa environments; natural ingredient approaches (shea butter, aloe vera, frankincense) for skincare',
    cultural: 'Ethiopian male grooming includes traditional practices; coffee-based scrubs and preparations; Ethiopian men of the Omo Valley tribes practice elaborate body and face painting for cultural ceremonies — one of the most striking examples of traditional male beauty practices globally',
    diaspora: 'East African diaspora men (Ethiopian-American, Somali-American, etc.) negotiate traditional and Western grooming norms; the barbershop is a community gathering space in diaspora East African communities'
  },
  'south-african': {
    hair: 'South African men\'s hair spans the full diversity of the country: short natural fades for Black South African men; Cape Malay heritage men; white South African heritage with European hair types; diverse barbershop culture reflecting this diversity',
    skin: 'South African men face high UV exposure (South Africa has intense solar radiation; very high skin cancer rates in the white South African population; lower but still significant risk for Black South African men who are significantly underdiagnosed); SPF is crucial; South African Rugby culture has contributed to high skin damage rates from outdoor sun exposure',
    rugby: 'Rugby is the most popular sport among Afrikaner/white South African men; decades of outdoor sport without adequate SPF has contributed to high skin cancer rates in this demographic; melanoma education campaigns are important in South African public health',
    indigenous: 'Indigenous South African grooming practices include the use of marula oil and rooibos; Ndebele, Zulu, and Xhosa male traditional dress and body adornment practices for ceremonies are among the most visually spectacular traditional male aesthetics globally',
    township: 'South African township barbershop culture (particularly in Soweto, Khayelitsha, and other townships) is vibrant and sophisticated; the "shisanyama" (braai/barbecue) and barbershop are social centres for Black South African working-class men'
  },
  'black-american': {
    hair: 'Black American men\'s hair is one of the most culturally significant and creatively diverse in the world; from the high top fade of the 1980s/1990s to the contemporary taper fade, waves, locs, and natural styles; the barbershop is a sacred cultural institution in Black American communities',
    barbershop: 'The Black American barbershop is one of the most important cultural institutions; it is a gathering place for community, politics, debate, mentorship, and bonding; barbers are trusted community figures; the tradition has spawned films ("Barbershop" franchise), TV shows, and extensive cultural documentation; getting a fresh cut before important occasions is deeply culturally significant',
    waves: '360 waves (or 360s) is a hairstyle unique to Black men created by intensive brushing of short hair to create a wave pattern; requires: a wave brush (stiff bristle); a wave pomade or "grease" (often petroleum-based); compression with a durag (fabric skull cap); dedication to daily brushing routine; a cultural art form and hairstyle with its own competitive community',
    locs: 'Dreadlocks and locs are significant in Black American culture as both a cultural and spiritual practice; associated with Rastafarianism, Black pride, and natural hair movements; "loc journey" is a significant identity milestone for many Black men; loc maintenance includes retwisting, interlocking, and loc sheen products',
    edge: 'Edge-up (line-up) — crisp, precisely cut hairline edges — is one of the most important elements of Black men\'s haircuts; a fresh edge-up transforms the appearance and is a barbershop skill that commands respect; edge-up tools (clippers, trimmers, straight razor) require skill to perfect',
    skin: 'Black American men have Fitzpatrick V-VI skin; PFB/razor bumps are the most significant grooming challenge; PIH from acne and ingrown hairs is also a major concern; the traditional "Bump Fighter" razor with single blade has been designed specifically for Black men\'s PFB prevention; natural skincare brands for Black men are growing (Scotch Porter, Bevel, Lumin) with PFB, PIH, and melanin-rich skin specifically addressed',
    bevel: 'Bevel, founded by Tristan Walker (a Black American entrepreneur), was one of the first shaving brands specifically designed for Black men with coily facial hair and PFB; Bevel\'s single-blade safety razor, pre-shave brush, and shave cream system was explicitly designed to prevent razor bumps; the brand\'s success demonstrated the underserved need in the market'
  }
};

export function getMensGroomingBasics(section) {
  const map = {
    skin: MENS_SKIN_BASICS,
    beard: BEARD_GUIDE,
    hair: MENS_HAIR_GROOMING
  };
  return map[section] || null;
}

export function getEthnicMensGroomingGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MENS_GROOMING_GUIDES['west-african'],
    'south-asian': ETHNIC_MENS_GROOMING_GUIDES['south-asian'],
    caribbean: ETHNIC_MENS_GROOMING_GUIDES.caribbean,
    arab: ETHNIC_MENS_GROOMING_GUIDES.arab,
    latina: ETHNIC_MENS_GROOMING_GUIDES.latina,
    'east-asian': ETHNIC_MENS_GROOMING_GUIDES['east-asian'],
    'east-african': ETHNIC_MENS_GROOMING_GUIDES['east-african'],
    'south-african': ETHNIC_MENS_GROOMING_GUIDES['south-african'],
    'black-american': ETHNIC_MENS_GROOMING_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const MENS_GROOMING_ETHNIC_STATS = {
  moduleId: 'mens_grooming_ethnic',
  version: '1.0.0',
  topics: ['pseudofolliculitis barbae PFB razor bumps coily beard', 'single-blade razor PFB prevention Black men', 'Bevel razor brand Black men grooming', 'waves 360 waves durag wave brush Black men', 'edge-up lineup barbershop Black American culture', 'barbershop Black American cultural institution', 'K-pop male grooming glass skin BB cream Korean', 'two-block Korean haircut global trend', 'Edgar cut Mexican-American Chicano barbershop', 'Sikh dastar kesh beard turban grooming', 'oud Arab male grooming fragrance', 'Sunnah beard Muslim Arab men', 'Rasta locs Caribbean Jamaican', 'androgenetic alopecia male pattern baldness DHT minoxidil finasteride', 'men skin biology androgen testosterone sebum collagen', 'beard oil carrier oils jojoba argan', 'African American barbershop South African township barbershop'],
  communitiesSupported: 9,
  keyFacts: [
    'Pseudofolliculitis barbae (PFB / razor bumps) affects up to 45-83% of Black men who shave; it occurs when coily beard hairs curl back and re-enter the skin after being cut at an angle by a razor; it disproportionately affects men with coily facial hair (West African, East African, Caribbean, and Black American men); a single-blade safety razor (like those made by Bevel, specifically designed for Black men) significantly reduces PFB compared to multi-blade razors',
    'The Black American barbershop is one of the most culturally significant institutions in the community — a gathering place for politics, mentorship, debate, and community bonding; getting a fresh cut is deeply linked to confidence and social presentation; barbers are respected community figures; the institution has been documented in films, TV, and extensive cultural studies',
    'K-pop male idol grooming has normalised skincare, subtle makeup (BB cream, skin tint, concealer), eyebrow grooming, and hair colouring for men globally, particularly among younger generations; BTS\'s L\'Oréal ambassadorship marked a major moment in the normalisation of male beauty product consumption; South Korea has one of the highest rates of male skincare product use in the world',
    'The "Edgar cut" (blunt fringe with high skin fade) originated in Mexican-American/Chicano youth culture in the US Southwest and became a global barbershop trend in the 2010s-2020s via TikTok; it is simultaneously a hairstyle and a cultural identity marker for many young Chicano men',
    'For Sikh men, uncut hair (kesh) is one of the five Ks (panj kakars) — articles of faith; the beard is kept and maintained with oil and combing; the dastar (turban) is wound around hair collected in a topknot (joora); Sikh beard grooming is both a devotional and an aesthetic practice, creating the elaborate, well-maintained beards visible in Sikh communities globally'
  ]
};
