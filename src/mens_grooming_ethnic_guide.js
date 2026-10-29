/**
 * MIRRR — Men's Grooming: Ethnic Focus
 * Beard care, shaving, skincare for men, all 9 communities.
 */

export const MENS_SKIN_BASICS = {
  title: 'Men\'s Skin Physiology',
  differences: {
    thickness: 'Male skin is approximately 20-25% thicker than female skin due to higher androgen (testosterone) levels which stimulate collagen production and structural proteins; the dermis is thicker; this provides some protection against environmental damage but also means male skin can feel tougher and less reactive to topical treatments at standard concentrations',
    sebum: 'Men produce approximately 2× more sebum than women throughout life due to androgen stimulation of sebaceous glands; this increased sebum production means men are more prone to acne and enlarged pores; it also means men\'s skin may need less additional moisturisation than women\'s skin of equivalent age; however, over-stripping the skin with harsh cleansers disrupts the sebum balance and causes compensatory over-production',
    aging: 'Male skin aging: due to thicker dermis and higher collagen density, male skin shows visible aging later than female skin; however, men lose collagen at a similar or slightly higher rate than women once aging begins; shaving acts as a form of daily exfoliation and may contribute to collagen maintenance in the lower face',
    sun: 'Sun protection deficit: men are significantly less likely to use sun protection than women; men have higher rates of skin cancer, particularly on the face, scalp, and back of neck; sun protection is the single most effective anti-aging intervention for male skin and is critically underused by men across almost all ethnic communities'
  },
  melanin: 'Men with melanin-rich skin share all the same considerations as women: risk of PIH from any inflammatory event (shaving, aggressive treatments, sun); need for Fitzpatrick-appropriate treatments; protection of the specific photoprotective and aesthetic beauty of melanin-rich skin'
};

export const BEARD_SCIENCE = {
  title: 'Beard Hair Biology',
  androgenicHair: 'Beard hair is androgenic hair — unlike scalp hair which has mixed androgen sensitivity, beard hair grows in direct response to dihydrotestosterone (DHT); DHT is the most potent androgen and is converted from testosterone by the enzyme 5-alpha-reductase; beard hair follicles are highly sensitive to DHT; the rate and density of beard growth varies enormously between individuals and between ethnic groups',
  growth: 'Beard growth rate: approximately 0.5 inch (1.27 cm) per month on average; beard hair grows at a similar rate to scalp hair but has a much longer potential growth period before it terminates; the terminal length of beard hair varies by genetics',
  texture: 'Beard hair texture follows the same elliptical cross-section patterns as scalp hair: straight beard hair (round cross-section): common in East Asian and some Northern European men; wavy beard hair (slightly elliptical): common in many Mediterranean, Middle Eastern, and South Asian men; coily/curly beard hair (highly elliptical): common in West African, East African, Caribbean, and Black American men',
  pseudofolliculitis: {
    name: 'Pseudofolliculitis Barbae (PFB) — Razor Bumps',
    description: 'PFB is an inflammatory condition affecting an estimated 60-83% of Black men who shave and a significant proportion of Hispanic, Middle Eastern, and South Asian men with curly beard hair; it occurs when shaved hair, rather than growing straight outward from the follicle, curves and grows back into the skin (intrafollicular PFB) or exits the skin and re-enters nearby skin (transfollicular PFB); the re-entering hair is a foreign body and triggers an inflammatory response; the result is red, irritated, painful papules and pustules that look similar to acne',
    mechanism: 'The highly elliptical cross-section of coily hair means it curves sharply as it grows; when cut at the skin surface by a sharp razor, the sharp angled tip of the cut hair easily penetrates back into the skin as the hair grows; the same hair type that gives curly beard hair its tight coil also makes it highly susceptible to PFB',
    treatment: 'PFB prevention and treatment: (1) Grow a beard — the most effective prevention is not shaving at all; (2) Chemical depilatory (hair removal cream) — removes hair below the skin surface with no sharp angled tip, eliminating the mechanical cause of ingrowths; (3) Electric clippers with a 1-2mm guard — cutting hair above the skin surface rather than at/below it; (4) Use single-blade razors (not multi-blade) — multi-blade razors "lift and cut" hair below the skin surface creating sharp angled tips that re-enter more easily; (5) Shave in the direction of hair growth only (not against the grain); (6) Salicylic acid or glycolic acid toner to the beard area to exfoliate and free trapped hairs; (7) Benzoyl peroxide for inflammatory papules; (8) Laser hair removal — permanently reduces hair density, significantly improving PFB'
  }
};

