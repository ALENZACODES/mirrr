/**
 * MIRRR — Traditional Beauty Rituals Guide
 * Comprehensive traditional beauty practices across all 9 ethnic communities.
 * Ancient wisdom meets modern skin science.
 */

export const RITUAL_SCIENCE = {
  title: 'Why Traditional Beauty Rituals Work — The Science',
  overview: 'Many traditional beauty rituals that predate modern cosmetic chemistry have been validated by contemporary research; ingredients used for thousands of years often turn out to contain bioactive compounds now understood through molecular biology; the challenge is separating evidence-backed traditional practices from those that are culturally significant but not demonstrably effective (and distinguishing those from harmful practices)',
  validatedIngredients: {
    turmeric: 'Curcumin in turmeric: anti-inflammatory (inhibits NF-κB pathway); antioxidant; inhibits tyrosinase; used in South Asian and Southeast Asian beauty traditions for millennia; validated by hundreds of clinical and in-vitro studies',
    rosewater: 'Rose water: mild astringent; mild anti-inflammatory; humectant properties; used across Middle Eastern, South Asian, and Persian traditions; well-tolerated; genuine anti-inflammatory properties confirmed in contemporary research',
    coconutOil: 'Virgin coconut oil: lauric acid is highly antimicrobial against Malassezia (a fungus relevant to dandruff and seborrhoeic dermatitis); penetrates hair shaft better than many synthetic oils (due to linear carbon chain); traditional in South Asian (particularly Kerala) and Pacific Island beauty; some evidence of reducing protein loss from hair when used pre-wash',
    ghee: 'Ghee (clarified butter): historical Ayurvedic skin use; contains short-chain fatty acids (butyrate); antioxidant vitamin E; squalene; used as an occlusive skin treatment; contemporary niche skincare is revisiting ghee as a premium moisturising ingredient',
    africanShea: 'Shea butter: West African traditional use for skin and hair; triterpene alcohols (lupeol, cinnamic acid esters) with anti-inflammatory and UV-absorbing properties; cinnamic acid esters give shea butter a natural SPF of approximately 3-4; emollient and occlusive; well-validated by research',
    arganOil: 'Argan oil: Moroccan Berber traditional use (primarily oral — as a dipping oil for bread — but also cosmetic); high oleic and linoleic acid content; vitamin E; squalene; high phenol content; evidence for antioxidant and moisturising effects',
    blackSeedOil: 'Nigella sativa (black seed/black cumin oil): traditional across Muslim communities (hadith reference); thymoquinone is the primary bioactive; evidence for anti-inflammatory, antioxidant, and antimicrobial properties; some RCT evidence for reduction in acne and atopic dermatitis'
  }
};

export const WEST_AFRICAN_RITUALS = {
  community: 'West African',
  skinRituals: {
    palmKernel: {
      name: 'Palm Kernel Oil Treatment',
      description: 'Palm kernel oil (distinct from palm oil; from the palm seed rather than the fruit pulp) has been used across West Africa for skin and hair care for centuries; dark brown oil with distinctive nutty scent; high in lauric acid (antimicrobial); caprylic and capric acids; rich and deeply nourishing',
      modernUse: 'Used as a pre-wash hair treatment, scalp massage oil, body moisturiser, and wound healing aid; contemporary natural beauty movement has led to resurgence in artisanal palm kernel oil production for beauty use'
    },
    shea: {
      name: 'Shea Butter Body Ritual',
      description: 'Raw, unrefined shea butter (from Vitellaria paradoxa — the shea tree native to the Sahel) has been used across West Africa for skin protection, hair care, and as cooking fat for thousands of years; the full traditional body shea ritual involves warming the butter in the hands and massaging it into the skin; traditionally performed after bathing',
      regions: 'The shea tree grows across the sahel belt from Senegal through Ghana, Nigeria, Burkina Faso and beyond; the quality varies by region; Ghanaian and Burkina Faso shea is considered particularly high quality'
    },
    akamu: {
      name: 'Akamu/Ogi Fermented Grain Mask',
      description: 'Fermented corn or guinea corn porridge (akamu in Yoruba; ogi in Igbo; pap in South African variants); the fermentation process produces lactic acid bacteria; lactic acid has mild exfoliating (AHA) properties; traditional West African women applied fermented cereal porridge to the face as a brightening and smoothing treatment — an intuitive discovery of AHA exfoliation centuries before the science was understood'
    },
    camwood: {
      name: 'Camwood (Osun) Skin Treatment',
      description: 'Camwood (Baphia nitida) produces a red powder (called osun in Yoruba) used traditionally for skin treatment, cultural ceremonies, and as a dye; has anti-inflammatory and antimicrobial properties; traditional Yoruba practice of applying camwood paste to newborn skin, to women postpartum, and as a ceremonial skin treatment',
      contemporary: 'Contemporary African natural beauty brands have incorporated camwood into facial masks and body scrubs; it provides a temporary orange-red tint that fades; anti-inflammatory properties may benefit acne-prone skin'
    }
  },
  hairRituals: {
    coconutOil: {
      name: 'Pre-Wash Oil Treatment',
      description: 'Weekly pre-wash oiling of hair and scalp using coconut, palm kernel, or castor oil before shampooing; reduces hygral fatigue (damage from repeated swelling and drying) and protein loss during washing; keeps the scalp and hair nourished',
      modern: 'The pre-wash oiling tradition is fully validated by hair science; coconut oil\'s ability to penetrate the hair cortex significantly reduces protein loss during washing; this was demonstrated in a seminal 2001 study in the Journal of Cosmetic Science'
    },
    shea: {
      name: 'Shea Butter Sealant',
      description: 'Applying raw shea butter as the final step of hair moisturising; seals moisture into coily and kinky hair types; traditional across West Africa as a hair "butter"; used on twist-outs, braids, and natural styles'
    }
  }
};

