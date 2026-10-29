// festival_beauty_ethnic_guide.js
// Festival and celebration beauty traditions across 9 ethnic communities
// Covers signature festivals, makeup, hair, adornment, modern adaptations, DIY recipes

export const ETHNIC_FESTIVAL_BEAUTY_GUIDES = {

  // ─────────────────────────────────────────────────────────────────────────
  // WEST AFRICAN
  // ─────────────────────────────────────────────────────────────────────────
  'west-african': {
    id: 'west-african',
    title: 'West African Festival Beauty',
    subtitle: 'Durbar, Naming Ceremonies, Harvest & Masquerade Beauty Traditions',
    overview: `West African festival beauty is a living archive of cultural memory. From the
grand Durbar festivals of northern Nigeria and Ghana's Homowo harvest celebrations
to the sacred masquerade festivals of the Igbo, Yoruba, and Akan peoples, beauty
in these contexts is never purely aesthetic — it is spiritual, social, and ancestral.
Adornment communicates clan identity, marital status, spiritual protection, and
communal belonging. The colours, patterns, and materials used carry layered meanings
passed through generations of oral tradition.`,
    festivals: [
      {
        name: 'Durbar Festival',
        regions: ['Northern Nigeria', 'Ghana'],
        timing: 'Eid al-Fitr and Eid al-Adha, also coronation celebrations',
        description: `The Durbar is one of West Africa's most visually spectacular festivals,
celebrated by the Hausa-Fulani, Kanuri, and other northern Nigerian peoples as well
as in the Northern Region of Ghana. Emirs, chiefs, and their cavalry parade in
brilliant regalia — turbans, flowing robes, silver and gold embroidery — while
drummers, trumpeters, and praise-singers create a thundering procession.`,
        beautyFocus: {
          makeup: [
            'Kohl (tiro) applied heavily around the eyes — both men and women',
            'Black kohl lines extended dramatically past the outer corner',
            'Indigo-dyed lips for women of Tuareg and Fulani heritage',
            'Henna on hands and feet completed one to two days before the festival',
            'Face lightened with shea-based powder mixed with ground rice',
          ],
          hair: [
            'Fulani women braid hair with gold coins, amber beads, and cowrie shells woven in',
            'Five-strand Fulani braids adorned with metal rings at the ends',
            'Hair oiled with shea butter and scented with black seed (habatus-sauda) oil',
            'Elaborate hairpieces constructed from horsehair for ceremonial grandeur',
          ],
          adornment: [
            'Heavy gold and silver filigree earrings — the Fulani calabash earring style',
            'Amber bead necklaces indicating wealth and fertility',
            'Leather amulets (tira) worn for spiritual protection during the procession',
            'Embroidered boubou or kaftan in indigo, green, white, or royal purple',
          ],
          modernAdaptations: [
            'Black liquid eyeliner used instead of traditional tiro in urban settings',
            'Gold and amber jewelry replicated in fashion jewelry for everyday festivalgoers',
            'Henna applied with cone applicators for finer geometric Fulani patterns',
            'Social media influencers styling Fulani braids for international audiences',
          ],
        },
      },
      {
        name: 'Naming Ceremony (Outdooring / Naming Day)',
        regions: ['Ghana', 'Nigeria', 'Senegal', 'Sierra Leone'],
        timing: 'Seven or eight days after birth (varies by ethnic group)',
        description: `The naming ceremony — called Outdooring among the Akan, Ebi among the Yoruba,
Aqiqah-influenced Koobi among Hausa Muslims — is among the most important family
celebrations in West Africa. The mother and child are formally introduced to the
community, gifts are given, and the child's name is announced. The mother's
post-birth beauty preparation is a communal act of love.`,
        beautyFocus: {
          makeup: [
            'Mothers use camwood paste (osun) mixed with palm kernel oil for a rich red-orange glow',
            'White clay (efun / calabash chalk) dotted on forehead, cheeks, and chin for spiritual protection',
            'Eyes lined with native black eyeliner made from ground ogiri and carbon',
            'Lips darkened with shea mixed with crushed dried fruits for natural stain',
          ],
          hair: [
            'Gele (headwrap) tied in elaborate styles — the taller the gele, the more festive',
            'Cornrows or flat twists as foundation under the gele',
            'Hair moisturized with coconut oil and shea butter blend one week prior',
            'Ankara-print fabric used to wrap the gele to match the aso-ebi (coordinated outfits)',
          ],
          skinPrep: [
            'Steam bath (ose dudu black soap steam) performed three to five days before ceremony',
            'Full body scrub with ground oatmeal and raw honey two days before',
            'Shea butter body butter applied daily from day five postpartum',
            'Turmeric paste on face for brightening the skin post-delivery',
          ],
          diyRecipes: [
            {
              name: 'Camwood Ceremony Glow Paste',
              ingredients: ['2 tbsp camwood powder', '1 tbsp palm kernel oil', '1 tsp honey', '5 drops frankincense oil'],
              method: 'Mix camwood with palm kernel oil into a smooth paste. Add honey and frankincense. Apply to face and neck 30 minutes before ceremony. Rinse and follow with shea butter.',
            },
            {
              name: 'Black Soap Pre-Event Face Steam',
              ingredients: ['1 bar African black soap', '4 cups hot water', 'dried lemongrass', 'eucalyptus leaves'],
              method: 'Dissolve black soap in hot water. Add lemongrass and eucalyptus. Drape towel over head and steam face for 10 minutes. Pat dry and apply camwood paste.',
            },
          ],
        },
      },
      {
        name: 'Homowo Harvest Festival',
        regions: ['Accra, Ghana (Ga people)'],
        timing: 'August–September',
        description: `Homowo (meaning "hooting at hunger") commemorates a historical famine survived
by the Ga people. Families reunite, libations are poured for ancestors, and the
traditional dish kpokpoi is shared. Women dress in elaborate kente or wax-print cloth
with layered gold jewelry. The festival is both solemn and celebratory.`,
        beautyFocus: {
          makeup: [
            'Kente-complementary eyeshadow in gold, forest green, and burgundy',
            'Dewy skin achieved with shea butter pressed into warm damp skin',
            'High-gloss lip in deep plum or brick red',
            'White kaolin clay designs painted on cheeks as ancestral symbols',
          ],
          hair: [
            'Women wear elaborate wigs or extensions styled in upswept designs',
            'Gold thread woven into braids and twists',
            'Scalp oiled with coconut and argan blend for shine',
          ],
        },
      },
      {
        name: 'Masquerade Festival (Mmonwu / Egungun)',
        regions: ['Igboland, Nigeria (Mmonwu)', 'Yorubaland, Nigeria/Benin (Egungun)'],
        timing: 'Varies — dry season, new year, harvest, and funeral contexts',
        description: `Masquerade festivals bridge the world of the living and the ancestors. Masquerades
are considered embodiments of the ancestral spirits. Attendees dress in their finest
to honor the spirits. Women in particular adorn themselves to show reverence, community
standing, and beauty as spiritual offering.`,
        beautyFocus: {
          makeup: [
            'Yoruba women use iyun (coral) and osun for ceremonial face marking',
            'Tribal marks, if worn, freshened with camwood for photographic clarity',
            'Aso-oke headtie (gele) in ippele red for married Yoruba women',
            'Bright orange or red lipstick to complement coral jewelry',
          ],
          hair: [
            'Yoruba onilegogoro (sky-high) gele styles at their most elaborate',
            'Igbo women wear isi agu fabric tied into structured headwraps',
            'Cornrows left exposed at the back as decorative base for the gele',
          ],
          adornment: [
            'Layers of coral beads (iyun) — the more strands, the higher the status',
            'Bronze or brass ankle bangles for Igbo women',
            'Tie-dye adire fabric or traditional George wrapper in deep tones',
          ],
        },
      },
    ],
    generalBeautyPrinciples: [
      'Skin luminosity is a marker of health and blessing — shea butter is foundational',
      'White clay and camwood are sacred cosmetic pigments, not merely decorative',
      'Jewelry quantity communicates life-stage and social standing',
      'Headwear is the centrepiece of the look — invest disproportionate time there',
      'Scent matters deeply: shea, black soap, incense, and perfume oils layer together',
    ],
    diyRecipes: [
      {
        name: 'West African Festival Glow Oil',
        ingredients: ['3 tbsp shea butter', '1 tbsp argan oil', '1 tsp camwood powder', '5 drops ylang-ylang oil', '3 drops frankincense oil'],
        method: 'Melt shea butter gently. Mix in argan oil. Let cool slightly and whisk in camwood powder and essential oils. Apply as a full-body oil for festival day.',
      },
      {
        name: 'Fulani Henna Prep Scrub',
        ingredients: ['3 tbsp ground oatmeal', '2 tbsp raw honey', '1 tbsp lemon juice', '1 tsp turmeric'],
        method: 'Mix all ingredients. Scrub hands and feet in circular motions for 5 minutes. Rinse thoroughly. Apply henna immediately after for maximum color uptake.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOUTH ASIAN
  // ─────────────────────────────────────────────────────────────────────────
  'south-asian': {
    id: 'south-asian',
    title: 'South Asian Festival Beauty',
    subtitle: 'Diwali, Holi, Navratri, and Wedding Season Traditions',
    overview: `South Asian festival beauty is among the world's most richly codified cosmetic
traditions. Festivals are occasions for maximum adornment — layered gold jewelry,
silk saris in electric hues, mehndi (henna) patterns covering both hands to the
elbow, and eyes lined with dark kajal. The beauty preparation process is itself
ritualistic: oiling the hair the night before, bathing with gram flour paste,
applying the bindi with precision. Each festival has its own colour vocabulary and
its own spiritual significance embedded in the beauty choices made.`,
    festivals: [
      {
        name: 'Diwali — Festival of Lights',
        timing: 'October/November (new moon between Ashwin and Kartik months)',
        description: `Diwali is the largest Hindu festival, celebrated across India, Nepal, Sri Lanka,
and the South Asian diaspora worldwide. The Festival of Lights marks the return of
Rama, the triumph of light over darkness, and the blessings of Lakshmi (goddess of
wealth and beauty). Dressing exquisitely is both a cultural norm and a spiritual act
of welcoming the goddess.`,
        beautyTimeline: {
          tenDaysBefore: [
            'Book mehndi (henna) artist — intricate designs take 2–4 hours',
            'Begin facial with turmeric-milk mask nightly',
            'Hair oiling ritual: warm coconut oil with curry leaves, massaged into scalp',
            'Start vitamin C serum to brighten complexion',
          ],
          threeDaysBefore: [
            'Full body ubtan scrub with gram flour, turmeric, rose water, and saffron',
            'Eyebrow threading or waxing',
            'Get nails done — deep jewel tones, burgundy, or gold glitter',
            'Trial run of jewelry and outfit together',
          ],
          oneDay: [
            'Apply mehndi — leave on minimum 6 hours for deep colour',
            'Deep condition hair with egg and honey mask',
            'Sleep with hair braided loosely and wrapped in silk scarf',
          ],
          dayOf: [
            'Oil bath with sesame or coconut oil before bathing (auspicious tradition)',
            'Apply kajal (kohl) — dramatic cat-eye or smudged kohl circle',
            'Position bindi precisely: oval or teardrop, centred between brows',
            'Full gold jewelry: maang tikka (headpiece), jhumkas (earrings), bangles stacked both wrists',
            'Apply jasmine garland to hair or clip mogra flowers at the base of bun',
          ],
        },
        makeupDetails: {
          eyes: 'Heavy kajal on waterline and lower lid, smudged with fingertip for depth. Gold or bronze eyeshadow on lid. Dramatic wing in black liquid liner.',
          lips: 'Deep berry, plum, or vibrant coral. No gloss — matte or satin for longevity in festive heat.',
          skin: 'Full coverage foundation matched to neck. Set with translucent powder. Dab gold highlighter on cheekbones, cupid\'s bow, and inner eye corner.',
          bindi: 'Traditional red circular bindi for married women. Decorative bindis in crystals, teardrops, or elaborate patterns for unmarried women and modern wearers.',
        },
        diyRecipes: [
          {
            name: 'Diwali Saffron-Turmeric Ubtan',
            ingredients: ['4 tbsp gram flour (besan)', '1 tsp turmeric', '10 saffron strands soaked in 2 tbsp warm milk', '2 tbsp rose water', '1 tbsp raw honey', '1 tsp sandalwood powder'],
            method: 'Soak saffron in warm milk for 10 minutes. Mix all dry ingredients, then add saffron milk, rose water, and honey. Mix to a paste. Apply to face and body, let dry 15 minutes, then scrub off gently in circular motions. The saffron brightens, turmeric evens tone, and gram flour exfoliates.',
          },
          {
            name: 'Diwali Night Hair Oiling Ritual',
            ingredients: ['4 tbsp coconut oil', '10 fresh curry leaves', '5 drops jasmine essential oil', '1 tbsp castor oil', '1 tsp fenugreek seeds'],
            method: 'Heat coconut oil gently. Add curry leaves and fenugreek seeds, simmer 5 minutes. Cool and strain. Add jasmine oil and castor oil. Massage into scalp and hair. Leave overnight wrapped in a warm towel. Shampoo next morning with a gentle cleanser.',
          },
        ],
      },
      {
        name: 'Holi — Festival of Colours',
        timing: 'March (Phalguna Purnima, full moon)',
        description: `Holi is the festival of spring, love, and colour. Powder pigments — gulal — are
thrown joyfully, marking the victory of devotion over evil (the Holika story) and
celebrating the arrival of spring. The central beauty challenge of Holi is protecting
skin and hair from the pigments, which can be harsh, while still fully participating
in the celebration.`,
        beautyPrepProtocol: [
          'Apply coconut oil liberally to entire body — a barrier against pigment absorption',
          'Oil the hair completely from root to tip — prevents colour penetrating the shaft',
          'Apply Vaseline or thick balm around eyes, ears, lips, and cuticles',
          'Wear old clothes — white is traditional to show off the colours',
          'Apply waterproof mascara and eyeliner only — water-based makeup is futile',
          'Skip all other makeup — lean into bare, oiled skin as the festival look',
          'Wear protective sunscreen SPF 50 beneath the oil layer',
        ],
        postHoliCare: [
          'Oil massage before bathing to loosen remaining pigment',
          'Gentle shampoo twice — avoid hot water which opens the cuticle and traps colour',
          'Apply aloe vera gel to skin after bath for soothing',
          'Deep conditioning hair mask with yogurt and honey',
          'Face mask with cucumber and milk to calm any irritation',
        ],
        diyRecipes: [
          {
            name: 'Holi Skin Protection Oil',
            ingredients: ['6 tbsp coconut oil', '2 tbsp sweet almond oil', '1 tbsp castor oil', '10 drops tea tree oil'],
            method: 'Mix all oils. Apply generously to face and body 30 minutes before playing Holi. Reapply to exposed areas as needed. This barrier layer prevents synthetic colour from staining the skin.',
          },
          {
            name: 'Post-Holi Colour Removal Paste',
            ingredients: ['3 tbsp yogurt', '1 tbsp gram flour', '1 tsp lemon juice', '1 tsp coconut oil'],
            method: 'Mix all ingredients into a paste. Apply to colour-stained skin. Leave 10 minutes. Gently massage off under lukewarm water. Repeat once more if needed. Follow with a gentle moisturizer.',
          },
        ],
      },
      {
        name: 'Navratri — Nine Nights of Dance',
        timing: 'September/October (Sharad Navratri is largest)',
        description: `Navratri celebrates the nine forms of the goddess Durga across nine nights of
dance (Garba and Dandiya Raas) in Gujarat, Rajasthan, and across the diaspora. Each
night has a colour associated with one form of the goddess, and celebrants dress in
that colour. The dancing is vigorous — makeup must survive hours of movement.`,
        colourCalendar: [
          'Day 1 — Royal Blue / Shailaputri',
          'Day 2 — Yellow / Brahmacharini',
          'Day 3 — Green / Chandraghanta',
          'Day 4 — Grey / Kushmanda',
          'Day 5 — Orange / Skandamata',
          'Day 6 — White / Katyayani',
          'Day 7 — Red / Kalaratri',
          'Day 8 — Sky Blue / Mahagauri',
          'Day 9 — Pink / Siddhidatri',
        ],
        makeupForDancing: [
          'Use long-wear foundation with setting spray — dancing causes perspiration',
          'Waterproof kajal and mascara are non-negotiable',
          'Bold lip in the night\'s colour — apply, blot, reapply for longevity',
          'Set face with translucent powder and rosewater setting spray',
          'Mirror work (shisha) choli (blouse) reflects light beautifully — complement with subtle shimmer',
          'Avoid heavy contouring — sweat will move it visibly under lights',
        ],
        hairForDancing: [
          'Braids are the most practical option — French braid, Dutch braid, or fishtail',
          'Braids adorned with marigold flowers or gajra (jasmine garland)',
          'If wearing hair open, use strong-hold hair spray and bobby pin the crown',
          'Sweat-absorbing headband in fabric matching the outfit, hidden under hair',
        ],
      },
      {
        name: 'Wedding Season (Shaadi)',
        timing: 'October–March (peak season, avoiding summer heat)',
        description: `South Asian wedding season beauty spans months of preparation. The wedding itself
is typically three or more ceremonies: mehndi night, sangeet (musical night), and
the main wedding day. Each requires its own distinct look.`,
        mehendiNight: {
          beauty: 'Simple, glowing skin — all eyes are on the mehndi patterns. Minimal makeup so the mehndi is the star. Lip tint and mascara only.',
          hair: 'Loose waves or half-up style — hair must be accessible for family to apply mehndi on hands and feet.',
          outfit: 'Yellow traditionally (turmeric colour for auspiciousness), modern brides choose colourful lehengas.',
        },
        sangeetNight: {
          beauty: 'Bold and festive — this is the dance party. Dramatic eye look, glitter, holographic highlighter.',
          hair: 'Fun styles allowed — waterfall braids, tousled waves, side-swept looks. Flower accessories.',
          outfit: 'Vibrant colours — hot pink, electric blue, emerald green.',
        },
        weddingDay: {
          beauty: 'Bridal look: full coverage foundation, dramatic eye, bold or nude lip (bride\'s preference). Professional application recommended.',
          hair: 'Traditional bun adorned with floral jhoomar (headpiece), or modern down-do with curls and dupatta pinned precisely.',
          jewelry: 'Full bridal set — maang tikka, matha patti, nath (nose ring), jhumka, haar (necklace), kamarband (waistband), and payals (anklets).',
        },
      },
    ],
    generalTips: [
      'Prep skin for 10–14 days before any major festival',
      'Kajal and kohl are foundational — invest in a quality waterproof formula',
      'Mehndi colour deepens over 24–48 hours — apply before major events',
      'Layer fragrances: attar (concentrated oil perfume) beneath Western perfume',
      'Gold jewelry is transformative — even costume gold elevates a festival look dramatically',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CARIBBEAN
  // ─────────────────────────────────────────────────────────────────────────
  'caribbean': {
    id: 'caribbean',
    title: 'Caribbean Festival Beauty',
    subtitle: 'Carnival Trinidad, Barbados Crop Over, Jamaica Reggae, and Island Celebration Culture',
    overview: `Caribbean festival beauty is defined by maximum expression — the boldest colours, the
most elaborate headpieces, the most dramatic face paint, and the most sculpted body
presentation possible. Carnival, the crown jewel of Caribbean celebration, is the
festival toward which beauty preparation builds for months. In Trinidad and Tobago,
Barbados's Crop Over, St. Lucia's Jazz Festival, and Notting Hill Carnival in London,
the Caribbean diaspora brings this tradition worldwide. The preparation is as ritual
as the festival itself.`,
    festivals: [
      {
        name: 'Trinidad and Tobago Carnival',
        timing: 'Monday and Tuesday before Ash Wednesday (February/March)',
        description: `Trinidad Carnival is the mother of Caribbean carnivals. It spans J'ouvert (early
morning dark street celebration), followed by Monday Wear and finally Tuesday — the
greatest spectacle. Playing mas (masquerade) in a band means wearing a costume,
which in modern Carnival means tiny, jewelled, feathered, and as revealing as
desired. The full preparation timeline begins months in advance.`,
        beautyTimeline: {
          threeMonthsBefore: [
            'Begin skin lightening prevention — protect skin from sun for even tone',
            'Start body-sculpting routine if desired — diet and targeted exercise',
            'Research and book glitter artist or costume body painter',
            'Choose costume colours and plan complementary makeup palette',
          ],
          oneMonthBefore: [
            'Full body wax or laser hair removal appointment',
            'Begin exfoliating body twice weekly with sugar scrub',
            'Apply coconut oil or body oil nightly for deep moisture',
            'Tan (natural or spray) if desired — ensure even coverage',
            'Nail appointment: press-ons or gel in festival colours',
          ],
          oneWeekBefore: [
            'Final facial — no new products to avoid breakouts',
            'Body scrub daily to remove dead cells and prepare for body glitter application',
            'Hair appointment: protective style, silk press, or wig prep',
            'Eyebrow appointment: shape and tint for maximum definition',
          ],
          dayBefore: [
            'Shave or wax any remaining areas',
            'Full body moisturize with shimmer body butter',
            'Lay out all costume pieces, accessories, and beauty supplies',
            'Apply self-tanner if using — let develop overnight',
            'Prep J\'ouvert kit: old clothes, mud or paint kit if doing traditional J\'ouvert',
          ],
          dayOf: [
            'Wake at 2–3am for J\'ouvert if attending',
            'Body glitter application — chunky, biodegradable preferred',
            'Full face in bold costume-complementary colours',
            'Waterproof everything — humidity, dancing, and rain are guaranteed',
            'Carry touch-up kit: powder, lipstick, extra glitter, body tape',
          ],
        },
        bodyGlitter: {
          applicationMethod: [
            'Apply shimmer body lotion as base — adds luminosity beneath glitter',
            'Use aloe vera gel or body glitter glue as adhesive layer',
            'Apply chunky glitter with a soft makeup brush in sweeping motions',
            'Press glitter into skin firmly — pat, do not rub, for maximum stick',
            'Build in layers for more intense coverage',
            'Biodegradable glitters now widely available and preferred',
          ],
          removalMethod: [
            'Apply coconut oil generously — glitter slides off with oil',
            'Wipe with a warm damp cloth',
            'Shower gently, letting water carry remaining glitter away',
            'Avoid drains — catch glitter in a removable drain cover',
          ],
        },
        facePaint: {
          fullFace: [
            'Prime with silicone-based primer for longevity in heat',
            'Foundation one shade lighter to allow face paint colours to show vibrantly',
            'Use high-pigment face paint or theatrical greasepaint for bold looks',
            'Set all layers with setting spray and translucent powder',
            'Consider: rhinestones glued at temples, cheekbones, and brow arch',
          ],
          popularStyles: [
            'Butterfly masks — blended wings across the eyes and temples',
            'Crystal crown — rhinestones arranged along hairline',
            'Chromatic cut-crease — mirroring the costume\'s metallic tones',
            'Body paint extensions from face down neck and collarbone',
          ],
        },
        diyRecipes: [
          {
            name: 'Carnival Body Shimmer Oil',
            ingredients: ['4 tbsp fractionated coconut oil', '2 tbsp jojoba oil', '2 tbsp fine gold mica powder', '1 tbsp fine silver mica powder', '5 drops vanilla essential oil'],
            method: 'Mix oils thoroughly. Add mica powders and whisk until evenly distributed. Add vanilla for scent. Apply to legs, arms, and shoulders before adding chunky glitter on top. Provides a luminous base that makes glitter adhere longer.',
          },
          {
            name: 'Waterproof Sweat-Proof Setting Spray',
            ingredients: ['1/2 cup distilled water', '1 tbsp vegetable glycerin', '1 tbsp witch hazel', '5 drops rose essential oil'],
            method: 'Combine all ingredients in a spray bottle. Shake well. Spray on face after full makeup application, holding 12 inches away. Allows makeup to set and minimizes sweat-through for several hours of intense dancing.',
          },
        ],
      },
      {
        name: 'Crop Over — Barbados',
        timing: 'July–August, culminating in Kadooment Day (first Monday in August)',
        description: `Barbados's Crop Over began as a celebration of the sugar cane harvest and evolved
into a full carnival celebration. Kadooment Day is the grand finale — costumed mas
bands parade, soca music fills the streets, and beauty is at its most spectacular.`,
        beautyNotes: [
          'Crop Over falls in summer — sun protection is critical beneath glitter and makeup',
          'SPF 50 applied as first step before any other product',
          'Neon and fluorescent colours popular in the Barbadian carnival aesthetic',
          'Body paint artists available for hire on the island in July-August',
          'Water-resistant everything — afternoon showers are common in August',
        ],
        hairTraditions: [
          'Barbadian women often choose elaborate up-dos that integrate with costume headpieces',
          'Braids and locs traditionally worn — heat is intense, protective styles are practical',
          'Brightly coloured wigs or colourful hair extensions for the day',
          'Silk press for those who prefer straight styles — humidity-protection spray essential',
        ],
      },
      {
        name: 'Jonkonnu (Jamaica / Bahamas)',
        timing: 'December 26 and New Year celebrations',
        description: `Jonkonnu is an Afro-Caribbean festival with roots in West African masquerade
tradition. Elaborate costumes, masks, and music fill the streets. The beauty tradition
is centered on mask and costume construction, body painting, and elaborate headpieces.`,
        beautyNotes: [
          'Traditional face masks range from simple painted faces to elaborate papier-mâché',
          'Body paint in red, black, and white — the ancestral colour triad',
          'Cowrie shells, feathers, and cloth strips incorporated into headpieces',
          'Bare skin with strategic body paint rather than full coverage makeup',
        ],
      },
    ],
    generalCarnivalBeauty: {
      skinPrep: [
        'Exfoliate body 2–3 times weekly for four weeks before Carnival',
        'Body butter or oil applied nightly — skin must be supremely smooth for body paint and glitter',
        'Address any hyperpigmentation: vitamin C serum, kojic acid cream on knees, elbows, armpits',
        'Waxing preferred over shaving — longer smoothness for costume-wearing',
      ],
      makeupSurvival: [
        'Use a silicone primer as base — lasts longer in heat than water-based',
        'Set foundation with translucent powder, then baked setting powder for extra lock',
        'Carry a powder compact for touch-ups',
        'Bold lip in a transfer-proof or liquid matte formula',
        'Waterproof mascara and liner are non-negotiable',
      ],
    },
    diyRecipes: [
      {
        name: 'Caribbean Pre-Carnival Body Scrub',
        ingredients: ['1 cup brown sugar', '4 tbsp coconut oil', '2 tbsp lime juice', '1 tsp vanilla extract', '1 tbsp sea salt'],
        method: 'Combine all ingredients. Massage vigorously onto wet skin in circular motions. Focus on elbows, knees, and areas where glitter will be applied. Rinse thoroughly. Follow with coconut oil for deep moisture. Use twice weekly in the month before Carnival.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ARAB
  // ─────────────────────────────────────────────────────────────────────────
  'arab': {
    id: 'arab',
    title: 'Arab Festival Beauty',
    subtitle: 'Eid, Ramadan Beauty, Henna Nights, Rose Water & Attar Traditions',
    overview: `Arab beauty culture is rooted in opulence, fragrance, and timeless ritual. The Eid
celebrations (both al-Fitr and al-Adha), the pre-wedding henna night, and the
observance of Ramadan all have distinct beauty traditions shaped by Islamic practice,
desert heritage, and centuries of perfume and botanical knowledge. The hammam
tradition, attar (concentrated perfume oil) culture, kohl-rimmed eyes, and the art of
henna are the cornerstones of Arab festival beauty.`,
    festivals: [
      {
        name: 'Eid al-Fitr — Breaking of the Fast',
        timing: 'First day of Shawwal (end of Ramadan)',
        description: `Eid al-Fitr marks the end of the month of Ramadan. It is a joyous morning prayer,
family gathering, gift-giving (Eidiya for children), and feast celebration. The night
before Eid (Chand Raat or Laylat al-Eid) is a celebration in itself — henna is
applied, new outfits are prepared, and there is an air of festive anticipation. Eid
morning begins with ghusl (ritual bath) and beautiful dress.`,
        beautyTimeline: {
          beforeRamadan: [
            'Skin prep begins before the month of fasting — hydration and care',
            'Plan Eid outfit colour and begin planning complementary makeup',
          ],
          duringRamadan: [
            'Hydrate skin deeply — fasting can dehydrate; apply moisturizer before suhoor',
            'Avoid heavy exfoliation while fasting (body is in repair mode)',
            'Kohl is debated — many scholars permit it while fasting; check personal practice',
            'Lip balm without fragrance only — avoid swallowing products while fasting',
            'Night-time skincare is unrestricted — this is the time for serums and masks',
          ],
          chandRaat: [
            'Apply henna (mehndi) — full hand designs from fingertip to wrist or beyond',
            'Waxing or threading appointment in the afternoon',
            'Hair wash and deep conditioning',
            'Hammam-style body treatment: black soap scrub, then body butter',
            'Paint nails in Eid colours: rose gold, deep red, pearl, or coral',
          ],
          eidMorning: [
            'Ghusl (ritual bath) — cleansing, spiritual and physical',
            'Apply attar (perfume oil) — alcohol-free, applied to pulse points',
            'Full makeup: kohl eyes, contoured nose and cheeks, bold lip or nude with gloss',
            'Wear new clothing — the purchase of new garments is Eid Sunnah',
            'Apply bakhoor (incense) to abaya or thobe before dressing',
          ],
        },
        makeupDetails: {
          eyes: `The Arab eye is the centrepiece of Eid beauty. Kohl applied inside the waterline
in a thick line that extends past the outer corner. Smoky gradients in bronze, gold,
brown, and black are layered. False lashes are common. Arabic kohl (ithmid, made from
antimony) is prized for its blackness and believed healing properties.`,
          skin: `Dewy, luminous skin achieved with a hydrating foundation or tinted moisturizer.
Contouring with warm-toned bronzer to define cheekbones and nose. Highlighter on
the arch of the cheekbone, temple, and brow bone. Setting spray for longevity.`,
          lips: `Eid lips range from bold jewel tones (burgundy, berry, red) to elegant nudes and
mauves. Lip liner slightly overdraws for a full effect. Glossy top coats over nude
liner for a modern Gulf aesthetic.`,
          fragrance: `Attar culture is central to Eid beauty. Rose attar, oud oil, amber, and musk are
applied at wrists, behind ears, in the hair, and on clothing. Layering fragrances —
a woody oud base, a floral heart, a powdery musk — is an art form.`,
        },
      },
      {
        name: 'Henna Night (Laylat al-Henna)',
        timing: 'One to three nights before a wedding',
        description: `The henna night is a pre-wedding celebration hosted by the bride\'s family, gathering
women to apply henna, sing traditional songs, eat sweets, and celebrate the bride's
transition into married life. In Morocco it is called Laylat al-Henna, in the Gulf
it is Henna Night, and across North Africa and the Levant each culture has its own
variation. The bride receives the most intricate and time-consuming henna design.`,
        hennaArt: {
          preparation: [
            'Fast for 24 hours before henna to allow skin oils to recede for better stain',
            'Scrub hands and feet with lemon-sugar paste to remove dead skin',
            'Avoid moisturizers on the day of henna application',
            'Warm the skin slightly with warm water — opens pores for better penetration',
          ],
          application: [
            'Professional henna artist typically applies from 2–6 hours of work for full bridal design',
            'Gulf (Khaleeji) style: large, filled floral motifs often in orange-red tones',
            'Moroccan style: geometric lattice patterns, often on feet as well as hands',
            'Indian-influenced Arab style: fine-line peacocks, paisleys, mandalas',
            'Traditional bridal custom: groom\'s name hidden in the design for him to find',
          ],
          aftercare: [
            'Leave paste on minimum 6–8 hours (overnight is best)',
            'Seal with lemon-sugar solution applied over dry paste to prevent cracking',
            'Sleep with hands wrapped loosely in tissue and plastic bags',
            'Remove by scraping — never wash off',
            'Apply mustard oil or eucalyptus oil first contact with skin after removal',
            'Avoid water for 12 hours after removal — colour deepens to dark orange-red in 24–48 hours',
          ],
          diyHennaPaste: {
            name: 'Traditional Arab Henna Paste',
            ingredients: ['100g pure henna powder (sifted)', '1 tsp sugar', '1 tsp eucalyptus oil', '1 tsp lemon juice', 'Black tea brewed strong (as liquid)', '5 drops lavender essential oil'],
            method: 'Brew black tea strong and cool. Mix henna powder with tea gradually until smooth paste consistency. Add sugar, eucalyptus oil, lemon juice, and lavender oil. Cover with plastic wrap touching the surface. Rest 6–24 hours for dye release (paste ready when it shows dark green color on top). Fill in cone and apply.',
          },
        },
      },
      {
        name: 'Rose Water and Attar Traditions',
        description: `Arab beauty has used rose water (ma ward) for centuries — as a facial toner,
a hair rinse, a perfume, a room freshener, and a ritual cleansing water. Damask
rose cultivation in the Arab world (particularly Morocco, Egypt, and Saudi Arabia)
produces the finest rose water globally. Attar culture — concentrated botanical
perfume oils — predates Western alcohol perfumery by centuries.`,
        rosewaterUses: [
          'Morning face mist — pat on skin as first morning step',
          'Mixed into face masks for fragrance and soothing',
          'Spritzed in hair for light perfume and moisture',
          'Added to bakhoor (incense coal burner) to scent the room',
          'Mixed into eye kohl recipes as a binding agent',
          'Offered to guests in a spritzer as a welcome gesture at celebrations',
        ],
        attarTraditions: [
          'Rose attar: the queen of Arab perfumery, distilled from fresh Damask roses',
          'Oud (agarwood) oil: the most prestigious Arab scent — woody, animalic, complex',
          'Amber paste: worn on the wrist, melts into the skin as the day wears on',
          'Musk: synthetic musk used in many Khaleeji blends for longevity',
          'Bukhoor: wood chips soaked in fragrance and burned on a coal — scents abaya and thobe',
          'Layering: apply rose attar to inner wrists, oud behind ears, amber at base of throat',
        ],
        diyRecipes: [
          {
            name: 'Homemade Rose Water Facial Mist',
            ingredients: ['2 cups distilled water', '1/2 cup fresh rose petals (Damask or hybrid tea)', '2 tbsp vegetable glycerin', '5 drops rose essential oil'],
            method: 'Simmer rose petals in distilled water for 20 minutes on very low heat. Do not boil. Cool and strain. Add glycerin and rose essential oil. Pour into spray bottle. Refrigerate. Use as toner or facial mist. Lasts two weeks refrigerated.',
          },
          {
            name: 'Eid Hammam Body Scrub (Kessa-Style)',
            ingredients: ['1 bar black soap (savon beldi)', '3 tbsp argan oil', '1 tbsp honey', '1 cup warm water', '2 tbsp rough salt (Himalayan)'],
            method: 'Wet skin in warm shower for 5 minutes to soften. Apply black soap and massage in. Leave 5 minutes. Using kessa glove or rough mitt, scrub vigorously — dead skin rolls off. Rinse. Apply argan oil and honey mixture for 5 minutes. Rinse again. Finish with body butter.',
          },
        ],
      },
    ],
    generalArabBeautyPrinciples: [
      'Fragrance is a statement of identity and spiritual cleanliness — invest in quality attar',
      'Kohl-rimmed eyes are the Arab beauty signature — never underestimate its power',
      'Hammam body treatment quarterly transforms skin texture over time',
      'Henna is sacred — use pure henna only, never black henna (PPD risk)',
      'Less foundation, more skincare — Arab women invest deeply in skin preparation',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LATINA
  // ─────────────────────────────────────────────────────────────────────────
  'latina': {
    id: 'latina',
    title: 'Latina Festival Beauty',
    subtitle: 'Dia de los Muertos, Quinceañera, Carnaval de Barranquilla & More',
    overview: `Latina festival beauty spans from the solemn-yet-vibrant Dia de los Muertos tradition
to the explosive colour of Carnaval de Barranquilla in Colombia, the majestic Quinceañera
coming-of-age ceremony, and the sacred Day of the Dead offerings. Latin American beauty
is bold, proud, and deeply connected to family, ancestors, and cultural continuity.
Makeup, hair, and dress are not frivolous — they are a form of storytelling, community
memory, and spiritual honour.`,
    festivals: [
      {
        name: 'Día de los Muertos — Day of the Dead',
        timing: 'November 1–2 (All Saints\' Day and All Souls\' Day)',
        description: `Día de los Muertos is a Mexican tradition (now celebrated broadly across Latin America
and by Latine communities worldwide) that honours deceased ancestors. The holiday blends
Catholic traditions with pre-Columbian Aztec ritual. Ofrendas (altars) are built,
marigolds (cempasúchil) are laid to guide spirits home, and participants often paint
their faces as elaborately decorated skulls (calaveras or sugar skulls — calaveras de
azúcar). The sugar skull makeup is one of the most technically demanding and visually
stunning face-painting traditions in the world.`,
        sugarSkullMakeupTutorial: {
          overview: 'Full step-by-step sugar skull makeup for Día de los Muertos',
          supplies: [
            'White face paint or white liquid matte foundation',
            'Black face paint or black liquid liner',
            'Coloured face paints: red, purple, orange, yellow, pink, blue',
            'White eyeshadow',
            'Fine detail brush and flat shader brush',
            'Setting powder and setting spray',
            'False lashes (dramatic)',
            'Rhinestones for accents',
            'Floral crown or fresh marigolds for hair',
          ],
          steps: [
            {
              step: 1,
              action: 'PRIME AND BASE',
              detail: 'Apply silicone primer to entire face and neck. Apply white face paint or white matte foundation over the entire face — including eyelids and lips. This creates the skull\'s bone-white canvas. Set with translucent powder.',
            },
            {
              step: 2,
              action: 'OUTLINE THE EYES',
              detail: 'Using black face paint and a fine brush, draw large circular outlines around each eye, extending to the brow and below the under-eye. These oversized circles will become the skull\'s eye sockets. Make them as symmetrical as possible.',
            },
            {
              step: 3,
              action: 'FILL EYE SOCKETS',
              detail: 'Fill the outer portions of the circles with black. Leave the inner third (directly over the eyelid and centre of the under-eye) white. Add floral designs, swirls, or web patterns within the black areas using a fine detail brush.',
            },
            {
              step: 4,
              action: 'NOSE',
              detail: 'Draw an inverted heart shape on the nose tip in black, creating the skull\'s nasal cavity. Add small dots or a decorative border around the heart.',
            },
            {
              step: 5,
              action: 'TEETH',
              detail: 'Using black liner, extend lines down from the lips and draw a grid of "teeth" squares from nose to chin — typically 3 columns of 4 squares. Fill alternating squares black to create dimension, or leave as outlined rectangles.',
            },
            {
              step: 6,
              action: 'COLOUR WORK',
              detail: 'Add colour to the forehead, cheeks, and temples in the chosen palette. Popular choices: roses, spider webs, butterflies, mandalas, or abstract floral swirls. Work in small sections with a fine brush.',
            },
            {
              step: 7,
              action: 'FOREHEAD DESIGN',
              detail: 'The forehead is prime real estate — add a central motif such as a cross (traditional), a heart, a flower mandala, or a spider and web. Make it symmetrical.',
            },
            {
              step: 8,
              action: 'LASHES AND LIP',
              detail: 'Apply dramatic false lashes. Define the lip in black or a deep berry colour, painting over the "teeth" areas with white at the teeth position. Add lip liner extensions to exaggerate the mouth shape if desired.',
            },
            {
              step: 9,
              action: 'RHINESTONES',
              detail: 'Apply rhinestones along the brow arches, at the outer eye corners, along cheekbones, and centrally on the forehead. Clear, purple, orange, and gold rhinestones work beautifully.',
            },
            {
              step: 10,
              action: 'SET AND SEAL',
              detail: 'Spray generously with setting spray. Allow to dry. A second coat of setting spray provides extra longevity. The look can last 6–8 hours with proper setting.',
            },
          ],
          hairStyling: [
            'Floral crown with marigolds, roses, and dried flowers is the most traditional complement',
            'Hair parted centre and swept into two low buns, each surrounded by a floral circle',
            'Braids interwoven with marigold and ribbon for a more elaborate look',
            'Single high bun adorned with a large rose and ribbon trim',
            'Colourful extensions woven through braids for a modern interpretation',
          ],
          outfit: [
            'Traditional: white or black dress with colourful embroidery (tehuana or Oaxacan style)',
            'Modern: black bodysuit with a colourful printed skirt',
            'Catrina (Victorian skeleton woman) look: elaborate Victorian-inspired dress with corseted waist',
            'Day of the Dead-print fabric made into any silhouette',
          ],
        },
      },
      {
        name: 'Quinceañera',
        timing: 'On or near a girl\'s fifteenth birthday',
        description: `The Quinceañera marks a girl\'s transition from childhood to womanhood in Latin
American culture. It is a religious and cultural milestone with a church ceremony and
a reception (the fiesta). The beauty preparation is a family event — the quinceañera
gets her first professional makeup, her first full hair-up, and wears her most
elaborate dress. It is a rite of passage marked in beauty as much as ceremony.`,
        beautyTraditions: {
          makeup: [
            'First "real" makeup look — traditionally soft and age-appropriate',
            'Foundation chosen to match skin tone precisely — often first professional colour match',
            'Soft shimmer eyeshadow in pink, lavender, or the dress\'s accent colour',
            'Defined brows — threading or waxing before the event',
            'Soft blush and highlight',
            'Lip gloss or soft pink lipstick — natural and youthful',
            'Modern quinceañeras choose more dramatic looks — personal preference now',
          ],
          hair: [
            'First formal up-do — half-up curls, full chignon, or cascading upswept style',
            'Tiara (corona) placed on the head during the ceremony as a symbol of royalty',
            'Fresh flowers pinned into the hair — matching the bouquet carried',
            'Curling irons and extensions often used for volume',
            'Trial run the week before is essential',
          ],
          accessories: [
            'The last doll (last muñeca) — symbolizing the departure from childhood',
            'Flat shoes changed to heels mid-ceremony — symbolizing a woman\'s first steps',
            'Jewellery typically a gift from parents — necklace, bracelet, or ring',
            'Long formal gloves in some regional traditions',
          ],
          diyRecipes: [
            {
              name: 'Quinceañera Prep Brightening Mask',
              ingredients: ['2 tbsp plain yogurt', '1 tbsp honey', '1 tsp lemon juice', '1 tsp aloe vera gel', '5 drops vitamin E oil'],
              method: 'Mix all ingredients until smooth. Apply to clean face and neck. Leave 20 minutes. Rinse with cool water. Apply sunscreen and moisturizer. Use three times in the week before the quinceañera for luminous skin.',
            },
          ],
        },
      },
      {
        name: 'Carnaval de Barranquilla',
        timing: 'Four days before Ash Wednesday (February/March)',
        description: `Barranquilla's Carnaval is Colombia's most celebrated festival and one of the
largest carnivals in the world — a UNESCO Intangible Cultural Heritage. The parade
of floats, dancers in elaborate costumes, and music traditions blending African,
Indigenous, and Spanish heritage create an intoxicating visual explosion. Beauty
at Barranquilla Carnaval is theatrical, loud, and joyfully excessive.`,
        beautyNotes: [
          'Face paint in yellow, red, blue, and green — Colombia\'s flag colours used prominently',
          'Mapalé and cumbia dance costumes incorporate elaborate headdresses with feathers',
          'Marimonda costume: trunk-nosed mask with polka dots — full-face coverage',
          'Congo women dancers wear vibrant skirts and body paint inspired by African tradition',
          'Garabato dancers in skeleton-themed face paint — death and life represented together',
          'Rain is common — waterproof everything for the outdoor Carnaval events',
        ],
      },
    ],
    generalTips: [
      'Latina festival beauty embraces maximum colour — more is more',
      'Skin prep matters: ubtan-equivalents exist in Latin botánica tradition (aloe vera, papaya masks)',
      'Hair accessories are statement pieces: flowers, pins, crowns, ribbons',
      'Festival makeup often requires theatrical-grade products for longevity',
      'Fragrance: floral and warm — jasmine, gardenia, and warm amber orientals',
    ],
    diyRecipes: [
      {
        name: 'Latina Festival Glow Mask — Papaya and Turmeric',
        ingredients: ['3 tbsp mashed ripe papaya', '1 tsp turmeric', '1 tbsp honey', '1 tsp lime juice'],
        method: 'Mash papaya thoroughly. Mix in remaining ingredients. Apply to face and neck for 15 minutes. Rinse with cool water. Papaya enzymes exfoliate gently and the turmeric brightens. Use once a week before festivals.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EAST ASIAN
  // ─────────────────────────────────────────────────────────────────────────
  'east-asian': {
    id: 'east-asian',
    title: 'East Asian Festival Beauty',
    subtitle: 'Lunar New Year, Chuseok, Japanese Matsuri & Korean Hanbok Traditions',
    overview: `East Asian festival beauty is built on ideals of luminous skin, understated
elegance, and precise technique. Whether it is Chinese New Year (Lunar New Year) red
clothing and freshly washed hair, Korean Chuseok in hanbok (traditional dress), or
Japanese matsuri (festival) with yukata (casual kimono) and traditional summer makeup,
the beauty philosophy emphasizes clear, poreless skin, precise eye definition, and
harmonious colour choices. The concept of beauty as internal wellness made external
runs through these traditions.`,
    festivals: [
      {
        name: 'Lunar New Year (Spring Festival / Tết / Seollal)',
        timing: 'January or February (new moon of first lunar month)',
        regions: ['China', 'Vietnam', 'Korea', 'Singapore', 'Taiwan', 'Diaspora worldwide'],
        description: `Lunar New Year is the most important holiday across much of East Asia. It marks
the beginning of the lunar calendar year and is associated with luck, prosperity,
family reunion, and renewal. Beauty traditions for Lunar New Year are laden with
superstition and symbolism — particularly around hair, colour, and cleanliness.`,
        beautySuperstitions: [
          'Do NOT wash hair on New Year\'s Day — you will wash away your luck for the year',
          'Do not cut hair in the first month of the new year',
          'Wash hair thoroughly on New Year\'s Eve to arrive clean into the new year',
          'Red is the colour of luck — wear something red, even if just underwear',
          'Avoid white and black — mourning colours in many East Asian traditions',
          'New clothing purchased specifically for New Year — symbolizes fresh start',
          'Broken makeup tools should be replaced before the new year',
        ],
        hairPrep: [
          'Wash hair thoroughly on New Year\'s Eve with a clarifying shampoo',
          'Deep condition with a hair mask overnight or for several hours',
          'Style into clean, neat looks: sleek ponytail, chignon, soft waves',
          'Red hair accessories are auspicious — red ribbons, red hair clips',
          'For men: fresh haircut on New Year\'s Eve, never the day itself',
        ],
        makeupDetails: {
          skin: `Glass skin or dewy skin aesthetic is the goal. Double cleanse the night before.
Apply essence, serum, and multiple hydrating layers. Foundation should be light
coverage — skin should glow through, not be masked. Avoid heavy powdering.`,
          eyes: `Clean, bright eyes. Light shimmer eyeshadow in champagne, rose gold, or soft red.
Precise eyeliner — Korean gyeong-cheonsanpik (clean liner along upper lash line).
Mascara for length and separation. Brows brushed up and defined — not overly arched.`,
          lips: `Red lipstick is quintessentially New Year. Classic matte red for Chinese New Year.
Korean celebratory looks prefer gradient lip (ombré from deep center to lighter edge).
Vietnamese Tết often uses coral or red-orange tones.`,
          colourPalette: 'Red, gold, and rose gold dominate. Avoid white, grey, and black in makeup for the New Year period.',
        },
        skincare: {
          newYearEveRitual: [
            'Double cleanse — oil cleanser first, then foam cleanser',
            'Exfoliate gently with enzyme exfoliant (not physical scrub on New Year\'s Eve)',
            'Sheet mask (the defining K-beauty contribution to ritual skincare)',
            'Eye cream — tap gently with ring finger',
            'Layering toner, essence, serum, moisturizer, facial oil',
            'Sleeping mask as final step',
          ],
          skincarePhilosophy: [
            'Multi-step skincare is not excessive — it is customary',
            'SPF every single day regardless of weather',
            'Fermented ingredients (sake, rice water, gochujang) used in traditional face treatments',
            'Jade rollers and gua sha used for morning de-puffing',
          ],
        },
      },
      {
        name: 'Chuseok (Korean Harvest Moon Festival)',
        timing: 'Fifteenth day of the eighth lunar month (September/October)',
        description: `Chuseok is the Korean mid-autumn harvest festival, equivalent to Thanksgiving.
Families gather, visit ancestral graves, share food, and wear hanbok (traditional
Korean clothing). The beauty of Chuseok is inseparable from the elegant, layered
aesthetic of hanbok itself.`,
        hanbokBeauty: {
          clothing: [
            'Hanbok consists of jeogori (top jacket) and chima (full skirt) for women',
            'Bright jewel tones in silk or silk-blend: red, blue, yellow, green, purple',
            'White muslin under-robe called a sokchima worn underneath',
            'The ribbon tie (goreum) at the chest becomes a focal point',
            'Men wear baji (trousers) and jeogori in more muted tones',
          ],
          makeup: [
            'Traditional Korean haesik (ceremonial) makeup: white base, thin red lips, simple eye',
            'Modern Chuseok makeup: natural, luminous, clean-girl aesthetic',
            'Soft blush applied high on cheekbones in round circle (circle blush trend)',
            'Light coverage BB cream or cushion foundation for a breathable finish',
            'Sunscreen worn even during autumn — UV protection year-round in K-beauty philosophy',
          ],
          hair: [
            'Chignon (쪽머리) is traditional — hair coiled and pinned with a binyeo (hairpin)',
            'Modern women wear hair down in soft waves or half-up styles',
            'Norigae (decorative tassel ornament) attached to the hanbok, occasionally to hair',
            'Hair must be neat and polished — family photographs are taken at Chuseok',
          ],
        },
        diyRecipes: [
          {
            name: 'Korean Rice Water Toner',
            ingredients: ['1/2 cup white rice', '2 cups distilled water'],
            method: 'Soak rice in water for 30 minutes, swirling occasionally. Strain the milky white water into a clean bottle. The rice water is now your toner. Apply with a cotton pad or hands after cleansing. Inositol and vitamins B and E in rice water brighten and even skin tone. Refrigerate and use within one week.',
          },
          {
            name: 'Fermented Rice Bran Face Mask',
            ingredients: ['3 tbsp rice bran', '1 tbsp plain yogurt', '1 tsp honey', '1 tsp rose water'],
            method: 'Mix all ingredients into a paste. Apply to clean face and neck. Leave 15–20 minutes. Massage gently before rinsing — rice bran exfoliates as you massage. Rinse with cool water. Skin will be visibly brighter immediately.',
          },
        ],
      },
      {
        name: 'Japanese Matsuri (Summer Festivals)',
        timing: 'July–August (varies by region and festival)',
        description: `Japanese matsuri are local Shinto festivals celebrated across Japan throughout
the year, with summer festivals (natsu matsuri) being the most visually iconic.
The Gion Matsuri (Kyoto, July) and Awa Odori (Tokushima, August) are among the
largest. Women and girls wear yukata (casual cotton kimono) and sandals (geta or
zōri), and the beauty tradition reflects a mix of traditional Shinto aesthetic and
modern Japanese kawaii and gyaru culture.`,
        yukataBeauty: {
          traditional: [
            'Hair worn up in shimada or tsubushi shimada (traditional geisha-influenced bun)',
            'Kanzashi (hair ornaments) — lacquered picks with dangling floral decorations',
            'White face powder (oshiroi) as a traditional festival base — purely decorative now',
            'Precise lip in red or deep pink — bud shape or full lip depending on style',
            'Simple mascara and defined brows',
          ],
          modern: [
            'Many young Japanese women now wear modern fresh makeup with yukata',
            'Clean skin with dewy cushion foundation',
            'Bold eye look in festival setting — shimmer, colourful liner',
            'Glitter at the inner eye corner — a distinctly modern matsuri touch',
            'Waterproof products are essential: summer matsuri are hot and humid',
          ],
          hair: [
            'Half-up bun with kanzashi is the classic summer festival style',
            'Loose low bun with face-framing pieces and floral pins',
            'Double buns with ribbons and kanzashi picks',
            'Braids interwoven with ribbon matching the yukata obi (sash)',
          ],
        },
      },
    ],
    generalEastAsianBeautyPrinciples: [
      'Glass skin and dewy skin are the perennial goal — hydration is everything',
      'Sun protection SPF 50 PA++++ is a non-negotiable daily step',
      'Multi-step skincare is ritualistic — do not rush it',
      'Precision in makeup — symmetry, clean lines, intentional colour choices',
      'Red is the colour of luck, celebration, and life — deploy it consciously',
    ],
    diyRecipes: [
      {
        name: 'Glass Skin Festival Prep Serum',
        ingredients: ['2 tbsp aloe vera gel', '1 tbsp hyaluronic acid serum', '1 tsp niacinamide powder', '1 tsp vitamin C powder (ascorbic acid)', '5 drops rosehip oil'],
        method: 'Mix aloe vera gel as the base. Dissolve niacinamide and vitamin C powders in the aloe. Add hyaluronic acid serum and rosehip oil. Mix thoroughly. Apply as a serum after toner and before moisturizer. Use nightly for one week before a festival for luminous, poreless-looking skin.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EAST AFRICAN
  // ─────────────────────────────────────────────────────────────────────────
  'east-african': {
    id: 'east-african',
    title: 'East African Festival Beauty',
    subtitle: 'Ethiopian Timkat, Sigd, Coffee Ceremony Beauty & Eritrean Traditions',
    overview: `East African festival beauty draws from some of the world's oldest cosmetic
traditions. Ethiopia and Eritrea have unbroken cosmetic cultures stretching back
millennia — butter for hair and skin, kohl for eyes, coffee as a social and beauty
ritual, and the distinctive body adornment practices of the Mursi, Hamar, and Surma
peoples. The Ethiopian Orthodox Christian calendar generates a rich cycle of festivals,
each with its own beauty tradition, while the Somali, Djiboutian, and Kenyan coastal
traditions add further layers of Islamic, Swahili, and pastoral beauty culture.`,
    festivals: [
      {
        name: 'Timkat (Ethiopian Epiphany)',
        timing: 'January 19 (January 20 in leap years) — 11 Ter in Ethiopian calendar',
        description: `Timkat celebrates the baptism of Jesus in the Jordan River and is the most
visually spectacular of Ethiopia's Orthodox Christian festivals. The Tabot (a replica
of the Ark of the Covenant) is carried in procession by priests, wrapped in fine
cloth. Celebrants dress in white netela (traditional shawl) and follow the procession
through candlelit dawn streets to a pool or river where the water is blessed and
people are sprinkled. The beauty of Timkat is the beauty of white-clad devotion.`,
        beautyTraditions: {
          clothing: [
            'Habesha kemis (traditional Ethiopian dress) in white with colourful woven border (tibeb)',
            'Netela (white cotton shawl) draped over shoulders and head',
            'Priests in embroidered ceremonial vestments of extraordinary elaborateness',
            'Deacons in colourful robes with crosses and censers',
          ],
          hair: [
            'Traditional Ethiopian women\'s style: cornrows close to the scalp in intricate patterns',
            'Chebe powder used by some — a West African influence spreading east — for length retention',
            'Hair oiled with Ethiopian butter (nitir kibbeh — spiced clarified butter) is traditional',
            'Modern Ethiopian women wear hair in protective styles: box braids, twists, or natural afros',
            'Traditional women of Tigray and Amhara regions wear long, fine cornrow styles',
          ],
          skin: [
            'Nitre kibbeh (Ethiopian spiced butter) applied to skin for festive sheen',
            'Women use injera fermentation liquid (the sourdough water) as a skin brightening rinse',
            'Kohl (homemade from ground plant material or commercial) applied to eyes',
            'Eucalyptus steam before ceremonies to cleanse and open pores',
          ],
          adornment: [
            'Cross pendants (Coptic Ethiopian cross) are central jewelry for Orthodox women',
            'Maria Theresa thalers (silver coins) repurposed as necklaces and earrings',
            'Heavy silver bracelets in the Amhara tradition',
            'Amber beads from Ethiopian trade routes worn as necklaces',
          ],
        },
        diyRecipes: [
          {
            name: 'Ethiopian Spiced Beauty Butter (inspired by Nitir Kibbeh)',
            ingredients: ['4 tbsp unsalted butter or shea butter', '1/4 tsp turmeric', '1/4 tsp black cumin (nigella sativa)', '1/4 tsp dried ginger powder', '5 drops frankincense resin oil'],
            method: 'Melt butter gently. Add turmeric, black cumin, and ginger. Simmer on very low heat for 10 minutes to infuse. Strain out solids. Cool to room temperature. Stir in frankincense oil. Apply to face and body as a ceremonial skin butter. The spiced butter leaves a subtle warm sheen. Do not use on acne-prone skin — comedogenic for some.',
          },
        ],
      },
      {
        name: 'Sigd (Ethiopian Jewish Holiday)',
        timing: '50 days after Yom Kippur (October/November)',
        description: `Sigd is an Ethiopian Jewish (Beta Israel / Falasha) holiday celebrating the
renewal of the covenant between God and the Jewish people. Ethiopian Jews who
emigrated to Israel brought Sigd with them, and it is now a national holiday in
Israel. Women dress in white and ascend a mountain or hill in prayer. The beauty
tradition mirrors Timkat: white dress, traditional Ethiopian jewelry, and kohl-rimmed
eyes.`,
        beautyNotes: [
          'White dress with tibeb border is traditional for Sigd as for Timkat',
          'Women cover their hair with white netela in prayer contexts',
          'Kohl applied heavily — a tradition that predates both the Jewish and Christian periods in Ethiopia',
          'Silver and beaded jewelry in Ethiopian Jewish style',
          'Post-ceremony celebration allows for more vibrant clothing and jewelry',
        ],
      },
      {
        name: 'Ethiopian Coffee Ceremony Beauty Ritual',
        timing: 'Daily, but especially for guests and celebrations (all day long)',
        description: `The Ethiopian coffee ceremony (Bunna) is one of the world's great cultural
rituals — it can last two to three hours, involving three rounds of coffee (abol,
tona, baraka), burning frankincense, and the host's preparation being itself a form
of beauty display. The ceremony is always hosted by a woman, who wears traditional
dress and sits on a low stool, preparing coffee with care. Beauty and hospitality are
inseparable here.`,
        ceremonyBeauty: [
          'Woman changes into habesha kemis specifically for hosting',
          'Hair freshly done — braided, oiled, or covered with a netela',
          'Frankincense (etan) burned on a coal: the scent permeates clothes and hair',
          'Jasmine flowers scattered on the floor and woven into the ceremony space',
          'Hands and feet clean and moisturized — they are visible throughout the ceremony',
          'No strong perfume — the frankincense and coffee aromas are the olfactory story',
        ],
        coffeeBeautyUses: [
          'Spent coffee grounds used as a body scrub — exfoliates and reduces cellulite appearance',
          'Coffee-infused water applied as a toner for oily skin (caffeine\'s tightening effect)',
          'Ground coffee mixed with coconut oil as a hair growth mask (increases circulation)',
          'Coffee bags steeped in warm water and placed on eyes for puffiness reduction',
        ],
        diyRecipes: [
          {
            name: 'Ethiopian Coffee Ground Body Scrub',
            ingredients: ['4 tbsp used Ethiopian coffee grounds', '3 tbsp coconut oil', '1 tbsp honey', '1 tsp cinnamon', '5 drops vanilla extract'],
            method: 'Mix all ingredients. Apply to damp skin in firm circular motions. Focus on rough areas: elbows, knees, heels. Leave as a mask for 5 minutes. Rinse under warm water. The caffeine tightens and tones, cinnamon stimulates circulation, and honey moisturizes. Use once or twice weekly.',
          },
          {
            name: 'Frankincense Facial Oil (Ethiopian Inspired)',
            ingredients: ['2 tbsp argan oil', '1 tbsp rosehip oil', '10 drops frankincense essential oil', '5 drops myrrh essential oil', '5 drops lavender oil'],
            method: 'Combine all oils in a dark glass dropper bottle. Shake well. Apply 3–4 drops to clean face at night. Massage in upward motions. Frankincense promotes cell renewal and reduces the appearance of fine lines. Myrrh soothes and protects. A traditional East African beauty formula now validated by science.',
          },
        ],
      },
      {
        name: 'Kenyan Maasai and Samburu Celebration Beauty',
        timing: 'Olng\'esherr (warrior graduation), circumcision ceremonies, weddings',
        description: `The Maasai and Samburu people of Kenya and Tanzania have some of East Africa's
most visually distinctive beauty traditions. Red ochre mixed with fat (ocher paste)
is applied to skin and hair as the primary ceremonial pigment. Elaborate beaded
jewelry — particularly the multi-strand flat bead necklaces — is the defining aesthetic.`,
        beautyNotes: [
          'Red ochre (siagi) mixed with animal fat applied to body and hair',
          'Warriors (moran) grease long ochre-dyed hair into braids or spikes',
          'Elaborate multi-strand flat bead necklaces with specific colour codes for status',
          'White, blue, and red beads in specific patterns communicate clan and life-stage',
          'Stretched earlobes adorned with large circular bead earrings',
          'Beadwork gifted between women to mark life transitions',
        ],
      },
    ],
    generalEastAfricanBeautyPrinciples: [
      'Butter and fat are ancient skin care — shea, nitir kibbeh, and animal fat protect skin in dry climates',
      'Frankincense and myrrh are East African heritage skincare ingredients',
      'Kohl is a shared tradition across the Horn of Africa — invest in high-quality',
      'Coffee is not just a drink — it is a scrub, a toner, and a hair treatment',
      'Beaded jewelry is a language — learn what patterns mean in specific communities',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOUTH AFRICAN
  // ─────────────────────────────────────────────────────────────────────────
  'south-african': {
    id: 'south-african',
    title: 'South African Festival Beauty',
    subtitle: 'Heritage Day, Klopse, Zulu Reed Dance & Rainbow Nation Traditions',
    overview: `South African festival beauty reflects the extraordinary diversity of the Rainbow
Nation — Zulu, Xhosa, Sotho, Tswana, Venda, Ndebele, Cape Malay, Afrikaner, and
Indian South African traditions coexist. Heritage Day (September 24) is the nation's
celebration of this cultural multiplicity. The Cape Town New Year carnival (Klopse
or Cape Minstrels) is a uniquely Cape Malay-rooted tradition. The Zulu Reed Dance
(Umkhosi woMhlanga) is one of Africa's largest maidens' ceremonies. South African
beauty is a study in joyful, proud cultural multiplicity.`,
    festivals: [
      {
        name: 'Heritage Day (September 24)',
        timing: 'September 24 annually',
        description: `Heritage Day (also celebrated humorously as "Braai Day") is the national holiday
on which South Africans are encouraged to celebrate their cultural traditions. The day
is marked by wearing traditional attire — and the streets of South Africa's cities fill
with every cultural tradition in breathtaking visual plurality. From Ndebele beaded
blankets to Zulu imibhaco (cloaks), to Cape Malay robes and Indian saris, the beauty
of Heritage Day is the beauty of cultural pride worn openly.`,
        communityBeauty: {
          ndebele: [
            'Ndebele women wear stiff beaded aprons (mapoto), beaded blankets, and neck rings (idzilla)',
            'Neck, arm, and leg rings are a permanent adornment — removed only at death of husband traditionally',
            'Painted geometric murals on their homes extend the beadwork aesthetic into architecture',
            'Face adorned with bold geometric designs in white and black for ceremonies',
          ],
          zulu: [
            'Zulu traditional dress: beaded bracelets, necklaces, and anklets in specific colour codes',
            'Isicholo (wide circular married women\'s hat) in black and red',
            'Umutsha (traditional beaded loin covering) for men',
            'Women\'s hair in elaborate styles — amasokisi (rolled locks), or modern natural styles',
            'Red and yellow ochre used on skin for ceremonies',
          ],
          xhosa: [
            'White ochre (ibuhlungu) painted on face for initiation ceremonies',
            'Red ochre on married women — umhlanga (ochre-dyed cloth)',
            'Isidlokolo (patterned turban) worn by Xhosa married women',
            'Blue-beaded jewelry in distinctively Xhosa style',
          ],
          capeMatay: [
            'Brightly coloured satins and silks in vivid green, pink, orange, yellow',
            'Tasselled fez (songkok) for men, elaborate headwraps for women',
            'Heavy gold jewelry reflecting the community\'s Malay and Indian Ocean trade heritage',
            'Kohl-rimmed eyes and red lips for festive occasions',
          ],
        },
        diyRecipes: [
          {
            name: 'South African Rooibos Skin Brightening Toner',
            ingredients: ['2 cups brewed rooibos tea (strong)', '2 tbsp raw honey', '1 tbsp apple cider vinegar', '5 drops lavender oil'],
            method: 'Brew rooibos very strong, using 3 tea bags. Cool completely. Add honey, apple cider vinegar, and lavender oil. Stir to dissolve honey. Store in a spray bottle. Apply to face after cleansing. Rooibos is a South African native plant rich in antioxidants and alpha-hydroxy acids. Use twice daily.',
          },
        ],
      },
      {
        name: 'Cape Town New Year Carnival (Klopse / Cape Minstrels)',
        timing: 'January 1 and 2 (and throughout the festive season)',
        description: `The Cape Minstrel Carnival (called Klopse or the Tweede Nuwe Jaar — "Second New Year")
is a uniquely Cape Town tradition with roots in the Cape Malay community's adaptation of
American minstrelsy and the celebration of the day enslaved people were given freedom of
movement. Troupes dress in matching satin suits, painted faces, and perform with banjos
and umbrellas through the streets of the Cape Flats and Bo-Kaap.`,
        beautyTraditions: {
          faceDesigns: [
            'White face paint as base covering the entire face — the iconic minstrel base',
            'Bright colour added: red cheeks, black eye lines, painted smiling mouths',
            'Modern Klopse troupes vary the design — some more abstract and artistic',
            'Body glitter added to satin suits for additional sparkle',
            'Matching costume and face design within each troupe is essential',
          ],
          costumeDetail: [
            'Satin suits in bright matching colours — each troupe has its signature colour scheme',
            'Straw hats, top hats, or elaborate headpieces',
            'White gloves',
            'Umbrellas in matching colour, twirled and used as choreographic props',
            'Elaborate appliqué and embroidery on the suit',
          ],
          diyRecipes: [
            {
              name: 'Klopse Face Paint Removal Oil',
              ingredients: ['4 tbsp coconut oil', '2 tbsp olive oil', '1 tbsp castor oil', '5 drops tea tree oil'],
              method: 'Mix all oils. After the carnival, apply generously to painted face and massage in circular motions. The oil dissolves paint without harsh scrubbing. Wipe away with a warm damp cloth. Repeat once more. Follow with a gentle face wash and moisturizer. The skin will be clear and soft.',
            },
          ],
        },
      },
      {
        name: 'Umkhosi woMhlanga (Zulu Reed Dance)',
        timing: 'Late August or early September',
        description: `The Zulu Reed Dance (Reed Dance Ceremony) is an annual ceremony at the royal palace
in KwaZulu-Natal, where thousands of virgin maidens present reeds to the Zulu Queen
Mother. It celebrates young women's purity, their cultural pride, and their place in
Zulu society. The beauty of the Reed Dance is a mass display of Zulu traditional dress
in its most elaborate form.`,
        beautyForReedDance: [
          'Maidens wear isidwaba (short black cowhide skirt) and elaborate beaded top covering',
          'Beadwork gifted by parents and family — the quantity indicates family investment',
          'Hair worn natural, close to the scalp — a Crown adorned with a beaded headband',
          'Red ochre applied to the body by some participants',
          'Long colourful braided false hair attached and decorated with beads',
          'The reed itself is cut fresh and carried — beauty object and symbol combined',
          'Isicwaya (bead collar) worn around the neck in Zulu beaded jewellery',
        ],
      },
    ],
    generalSouthAfricanBeautyPrinciples: [
      'Rooibos is South Africa\'s gift to natural beauty — antioxidant-rich and skin-soothing',
      'Beadwork is a language in Ndebele, Zulu, Xhosa, and Sotho traditions — each colour and pattern means something',
      'South African beauty is proudly multicultural — borrow thoughtfully and respectfully',
      'Ochre (red and white) as ceremonial body pigment predates recorded history in this region',
      'Marula oil, baobab oil, and rooibos are South Africa\'s signature natural beauty exports',
    ],
    diyRecipes: [
      {
        name: 'South African Marula and Baobab Festival Skin Oil',
        ingredients: ['3 tbsp marula oil', '2 tbsp baobab oil', '1 tbsp rosehip oil', '5 drops frankincense oil', '5 drops neroli oil'],
        method: 'Combine all oils in a dark glass bottle. Shake to blend. Apply 3–5 drops to face and neck after cleansing and toning. Marula oil is rich in oleic acid and antioxidants. Baobab is extraordinarily rich in omega fatty acids. This combination is deeply nourishing for all skin types and particularly suited to sub-Saharan skin.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLACK AMERICAN
  // ─────────────────────────────────────────────────────────────────────────
  'black-american': {
    id: 'black-american',
    title: 'Black American Festival Beauty',
    subtitle: 'Juneteenth, Kwanzaa, Sunday Best, and HBCU Homecoming Culture',
    overview: `Black American festival beauty is shaped by centuries of cultural resilience,
creativity under constraint, and the ongoing project of defining beauty on Black
terms. From the Sunday church tradition that transformed "getting ready" into an
art form, to the explosive creativity of HBCU homecoming weekends, to Juneteenth's
emergence as a national celebration of freedom, to Kwanzaa's seven-day observance
of African heritage — Black American beauty is simultaneously a political statement,
a cultural inheritance, and a joyful, unbounded creative expression.`,
    festivals: [
      {
        name: 'Juneteenth (June 19)',
        timing: 'June 19 annually (US federal holiday since 2021)',
        description: `Juneteenth commemorates June 19, 1865 — the date enslaved people in Texas were
informed of the Emancipation Proclamation (which had been signed two and a half years
earlier). It has been celebrated by Black Americans since 1866 and became a federal
holiday in 2021. Juneteenth celebrations include parades, picnics, community festivals,
music, and increasingly a conscious beauty culture centered on Black liberation and pride.`,
        beautyTraditions: {
          colourPalette: [
            'Red, black, and green — Pan-African colours of liberation',
            'Red: blood of the ancestors, sacrifice, and struggle',
            'Black: people, the skin, the ancestors',
            'Green: land, future, and prosperity',
            'Gold: wealth and a shared future',
          ],
          makeup: [
            'Bold red lip is the Juneteenth beauty signature',
            'Glowing, luminous skin — Black skin in its full glory is the statement',
            'Jewel-toned eyeshadow: emerald green, sapphire blue, deep burgundy',
            'Gold and bronze highlighter on cheekbones, temples, and nose bridge',
            'Natural or dramatic lashes — personal expression is celebrated',
            'Protective styles adorned with red, black, and green accessories',
            'Afros, locs, braids, and natural styles centred as the aesthetic',
          ],
          hair: [
            'Natural hair celebrations — Juneteenth is a showcase for natural texture',
            'Braided styles: Senegalese twists, box braids, cornrows with cowrie shells',
            'Bantu knots, afros, and wash-and-go styles all celebrated',
            'Red, green, and black hair accessories woven into styles',
            'Silk press for those who prefer: sleek and polished is also celebrated',
            'Protective styles that honour the African heritage of braiding',
          ],
          outfits: [
            'African wax print (Ankara) garments increasingly popular at Juneteenth',
            'Red, black, and green colour-coordinated modern outfits',
            'White dresses reference the Emancipation era\'s freedom symbolism',
            'Kente cloth accessories or full kente looks',
            'Political T-shirts paired with festival-worthy accessories',
          ],
          diyRecipes: [
            {
              name: 'Juneteenth Glow Bomb Highlighter Oil',
              ingredients: ['3 tbsp jojoba oil', '1 tbsp vitamin E oil', '2 tbsp gold mica powder', '1 tsp red mica powder', '5 drops bergamot essential oil'],
              method: 'Blend jojoba and vitamin E oils. Whisk in gold mica powder until fully incorporated. Add a smaller amount of red mica for a deeper warm glow. Add bergamot oil for a citrus-freedom scent. Dab on cheekbones, temples, collarbone, and shoulders for a luminous festival look. Red and gold mica mirrors the Juneteenth colour palette.',
            },
          ],
        },
      },
      {
        name: 'Kwanzaa (December 26 – January 1)',
        timing: 'December 26 through January 1 (seven days)',
        description: `Kwanzaa was created in 1966 by Dr. Maulana Karenga as a celebration of African
heritage, community, and family for Black Americans. Its seven principles (Nguzo Saba)
are honoured across seven days, each day lighting a candle of the kinara (candle holder).
The seven principles — unity, self-determination, collective work and responsibility,
cooperative economics, purpose, creativity, and faith — each translate into the beauty
world in meaningful ways. Kwanzaa beauty is conscious, deliberate, and rooted in
African heritage.`,
        sevenDayBeautyRitual: [
          {
            day: 1,
            principle: 'Umoja (Unity)',
            beautyRitual: 'Gather with family for a communal skincare ritual — apply face masks together, sharing recipes and beauty knowledge across generations.',
          },
          {
            day: 2,
            principle: 'Kujichagulia (Self-Determination)',
            beautyRitual: 'Wear your natural hair in its full, unaltered expression. Celebrate what grows from your scalp. No apologizing, no straightening unless it is your genuine choice.',
          },
          {
            day: 3,
            principle: 'Ujima (Collective Work)',
            beautyRitual: 'Support a Black-owned beauty brand today. Seek out Black herbalists, estheticians, and cosmetologists. Spend Black, look beautiful.',
          },
          {
            day: 4,
            principle: 'Ujamaa (Cooperative Economics)',
            beautyRitual: 'Purchase beauty products only from Black-owned businesses. Research local Black estheticians and book appointments.',
          },
          {
            day: 5,
            principle: 'Nia (Purpose)',
            beautyRitual: 'Set a beauty intention. What does your appearance communicate about who you are and what you stand for? Dress and adorn with purpose.',
          },
          {
            day: 6,
            principle: 'Kuumba (Creativity)',
            beautyRitual: 'Create something new with your beauty practice today. Try a new makeup look, a new hairstyle, or make a DIY beauty recipe from scratch.',
          },
          {
            day: 7,
            principle: 'Imani (Faith)',
            beautyRitual: 'Affirm your beauty as it is. Write an affirmation about your face, your hair, your skin. Repeat it while doing your morning beauty ritual.',
          },
        ],
        kwanzaaBeautyAesthetic: {
          colours: 'Red, black, and green are the Kwanzaa colours — incorporate into outfits, accessories, and nail colour.',
          clothing: 'African dashiki, kente cloth, Ankara prints, or simply red, black, and green in modern silhouettes.',
          makeup: 'Rich and warm — berry and brick lip, deep jewel eye, gold-kissed skin with full natural highlighter.',
          hair: 'Natural styles are centred at Kwanzaa — locs, afros, braids, twists in full glory.',
          jewelry: 'African-inspired jewelry: cowrie shells, wood beads, brass and copper metals.',
        },
        diyRecipes: [
          {
            name: 'Kwanzaa African Shea Butter Body Butter',
            ingredients: ['1/2 cup raw shea butter', '3 tbsp coconut oil', '2 tbsp jojoba oil', '1 tbsp arrowroot powder', '10 drops ylang-ylang oil', '5 drops patchouli oil', '5 drops frankincense oil'],
            method: 'Melt shea butter and coconut oil together gently. Remove from heat. Cool in refrigerator until just solidifying. Whip with hand mixer until fluffy. Add jojoba oil, arrowroot powder, and essential oils. Whip again until light and airy. Store in a clean jar. Apply all over body for deeply nourishing, beautifully scented skin throughout the Kwanzaa celebrations.',
          },
          {
            name: 'Kwanzaa Scalp Revitalizer',
            ingredients: ['3 tbsp castor oil', '2 tbsp jojoba oil', '1 tbsp coconut oil', '10 drops peppermint essential oil', '5 drops tea tree oil', '5 drops rosemary oil'],
            method: 'Combine all oils and shake well. Using a dropper, apply directly to scalp in sections. Massage firmly with fingertips in circular motions for 5 minutes. Leave for 1–2 hours or overnight with a shower cap. Wash out with a gentle clarifying shampoo. Castor oil promotes hair thickness. Peppermint stimulates blood flow. Rosemary promotes growth.',
          },
        ],
      },
      {
        name: 'Sunday Best (Church Culture)',
        timing: 'Every Sunday, but particularly Easter, Homecoming Sunday, and Christmas',
        description: `The Black American church tradition of "Sunday Best" — dressing in one's finest
for Sunday service — is one of the most enduring and influential beauty traditions in
African American culture. From the wide-brimmed hats of Black women church mothers
to sharp suits and pocket squares for men, Sunday dress is not vanity but testimony.
It is a tradition forged partly in the dignity defiance that Sunday allowed — when
formal dress was a political act of self-definition against the dehumanization of
daily life in segregated America. The influence of Sunday Best extends across all
Black American beauty culture.`,
        beautyTraditions: {
          hats: [
            'Wide-brimmed church hats in every color — the bigger, the more testimony',
            'Feather accents, silk flowers, rhinestone trim, and netting',
            'Hat must complement the suit or dress perfectly — ensemble thinking',
            'Easter Sunday: the most elaborate hats of the year',
            'Hat pins and hat bands are an art within the art',
          ],
          makeup: [
            'Red lip: the quintessential Sunday best makeup choice for generations',
            'Full foundation coverage in a perfectly matched shade',
            'Sculpted and set — face stays put through a three-hour service',
            'Pearls or rhinestones complement the Sunday eye look',
            'Mascara and defined brows always',
          ],
          hair: [
            'Silk press for straight styles — smooth, shining, and perfectly set',
            'Natural styles: large afros, defined twist-outs, coil-outs',
            'Sunday hair prep begins Saturday: wash, deep condition, style, sleep in silk',
            'Silk or satin bonnet is sacred — preserves the Sunday set all week',
            'Wigs and weaves treated with the same care as natural hair',
          ],
          skinPrep: [
            'Shea butter is the Sunday morning ritual — applied warm and pressed in',
            'Holy water is spiritual but Vitamin C is the skincare gospel',
            'Setting spray is non-negotiable — church is emotional and warm',
            'Touch-up kit in the purse: powder, lipstick, edge control',
          ],
        },
      },
      {
        name: 'HBCU Homecoming',
        timing: 'October (varies by institution)',
        description: `HBCU (Historically Black Colleges and Universities) homecoming weekends are among
the most significant cultural events in Black American life. Schools like Howard
University, Spelman College, Morehouse College, Hampton University, and over 100 others
host alumni gatherings, football games, step shows, fashion runway events, and parties.
HBCU homecoming has launched fashion trends, beauty influencers, and represents the
pinnacle of Black fashion creativity. The aesthetic ranges from high fashion editorial
to the school-spirited to streetwear to formal.`,
        beautyAesthetic: {
          makeup: [
            'Dramatic and creative — HBCU homecoming is a makeup showcase',
            'Bold graphic liner looks — geometric shapes, avant-garde colour',
            'Monochromatic looks (one colour family across eyes, cheeks, lips)',
            'Glitter and rhinestones in daytime — rules suspended for homecoming',
            'Full glam for game day: waterproof everything (outdoor + emotional)',
          ],
          hair: [
            'Custom dyed styles: colour to match school colours is common',
            'Elaborate natural styles: sculptural afros, defined coils in school-colour accessories',
            'Wigs customized and coloured for the occasion',
            'Braids with school-coloured extensions or beads',
            'Howard girls may go cobalt blue; Spelman may go red and black',
            'Silk press moments: sleek, long, perfectly bouncy looks',
          ],
          nails: [
            'Custom press-ons with school logos, colours, and homecoming themes',
            'Long coffin or stiletto nails in school colours',
            'Nail art featuring the school\'s mascot',
            'Gel extensions for the multi-day homecoming schedule',
          ],
          outfits: [
            'School merchandise styled in fashion-forward ways',
            'High fashion coordinated with school colours',
            'Step show outfits for Greek organizations: precision-styled and colour-coordinated',
            'Matching couple or friend-group outfits for game day',
          ],
          diyRecipes: [
            {
              name: 'HBCU Homecoming All-Day Makeup Lock Spray',
              ingredients: ['1/2 cup distilled water', '2 tbsp pure aloe vera gel', '1 tsp vegetable glycerin', '1/2 tsp witch hazel', '3 drops lavender oil'],
              method: 'Blend all ingredients in a small spray bottle. Shake vigorously. Spray in a circular motion, 10–12 inches from face, before and after makeup application. The glycerin humectant locks in moisture and keeps makeup from cracking in outdoor heat. Aloe vera soothes and sets. Works through football games, step shows, and late-night parties.',
            },
          ],
        },
      },
    ],
    generalBlackAmericanBeautyPrinciples: [
      'Black beauty is its own standard — not a deviation from another standard',
      'Support Black-owned beauty brands: there are extraordinary options in every category',
      'Natural hair is not a trend — it is a birthright and a beauty tradition as old as humanity',
      'The Sunday hat tradition is a masterclass in personal expression and joyful excess',
      'SPF matters for melanated skin — UV damage is cumulative and real, hyperpigmentation is preventable',
      'Edge control is a science — find your formula and protect your edges with silk',
      'Community beauty knowledge — passed grandmother to mother to daughter — is worth preserving',
    ],
    diyRecipes: [
      {
        name: 'Black American Kitchen Beauty — Honey and ACV Hair Rinse',
        ingredients: ['2 cups warm water', '2 tbsp apple cider vinegar', '1 tbsp raw honey', '5 drops peppermint oil'],
        method: 'Combine all ingredients. After shampooing and conditioning, pour over hair and work through. Leave 2 minutes. Rinse well with cool water. The ACV closes the hair cuticle for shine and smoothness. Honey adds moisture. Peppermint stimulates the scalp. A kitchen remedy that predates the natural hair movement by generations.',
      },
      {
        name: 'Sunday Best Pressed Powder Setting',
        ingredients: ['2 tbsp arrowroot powder', '1 tsp cocoa powder (adjust to skin tone)', '1/2 tsp cornstarch', '1 tsp mica powder (for glow)'],
        method: 'Mix arrowroot powder as the base. Add cocoa powder gradually, testing on the back of your hand until it matches your skin tone. Add cornstarch and mica. Transfer to a small compact or empty pan. Press with a spoon or press firmly. Apply over foundation with a fluffy brush to set makeup for all-day wear without flashback.',
      },
    ],
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getFestivalBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_FESTIVAL_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_FESTIVAL_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_FESTIVAL_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_FESTIVAL_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_FESTIVAL_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_FESTIVAL_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_FESTIVAL_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_FESTIVAL_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_FESTIVAL_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_COMMUNITIES = [
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

export const FESTIVAL_INDEX = {
  'Durbar Festival': 'west-african',
  'Naming Ceremony': 'west-african',
  'Homowo': 'west-african',
  'Masquerade Festival': 'west-african',
  'Diwali': 'south-asian',
  'Holi': 'south-asian',
  'Navratri': 'south-asian',
  'Quinceañera': 'latina',
  'Eid al-Fitr': 'arab',
  'Henna Night': 'arab',
  'Día de los Muertos': 'latina',
  'Carnaval de Barranquilla': 'latina',
  'Trinidad Carnival': 'caribbean',
  'Crop Over': 'caribbean',
  'Lunar New Year': 'east-asian',
  'Chuseok': 'east-asian',
  'Matsuri': 'east-asian',
  'Timkat': 'east-african',
  'Sigd': 'east-african',
  'Coffee Ceremony': 'east-african',
  'Heritage Day': 'south-african',
  'Klopse': 'south-african',
  'Reed Dance': 'south-african',
  'Juneteenth': 'black-american',
  'Kwanzaa': 'black-american',
  'Sunday Best': 'black-american',
  'HBCU Homecoming': 'black-american',
};

export function getFestivalCommunity(festivalName) {
  return FESTIVAL_INDEX[festivalName] || null;
}

export function getAllFestivalNames() {
  return Object.keys(FESTIVAL_INDEX);
}

export function getAllDIYRecipes(communityId) {
  const guide = getFestivalBeautyGuide(communityId);
  if (!guide) return [];
  const recipes = [];
  if (guide.diyRecipes) recipes.push(...guide.diyRecipes);
  if (guide.festivals) {
    guide.festivals.forEach(festival => {
      if (festival.diyRecipes) recipes.push(...festival.diyRecipes);
      if (festival.beautyFocus && festival.beautyFocus.diyRecipes) {
        recipes.push(...festival.beautyFocus.diyRecipes);
      }
      if (festival.hennaArt && festival.hennaArt.diyHennaPaste) {
        recipes.push(festival.hennaArt.diyHennaPaste);
      }
      if (festival.beautyTimeline && festival.beautyTimeline.diyRecipes) {
        recipes.push(...festival.beautyTimeline.diyRecipes);
      }
    });
  }
  return recipes;
}

export const FESTIVAL_COLOUR_PALETTES = {
  'west-african': ['earthy red', 'gold', 'indigo', 'forest green', 'black'],
  'south-asian': ['deep red', 'gold', 'jewel tones', 'forest green', 'electric orange'],
  'caribbean': ['neon', 'gold', 'electric blue', 'hot pink', 'rainbow'],
  'arab': ['burgundy', 'gold', 'rose', 'deep plum', 'nude'],
  'latina': ['vibrant red', 'marigold orange', 'black', 'white', 'cobalt blue'],
  'east-asian': ['red', 'gold', 'rose gold', 'champagne', 'jade green'],
  'east-african': ['white', 'gold', 'red ochre', 'silver', 'cobalt blue'],
  'south-african': ['red', 'black', 'white', 'green', 'vibrant satin tones'],
  'black-american': ['red', 'black', 'green', 'gold', 'jewel tones'],
};

export function getFestivalColours(communityId) {
  return FESTIVAL_COLOUR_PALETTES[communityId] || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED FESTIVAL NOTES: ADDITIONAL TRADITIONS AND DEEP DIVES
// ─────────────────────────────────────────────────────────────────────────────

export const EXTENDED_FESTIVAL_NOTES = {

  'west-african': {
    additionalFestivals: [
      {
        name: 'Osun-Osogbo Festival',
        region: 'Osogbo, Nigeria (Yoruba)',
        timing: 'August (annual, sacred grove)',
        description: `The Osun-Osogbo Festival is a UNESCO Intangible Heritage celebration honouring
Osun, the Yoruba goddess of fertility, love, and rivers. Devotees dress in yellow and
gold — Osun\'s colours — and process to the sacred grove at the Osun River. Priestesses
wear elaborate white and yellow garments. The festival draws thousands of devotees
and is one of the most spiritually vibrant in all of West Africa.`,
        beauty: [
          'Yellow and gold clothing — Osun\'s sacred colours',
          'White chalk (efun) marks on forehead and cheeks for devotees',
          'Osun water (from the sacred river) used to wash the face at festival dawn',
          'Honey applied to lips as an offering to the goddess of sweetness',
          'Beads in yellow, gold, and amber strung specifically for the festival',
          'Hair oiled with palm kernel oil and adorned with brass combs',
        ],
      },
      {
        name: 'Chale Wote Street Art Festival',
        region: 'Jamestown, Accra, Ghana',
        timing: 'August',
        description: `Chale Wote is a contemporary arts and performance festival in the historic Jamestown
neighbourhood of Accra. It bridges traditional Ghanaian beauty and art with contemporary
Afrofuturist and global art movements. Body paint, elaborate costumes, and avant-garde
interpretations of traditional motifs define the aesthetic.`,
        beauty: [
          'Body painting by professional artists — full torso and leg works',
          'Afrofuturist face paint: kente-inspired geometric patterns in bold colours',
          'Natural hair in sculptural styles: locs, large afros, afro puffs dyed in vivid colours',
          'Mix of traditional Ghanaian jewelry with contemporary art accessories',
          'Face glitter and rhinestones applied in traditional Akan pattern shapes',
          'Ankara prints in avantgarde silhouettes cut by local Ghanaian designers',
        ],
      },
    ],
    hairDeepDive: {
      title: 'West African Hair as Cultural Archive',
      content: `Hair in West African cultures is among the most information-dense forms of self-expression.
Historically, hairstyles communicated tribe, age, marital status, religion, wealth,
and geographic origin at a glance. The Yoruba oya (spiral coil) style was worn by
women in mourning. Fulani braids with specific bead placements communicate clan
identity across thousands of miles of West African territory. The Akan people of
Ghana braided specific patterns that identified warriors before battle. These are not
merely decorative choices — they are a living script.`,
      styles: [
        {
          name: 'Cornrows (threading and braiding)',
          significance: 'Used to map escape routes by enslaved Africans in colonial periods; also a daily utility style and social gathering activity',
          modernUse: 'Global dominance — now worn worldwide across cultures as a beauty style',
        },
        {
          name: 'Fulani braids',
          significance: 'Nomadic Fulani identity markers; bead types indicate home region',
          modernUse: 'Popular globally on natural hair; often misunderstood as a generic "braid" style',
        },
        {
          name: 'Threading (irun kiko)',
          significance: 'Yoruba tradition of wrapping hair sections in black thread to create sculpted shapes',
          modernUse: 'High-fashion editorial revival; worn at cultural festivals and celebrations',
        },
        {
          name: 'Bantu knots',
          significance: 'Worn across multiple Bantu language group cultures from West through Southern Africa',
          modernUse: 'Natural hair staple; also used to create "Bantu knot out" curl definition',
        },
      ],
    },
    skincareTraditions: {
      shea: `Shea butter (ori in Yoruba, nkuto in Akan) is West Africa\'s most important skincare
ingredient. It is produced by women\'s cooperatives across the shea belt (Mali, Burkina
Faso, Ghana, Nigeria) and used from birth — applied to newborns\' skin, massaged into
mothers\' bellies during pregnancy, used on hair, face, and body throughout life. Raw
unrefined shea is the most potent, with its naturally occurring vitamins A, E, and F
intact. Festival beauty preparation almost always begins with shea butter.`,
      blackSoap: `African black soap (ose dudu in Yoruba, alata samina in Twi) is made from plantain
ash, palm kernel oil, cocoa pods, and shea butter. It has been used for centuries for
everything from face washing to wound healing. It is one of the few traditional African
cosmetic ingredients to have found global scientific validation for its gentle
antimicrobial and skin-brightening properties. Pre-festival skin prep in Ghana and
Nigeria typically begins with a black soap steam or wash.`,
      palmOil: `Red palm oil (elepo in Yoruba) is another foundational West African cosmetic ingredient.
Rich in carotenoids (the source of its deep red colour), it has been used topically
for wound healing, as a hair conditioner, and as a ceremonial skin pigment. It turns
the skin a warm orange-gold when applied in quantity — a festival glow technique
centuries old.`,
    },
  },

  'south-asian': {
    additionalFestivals: [
      {
        name: 'Pongal / Makar Sankranti',
        region: 'Tamil Nadu, South India; also celebrated as Lohri (Punjab) and Bihu (Assam)',
        timing: 'January 14–15',
        description: `The harvest festivals of South Asia mark the end of winter and the sun\'s northward
journey (Uttarayan). In Tamil Nadu, Pongal is a four-day celebration during which women
draw elaborate kolam (geometric rice flour designs) at the entrance to their homes every
morning. The beauty of Pongal is in the hands — the kolam artists.`,
        beauty: [
          'Fresh jasmine flowers in the hair — a Tamil tradition for auspicious days',
          'Silk pavadai (skirt) in traditional silk weaves: Kanjivaram, Madurai silk',
          'Gold silk thread woven into the borders of saris',
          'Bindi in red, particularly for married women (pottu in Tamil)',
          'Kumkum (vermilion powder) mixed with turmeric applied to the hair parting',
          'Hands washed in turmeric water before drawing kolam — brightens and purifies',
        ],
      },
      {
        name: 'Karwa Chauth',
        region: 'North India (Punjab, Rajasthan, Uttar Pradesh)',
        timing: 'October (fourth day after the full moon of Kartik month)',
        description: `Karwa Chauth is observed by married Hindu women who fast from sunrise to moonrise
for the long life of their husbands. The day ends with seeing the moon through a sieve
and then seeing the husband\'s face. Beauty preparation for Karwa Chauth is extensive —
this is the occasion for a married woman\'s most elaborate adornment.`,
        beauty: [
          'Mehndi applied the night before — intricate hands and feet designs',
          'Full bridal-adjacent makeup on the day: heavy kohl, bold lip, contoured face',
          'Sixteen shringaar (adornments) traditionally completed: sindoor, mangalsutra, bangles, anklets, ring, toe ring, bindi, kajal, mehndi, maang tikka, nath, haar, kamarbandh, bajuband, payal, and earrings',
          'Sari in red or pink — the festive married woman\'s colours',
          'Moon-viewing celebration: makeup must remain pristine through hours of waiting',
        ],
      },
    ],
    hairDeepDive: {
      title: 'South Asian Hair Oiling Tradition',
      content: `Hair oiling (champi in Hindi) is among the most deeply rooted beauty traditions in
South Asian culture. The practice predates written history and is documented in
Ayurvedic texts thousands of years old. In traditional families, oil massage is
performed by a grandmother or mother — it is a form of love, healing, and knowledge
transfer. The oils used vary by region: coconut is predominant in South India,
mustard oil in North India and Bengal, sesame oil in Tamil Nadu, and amla (Indian
gooseberry) oil is prized pan-regionally for hair growth.`,
      festivalHairRituals: [
        'Pre-Diwali: oiling hair with coconut and curry leaf infusion 3 days before',
        'Pre-wedding: deep overnight oil treatment with heated sesame and fenugreek oil',
        'Navratri: hair oiled and braided every morning — ornate braids for dance',
        'New year (Ugadi, Vishu): hair wash and oiling is an auspicious first act',
        'Temple visits: hair freshly washed and oiled is the tradition before prayer',
      ],
      diyOilRecipes: [
        {
          name: 'Amla and Bhringraj Growth Oil',
          ingredients: ['3 tbsp cold-pressed coconut oil', '2 tbsp sesame oil', '1 tbsp amla powder', '1 tbsp bhringraj powder', '10 curry leaves', '1 tsp fenugreek seeds'],
          method: 'Heat coconut oil and sesame oil together. Add curry leaves and fenugreek seeds. Simmer 10 minutes on very low heat. Cool slightly. Whisk in amla and bhringraj powders. Cool completely and strain if desired. Massage into scalp and hair. Leave minimum 2 hours. Wash out thoroughly with a gentle shampoo. Weekly use significantly improves hair density over three months.',
        },
      ],
    },
  },

  'caribbean': {
    additionalBeautyTraditions: [
      {
        name: 'Trini Makeup Culture',
        description: `Trinidad has developed a distinct makeup culture shaped by Carnival and the island\'s
multicultural population (African, Indian, Chinese, Syrian, European heritage). The
result is an approach to makeup that is comfortable with maximum drama and maximum
colour — Trini women are among the most adventurous makeup wearers in the Caribbean.
Local beauty brands and makeup artists have built global followings through their
work in Carnival season.`,
        traditions: [
          'Foundation matching is taken seriously — mixed-heritage skin tones require expertise',
          'Body paint artistry is a professional skill, with artists booked months in advance',
          'Glitter and rhinestones are worn in contexts where other cultures would not consider it',
          'Eyebrow threading and shaping is a weekly (not occasional) grooming ritual',
          'Nail art is exceptionally elaborate by global standards',
        ],
      },
      {
        name: 'Bajan (Barbadian) Beauty Traditions',
        description: `Barbadian beauty culture is shaped by Crop Over and a strong sense of Bajan
identity. The island\'s Black British Commonwealth history intersects with African
heritage and Caribbean influences.`,
        traditions: [
          'Coconut oil from locally grown coconuts used in hair care from childhood',
          'Aloe vera harvested fresh and applied to sunburned or irritated skin',
          'Sea water as a natural skin and hair treatment — Bajans swim regularly',
          'Natural pum-pum (short) hairstyles, locs, and protective styles celebrated',
          'Body exfoliation with local sea salt and coconut oil before Crop Over events',
        ],
      },
    ],
    diyRecipes: [
      {
        name: 'Caribbean Sea Salt and Coconut Exfoliating Scrub',
        ingredients: ['1 cup fine sea salt', '4 tbsp coconut oil (melted)', '2 tbsp lime juice', '1 tsp local rum (optional — traditional ingredient)', '5 drops neroli oil'],
        method: 'Combine salt and melted coconut oil. Add lime juice and neroli oil. Mix thoroughly. In the shower, apply to wet skin in circular motions, spending extra time on rough areas. The salt exfoliates, lime brightens, coconut oil moisturizes. For Carnival prep, use three times weekly for four weeks prior.',
      },
      {
        name: 'Aloe Vera After-Sun Recovery Gel',
        ingredients: ['4 tbsp fresh aloe vera gel (from leaf)', '1 tbsp rose water', '5 drops lavender oil', '1 tsp vitamin E oil'],
        method: 'Slice open a fresh aloe leaf. Scoop out the clear gel. Blend until smooth. Add rose water, lavender, and vitamin E. Store in the refrigerator. Apply generously to sunburned or irritated skin. Cold from the fridge doubles the soothing effect. Essential post-outdoor festival recovery.',
      },
    ],
  },

  'arab': {
    additionalTraditions: [
      {
        name: 'Moroccan Beauty Traditions',
        description: `Morocco has its own distinct beauty tradition that sits at the intersection of
Amazigh (Berber), Arab, and Andalusian heritage. The hammam, argan oil, ghassoul clay,
and kessa glove are Moroccan contributions to global beauty. Moroccan women\'s beauty
preparation for Eid and wedding season is among the most elaborate in the Arab world.`,
        hammamRitual: [
          'Enter steam room and allow pores to open for 10–15 minutes',
          'Apply savon beldi (black soap) from head to toe — leave 5 minutes',
          'Scrub vigorously with kessa glove — dead skin rolls off in grey sheets',
          'Apply ghassoul clay to hair and face as a mask',
          'Rinse clean with warm water',
          'Apply argan oil while still warm and damp from the steam',
          'Exit to cool room — skin is visibly smoother and deeply cleansed',
        ],
      },
      {
        name: 'Levantine Beauty (Syria, Lebanon, Jordan, Palestine)',
        description: `Levantine Arab beauty culture is known for its emphasis on natural ingredients,
rose water (from the Damascene rose), and the particular elegance of the Levantine
aesthetic — neither as maximalist as Gulf culture nor as traditional as Egyptian.`,
        traditions: [
          'Damask rose water as the primary toner — Damascus gave the world this rose',
          'Olive oil from local trees used as both cooking and skincare ingredient',
          'Za\'atar herb used in face steams for its antiseptic and aromatic properties',
          'Sumac mixed with olive oil as a natural lip stain in some rural traditions',
          'Tahini (sesame paste) applied to hair for conditioning',
        ],
      },
    ],
    diyRecipes: [
      {
        name: 'Moroccan Argan Oil Hair Treatment',
        ingredients: ['3 tbsp pure argan oil', '1 tbsp honey', '1 egg yolk', '5 drops rose essential oil'],
        method: 'Whisk egg yolk until smooth. Add argan oil and honey, mix well. Add rose oil. Apply to dry hair from mid-length to ends. Cover with a warm towel or shower cap. Leave 30–45 minutes. Shampoo out thoroughly. Argan oil (Moroccan gold) is extraordinarily rich in fatty acids and vitamin E. One treatment transforms dry, frizzy hair.',
      },
      {
        name: 'Gulf Oud and Amber Body Butter',
        ingredients: ['4 tbsp shea butter', '2 tbsp coconut oil', '1 tbsp sweet almond oil', '8 drops oud essential oil', '5 drops amber resin oil', '3 drops sandalwood oil'],
        method: 'Melt shea and coconut oil. Cool until just beginning to solidify. Whip with a hand mixer. Add almond oil and essential oils. Whip until fluffy and light. Apply after bath as a body butter. The combination of oud, amber, and sandalwood creates a sophisticated Gulf fragrance on the skin that lasts hours.',
      },
    ],
  },

  'east-african': {
    additionalTraditions: [
      {
        name: 'Somali Beauty Traditions',
        description: `Somali beauty culture is distinct within East Africa, shaped by Islamic practice,
nomadic heritage, and Indian Ocean trade connections. Dirac (traditional dress) in vivid
silk or chiffon, heavy gold jewelry, and the use of qasil (hairwash paste made from dry
leaves) are signature elements. Somali women\'s henna patterns differ from Arab and
South Asian styles — geometric and tribal rather than floral.`,
        traditions: [
          'Qasil (hairwash paste from a specific East African plant) used for centuries as shampoo and conditioner',
          'Dirac in vivid jewel tones — silk that moves like liquid',
          'Heavy gold: muraad (necklace), shankhaad (anklet), dhab (gold chain headpiece)',
          'Henna applied in geometric patterns on hands, feet, and lower legs',
          'Bukhoor burned before dressing — clothes absorb the fragrance',
          'Eyes lined with kohl made from ground kohl stone and sometimes mixed with dried clove',
        ],
      },
      {
        name: 'Eritrean Celebration Beauty',
        description: `Eritrean festival beauty shares much with Ethiopian traditions but has distinct
Tigrinya, Tigre, Saho, and Bilen cultural expressions. The habesha kemis is shared,
but Eritrean embroidery styles differ. The nation\'s coastline (Red Sea) brings an
additional layer of seafaring and trading culture into the aesthetic.`,
        traditions: [
          'Habesha kemis in white with distinctive Eritrean embroidery along the hem and neckline',
          'Silver jewelry predominates over gold in many highland Eritrean traditions',
          'Zuria (a wrap dress) in bright colours for younger women',
          'Butter applied to hair before braiding for shine and scalp health',
          'Henna applied during Eid celebrations reflecting the coastal Muslim communities',
          'Incense (cedarwood and frankincense) burned throughout celebrations',
        ],
      },
    ],
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL FESTIVAL BEAUTY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export const FESTIVAL_BEAUTY_CALENDAR = {
  january: [
    { festival: 'Timkat', community: 'east-african', note: 'White dress, gold jewelry, kohl eyes' },
    { festival: 'Kwanzaa ends Jan 1', community: 'black-american', note: 'Seven-day African heritage celebration' },
    { festival: 'Lunar New Year (some years)', community: 'east-asian', note: 'Red, gold, hair wash on New Year\'s Eve' },
  ],
  february: [
    { festival: 'Lunar New Year (some years)', community: 'east-asian', note: 'Red and gold beauty palette' },
    { festival: 'Trinidad Carnival', community: 'caribbean', note: 'Body glitter, face paint, full Carnival prep' },
    { festival: 'Carnaval de Barranquilla', community: 'latina', note: 'Theatrical Colombian carnival makeup' },
  ],
  march: [
    { festival: 'Holi', community: 'south-asian', note: 'Oil body completely before colour throwing' },
    { festival: 'Trinidad Carnival (some years)', community: 'caribbean', note: 'Pre-Ash Wednesday timing varies' },
  ],
  april: [
    { festival: 'Eid al-Fitr (lunar calendar varies)', community: 'arab', note: 'Chand Raat henna night, Eid morning ghusl and attar' },
  ],
  june: [
    { festival: 'Juneteenth', community: 'black-american', note: 'Red, black, green liberation beauty palette' },
  ],
  july: [
    { festival: 'Crop Over begins', community: 'caribbean', note: 'Begin four weeks of Kadooment prep' },
    { festival: 'Japanese Matsuri season begins', community: 'east-asian', note: 'Yukata and kanzashi styling' },
    { festival: 'Chale Wote (Accra)', community: 'west-african', note: 'Body paint and Afrofuturist beauty' },
  ],
  august: [
    { festival: 'Crop Over Kadooment Day', community: 'caribbean', note: 'Carnival costume, body glitter, waterproof makeup' },
    { festival: 'Osun-Osogbo Festival', community: 'west-african', note: 'Yellow and gold for the river goddess' },
    { festival: 'Japanese Matsuri peak', community: 'east-asian', note: 'Awa Odori, Bon Odori festivals' },
    { festival: 'Zulu Reed Dance', community: 'south-african', note: 'Traditional Zulu maiden adornment' },
  ],
  september: [
    { festival: 'Heritage Day (Sept 24)', community: 'south-african', note: 'Cultural dress from all Rainbow Nation traditions' },
    { festival: 'Navratri begins', community: 'south-asian', note: 'Nine-night dance — colour of the day guides outfit' },
    { festival: 'Chuseok', community: 'east-asian', note: 'Hanbok, chignon, glass skin' },
  ],
  october: [
    { festival: 'Navratri / Dussehra', community: 'south-asian', note: 'Final nights of nine-night festival' },
    { festival: 'Día de los Muertos prep', community: 'latina', note: 'Sugar skull makeup practice sessions' },
    { festival: 'HBCU Homecoming', community: 'black-american', note: 'School colour beauty — October peak season' },
    { festival: 'Sigd', community: 'east-african', note: 'Ethiopian Jewish holiday, white dress' },
  ],
  november: [
    { festival: 'Diwali', community: 'south-asian', note: 'Festival of Lights — maximum adornment' },
    { festival: 'Día de los Muertos', community: 'latina', note: 'November 1-2 sugar skull makeup' },
    { festival: 'Eid al-Adha (lunar calendar varies)', community: 'arab', note: 'Similar beauty tradition to Eid al-Fitr' },
  ],
  december: [
    { festival: 'Kwanzaa begins Dec 26', community: 'black-american', note: 'Seven-day celebration of African heritage' },
    { festival: 'Klopse / Cape Minstrels Cape Town', community: 'south-african', note: 'January 1-2 but prep begins December' },
    { festival: 'Jonkonnu', community: 'caribbean', note: 'December 26 Jamaica and Bahamas' },
    { festival: 'Durbar (Eid context)', community: 'west-african', note: 'Northern Nigerian royal procession' },
  ],
};

export function getFestivalsForMonth(month) {
  const monthLower = month.toLowerCase();
  return FESTIVAL_BEAUTY_CALENDAR[monthLower] || [];
}

export function getUpcomingFestivals(currentMonth) {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const idx = months.indexOf(currentMonth.toLowerCase());
  if (idx === -1) return [];
  const next3 = [months[idx], months[(idx + 1) % 12], months[(idx + 2) % 12]];
  return next3.flatMap(m => FESTIVAL_BEAUTY_CALENDAR[m] || []);
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL FESTIVAL BEAUTY PRINCIPLES
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_FESTIVAL_BEAUTY_PRINCIPLES = [
  'Skin preparation begins weeks before — exfoliation, hydration, and targeted treatment',
  'Hair care intensifies pre-festival: deep conditioning, oiling, and protective styling',
  'Fragrance is as important as makeup — scent creates memory and completes a look',
  'Traditional cosmetic ingredients (shea, kohl, henna, ochre, rose water) outperform marketing-driven products in many cases',
  'Festival makeup requires longevity-focused products — set everything, carry touch-up kits',
  'Cultural beauty traditions encode history, spirituality, and identity — wear them with knowledge',
  'Buy from community-owned brands and artisans when preparing for cultural festivals',
];

export function getUniversalPrinciples() {
  return UNIVERSAL_FESTIVAL_BEAUTY_PRINCIPLES;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const MODULE_METADATA = {
  name: 'festival_beauty_ethnic_guide',
  version: '1.0.0',
  communities: SUPPORTED_COMMUNITIES,
  totalCommunities: SUPPORTED_COMMUNITIES.length,
  primaryExport: 'ETHNIC_FESTIVAL_BEAUTY_GUIDES',
};