export const SHAVING_SCIENCE = {
  title: 'Shaving Science and Technique',
  preparation: 'Shaving preparation: wet shaving requires thorough preparation; pre-shave: warm the face with a warm towel or shave after shower; this softens the beard hair (hydrated hair is 30-40% softer than dry hair) and opens the follicle; apply pre-shave oil as an additional lubricating layer under shaving cream for sensitive or PFB-prone skin; use a quality shaving cream or soap worked into a lather with a shaving brush for optimal lubrication',
  technique: 'Shaving technique: shave in the direction of hair growth (with the grain) on the first pass; a second pass can be across the grain but should never be against the grain on Black or highly curly beard skin; rinse the blade after every 2 strokes to prevent clogging and reduce drag; use light pressure — the weight of the razor is sufficient, additional pressure increases friction and irritation',
  aftershave: 'Post-shave care: rinse with cool water (closes pores); apply alcohol-free toner with niacinamide or salicylic acid; apply a lightweight moisturiser with SPF; avoid fragrance-heavy aftershave splashes that can irritate freshly shaved skin (particularly on dark skin where fragrance-induced PIH can occur)',
  laser: 'Laser hair removal for PFB: Nd:YAG 1064nm laser is the safe laser choice for Fitzpatrick IV-VI skin; this is the same wavelength used safely on dark skin for body laser hair removal; for Black and dark-skinned men with severe PFB, laser hair removal of the beard area significantly improves quality of life and eliminates the chronic inflammation cycle'
};