export const SOUTH_ASIAN_RITUALS = {
  community: 'South Asian',
  skinRituals: {
    ubtan: {
      name: 'Ubtan (Bridal Skin Preparation)',
      description: 'Ubtan is a traditional Indian/Pakistani/Bangladeshi pre-bridal skin treatment paste made from: besan (chickpea flour, which contains saponins that cleanse and mild AHAs that exfoliate); turmeric (anti-inflammatory, anti-pigmentation); rose water or milk (hydrating); a small amount of oil (moisturising); ground almonds or sandalwood powder in more elaborate versions',
      ritual: 'The ubtan ceremony (haldi ceremony in North India; tel embodied ritual in Bengal) is a significant pre-wedding celebration in which family members apply the paste to the bride and sometimes groom; the ritual has deep spiritual significance beyond skin preparation; the turmeric gives the treated skin a temporary golden glow',
      science: 'The chickpea flour provides gentle physical exfoliation and AHA-type chemical exfoliation; turmeric\'s curcumin is anti-inflammatory and inhibits tyrosinase; milk lactic acid provides additional AHA exfoliation; modern dermatologists confirm many ubtan ingredients are genuinely beneficial'
    },
    amla: {
      name: 'Amla (Indian Gooseberry) Treatment',
      description: 'Amla (Phyllanthus emblica / Emblica officinalis) is considered one of the most powerful Ayurvedic herbs; used both internally and externally for centuries; as a topical: amla oil or fresh amla paste applied to hair and skin; one of the highest natural sources of vitamin C; the vitamin C in amla is unusually heat-stable due to binding with ellagitannins',
      hairUse: 'Amla oil (amla infused in sesame or coconut oil) is a traditional South Asian hair treatment; used for scalp health, reducing hair fall, and promoting hair growth; the vitamin C content supports collagen production around hair follicles; widely available as a commercial product (Dabur Amla Hair Oil is an iconic brand)'
    },
    rosewater: {
      name: 'Rose Water (Gulab Jal)',
      description: 'Rose water (gulab jal — from gulab, Urdu/Hindi for rose) has been used in South Asian beauty for centuries; obtained by steam distillation of rose petals (Rosa damascena, the Damask rose, is the primary source); used as a skin toner, facial mist, ingredient in cosmetics, cooking (rose milk, rasgulla), and religious ceremonies (applied to deities in Hindu puja)',
      beauty: 'Traditional South Asian women used rose water as a skin toner after cleansing; the mild astringency temporarily reduces the appearance of pores; anti-inflammatory properties are documented; the Persian tradition of rose water also flows through Mughal and North Indian court beauty culture'
    },
    multaniMitti: {
      name: 'Multani Mitti (Fuller\'s Earth)',
      description: 'Multani mitti ("soil of Multan") is a naturally occurring clay mineral (smectite group; similar to montmorillonite and bentonite clays) mined primarily in Multan, Pakistan; used for thousands of years across South Asia as a deep-pore cleanser and oil-absorbing face mask; famous for leaving skin feeling clean and minimising pores',
      science: 'Fuller\'s earth has very high oil-absorption capacity; the negatively charged clay particles attract positively charged impurities; however, it can be over-drying with overuse; the Ayurvedic tradition suggests using it only once or twice weekly for oily skin; daily use can strip the skin barrier'
    },
    castor: {
      name: 'Castor Oil (Arandi Tel) Eyebrow and Lash Treatment',
      description: 'Castor oil (from Ricinus communis seeds; arandi in Hindi) applied to eyebrows and eyelashes with a clean spoolie or finger; traditional belief that it promotes hair growth; while the mechanism is not fully proven for hair growth specifically, ricinoleic acid in castor oil is genuinely anti-inflammatory and creates a coating that protects existing hairs from breakage and gives the appearance of denser, glossier brows and lashes',
      tradition: 'Castor oil is one of the oldest cultivated oil crops; traditional South Asian women used arandi tel for hair and eyebrow care for centuries; the practice has been globalised through social media (the "castor oil for brows" trend was enormous)'
    }
  },
  hairRituals: {
    champi: {
      name: 'Champi (Indian Head Massage)',
      description: 'Champi (from the Sanskrit champī, root of the English word "shampoo") is a traditional Indian scalp and hair massage performed with warm oil (sesame, coconut, or amla oil); the massage stimulates circulation to the scalp, nourishes hair follicles, reduces stress (scalp massage measurably reduces cortisol), and deeply conditions the hair',
      tradition: 'Champi has been performed for generations in South Asian families; often performed by a family elder on younger family members; still widely offered in South Asian hair salons globally; the global head massage wellness trend is rooted in champi'
    },
    henna: {
      name: 'Henna for Hair Conditioning and Colour',
      description: 'Pure henna (Lawsonia inermis) applied to hair as a conditioning treatment that also imparts an orange-red to burgundy colour depending on processing; traditional across South Asia and the Arab world; henna protein binds to the hair shaft, temporarily filling damage; the lawsone molecule in henna permanently bonds to the keratin proteins in hair',
      science: 'Henna is a legitimate deep conditioning treatment; the protein coating effect is real; however, henna also creates a barrier that can make subsequent chemical treatments (bleaching, perming) unpredictable; full transparency with hairdressers about henna history is essential before chemical services'
    }
  }
};

