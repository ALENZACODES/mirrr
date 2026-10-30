/**
 * MIRRR — Men's Grooming Ethnic Guide
 * Grooming traditions, barbershop culture and skincare for men from
 * nine communities. Beard texture and skin type are the reader's own pick,
 * never assigned by community.
 */

export const ETHNIC_MENS_GROOMING_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    groomingPhilosophy: 'West African men\'s grooming is rooted in dignity, presentation, and cultural pride. A well-groomed West African man is a statement of respect — for himself, his community, and his heritage. From the ceremonially lined fade of Ghanaian barber art to the precisely tapered Afro of Lagos fashion, grooming is cultural expression. Traditional practices using locally sourced ingredients have long maintained the health and appearance of West African men\'s skin, hair, and beards.',
    traditionalPractices: [
      {
        name: 'Shea Butter Skin Maintenance',
        description: 'Unrefined shea butter is the cornerstone of West African men\'s skincare — applied post-shower to lock in moisture and prevent ashiness.',
        application: 'Apply to damp skin straight after showering. Focus on elbows, knees and ashy areas. On the face use very little: shea can clog pores on oily or acne-prone skin.',
      },
      {
        name: 'Palm Oil Hair Treatment',
        description: 'Palm oil (red palm oil for higher antioxidant content) applied to the scalp and hair as a deep conditioning treatment.',
        method: 'Warm palm oil. Apply to scalp and hair. Cover with a warm towel. Leave 20–30 minutes. Shampoo out with a clarifying cleanser.',
        benefit: 'Red palm oil is rich in fatty acids and carotenoids and coats the hair, which helps it feel softer. It can stain light fabric.',
      },
      {
        name: 'Neem Oil Beard Treatment',
        description: 'Neem oil applied to the beard to prevent ingrown hairs, reduce inflammation, and treat beard dandruff.',
        method: 'Mix 3–4 drops neem oil into a carrier oil (coconut or jojoba). Apply to beard after showering.',
        warning: 'Neem oil has a strong odor. Use sparingly and with a more pleasant carrier.',
      },
      {
        name: 'African Black Soap Face Wash',
        description: 'Authentic African black soap used as a face cleanser. It removes oil well and can suit oily skin.',
        how: 'Work a small amount into a light lather. Apply to face. Leave 30 seconds. Rinse thoroughly. Follow with a light moisturizer.',
        note: 'Black soap is alkaline — overuse can disrupt skin barrier. 1x daily maximum.',
      },
    ],
    razorBumpGuide: {
      whatAreRazorBumps: 'Pseudofolliculitis barbae (PFB): after shaving, a tightly curled beard hair curls back into the skin, causing inflamed bumps that can leave dark marks. It is most common with coily beard hair.',
      prevention: ['Electric clipper with guards instead of a razor blade — leaves hair slightly longer, reducing in-growth', 'Shave in the direction of hair growth (with the grain), not against it', 'Single-blade razor if you prefer a close shave — multiple blades cut below the skin surface', 'Pre-shave oil to soften hair and reduce drag', 'Never dry shave — always with water and a quality shave cream', 'Chemical exfoliation (glycolic acid, salicylic acid) to prevent dead skin trapping hairs'],
      treatment: ['Warm compress to soften the skin', 'Lift a trapped hair out with a sterile needle or tweezers; do not pluck it or squeeze the bump', 'Salicylic acid to exfoliate and calm', 'See a doctor for painful, pus-filled or spreading bumps; they may need prescription treatment', 'Niacinamide or azelaic acid for dark marks left behind'],
    },
    beardCare: {
      groomingStyles: [
        {
          style: 'Shaped Beard',
          description: 'A full beard shaped and lined at the neckline, cheeks, and mustache for a clean, defined look.',
          maintenance: 'Professional lining every 2–3 weeks. Home maintenance with a precision trimmer.',
        },
        {
          style: 'Low Fade + Beard',
          description: 'A tight fade connecting seamlessly to a shaped beard; a familiar look in Lagos and Accra barbershops.',
          maintenance: 'Weekly edge-up. Beard oil daily.',
        },
        { style: 'Goatee', description: 'Mustache plus chin beard: a classic everywhere.', maintenance: 'Sharp lining every 1–2 weeks.' },
        { style: 'Clean Shave', description: 'Smooth, clean-shaven — requires the most disciplined razor bump management.', maintenance: 'Every 2–3 days with proper PFB prevention protocol.' },
      ],
      beardOilRecipe: {
        base: '2 tbsp jojoba oil + 1 tbsp argan oil + 1 tbsp sweet almond oil',
        adds: '5 drops cedarwood EO + 3 drops peppermint EO + 2 drops tea tree EO',
        instructions: 'Mix in a dropper bottle. Apply 3–5 drops to palm. Rub hands together. Massage into beard from roots to tips daily.',
      },
    },
    hairGrooming: {
      naturalHairCare: ['Co-wash with a lightweight conditioner weekly', 'Deep condition with shea butter mix monthly', 'Low manipulation styling to minimize breakage', 'Protective styles: dreads, twists, braids — reduce daily manipulation', 'Scalp oil with tea tree for dandruff prevention'],
      theBarber: {
        note: 'In West African communities, the barbershop is as much a cultural institution as a grooming venue. A skilled barber is a respected community figure.',
        popularStyles: ['Afro Fade', 'Low Cut', 'Shaved Head', 'Temp Fade', 'Drop Fade + Design', 'Locs / Dreads'],
      },
    },
    skinCareRoutine: {
      minimal: {
        am: ['African black soap or gentle cleanser', 'Lightweight moisturizer with SPF'],
        pm: ['Cleanser', 'Spot treatment if acne', 'Shea butter or heavy moisturizer'],
      },
      advanced: {
        am: ['Cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 30+'],
        pm: ['Double cleanse', 'Salicylic acid toner (if acne-prone)', 'Niacinamide serum', 'Retinol 2x/week', 'Heavy moisturizer'],
      },
    },
  },
  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    groomingPhilosophy: 'South Asian men\'s grooming is deeply influenced by Ayurvedic tradition — the concept that outer appearance reflects inner health. Hair oiling (champi), skincare using natural pastes, and beard grooming are long-standing practices. Modern South Asian men in urban centers have embraced sophisticated grooming routines combining Ayurvedic fundamentals with contemporary products. The beard has become a central style statement across South Asian communities.',
    traditionalPractices: [
      {
        name: 'Champi (Head Massage with Oil)',
        description: 'Weekly head and scalp massage with warm oil, a foundational Ayurvedic practice. It conditions the scalp and is relaxing; evidence that it reduces hair loss is limited.',
        oils: ['Coconut oil', 'Sesame oil (til)', 'Amla oil', 'Bhringraj oil', 'Neem oil'],
        technique: 'Warm the oil. Apply to scalp. Use fingertips (not nails) to massage in circular motions for 10–15 minutes. Cover with a warm towel. Leave 1 hour or overnight. Shampoo out.',
        frequency: 'Weekly minimum. Some traditional practitioners do it nightly.',
      },
      {
        name: 'Multani Mitti (Fuller\'s Earth) Face Mask',
        description: 'Fuller\'s earth (multani mitti) used as a weekly face mask for oil control, pore cleansing, and skin brightening.',
        recipe: '2 tbsp multani mitti + rose water to make a paste + a pinch of turmeric. Apply. Leave 15–20 minutes. Rinse.',
        benefit: 'Absorbs oil and leaves skin feeling clean. It can be drying, so use it once a week at most on dry skin.',
      },
      {
        name: 'Ubtan Beard Scrub',
        description: 'Ubtan (traditional Indian paste of besan, turmeric, and milk/rose water) used as a beard and face exfoliator.',
        recipe: '2 tbsp besan + ¼ tsp turmeric + enough milk or rose water to make a paste. Apply to face and beard area. Rub gently. Leave 5 minutes. Rinse.',
      },
      {
        name: 'Neem and Tulsi Face Wash',
        description: 'Neem leaves and holy basil (tulsi) steeped in water used as a face rinse for acne-prone South Asian skin.',
        method: 'Boil 10–15 neem leaves and 10 tulsi leaves in 2 cups water. Strain. Cool. Use as a toner or rinse after cleansing.',
      },
      {
        name: 'Amla Oil for Hair',
        description: 'Amla (Indian gooseberry) oil is a long-standing Ayurvedic scalp and hair oil: amla fruit steeped in a base oil.',
        benefit: 'Conditions the scalp and hair. Vitamin C does not dissolve in oil, and evidence that amla oil prevents greying or hair loss is limited.',
        application: 'Apply amla oil to scalp. Massage in. Leave 1–2 hours. Shampoo out with gentle cleanser.',
      },
    ],
    beardCare: {
      sikhBeardTradition: {
        religioussignificance: 'In Sikhism, kesh (uncut hair, including the beard, or dhari) is one of the five Ks (panj kakar). Many Sikhs do not cut their hair or beard.',
        care: ['Daily washing with gentle beard wash or shampoo', 'Deep conditioning with coconut or argan oil', 'Beard comb to keep neat and tangle-free', 'Keski or patka to protect and manage the beard during sports or sleep', 'Beard wax or balm for formal occasions'],
      },
      groomingStyles: ['Full beard, shaped and conditioned', 'Short boxed beard', 'Designer stubble (3–7 days growth)', 'Clean shave (requires proper technique for thick coarse hair)'],
    },
    hairLossGuide: {
      ayurvedicApproach: ['Bhringraj oil, called the "king of herbs for hair" in Ayurveda', 'Brahmi oil, traditionally used for hair density', 'Amla oil for scalp conditioning', 'Regular scalp massage', 'A balanced diet with enough iron, zinc and protein; supplements only help if you are low'],
      modernMedical: ['Minoxidil: topical, with good evidence', 'Finasteride: a prescription tablet with good evidence; discuss side effects with your doctor', 'PRP (platelet-rich plasma) injections: evidence is mixed', 'Hair transplant for advanced cases', 'See a dermatologist to confirm the cause first'],
    },
    skinCareRoutine: {
      forOilyAcneProneSkin: {
        am: ['Salicylic acid or neem cleanser', 'Niacinamide 10% serum', 'Oil-free gel moisturizer', 'SPF 30+'],
        pm: ['Double cleanse', 'BHA toner or salicylic acid pad', 'Retinol 3x/week', 'Lightweight moisturizer'],
        weekly: ['Multani mitti mask', 'Gentle exfoliation'],
      },
    },
  },
  caribbean: {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    groomingPhilosophy: 'Caribbean men\'s grooming is cool, confident, and unhurried. The Caribbean man values a crisp fade, a clean shave or neatly shaped beard, and skin that looks healthy and vibrant. Island life influences grooming — salt water, sun, humidity, and outdoor activity shape the products and routines needed. Natural island ingredients — coconut, aloe, tropical herbs — are central to traditional grooming practices.',
    traditionalPractices: [
      {
        name: 'Coconut Oil Full-Body Moisturizer',
        description: 'Coconut oil pressed from local coconuts, used after a shower as an all-over body moisturiser.',
        application: 'Apply to damp skin straight after showering. Keep it off acne-prone faces: it can clog pores.',
      },
      {
        name: 'Aloe Vera After-Shave',
        description: 'Fresh aloe gel applied straight after shaving to cool and soothe the skin.',
        method: 'Keep an aloe plant at home. Cut a leaf. Scrape the gel. Apply to freshly shaved skin.',
      },
      {
        name: 'Sea Salt Scalp Scrub',
        description: 'Fine sea salt mixed with coconut oil used as a weekly scalp exfoliator.',
        recipe: '2 tbsp fine sea salt + 1 tbsp coconut oil + 3 drops tea tree oil. Massage into wet scalp. Leave 5 minutes. Rinse thoroughly. Shampoo.',
        benefit: 'Lifts product build-up and flakes. Be gentle: salt is abrasive, and skip it if your scalp is sore or broken.',
      },
      {
        name: 'Jamaican Black Castor Oil (JBCO)',
        description: 'Jamaican black castor oil applied to the beard and scalp to soften and condition. It coats hair so it looks fuller; it does not create new hair.',
        application: 'For beard: apply to beard roots and ends nightly. For scalp: massage in before washing.',
      },
    ],
    beachGroomingRoutine: {
      preBeach: ['SPF 30 on face and any exposed skin', 'Lightweight, water-resistant moisturizer', 'Waterproof SPF lip balm'],
      postBeach: ['Rinse thoroughly with fresh water — salt dries hair and skin', 'Aloe gel on any sun-exposed areas', 'Deep condition hair after salt water exposure', 'Moisturize heavily — salt and sun are dehydrating'],
    },
    barbershopCulture: {
      significance: 'The Caribbean barbershop is a cornerstone of community life — as much a social institution as a grooming destination. Music, dominoes, conversation, and community happen here.',
      popularStyles: ['Afro Fade', 'High Top Fade', 'Skin Fade', 'Temp Fade + Line', 'Locs', 'Cornrows', 'Clean Shave', 'Shaped Beard'],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Gentle cleanser', 'SPF moisturizer'],
        pm: ['Cleanser', 'Aloe gel', 'Coconut oil'],
      },
    },
  },
  arab: {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    groomingPhilosophy: 'Arab men\'s grooming is sophisticated, intentional, and fragrance-forward. The beard holds religious and cultural significance across Muslim Arab communities. Skin care using traditional formulations — oud-infused balms, argan oil preparations, rose water toners — represents a long heritage of grooming sophistication. Modern Arab men in Dubai, Cairo, Riyadh, and Beirut have embraced a fusion of traditional rituals and international luxury grooming.',
    traditionalPractices: [
      {
        name: 'Hammam (Traditional Steam Bath)',
        description: 'The hammam is central to Arab male grooming culture. A full hammam session involves steaming, kese (exfoliating mitt) scrub, soap lather, and rinse. Deeply cleanses pores and sloughs off dead skin.',
        frequency: 'Weekly or bi-weekly in traditional practice.',
        modernEquivalent: 'Steam treatment at a barber shop. At-home: hot shower + exfoliating scrub mitt.',
      },
      {
        name: 'Argan Oil Beard Conditioning',
        description: 'Pure Moroccan argan oil applied to the beard for conditioning, shine, and softening.',
        application: '2–3 drops rubbed between palms. Worked through the beard from roots to tips.',
        benefit: 'Rich in oleic acid and vitamin E; softens coarse beard hair.',
      },
      {
        name: 'Oud (Agarwood) Fragrance Ritual',
        description: 'Burning oud chips or bakhoor in a mabkhara (incense burner) and wafting clothing and hair over the smoke. A treasured fragrance tradition across the Gulf.',
      },
      {
        name: 'Black Seed Oil Skin Treatment',
        description: 'Black seed oil (habbatus sauda) applied topically for skin health, beard growth, and anti-inflammatory benefit.',
        application: 'Dilute a few drops in a carrier oil and patch test first: black seed oil can cause allergic skin reactions.',
      },
      {
        name: 'Rose Water Toner',
        description: 'Rose water (ma\' al-ward) used as a toner to soothe skin after shaving.',
        method: 'Apply to cotton pad or pour into hands. Pat onto face after cleansing.',
      },
    ],
    arabBeardTradition: {
      islamicContext: 'The beard in Islam is considered a sunnah (tradition of the Prophet Muhammad, peace be upon him). Many Muslim Arab men maintain a beard as a religious practice.',
      classicShapes: [
        { style: 'Full Sunnah Beard', description: 'Full beard, not trimmed on the length (one fist length minimum in some schools), with the mustache trimmed above the lip line.' },
        { style: 'Shaped Full Beard', description: 'Full coverage beard, shaped and lined on cheek line and neckline for a clean appearance.' },
        { style: 'Short Shaped Beard', description: 'Shorter beard, precisely shaped. Very popular in Levantine and North African cities.' },
        { style: 'Gulf Designer Beard', description: 'Often very well maintained, with professional lining, sometimes with decorative shaping.' },
      ],
      beardCareRituals: ['Daily wash with mild shampoo or beard wash', 'Argan or oud-infused beard oil applied daily', 'Beard comb or brush for styling', 'Professional trimming and shaping at a barber every 2 weeks'],
    },
    fragranceGuide: {
      layering: 'Traditional Arab fragrance layering: body oil or lotion on skin, then oud perfume on pulse points, then oud clothing smoke (optional). The layers create a complex, evolving scent signature.',
    },
  },
  latina: {
    communityId: 'latina',
    communityName: 'Latino',
    groomingPhilosophy: 'Latino men\'s grooming is proud, sharp, and community-rooted. The barbershop (peluquería) is one of the most important community spaces in Latin American neighborhoods. A fresh cut, a clean line-up, and a well-maintained beard or mustache are expressions of self-respect and cultural identity. Traditional grooming practices using local plants and oils have been passed down through generations alongside modern barbering techniques.',
    traditionalPractices: [
      {
        name: 'Aceite de Almendra (Sweet Almond Oil) Hair Treatment',
        description: 'Sweet almond oil applied to hair and scalp as a traditional Latin American conditioning treatment.',
        application: 'Warm a small amount. Massage into scalp and work through hair. Cover with a towel. Leave 30 minutes. Shampoo out.',
      },
      {
        name: 'Sábila (Aloe Vera) After-Shave',
        description: 'Fresh aloe vera gel applied immediately post-shave to prevent irritation, razor bumps, and soothe skin.',
        benefit: 'Cooling and soothing on freshly shaved skin. Patch test: some people react to aloe.',
      },
      {
        name: 'Aceite de Coco (Coconut Oil) Moisturizer',
        description: 'Coconut oil applied to the body and beard as a multi-purpose moisturizer and grooming oil.',
        tip: 'For the face, use sparingly — coconut oil is comedogenic for acne-prone skin.',
      },
      {
        name: 'Manzanilla (Chamomile) Scalp Rinse',
        description: 'Chamomile tea brewed and used as a scalp rinse to soothe irritation, reduce dandruff, and add subtle highlights to lighter hair.',
        method: 'Brew strong chamomile. Cool. Pour over scalp after shampoo as final rinse. Do not rinse out.',
      },
    ],
    barbershopCulture: {
      significance: 'La peluquería (barber shop) is a cornerstone of Latino male community life. It is where neighborhood connections are maintained, politics and sports are debated, and masculinity is performed.',
      popularStyles: ['Mid Fade + Textured Top', 'High Skin Fade + Curly Top (for curly-haired Latino men)', 'Taper + Slick Back', 'Low Fade + Comb Over', 'Afro Fade (Afro-Latino community)', 'Bald Fade + Line-up', 'Natural Curls + Defined Shape'],
      mustacheTradition: 'The mustache (bigote) carries deep cultural meaning in many Latin American communities, from the full Mexican charro mustache to the thin pencil mustache.',
    },
    beardStyles: ['Full beard, kept thick and shaped', 'Candado (padlock): mustache joined to a chin beard', 'Three-day stubble, kept at that length', 'Clean shave: very sharp, needs regular upkeep'],
    skinCareRoutine: {
      forHotClimate: {
        am: ['Lightweight cleanser', 'Niacinamide serum for oil control', 'SPF 30 gel moisturizer'],
        pm: ['Cleanser', 'Aloe gel (soothing)', 'Light moisturizer'],
      },
    },
  },
  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    groomingPhilosophy: 'East Asian men\'s grooming has changed fast. Traditional grooming was simple: hair, cleanliness and little else. Today South Korea has one of the world\'s largest men\'s skincare markets, and a skincare routine is normal for men of all ages there. A healthy, non-shiny complexion and neat, styled hair are the goals.',
    traditionalPractices: [
      {
        name: 'Rice Water Hair Rinse',
        description: 'Fermented rice water used as a hair rinse for strength, shine, and scalp health.',
        method: 'Ferment rice water 24–48 hours. Strain. Apply to scalp and hair after shampoo. Leave 5–10 minutes. Rinse.',
        history: 'A long-standing hair rinse in China and Japan.',
      },
      {
        name: 'Green Tea Toner',
        description: 'Strong-brewed green tea cooled and used as a daily face toner.',
        benefit: 'Green tea is rich in antioxidants (EGCG) and may calm skin and reduce oiliness a little.',
        method: 'Brew green tea. Cool. Store in refrigerator. Apply with cotton pad after cleansing.',
      },
      {
        name: 'Camellia Oil Facial Treatment',
        description: 'Tsubaki (camellia) oil used as a facial oil treatment in Japanese grooming tradition.',
        application: '2–3 drops patted onto face after moisturizer. Seals in moisture and provides antioxidant protection.',
      },
      {
        name: 'Jade Roller Facial Massage',
        description: 'A cool stone roller sold as a traditional Chinese beauty tool. It feels soothing and can briefly reduce morning puffiness.',
        method: 'Roll outward from the centre of the face to the hairline and down the jaw for a few minutes. Clean it after each use.',
      },
    ],
    kBeautyMensRoutine: {
      description: 'The Korean men\'s skincare routine (known as K-grooming) has been a global export. It is thorough, systematic, and product-driven.',
      steps: [
        { step: 1, name: 'Oil Cleanser', purpose: 'Remove sunscreen and sebum' },
        { step: 2, name: 'Foam Cleanser', purpose: 'Second cleanse for thorough clean' },
        { step: 3, name: 'Toner', purpose: 'pH balance and hydration prep' },
        { step: 4, name: 'Serum / Essence', purpose: 'Targeted treatment (niacinamide for pores, vitamin C for brightness)' },
        { step: 5, name: 'Moisturizer', purpose: 'Hydration and barrier repair' },
        { step: 6, name: 'SPF (Morning Only)', purpose: 'UV protection' },
      ],
    },
    hairStylingGuide: {
      styles: ['Two-block cut (Korean)', 'Layered textured top', 'Slick back', 'Curtain bangs', 'Undercut', 'Natural medium length'],
      products: {
        forVolume: ['Dry shampoo at roots', 'Sea salt spray', 'Mousse on damp hair'],
      },
    },
  },
  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    groomingPhilosophy: 'East African men\'s grooming reflects a proud, traditional aesthetic. Somali, Ethiopian, Eritrean, Kenyan, and Tanzanian grooming traditions emphasize clean presentation, natural skin health, and increasingly, sophisticated beard styling. Traditional practices using castor oil, frankincense, and locally available botanicals maintain skin and hair health. Urban East African men in Nairobi, Addis Ababa, and Mogadishu have embraced international barbering trends while maintaining cultural grooming roots.',
    traditionalPractices: [
      {
        name: 'Castor Oil Beard and Hair Treatment',
        description: 'Castor oil (the castor plant is native to East Africa) applied to the beard and scalp to soften and condition. It makes hair look fuller; it does not create new hair.',
        application: 'Apply to scalp and beard. Massage in. Leave 1–2 hours or overnight. Wash out thoroughly (castor oil is thick and requires proper cleansing).',
      },
      {
        name: 'Frankincense (Lubaan) Skin Treatment',
        description: 'Frankincense resin and oil are used for scent and in traditional skin preparations.',
        usage: 'Dilute frankincense essential oil to 1% or less in a carrier such as jojoba, and patch test first.',
        cultural: 'Frankincense trees grow in Somalia, the wider Horn of Africa and southern Arabia; frankincense has been traded and burned for thousands of years.',
      },
      {
        name: 'Coffee Scrub Exfoliation',
        description: 'Ethiopian coffee grounds mixed with a little coconut oil as a body scrub. Grounds are too rough for the face.',
        recipe: '1 tbsp fine coffee grounds + 1 tbsp coconut oil. Scrub the body gently in circles. Rinse.',
        benefit: 'Grounds exfoliate and coconut oil moisturises.',
      },
      {
        name: 'Shea and Neem Moisturizer',
        description: 'Shea butter combined with neem oil as an everyday body and beard moisturizer.',
        ratio: 'Melt shea butter and stir in a few drops of neem oil (neem is strong-smelling and can irritate). Apply after showering.',
      },
    ],
    somaliBarbershopCulture: {
      note: 'In Somali neighbourhoods, as in many communities, the barbershop is a social hub.',
      popularStyles: ['Low fade', 'Skin fade', 'Razor part', 'Shaped beard', 'Short taper'],
    },
    skinCareRoutine: {
      basic: {
        am: ['Gentle cleanser', 'Aloe vera gel', 'Lightweight moisturizer with SPF 30'],
        pm: ['Cleanser', 'Castor oil on beard', 'Shea butter on body'],
      },
    },
  },
  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    groomingPhilosophy: 'South African men\'s grooming reflects the country\'s remarkable cultural diversity. Zulu, Xhosa, Sotho, Venda, Afrikaner, Coloured, and Indian South African men each bring distinct grooming traditions. Urban South African men — particularly in Johannesburg, Cape Town, and Durban — have developed sophisticated international grooming cultures. Traditional practices using rooibos, marula oil, and baobab sit alongside international luxury products.',
    traditionalPractices: [
      {
        name: 'Marula Oil Moisturizer',
        description: 'Marula oil from the Southern African marula tree applied as a lightweight facial and body moisturizer.',
        benefit: 'Quickly absorbed, non-greasy, rich in antioxidants and omega fatty acids.',
      },
      {
        name: 'Rooibos Tea Toner',
        description: 'Cooled rooibos tea used as a face toner for antioxidant benefit and skin soothing.',
        method: 'Brew rooibos. Cool. Store in refrigerator. Apply to face with cotton pad after cleansing.',
      },
      {
        name: 'Umuthi (Traditional Medicine) Skin Preparations',
        description: 'Traditional healers prepare plant remedies, and Aloe ferox (Cape aloe) gel is used on the skin. Do not put any remedy on broken skin without advice.',
      },
    ],
    southAfricanBarbershopScene: {
      note: 'South Africa has a vibrant barbershop culture, from township barbers to city salons.',
      popularStyles: ['Afro Fade', 'Skin Fade with Design', 'Temp Fade', 'Dread/Loc styles', 'Shaved head', 'Shaped beard'],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Gentle cleanser', 'SPF 30 moisturizer'],
        pm: ['Cleanser', 'Marula oil'],
      },
      full: {
        am: ['Rooibos cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 50'],
        pm: ['Double cleanse', 'Niacinamide serum', 'Retinol 2x/week', 'Marula oil moisturizer'],
      },
    },
  },
  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    groomingPhilosophy: 'Black American men\'s grooming is a cultural art form. The barbershop is an institution: a community hub, a safe space and a place where identity is expressed. The lined fade, the shaped beard and the fresh cut are statements of pride and belonging. Jamaican black castor oil, shea butter and edge control are part of everyday grooming, and Black-owned grooming brands have grown to serve the community.',
    traditionalPractices: [
      {
        name: 'Jamaican Black Castor Oil (JBCO)',
        description: 'Jamaican black castor oil applied to the scalp, beard and edges to condition and seal in moisture. A staple of Black American grooming.',
        applications: {
          scalp: 'Apply to scalp sections with dropper. Massage in. Leave overnight or wash out after 1 hour.',
          beard: 'Apply to beard roots and throughout. Use as a base for beard oil blends.',
          edges: 'Apply to edges with a toothbrush or edge brush for a smooth laid look.',
        },
      },
      {
        name: 'Shea Butter Full Body Moisture',
        description: 'Unrefined shea butter as the go-to body moisturizer for preventing ashiness.',
        tradition: 'Applied post-shower before skin dries fully. The heat from damp skin helps shea absorb rather than sit on top.',
      },
      {
        name: 'African Black Soap Face Wash',
        description: 'Authentic African black soap for face cleansing: it removes oil well and is traditionally made.',
        note: 'Use 1x daily maximum. Rinse very thoroughly. Follow with moisturizer.',
      },
      {
        name: 'Coconut Oil Hair Sealing',
        description: 'Coconut oil used to seal moisture into natural hair (twists, locs, afro).',
        locs: 'Apply coconut oil to maturing locs to prevent dryness and frizz. Dilute with water in a spray bottle for a lighter application.',
      },
    ],
    barbershopCulture: {
      significance: 'The Black barbershop is one of the most significant cultural institutions in African American life. Beyond grooming, it is a space for community, mentorship, political discourse, and healing.',
      legacyBarbers: 'Master barbers in Black communities are artists and community leaders. The craft is often passed through generations.',
      popularStyles: ['High Skin Fade', 'Temp Fade + Design', 'Flat Top (a classic)', 'Locs / Dreads', 'Low Fade + Curls / Waves', '360 Waves (requires wave cap, brush, and specific products)', 'Afro shaped and rounded', 'Bald / Shaved head'],
      edgesAndWaves: {
        edges: 'The laid edges (baby hairs at the hairline) are an art form. Edge control products and a toothbrush or edge brush create sleek, defined baby hairs.',
        waves: '360 waves require: a wave brush (medium-hard bristle), wave grease or pomade, a du-rag/wave cap worn consistently, and daily brushing in the wave pattern.',
      },
    },
    razorBumpProtocol: {
      prevention: ['Single-blade safety razor, or a clipper with a guard', 'Shave in the direction of hair growth only', 'Pre-shave oil (3-5 drops before shave cream)', 'Never dry shave', 'Warm water or a hot towel first', 'Chemical exfoliation (salicylic acid pads) about 3 times a week to keep follicles clear'],
      treatment: ['Salicylic acid on bumps', 'Warm compress to soften the skin', 'Lift trapped hairs with a sterile needle; do not pluck', 'Azelaic acid or niacinamide for redness and dark marks', 'See a doctor for painful or infected bumps, or bumps that leave raised scars'],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Black soap or gentle cleanser', 'SPF moisturizer for deep skin'],
        pm: ['Cleanser', 'Spot treatment if needed', 'Shea butter'],
      },
      advanced: {
        am: ['Black soap cleanser', 'Vitamin C serum', 'Niacinamide', 'SPF 30+'],
        pm: ['Double cleanse', 'BHA or salicylic acid', 'Retinol 2x/week', 'Dark spot corrector', 'Shea butter'],
      },
    },
  },
};