export const ETHNIC_MENS_GUIDES = {
  'west-african': {
    community: 'West African Men',
    pbf: 'PFB is a critical issue for West African men with tightly coiled beard hair; up to 83% of Black men who shave develop PFB to some degree; West African diaspora men should know that PFB is not an infection or a hygiene problem but a structural response to the geometry of coily hair re-entering the skin; primary recommendations: grow a beard if professional context allows, or switch to clippers at 1-2mm rather than close shaving',
    beard: 'West African beard care: the tightly coiled nature of West African beard hair requires the same LOC (Liquid-Oil-Cream) or LCO approach as scalp hair to maintain moisture; beard oil (jojoba, argan, JBCO) applied to a damp beard after washing; beard butter or balm to seal moisture; a boar bristle beard brush or wide-tooth comb for detangling; beard hair benefits from the same protective styling logic as scalp hair',
    skincare: 'West African men\'s skin: men in this community need a straightforward skincare routine: gentle cleanser; toner with niacinamide for oil control and PIH prevention; moisturiser with SPF; spot treatment with benzoyl peroxide or salicylic acid for active acne; dark skin men are particularly susceptible to PIH from picking acne or from shaving irritation',
    hyperpigmentation: 'Post-shave hyperpigmentation: the combination of PFB inflammation and PIH in Fitzpatrick V-VI skin creates the dark spots around the beard area that many Black men develop over years of shaving; the prevention strategy (not close-shaving, or growing a beard) is far more effective than treating the resultant hyperpigmentation',
    recommendations: 'Grow a beard or use clippers; beard oil and beard butter for moisture; no-shave is not unprofessional (CROWN Act equivalent protections increasingly include beard styling); SPF daily; niacinamide for even skin tone; Nd:YAG laser for PFB if shaving is unavoidable'
  },
  'south-asian': {
    community: 'South Asian Men',
    champi: 'Champi (head massage) is a significant component of traditional South Asian male grooming; hair oiling is as important in South Asian male beauty culture as female; coconut oil, mustard oil, amla oil applied to the scalp and beard is traditional South Asian male hair care',
    beard: 'South Asian beard culture: beard growth patterns vary significantly across South Asian men by ethnicity; many South Asian men can grow full, dense beards; Sikh men observe Kesh (the religious practice of not cutting beard or head hair as one of the Five Ks); for Sikh men, the beard is a sacred practice (dastar/turban and daadi/beard) requiring specific care including combing and tying with a beard net (gol pheta) in everyday settings; the Sikh beard care routine includes washing with gentle shampoo, conditioning, and combing',
    bodyHair: 'South Asian men and body hair: many South Asian men have high body and facial hair density due to genetic and androgen factors; manscaping (body hair grooming) is increasingly accepted in South Asian male culture though attitudes vary widely by generation; laser hair removal for back, chest, and shoulder hair is used by South Asian men at higher rates than some other communities',
    skincare: 'South Asian men\'s skincare: PCOS-driven hormonal imbalance awareness applies differently to men: male-pattern androgen excess (which can manifest as premature beard growth in teenage years, acne, and male pattern hair loss) is relevant in South Asian men who may have higher androgen sensitivity; a basic SPF-focused routine prevents the hyperpigmentation that develops on South Asian skin with cumulative UV exposure',
    recommendations: 'Champi with coconut or amla oil for beard and scalp health; SPF is critical (South Asian skin is susceptible to PIH from sun combined with any inflammation); Sikh men: dastar care and beard maintenance as a spiritual practice; gentle beard wash; beard oil for softer, more manageable beard hair'
  },
  caribbean: {
    community: 'Caribbean Men',
    pbf: 'PFB affects Afro-Caribbean men similarly to West African men (60-80% of those with tightly coiled beard hair who shave); the same prevention strategy applies: grow a beard, use clippers, or switch to single-blade razors with with-the-grain technique',
    colonge: 'Caribbean men\'s fragrance: cologne (eau de toilette or eau de parfum) is an important element of Caribbean male grooming; the Caribbean male grooming identity includes being well-fragrant; bay rum is the traditional Caribbean aftershave fragrance (warm, spicy, classic)',
    skincare: 'Caribbean men\'s skincare: similar to West African men with additional tropical UV exposure consideration; Caribbean men often have significant UV exposure from outdoor activities and work in tropical climates; SPF is the critical missing element in Caribbean male skincare; moisturiser with SPF daily',
    recommendations: 'PFB prevention as the primary beard/shaving consideration; SPF daily for tropical UV exposure; bay rum aftershave tradition; beard oil for coily beard texture; basic cleanser-moisturiser-SPF routine'
  },
  arab: {
    community: 'Arab Men',
    beardInIslam: 'The beard in Islamic practice: growing a beard is a sunnah (practice of the Prophet Muhammad PBUH) and is strongly encouraged for Muslim men; many Islamic scholars consider maintaining a beard (of a specific minimum length) to be wajib (obligatory) or at minimum mustahab (recommended); Arab Muslim men who observe this practice typically have a dense, full beard; beard care becomes a part of Islamic self-presentation and dignity (itaa\' al-liḥya)',
    beardOil: 'Arab beard care: the Arab male grooming tradition uses scented oils (attar-infused beard oils, argan oil, black seed/nigella sativa oil) for beard conditioning and fragrance; the combination of beard care and scent is a fundamental part of Arab male self-care; applying scented beard oil before Friday prayers (Jumu\'ah) is a standard practice',
    skincare: 'Arab men\'s skincare: the Middle Eastern climate (extreme heat, high UV, sand/wind in desert regions) creates specific skincare needs for Arab men; SPF is critical but often neglected; the fashion for light, glowing skin in Arab male beauty culture (particularly in Gulf countries) has driven skincare adoption among Arab men',
    grooming: 'Arab grooming culture: body hair grooming (removing underarm and pubic hair) is specifically mentioned in Islamic hadith as among the fitrah (natural practices of cleanliness); Arab men remove underarm and pubic hair routinely as part of Islamic hygiene practice',
    recommendations: 'Full beard maintenance as sunnah practice; beard oil (argan, black seed/nigella sativa) for beard conditioning; scented beard oil (attar-infused) before prayers; SPF daily for Middle Eastern UV levels; halal grooming products (alcohol-free where possible); nigella sativa for skin and beard — anti-inflammatory and traditionally Islamic'
  },
  latina: {
    community: 'Latino Men',
    machismo: 'Latino male beauty and machismo: traditional Latino machismo masculine identity has historically been resistant to explicit beauty and grooming culture beyond shaving and cologne; however, contemporary Latino male grooming culture (particularly in younger generations and urban communities) actively embraces skincare, haircare, and grooming as masculine self-expression; the shift from machismo beauty resistance to urban Latino metrosexuality reflects generational change',
    hair: 'Latino men\'s hair: the enormous diversity of Latino hair types (from straight East Asian-influenced hair in East Asian-Latino communities to Type 4 coily hair in Afro-Latino communities) means hair care approaches vary radically; Latino men with wavy to curly hair benefit from leave-in conditioner and curl-defining product; Afro-Latino men with coily beard hair face PFB similarly to Black American men',
    mustache: 'The Latin mustache tradition: the mustache is a significant element of Latino masculine identity across many communities; the handlebar, the pencil mustache, and the chevron mustache have all been iconic in various Latino cultural contexts; mustache maintenance (grooming, waxing, shaping) is a specific sub-practice of Latino male grooming',
    skincare: 'Latino men\'s skincare: warm Latino skin (typically Fitzpatrick III-V) is susceptible to hyperpigmentation from acne, sun, and shaving irritation; SPF is an essential; the increased interest in skincare among younger Latino men is creating market growth for male-targeted skincare products in Latin communities',
    recommendations: 'SPF daily; mustache grooming products (wax, balm); beard oil for coily beard textures; PFB prevention for Afro-Latino men; niacinamide for even skin tone; fragrance is culturally significant in Latino male grooming (cologne is expected in many social settings)'
  },
  'east-asian': {
    community: 'East Asian Men',
    kbeautyMen: 'K-beauty for men: South Korea has the world\'s highest per-capita male cosmetics consumption; Korean men use tinted moisturiser (BB cream), concealer, eyebrow grooming, and basic skincare as standard; the Korean military explicitly includes skincare education as part of mandatory service training; this normalisation of male beauty products in Korea has influenced the global expansion of male beauty acceptance',
    skincare: 'East Asian men\'s skincare: the K-beauty and J-beauty approach for men is a streamlined version of the female routine: cleanser (double cleanse for oily skin); toner/essence; moisturiser with SPF; eye cream; occasionally sheet mask; the "glass skin" aspiration is gender-equal in Korean beauty culture — luminous, even, healthy skin is a beauty goal for Korean men and women',
    beard: 'East Asian beard patterns: many East Asian men have sparser, finer beard hair than other communities due to lower androgen receptor density in facial skin; the cultural tradition for clean-shaved or minimal-beard aesthetics in East Asian male beauty reflects both this biological tendency and the cultural aesthetic preference; in Korean and Japanese fashion/idol culture, the clean-shaved look is dominant; a full beard is increasingly fashionable among some groups',
    eyebrow: 'East Asian men\'s eyebrows: brow grooming is standard in Korean and Japanese male beauty; K-pop idols and male celebrities regularly show manicured, groomed brows; the straight brow aesthetic (minimal arch) applies to Korean male brow ideal as much as female; brow grooming for Korean men is accepted and expected in many professional and entertainment contexts',
    recommendations: 'Basic 3-5 step skincare routine; SPF daily (critical for glass skin maintenance); tinted moisturiser/BB cream where culturally acceptable; eyebrow grooming; lightweight cleanser; essence/toner for hydration; minimal beard grooming if growing facial hair'
  },
  'east-african': {
    community: 'East African Men',
    muslimGrooming: 'East African Muslim men\'s grooming follows Islamic sunnah practices: beard as religious obligation; trimming mustache; removing underarm and pubic hair; using alcohol-free attar fragrance; miswak (teeth-cleaning stick from Salvadora persica root) as a natural dental hygiene tool recommended in hadith',
    beard: 'East African beard texture: Somali, Ethiopian, and Eritrean men typically have moderately coily to coily beard hair; PFB is a concern for those with tightly coiled beard hair who shave; however, the Islamic practice of keeping a beard means many East African Muslim men do not face this issue in practice — the very religious practice that Islamic scholars recommend protects from a dermatological problem',
    skincare: 'East African men\'s skincare: similar concerns to West African and other dark-skinned communities; SPF for dark skin protection (primarily against PIH from UV rather than skin cancer risk, though UV-induced skin cancer occurs in all skin types); dark skin care for PIH prevention around shaving area',
    recommendations: 'Beard maintenance per Islamic sunnah; beard oil (preferably attar-infused for Islamic fragrance tradition); SPF daily; gentle cleanser; miswak for dental health; alcohol-free grooming products'
  },
  'south-african': {
    community: 'South African Men',
    ubuntu: 'Ubuntu grooming culture: the South African concept of Ubuntu (I am because we are) applies to male grooming as a form of dignity and community respect; well-groomed, presentable appearance is part of Ubuntu dignity in South African culture',
    beard: 'South African Black men\'s beard: similar PFB considerations as West African men; the tightly coiled beard hair of Black South African men creates the same ingrown hair risks with close shaving; beard growing culture is strong in Black South African male identity; many South African Black men grow full beards as a masculine aesthetic choice rather than engaging in the ongoing PFB battle of close shaving',
    barberShop: 'Barber shop culture: the barber shop in Black South African communities is a social institution similar to West African and Black American barber culture; the barber shop is a gathering place, a community news exchange, and a space for masculine social bonding alongside hair and beard grooming',
    skincare: 'South African men\'s skincare: the South African climate ranges from very high UV in the Northern Cape and Highveld to subtropical humidity in KwaZulu-Natal; sunscreen is critical in all regions; dark skin men in South Africa are prone to PIH from any skin trauma including shaving; basic gentle cleanser and SPF moisturiser as a starting point',
    recommendations: 'Grow a beard as a PFB-free masculine aesthetic choice; barber shop for professional grooming; SPF daily; beard oil for conditioning; shea butter or cocoa butter for any body dryness; marula oil (South African native plant) for beard and skin conditioning'
  },
  'black-american': {
    community: 'Black American Men',
    barbershop: 'The Black American barbershop: the barbershop is one of the most important social institutions in Black American culture; it functions as a community gathering place, a space for political and cultural discussion, a mental health safe space, and a site of masculine identity affirmation; the barber is a trusted community figure; the tradition of the Black barbershop spans the history of Black American community life from the Reconstruction era forward',
    pbf: 'PFB — "razor bumps": the term "razor bumps" is widely understood in Black American male culture as a chronic condition associated with shaving; many Black American men have navigated this condition throughout their shaving lives without necessarily knowing its medical name; the practical strategies (single-blade razor, shaving with the grain, using chemical depilatories, electric clippers) have been transmitted within barber culture and family knowledge',
    fade: 'The fade: the "fade" haircut — a gradient taper from very short at the sides and back, transitioning to longer hair at the top — is one of the defining Black American male aesthetic achievements; the precision fade requires highly skilled barbering; fade variations (skin fade, mid fade, high fade; shadow fade; burst fade; temple fade; Edgar fade) represent a sophisticated technical vocabulary; maintaining the fade requires regular barbershop visits (typically every 1-3 weeks)',
    skincare: 'Black American men\'s skincare: Black American men have the same high-PIH-risk skin as other dark-skinned communities; additionally, the social stigma around male skincare in some traditional masculine contexts has historically limited skincare adoption; younger Black American men are increasingly embracing skincare as masculine self-care; SPF, niacinamide, and basic moisturisation are the foundation',
    groomingProducts: 'Black American male grooming products: the Black male grooming product market is significant and growing; SheaMoisture Men, Bevel (designed specifically to address PFB), and Black-owned grooming brands are actively serving this market; Bevel was founded specifically to address the PFB problem in Black men\'s shaving experience',
    recommendations: 'The barbershop is the community anchor of Black American male grooming — use a trusted barber; Bevel single-blade razor system for PFB prevention; electric clippers as an alternative to close shaving; SPF daily; beard oil for conditioning; niacinamide serum for hyperpigmentation; glycolic acid toner on shaving days to exfoliate and free ingrown hairs'
  }
};