export const CARIBBEAN_RITUALS = {
  community: 'Caribbean',
  skinRituals: {
    seaMoss: {
      name: 'Sea Moss Gel Treatment',
      description: 'Irish moss (Chondrus crispus) or sea moss (Gracilaria; several species) soaked and blended into a gel; used topically as a face and body mask and also consumed internally; the gel is rich in carrageenan (a polysaccharide with gelling, moisturising properties); also contains minerals including iodine, zinc, and magnesium',
      cultural: 'Sea moss use has deep roots in Caribbean wellness traditions, especially in Jamaica, Barbados, and Trinidad; the holistic health movement led by figures including Dr. Sebi has made sea moss gel massively popular in Caribbean diaspora communities globally; sea moss facial masks provide temporary hydration and a moisturising film'
    },
    aloeVera: {
      name: 'Fresh Aloe Vera Treatment',
      description: 'Cutting a fresh aloe vera leaf and applying the gel directly from the plant to the face and body; aloe vera grows prolifically in Caribbean climate; most effective when fresh (fresh gel contains acemannan polysaccharide, enzymes, and growth factors; processed aloe gel loses many active compounds)',
      science: 'Aloe vera has genuine evidence for: wound healing acceleration; mild anti-inflammatory effects; temporary skin hydration; sunburn soothing; direct application from a fresh leaf is optimal vs processed products; the tradition of keeping an aloe plant in the garden for cosmetic and medicinal use is embedded in Caribbean culture'
    },
    lime: {
      name: 'Lime Juice Treatment — WITH CRITICAL WARNING',
      description: 'Applying lime or lemon juice to the skin for brightening is a traditional practice across the Caribbean (and globally); lime juice contains citric acid (AHA) and vitamin C; the brightening effect is partly real due to AHA exfoliation',
      WARNING: 'PHYTOPHOTODERMATITIS RISK: this practice has a serious known risk; the furanocoumarins in citrus (particularly bergapten/5-MOP in lime, lemon, and especially bergamot) are photosensitising — when skin with citrus juice is exposed to UV light, a severe photochemical burn reaction occurs that causes dramatically worse hyperpigmentation than the original concern; this reaction can cause permanent dark spots; the risk is especially high in Caribbean outdoor environments with high UV intensity; this practice should be strongly discouraged and safer alternatives (vitamin C serum, gentle AHAs) should be used instead'
    }
  },
  hairRituals: {
    coconut: {
      name: 'Coconut Oil Pre-Wash Treatment',
      description: 'Applying coconut oil to hair before washing; traditional in Caribbean communities particularly for the Afro-Caribbean hair types; reduces protein loss during washing; conditions the scalp; specific to Caribbean identity through the availability of fresh coconuts for oil pressing',
      deepCondition: 'Caribbean practice of hot oil treatment: coconut oil warmed (or left in hair under a plastic cap in the hot sun) for deeper penetration; the heat opens the cuticle slightly and aids oil penetration'
    },
    blackCastor: {
      name: 'Jamaican Black Castor Oil (JBCO)',
      description: 'Jamaican Black Castor Oil is produced by roasting castor beans before pressing (creating a distinctive dark colour and nutty aroma with ash content); the roasting process partially breaks down ricin (making it safer) and creates the distinctive colour; a beloved heritage hair product in Jamaica that became globally popular through natural hair communities',
      use: 'Applied to scalp for hair growth support; to edges for edge restoration; as a sealant in LOC method for natural Afro-Caribbean hair; the traditional Jamaican practice of applying to thinning scalp areas has been carried through generations'
    }
  }
};