export const UNIVERSAL_MENS_GROOMING = {
  skinCareBasics: {
    whyMenNeedSkincare: ['Men\'s skin is usually thicker and oilier than women\'s, but it still needs care', 'More oil can mean more breakouts and visible pores', 'Shaving scrapes the skin, so it benefits from soothing and moisture', 'Sun protection prevents skin cancer and early ageing in all skin tones', 'Good shaving technique and after-care reduce razor bumps and irritation'],
    minimumRoutine: ['Cleanser (1–2x daily)', 'Moisturizer with SPF 30 in the morning', 'Nighttime moisturizer or oil'],
    powerIngredients: [
      { ingredient: 'Niacinamide', benefit: 'Pore reduction, oil control, brightening' },
      { ingredient: 'Vitamin C', benefit: 'Antioxidant, brightening, dark spot reduction' },
      { ingredient: 'Retinol', benefit: 'Anti-aging, pore refinement, acne treatment' },
      { ingredient: 'Salicylic Acid', benefit: 'Acne, razor bumps, ingrown hair prevention' },
      { ingredient: 'SPF', benefit: 'Skin cancer prevention, hyperpigmentation prevention, anti-aging' },
      { ingredient: 'Hyaluronic Acid', benefit: 'Hydration, plumping' },
    ],
  },
  shavinGGuide: {
    universalBestPractices: ['Never dry shave — always with water or shave cream', 'Shave after shower when hairs are softer', 'Shave with the grain first (with the direction of hair growth)', 'Rinse blade after every 2–3 strokes', 'Replace blade when it tugs or pulls', 'Apply post-shave product immediately (aloe, aftershave balm, or treatment)'],
    forTightlyCoiledHair: ['Single-blade razor ONLY', 'With the grain ONLY — never against', 'Or use a clipper with a guard for a close but above-skin cut', 'Chemical exfoliation 3x/week to prevent ingrown hairs', 'Post-shave bump treatment (salicylic acid or bump patrol)'],
  },
  beardGroomingUniversal: {
    growingPhase: ['Patience: beard growth is largely genetic', 'Minoxidil on the beard is off-label, with some trial evidence for more density; ask a doctor first', 'Biotin only helps if you are deficient, which is rare', 'Enough sleep, less stress and regular exercise support general health'],
    maintenancePhase: ['Wash the beard 2-4 times a week with a gentle beard wash', 'Apply beard oil after washing', 'Comb or brush daily to prevent tangles and train the direction of growth', 'Shape and line at the barbershop every 2-3 weeks', 'Trim at home with clippers and a guard to keep the length'],
    beardOilEssentials: {
      baseOils: ['Jojoba oil (best beard carrier oil)', 'Argan oil', 'Sweet almond oil', 'Grapeseed oil'],
      essentialOilAdds: ['Cedarwood (woody scent)', 'Tea tree (can help with flakes; can irritate)', 'Peppermint (cooling; keep it very dilute)', 'Sandalwood (warm scent)'],
    },
  },
};

export function getMensGroomingGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MENS_GROOMING_GUIDES['west-african'],
    'south-asian': ETHNIC_MENS_GROOMING_GUIDES['south-asian'],
    'caribbean': ETHNIC_MENS_GROOMING_GUIDES['caribbean'],
    'arab': ETHNIC_MENS_GROOMING_GUIDES['arab'],
    'latina': ETHNIC_MENS_GROOMING_GUIDES['latina'],
    'east-asian': ETHNIC_MENS_GROOMING_GUIDES['east-asian'],
    'east-african': ETHNIC_MENS_GROOMING_GUIDES['east-african'],
    'south-african': ETHNIC_MENS_GROOMING_GUIDES['south-african'],
    'black-american': ETHNIC_MENS_GROOMING_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}