export function getMensGroomingGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MENS_GUIDES['west-african'],
    'south-asian': ETHNIC_MENS_GUIDES['south-asian'],
    caribbean: ETHNIC_MENS_GUIDES.caribbean,
    arab: ETHNIC_MENS_GUIDES.arab,
    latina: ETHNIC_MENS_GUIDES.latina,
    'east-asian': ETHNIC_MENS_GUIDES['east-asian'],
    'east-african': ETHNIC_MENS_GUIDES['east-african'],
    'south-african': ETHNIC_MENS_GUIDES['south-african'],
    'black-american': ETHNIC_MENS_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const MENS_GROOMING_STATS = {
  moduleId: 'mens_grooming_ethnic_guide',
  version: '1.0.0',
  topics: ['pseudofolliculitis barbae PFB razor bumps Black men shaving', 'Islamic sunnah beard Kesh Sikh beard religious', 'K-beauty Korean men skincare glass skin BB cream', 'Black American barbershop social institution', 'Bevel single-blade razor PFB', 'Nd:YAG 1064nm laser dark skin PFB treatment', 'beard oil LOC method coily beard', 'fade haircut Black American barbering', 'South Asian champi male grooming', 'attar beard oil Islamic practice'],
  communitiesSupported: 9,
  keyFacts: [
    'Pseudofolliculitis barbae (PFB), commonly called razor bumps, affects approximately 60-83% of Black men who shave and significant proportions of men with curly/coily beard hair in Hispanic, Middle Eastern, and South Asian communities; it is caused by the tightly coiled structure of these hair types curving back into the skin after close shaving; it is a mechanical-structural condition, not an infection or hygiene issue; the most effective prevention is growing a beard, using electric clippers at a 1-2mm guard, or switching to a single-blade razor with strict with-the-grain shaving technique; Nd:YAG 1064nm laser hair removal significantly improves chronic PFB in dark-skinned men by permanently reducing hair density',
    'The Black American barbershop is one of the most documented social institutions in Black American culture and history; it functions simultaneously as a professional grooming establishment, a community gathering space, a site for political and cultural discourse, and a mental health safe space; the relationship between a Black man and his trusted barber is culturally specific and deeply meaningful; the precision fade haircut — a gradient taper from very short at the sides to longer at the top — is one of the defining aesthetic achievements of Black American barbering culture',
    'Korean men have the world\'s highest per-capita male cosmetics consumption; skincare (cleanser, toner, moisturiser, SPF, BB cream) is standard and expected in Korean male culture; the Korean military includes skincare education as part of mandatory military service; this normalisation contrasts sharply with many Western masculine cultures where explicit skincare adoption faces greater social resistance; K-beauty has driven global expansion of male beauty acceptance'
  ]
};