export const ARAB_RITUALS = {
  community: 'Arab',
  skinRituals: {
    blackSeed: {
      name: 'Black Seed Oil (Habbatus Sauda) Treatment',
      description: 'Nigella sativa oil applied topically for skin conditions; anti-inflammatory (thymoquinone); antimicrobial; antioxidant; used in traditional Islamic medicine ("a cure for everything except death" — hadith reference); both oral and topical use are traditional; evidence supports anti-inflammatory and skin-barrier supporting properties',
      ritual: 'Mixing black seed oil with honey as a face mask; applying black seed oil to problematic skin areas; consuming black seed daily for systemic skin benefits; the religious significance means the ritual has spiritual as well as cosmetic meaning for Muslim communities'
    },
    rosewater: {
      name: 'Rose Water (Ma\' al-Ward)',
      description: 'Rose water (ma\' al-ward — "water of the rose" in Arabic) is deeply embedded in Arab beauty and culinary tradition; Iran and Morocco are major rose water producing regions (Persian rose traditions); the Moroccan city of Kelaat M\'Gouna holds an annual Rose Festival; traditional use in hammam (bathhouse) rituals, as a skin toner, in cooking (kunafa, Turkish delight, rice pudding)',
      hammam: 'The hammam (Arab bathhouse) is a centralised beauty institution across the Arab world; a full hammam ritual involves: steam room for deep pore opening; vigorous exfoliation with a kessa (exfoliating mitt) and black soap (savon beldi); nourishing ghassoul clay mask application; full body moisturising with argan oil or shea butter; the hammam is a social ritual as much as a beauty treatment'
    },
    ghassoul: {
      name: 'Ghassoul (Rhassoul) Clay Mask',
      description: 'Ghassoul is a volcanic clay mined exclusively from the Atlas Mountains of Morocco (the name derives from the Arabic root meaning "to wash"); used for centuries in Moroccan and broader Arab beauty traditions for hair and skin cleansing; has exceptional oil-absorption and adsorption (attracting impurities to its surface) properties; gentler than many clays due to its relatively high pH',
      use: 'Mixed with water or rose water to form a paste; applied to face as a mask or worked through hair as a cleansing treatment; popular as a shampoo alternative in "no-poo" (no shampoo) natural hair communities; the Moroccan hammam traditionally uses ghassoul as part of the full treatment'
    },
    argan: {
      name: 'Argan Oil Treatment (Zit Argan)',
      description: 'Argan oil from the nuts of the Moroccan Argan tree (Argania spinosa) — a tree found only in Morocco; pressed by Berber women\'s cooperatives using traditional or semi-mechanical methods; one of the world\'s most expensive oils due to geographic limitation and labour-intensive production; "liquid gold" of Morocco',
      tradition: 'Traditional Berber women have used argan oil for generations: as a moisturiser; on hair; as a cooking oil; the argan industry supports thousands of Moroccan Berber women through cooperatives; buying from cooperative-certified sources ensures the traditional producers benefit'
    }
  },
  hairRituals: {
    henna: {
      name: 'Henna Hair Treatment and Staining',
      description: 'Traditional Arab henna use for hair: conditioning and colour; common in North Africa and throughout the Arab world; the lawsone in henna produces an orange-red colour that deepens with processing; mixing with cassia (neutral henna) for conditioning without colour; mixing with indigo for brown/black tones',
      bodyArt: 'Henna body art (mehndi in South Asian cultures; naqsh in Arabic) for ceremonial occasions; intricate geometric Arabic patterns vs flowing Indian patterns; Eid celebrations, weddings, and other occasions traditionally involve henna application; the tradition stretches back thousands of years across the region'
    },
    blackSeedScalp: {
      name: 'Black Seed Scalp Treatment',
      description: 'Black seed oil (Nigella sativa) applied to the scalp for hair growth and scalp health; traditional practice across Arab communities; the anti-inflammatory properties address scalp inflammation that can inhibit hair growth; regularly cited in Islamic wellness texts as beneficial for hair; the antimicrobial thymoquinone addresses scalp microbiome imbalances'
    }
  }
};

export const LATINA_RITUALS = {
  community: 'Latina/Latin American',
  skinRituals: {
    avocado: {
      name: 'Avocado Face Mask',
      description: 'Fresh avocado mashed and applied as a face mask; traditional Mexican and Central American beauty practice; avocado provides: oleic acid (deeply nourishing for the skin barrier); vitamin E (antioxidant); potassium; squalene; the Aztec civilisation cultivated avocado and used it medicinally and cosmetically before European contact',
      modern: 'The mashed fresh avocado mask tradition has crossed from traditional practice into mainstream global beauty (avocado face masks are now sold widely); the optimal version remains the traditional fresh avocado, perhaps with a squeeze of lemon (carefully — see phytophotodermatitis warning) or honey'
    },
    manzanilla: {
      name: 'Manzanilla (Chamomile) Treatment',
      description: 'Chamomile (manzanilla) tea rinse for hair lightening and scalp soothing; traditional Latin American practice of rinsing hair with cooled chamomile tea; apigenin in chamomile has mild hair-lightening properties in sun; the anti-inflammatory properties soothe scalp irritation; chamomile tea applied to irritated skin or sunburned skin as a calming treatment',
      internalUse: 'Chamomile tea is also deeply embedded in Latin American wellness culture as a digestive, sleep, and stress remedy (te de manzanilla); the gut-skin axis connection means the traditional internal use may have indirect skin benefits'
    },
    papayaMask: {
      name: 'Papaya Enzyme Mask',
      description: 'Fresh papaya (pawpaw/papaya — native to Mexico and Central America) mashed and applied to the face; papain enzyme in papaya is a natural exfoliant that breaks down dead skin cells (protein-degrading enzyme — protease); particularly effective as an exfoliating mask for brightening and smoothing skin texture',
      tradition: 'Papaya is used medicinally and cosmetically across Latin America and the Caribbean; the enzymatic exfoliation mechanism was intuited by traditional use long before the science was understood; commercial cosmetic papaya enzyme masks simply concentrate what traditional masks achieved with fresh fruit'
    },
    honey: {
      name: 'Honey (Miel) Mask',
      description: 'Raw honey applied as a face mask; particularly Manuka-adjacent honeys from local Latin American flowers; honey is a humectant; antibacterial (hydrogen peroxide production; methylglyoxal in specific honey types); anti-inflammatory; wound-healing properties (honey wound dressings are evidence-based medical treatments); traditional use across all Latin American cultures for skin and wound care',
      specifics: 'Mexican flora includes diverse endemic flowering plants that produce distinctive honeys (including honey from the native Mexican bee Melipona — stingless bee honey has particularly high antioxidant content in some studies); Colombian flower honey; Chilean honey from endemic flora'
    }
  },
  hairRituals: {
    avocado: {
      name: 'Avocado Deep Conditioning Treatment',
      description: 'Mashed avocado applied to hair as a deep conditioning mask; oils and vitamin E penetrate the hair shaft; particularly beneficial for dry, wavy, or curly Latina hair textures; mixed with egg (protein) and olive oil for a comprehensive treatment',
      tradition: 'Traditional Latin American hair beauty rituals often centred on whatever nourishing foods were available; avocado oil for hair is a natural extension of the avocado\'s deep cultural significance in Mexican and Central American culture'
    },
    beerRinse: {
      name: 'Beer Hair Rinse',
      description: 'Rinsing hair with flat beer as a conditioning treatment; traditional Latin American (particularly Mexican and Argentine) home beauty remedy; beer contains malt sugars that temporarily coat the hair shaft and add shine; B vitamins in beer; the hops provide mild scalp-stimulating effect; the result is temporarily glossier, bouncier hair',
      science: 'The effect is real but temporary: the sugar coating washes out with the next shampoo; not a structural hair treatment; the tradition provides the cosmetic benefit of a temporary shine-enhancing hair rinse with an entirely natural product'
    }
  }
};

export const EAST_ASIAN_RITUALS = {
  community: 'East Asian',
  skinRituals: {
    riceMilk: {
      name: 'Rice Water / Rice Milk Treatment',
      description: 'Rice water (the starchy water left after washing rice, or water in which rice has been fermented) used as a facial toner and hair rinse; traditional Japanese (kome no toka — rice bran water) and Korean beauty practice; the court ladies of the Heian period in Japan (794-1185 CE) are said to have maintained beautiful skin and extraordinarily long hair using rice water; the women of the Yao tribe in Longji, China, who reportedly maintain hair up to 6 feet long, use fermented rice water',
      science: 'Rice water contains: inositol (a carbohydrate that can penetrate the hair and repair damage from inside; notably inositol remains in the hair even after rinsing — one of the few hair care ingredients that does this); ferulic acid (antioxidant); amino acids; trace minerals; the fermented version contains additional organic acids and live organisms that may enhance skin benefits'
    },
    greenTeaMask: {
      name: 'Green Tea (Matcha) Skin Treatment',
      description: 'Used matcha or green tea applied to the face as a mask or toner; traditional Japanese and Korean practice; the catechins (especially EGCG) in green tea are potent antioxidants; anti-inflammatory; some evidence for anti-acne effects; matcha provides a higher concentration of EGCG per gram than steeped green tea',
      ritual: 'The Japanese tea ceremony (chado/chadō) — though primarily a spiritual and aesthetic practice — also functions as a mindfulness ritual with measurable stress-reducing effects; the application of matcha or green tea in beauty rituals connects to the same tradition of honouring the plant'
    },
    camellia: {
      name: 'Camellia Oil Treatment',
      description: 'Tsubaki oil (camellia oil) from Camellia japonica seeds; traditional Japanese beauty oil; very high in oleic acid (~85%) which mimics the skin\'s own sebum profile and penetrates well; used by Japanese geisha as a makeup remover and skin treatment; also used on hair for shine and protection; the island of Oshima in Japan is famous for camellia oil production',
      modern: 'Camellia oil has become a global luxury beauty ingredient; Japanese brands (Kosé, Shiseido, Shu Uemura) have elevated camellia into premium products; its cultural roots in geisha beauty culture (the Japanese ideal of flawless skin) enhance its prestige'
    },
    jadeRolling: {
      name: 'Jade Rolling and Gua Sha',
      description: 'Traditional Chinese facial massage tools; jade rollers (rolling cool jade over the face) are mentioned in Chinese beauty texts dating back to the Qing dynasty (1644-1912); gua sha (scraping technique) has origins in Traditional Chinese Medicine as a therapeutic treatment that has been adapted for facial use',
      science: 'The primary demonstrated benefit is lymphatic drainage enhancement — reducing morning facial puffiness by moving lymph fluid; temporary skin tightening from increased circulation; the "cooling" effect of jade is largely from temperature rather than jade\'s specific properties (any cool stone provides similar benefits); however, the ritual aspect and consistent skin massage do genuinely improve circulation and product absorption'
    }
  },
  hairRituals: {
    fermentedRiceWater: {
      name: 'Fermented Rice Water Hair Rinse',
      description: 'Hair rinsed with fermented rice water; traditional in East Asia (particularly the Yao women tradition in China); the fermentation process produces pitera (the name given by SK-II to the ferment filtrate found in sake breweries, where workers had notably young-looking hands); organic acids from fermentation adjust hair pH (closing the cuticle for shine); inositol penetrates and repairs',
      practical: 'Soak rinsed rice in water for 30 minutes to 24 hours (fermented versions 24-48 hours at room temperature); strain and use as a final rinse after shampooing and conditioning; the smell of fermented rice water is distinctive and can be strong; diluting with water or adding essential oil drops reduces the odour'
    },
    camelliaHair: {
      name: 'Camellia Oil Hair Treatment',
      description: 'Tsubaki camellia oil applied to hair and scalp; traditional Japanese geisha practice; high oleic acid content makes it suitable for adding shine to the hair and sealing the cuticle; used particularly on the ends of Asian hair (which tends to be long, straight, and prone to split ends) for protection'
    }
  }
};

export const EAST_AFRICAN_RITUALS = {
  community: 'East African',
  skinRituals: {
    frankincense: {
      name: 'Frankincense (Etan/Lubaan) Treatment',
      description: 'Frankincense resin (from Boswellia sacra, B. papyrifera, B. serrata) is historically significant in Ethiopia, Somalia, and Eritrea — Boswellia trees are native to the Horn of Africa and the Arabian Peninsula; traditionally burned as incense in homes and churches (Ethiopian Orthodox Christianity and Somali Islamic traditions both use frankincense extensively); also applied directly to skin as a resin paste or oil infusion for anti-inflammatory skin treatment',
      science: 'Boswellic acids in frankincense resin are genuinely anti-inflammatory — they inhibit 5-lipoxygenase (5-LOX), the enzyme that produces pro-inflammatory leukotrienes; some evidence for anti-ageing effects through inhibiting collagenase (the enzyme that breaks down collagen); the ritual incense burning (tef incense in Ethiopian tradition) is itself a wellness practice through the olfactory cortex stress pathway'
    },
    coffeeScrub: {
      name: 'Coffee Ground Skin Scrub',
      description: 'Ground coffee used as a body scrub; Ethiopia is the birthplace of coffee and the coffee plant (Coffea arabica) is native to Ethiopia; ground coffee provides: physical exfoliation; caffeine absorbed through the skin temporarily constricts blood vessels (reducing appearance of cellulite temporarily); antioxidant polyphenols; the tradition of using coffee grounds for skin care is natural in coffee-growing regions',
      tradition: 'The Ethiopian coffee ceremony (buna) involves three rounds of coffee; the final round (bereka) uses the third brewing of the same grounds; traditional use of cooled, spent grounds for skin exfoliation follows naturally from this cultural centrality of coffee in Ethiopian life'
    },
    tetePaper: {
      name: 'Gesho (Hop Leaves) and Teff Hair Rinse',
      description: 'Gesho (Rhamnus prinoides — an endemic Ethiopian plant used primarily in brewing tella and tej, Ethiopian beers) has traditional use in hair care as well; teff grain water used as a hair rinse; traditional East African women\'s beauty practices involving indigenous plants that are less well-documented in mainstream beauty literature but represent significant knowledge systems'
    }
  },
  hairRituals: {
    chebe: {
      name: 'Chebe Powder Hair Treatment',
      description: 'Chebe powder (from the seeds of Croton gratissimus, also called lavender croton; supplemented with other plant materials including shebe — dried resin — and fragrant plants) is a traditional Chadian hair treatment that has become widely adopted in Black natural hair communities globally; Chadian women are famous for very long natural hair attributed to chebe use',
      mechanism: 'Chebe is applied by mixing with an oil (typically shea or coconut) and massaging into hair, particularly the lengths; the mechanism of action is debated — the physical coating effect from the plant resins and oils may reduce breakage rather than stimulating growth; the tradition focuses on moisture retention and protective coating of the hair shaft rather than scalp application',
      globalSpread: 'Chebe became globally popular through social media circa 2018-2019 when natural hair bloggers and YouTubers shared the Chadian women\'s tradition; it is now available through African beauty suppliers globally'
    },
    castorOil: {
      name: 'Castor Oil Scalp Treatment',
      description: 'Black castor oil applied to scalp and hair; widely used across East Africa for hair health; the anti-inflammatory ricinoleic acid addresses scalp inflammation; castor oil\'s thick consistency creates an occlusive coating that reduces moisture loss from hair'
    }
  }
};

export const SOUTH_AFRICAN_RITUALS = {
  community: 'South African',
  skinRituals: {
    rooibos: {
      name: 'Rooibos Tea Skin Treatment',
      description: 'Cooled rooibos tea used as a facial toner or applied to skin with cotton pads; the tea can also be used as a bathing soak; rooibos (Aspalathus linearis) is uniquely South African, growing only in the Cederberg mountain region of the Western Cape; naturally caffeine-free; anti-inflammatory; the antioxidant aspalathin is unique to rooibos and not found in any other plant',
      tradition: 'Rooibos skin use is a relatively recent traditional practice compared to ancient South African plant knowledge; Cape Malay and Afrikaner communities have incorporated rooibos into skin and hair care; modern South African natural beauty brands (Africology, African Botanics, Skin Creamery) have elevated rooibos as a signature South African beauty ingredient'
    },
    marula: {
      name: 'Marula Oil Treatment',
      description: 'Oil from the seeds of the marula tree (Sclerocarya birrea); the marula tree is native to southern Africa (also growing north into East Africa); Swazi women have been using marula oil for skin and hair for centuries; the tree is integral to southern African culture including producing marula beer (the fermented fruit) and the traditional fat extracted from seeds',
      science: 'Marula oil is high in oleic acid (~70%) and linoleic acid; antioxidant tocotrienols and tocopherols; absorbed quickly into the skin without greasiness; used as a luxury facial oil; Africology\'s Marula Oil is a flagship South African beauty product; used as a pre-colour treatment in hair (seals and protects before hair dye application)'
    },
    buchu: {
      name: 'Buchu (Agathosma betulina) Treatment',
      description: 'Buchu is an indigenous South African plant (Cape fynbos endemic) with a long history in Khoikhoi and San traditional medicine; strong medicinal herb with anti-inflammatory and diuretic properties; used by indigenous South Africans for skin healing; the unique aromatic compounds in buchu (diosphenol) give it a distinctive blackcurrant-like scent',
      contemporary: 'Buchu-based skincare is growing in South African artisan beauty; used in anti-inflammatory skin treatments; the fynbos region of South Africa has extraordinary botanical diversity that is increasingly being explored for beauty applications'
    }
  },
  hairRituals: {
    shea: {
      name: 'Shea Butter for Protective Styles',
      description: 'Shea butter used as a moisturising sealant in natural hair care; widely used across Black South African communities for natural and protective hairstyles; the sealing of moisture is particularly important in the dry Highveld climate'
    },
    castor: {
      name: 'Castor Oil for Hair and Edge Growth',
      description: 'Castor oil tradition in Black South African hair care; applied to scalp and particularly to hair edges (the delicate hairline area often stressed by tight protective styles); ricinoleic acid provides anti-inflammatory scalp environment; the thick oil creates a protective coating'
    }
  }
};

export const BLACK_AMERICAN_RITUALS = {
  community: 'Black American',
  skinRituals: {
    shea: {
      name: 'Shea Butter as Daily Body Ritual',
      description: 'Applying raw shea butter after bathing as a daily body moisturising ritual; deeply ingrained in Black American beauty culture; raw unrefined shea butter has a distinctive scent (some find it strong) and is slightly grainy; the graininess can be reduced by melting and re-cooling or whipping; provides intense moisturising appropriate for the typically drier skin of Fitzpatrick V-VI types',
      importance: 'Shea butter has become one of the most culturally significant beauty products in Black American culture; raw shea has cultural associations with African heritage and connection to natural beauty traditions; the growth of natural Black beauty (particularly after the natural hair movement) has elevated shea butter from pharmacy product to cultural statement'
    },
    blackSoap: {
      name: 'African Black Soap',
      description: 'African black soap (ose dudu in Yoruba; alata samina in Ghana) is made from dried plantain skin ash, palm kernel oil, cocoa pod ash, shea butter, and water; originated in West Africa and has been widely adopted in Black American natural beauty communities; genuinely cleansing (the ash provides the alkaline pH for saponification), moisturising (shea butter, palm kernel oil), and has some antimicrobial properties',
      considerations: 'Raw African black soap is highly alkaline (pH 9-11) which can be irritating to some; formulated versions in bars or liquid have adjusted pH; the exfoliating texture of the ash particles can be abrasive if used too vigorously; very effective for oily skin and acne; can be drying for sensitive or dry skin types'
    }
  },
  hairRituals: {
    naturalMoisture: {
      name: 'LOC/LCO Method',
      description: 'The LOC method (Liquid, Oil, Cream) and LCO method (Liquid, Cream, Oil) are structured moisture layering techniques developed within the Black American natural hair community; applied in order to wet or damp hair to maximise moisture retention in highly porous natural hair (particularly Type 4 coils)',
      rationale: 'LOC: Liquid (water or leave-in conditioner) provides moisture; Oil seals the moisture in; Cream (heavier butter or cream) provides an outer protective layer; LCO is preferred for fine or low-porosity hair (where the oil is applied last to allow the cream to penetrate first); this technique addresses the unique challenge of maintaining moisture in highly coily hair that loses moisture rapidly due to the bent structure interrupting cuticle sealing'
    },
    gratitude: {
      name: 'Natural Hair Affirmation Rituals',
      description: 'Beyond product application, the natural hair community has developed rituals of affirmation and celebration around caring for natural hair; wash day (the dedicated day for washing, conditioning, and styling natural hair — a multi-hour process) has become a self-care ritual; the natural hair YouTube community, content creators like Naptural85 and CurlyPenny, have transformed hair care into community and identity affirmation'
    }
  }
};

export const ALL_TRADITIONAL_RITUALS = {
  'west-african': WEST_AFRICAN_RITUALS,
  'south-asian': SOUTH_ASIAN_RITUALS,
  caribbean: CARIBBEAN_RITUALS,
  arab: ARAB_RITUALS,
  latina: LATINA_RITUALS,
  'east-asian': EAST_ASIAN_RITUALS,
  'east-african': EAST_AFRICAN_RITUALS,
  'south-african': SOUTH_AFRICAN_RITUALS,
  'black-american': BLACK_AMERICAN_RITUALS
};

export function getTraditionalRituals(communityId) {
  const directMap = {
    'west-african': ALL_TRADITIONAL_RITUALS['west-african'],
    'south-asian': ALL_TRADITIONAL_RITUALS['south-asian'],
    caribbean: ALL_TRADITIONAL_RITUALS.caribbean,
    arab: ALL_TRADITIONAL_RITUALS.arab,
    latina: ALL_TRADITIONAL_RITUALS.latina,
    'east-asian': ALL_TRADITIONAL_RITUALS['east-asian'],
    'east-african': ALL_TRADITIONAL_RITUALS['east-african'],
    'south-african': ALL_TRADITIONAL_RITUALS['south-african'],
    'black-american': ALL_TRADITIONAL_RITUALS['black-american']
  };
  return directMap[communityId] || null;
}

export const TRADITIONAL_BEAUTY_STATS = {
  moduleId: 'traditional_beauty_rituals',
  version: '1.0.0',
  topics: ['ubtan chickpea turmeric bridal haldi ceremony South Asian', 'shea butter West African Sahel traditional skin hair', 'hammam Arab bathhouse kessa beldi soap ghassoul Morocco', 'rice water fermented inositol Yao women China hair', 'frankincense Boswellia Ethiopia Somalia anti-inflammatory', 'chebe powder Chad natural hair length tradition', 'sea moss Caribbean Irish moss wellness Dr Sebi', 'marula oil South Africa Swazi Sclerocarya birrea', 'rooibos Cederberg Western Cape skin anti-inflammatory', 'black soap ose dudu Yoruba Ghana plantain ash', 'LOC LCO method Black American natural hair moisture', 'phytophotodermatitis lime Caribbean citrus furanocoumarin WARNING', 'camellia tsubaki oil Japanese geisha beauty', 'castor oil Jamaican black roasted JBCO natural hair', 'argan Berber Morocco cooperative Argania spinosa', 'lime phytophotodermatitis Caribbean warning UV citrus PIH'],
  communitiesSupported: 9,
  keyFacts: [
    'Ubtan (the traditional South Asian pre-bridal paste of chickpea flour, turmeric, and rose water) contains multiple validated active ingredients: chickpea flour provides gentle AHA-type exfoliation through its saponin content; turmeric\'s curcumin inhibits tyrosinase (anti-pigmentation) and is anti-inflammatory through multiple pathways; lactic acid in milk provides additional AHA exfoliation — modern dermatologists confirm many ubtan ingredients are genuinely beneficial, making this one of the best-validated traditional beauty practices',
    'Fermented rice water contains inositol — one of the very few hair care ingredients that has been shown to remain in the hair shaft even after rinsing (hair fibres actively retain it); this property means inositol provides ongoing repair of damaged hair between applications; the tradition of the Yao women of Longji, China using fermented rice water for their reportedly extraordinary 6-foot-long hair is the most famous example of this practice',
    'CRITICAL WARNING: Traditional practices involving citrus juice (lime, lemon) applied to skin in Caribbean, Latina, and other communities carry significant phytophotodermatitis risk; the furanocoumarins in citrus (particularly bergapten) cause a photochemical burn reaction when citrus-treated skin is exposed to UV light, resulting in severely worsened hyperpigmentation that may be permanent; this risk is especially high in high-UV Caribbean and tropical environments; safer alternatives including vitamin C serums and professional AHA treatments should be recommended instead',
    'The hammam (Arab bathhouse ritual) is one of the world\'s most comprehensive traditional beauty treatments: the complete ritual (steam room, kessa exfoliation, black soap/savon beldi cleanse, ghassoul clay mask, argan oil moisturisation) provides a full skincare treatment that addresses cleansing, exfoliation, pore clearing, and deep moisturisation; all of the individual components have validated effects; the hammam as a social institution also provides significant stress reduction through community interaction'
  ]
};
