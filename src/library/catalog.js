/**
 * MIRRR Library catalog: every knowledge guide wired into the product, grouped into shelves.
 * Each guide is a self-contained module of written knowledge; the Library reads its data
 * exports, and the guide's own lookup functions are exercised by test/library.test.mjs.
 */
import * as skinRituals from '../skin_rituals.js';
import * as communityBeautyRituals from '../community_beauty_rituals.js';
import * as traditionalBeautyRituals from '../traditional_beauty_rituals.js';
import * as culturalBeautyRitualsGuide from '../cultural_beauty_rituals_guide.js';
import * as bathRitualsEthnicGuide from '../bath_rituals_ethnic_guide.js';
import * as bathBodyRituals from '../bath_body_rituals.js';
import * as spaTreatmentsEthnic from '../spa_treatments_ethnic.js';
import * as spaTreatmentsEthnicGuide from '../spa_treatments_ethnic_guide.js';
import * as culturalBeautyHistory from '../cultural_beauty_history.js';
import * as historicalBeautyGuide from '../historical_beauty_guide.js';
import * as bodyArtAtlas from '../body_art_atlas.js';
import * as festivalBeautyEthnicGuide from '../festival_beauty_ethnic_guide.js';
import * as culturalBeautyMyths from '../cultural_beauty_myths.js';
import * as ayurvedicBeautyExtended from '../ayurvedic_beauty_extended.js';
import * as traditionalMedicineBeauty from '../traditional_medicine_beauty.js';
import * as traditionalMedicineBeautyEthnicGuide from '../traditional_medicine_beauty_ethnic_guide.js';
import * as traditionalMedicineBeautyGuide from '../traditional_medicine_beauty_guide.js';
import * as browShapingEthnicGuide from '../brow_shaping_ethnic_guide.js';
import * as browShapingGuide from '../brow_shaping_guide.js';
import * as eyebrowShapingGuide from '../eyebrow_shaping_guide.js';
import * as lashBrowGrowth from '../lash_brow_growth.js';
import * as eyeMakeupEthnicGuide from '../eye_makeup_ethnic_guide.js';
import * as eyeMakeupEthnic from '../eye_makeup_ethnic.js';
import * as eyelinerStylesGuide from '../eyeliner_styles_guide.js';
import * as eyeBeautyEthnicGuide from '../eye_beauty_ethnic_guide.js';
import * as lashGuide from '../lash_guide.js';
import * as eyeCareEthnicGuide from '../eye_care_ethnic_guide.js';
import * as eyeCareBeauty from '../eye_care_beauty.js';
import * as makeupForGlasses from '../makeup_for_glasses.js';
import * as beautyForGlassesWearers from '../beauty_for_glasses_wearers.js';
import * as hairPainter from '../hair_painter.js';
import * as balayageEngine from '../balayage_engine.js';
import * as hairColorEthnicGuide from '../hair_color_ethnic_guide.js';
import * as hairColourGuideEthnic from '../hair_colour_guide_ethnic.js';
import * as hairColouringGuide from '../hair_colouring_guide.js';
import * as hairPorosityGuide from '../hair_porosity_guide.js';
import * as hairTextureGuide from '../hair_texture_guide.js';
import * as hairCareRoutines from '../hair_care_routines.js';
import * as hairCareRoutinesByType from '../hair_care_routines_by_type.js';
import * as hairDamageGuide from '../hair_damage_guide.js';
import * as protectiveStylesExtended from '../protective_styles_extended.js';
import * as wigGuideEthnic from '../wig_guide_ethnic.js';
import * as hairGrowthEthnicGuide from '../hair_growth_ethnic_guide.js';
import * as hairGrowthGuide from '../hair_growth_guide.js';
import * as hairGrowthGuideEthnic from '../hair_growth_guide_ethnic.js';
import * as hairGrowthScience from '../hair_growth_science.js';
import * as scalpCareGuide from '../scalp_care_guide.js';
import * as scalpConditionsGuide from '../scalp_conditions_guide.js';
import * as scalpHealthEthnicGuide from '../scalp_health_ethnic_guide.js';
import * as hairCareScienceExtended from '../hair_care_science_extended.js';
import * as hairExtensionsGuide from '../hair_extensions_guide.js';
import * as hyperpigmentationEthnicGuide from '../hyperpigmentation_ethnic_guide.js';
import * as acneEthnicGuide from '../acne_ethnic_guide.js';
import * as acneScienceExtended from '../acne_science_extended.js';
import * as acneManagementEthnic from '../acne_management_ethnic.js';
import * as spfGuideEthnic from '../spf_guide_ethnic.js';
import * as sunCareEthnicGuide from '../sun_care_ethnic_guide.js';
import * as suncareEthnicGuide from '../suncare_ethnic_guide.js';
import * as sunProtectionExtended from '../sun_protection_extended.js';
import * as sunDamageGuide from '../sun_damage_guide.js';
import * as skinBarrierGuide from '../skin_barrier_guide.js';
import * as skinBarrierEthnicGuide from '../skin_barrier_ethnic_guide.js';
import * as sensitiveSkinGuide from '../sensitive_skin_guide.js';
import * as sensitiveSkinEthnic from '../sensitive_skin_ethnic.js';
import * as colourCorrectingGuide from '../colour_correcting_guide.js';
import * as colourTheoryMakeup from '../colour_theory_makeup.js';
import * as foundationGuideExtended from '../foundation_guide_extended.js';
import * as settingProductsGuide from '../setting_products_guide.js';
import * as makeupFinishesGuide from '../makeup_finishes_guide.js';
import * as contouringGuideEthnic from '../contouring_guide_ethnic.js';
import * as contouringGuideV2 from '../contouring_guide_v2.js';
import * as cheekMakeupGuide from '../cheek_makeup_guide.js';
import * as makeupRemovalGuide from '../makeup_removal_guide.js';
import * as makeupToolsGuide from '../makeup_tools_guide.js';
import * as colorTheoryEthnicGuide from '../color_theory_ethnic_guide.js';
import * as colourTheoryEthnic from '../colour_theory_ethnic.js';
import * as colourTheoryEthnicSkin from '../colour_theory_ethnic_skin.js';
import * as colourTheoryBeauty from '../colour_theory_beauty.js';
import * as makeupEthnicGuide from '../makeup_ethnic_guide.js';
import * as makeupProductsDb from '../makeup_products_db.js';
import * as lipArtGuide from '../lip_art_guide.js';
import * as lipColourGuideExtended from '../lip_colour_guide_extended.js';
import * as lipCareGuide from '../lip_care_guide.js';
import * as lipCareEthnicGuide from '../lip_care_ethnic_guide.js';
import * as lipCareGuideEthnic from '../lip_care_guide_ethnic.js';
import * as lipHealthEthnicGuide from '../lip_health_ethnic_guide.js';
import * as nailArtistry from '../nail_artistry.js';
import * as nailColoursGuide from '../nail_colours_guide.js';
import * as nailCareEthnic from '../nail_care_ethnic.js';
import * as nailArtAdvanced from '../nail_art_advanced.js';
import * as nailArtGuideEthnic from '../nail_art_guide_ethnic.js';
import * as nailBeautyEthnicGuide from '../nail_beauty_ethnic_guide.js';
import * as nailCareGuideEthnic from '../nail_care_guide_ethnic.js';
import * as nailCareEthnicGuide from '../nail_care_ethnic_guide.js';
import * as fragranceLayeringGuide from '../fragrance_layering_guide.js';
import * as fragranceGuideExtended from '../fragrance_guide_extended.js';
import * as fragranceAtlas from '../fragrance_atlas.js';
import * as fragranceCommunitiesGuide from '../fragrance_communities_guide.js';
import * as fragranceEthnicGuide from '../fragrance_ethnic_guide.js';
import * as fragranceGuideEthnic from '../fragrance_guide_ethnic.js';
import * as agingSkinEthnicGuide from '../aging_skin_ethnic_guide.js';
import * as agingGracefullyEthnicGuide from '../aging_gracefully_ethnic_guide.js';
import * as antiAgingEthnic from '../anti_aging_ethnic.js';
import * as matureBeautyGuide from '../mature_beauty_guide.js';
import * as skincareRoutinesByAge from '../skincare_routines_by_age.js';
import * as collagenGuide from '../collagen_guide.js';
import * as menopauseBeauty from '../menopause_beauty.js';

export const SHELVES = [
  { id: 'rituals', title: 'Rituals & Heritage', blurb: 'Haldi, hammam, shea, mehndi, bathhouse and festival traditions, with the steps to do them at home.' },
  { id: 'eyes', title: 'Eyes, Brows & Kohl', blurb: 'Kohl and kajal traditions, brow threading and architecture, lashes, eye care, and makeup with glasses.' },
  { id: 'hair', title: 'Hair, Colour & Texture', blurb: 'Colour and lightening for dark and coily hair, henna and indigo, porosity, curl types, protective styles and wigs.' },
  { id: 'growth', title: 'Hair Growth & Scalp', blurb: 'How hair grows, why length breaks off, edges and traction, heat, scalp conditions and extensions.' },
  { id: 'skin', title: 'Skin: Marks, Breakouts & Sun', blurb: 'Dark marks and melasma, safe brightening, breakouts, sunscreen without a white cast, barrier repair, eczema and rosacea.' },
  { id: 'complexion', title: 'Makeup: Correct, Base & Sculpt', blurb: 'Colour correcting for your depth, foundation formulas and finishes, primer and powder without flashback, contour, blush and highlight, tools and removal.' },
  { id: 'colour', title: 'Colour & Lips', blurb: 'Undertones and colour formulas, lip colour for your depth and undertone, finishes, liner and ombre, lip care for dryness and darkening, and the brands and traditions behind them.' },
  { id: 'nails', title: 'Nails & Fragrance', blurb: 'Nail colour for your depth and undertone, shapes, finishes, gel, acrylic and press-ons with safe removal, dark streaks to watch, and fragrance families, concentrations, layering, attar and oud.' },
  { id: 'ageing', title: 'Ageing, Collagen & Menopause', blurb: 'What changes in each decade, retinoids at a pace your depth can take, collagen habits, in-clinic treatments that are safe for deeper skin, perimenopause and menopause care, and ageing traditions.' },
];

/** guide id = module file name without .js; shelf; display title; module namespace. */
export const GUIDES = [
  ['skin_rituals', 'rituals', 'Skin Rituals, Step by Step', skinRituals],
  ['community_beauty_rituals', 'rituals', 'Daily, Weekly and Ceremonial Rituals', communityBeautyRituals],
  ['traditional_beauty_rituals', 'rituals', 'Traditional Beauty Rituals', traditionalBeautyRituals],
  ['cultural_beauty_rituals_guide', 'rituals', 'Rites of Passage and Wedding Traditions', culturalBeautyRitualsGuide],
  ['bath_rituals_ethnic_guide', 'rituals', 'Bath Rituals', bathRitualsEthnicGuide],
  ['bath_body_rituals', 'rituals', 'Bath and Body Traditions', bathBodyRituals],
  ['spa_treatments_ethnic', 'rituals', 'Spa Traditions at Home', spaTreatmentsEthnic],
  ['spa_treatments_ethnic_guide', 'rituals', 'Spa Treatments Guide', spaTreatmentsEthnicGuide],
  ['cultural_beauty_history', 'rituals', 'Beauty History by Era', culturalBeautyHistory],
  ['historical_beauty_guide', 'rituals', 'Ancient Beauty: Egypt, India, Africa, East Asia', historicalBeautyGuide],
  ['body_art_atlas', 'rituals', 'Body Art Atlas: Henna, Gold and Marks', bodyArtAtlas],
  ['festival_beauty_ethnic_guide', 'rituals', 'Festival Beauty', festivalBeautyEthnicGuide],
  ['cultural_beauty_myths', 'rituals', 'Beauty Myths, Checked', culturalBeautyMyths],
  ['ayurvedic_beauty_extended', 'rituals', 'Ayurvedic Beauty', ayurvedicBeautyExtended],
  ['traditional_medicine_beauty', 'rituals', 'Traditional Medicine Systems', traditionalMedicineBeauty],
  ['traditional_medicine_beauty_ethnic_guide', 'rituals', 'Traditional Remedies by Community', traditionalMedicineBeautyEthnicGuide],
  ['traditional_medicine_beauty_guide', 'rituals', 'Traditional Medicine and Skin', traditionalMedicineBeautyGuide],
  ['brow_shaping_ethnic_guide', 'eyes', 'Brow Traditions by Community', browShapingEthnicGuide],
  ['brow_shaping_guide', 'eyes', 'Brow Mapping and Face Shape', browShapingGuide],
  ['eyebrow_shaping_guide', 'eyes', 'Eyebrow Shaping and Filling', eyebrowShapingGuide],
  ['lash_brow_growth', 'eyes', 'Lash and Brow Growth', lashBrowGrowth],
  ['eye_makeup_ethnic_guide', 'eyes', 'Kohl, Kajal, Tiro and Eye Makeup', eyeMakeupEthnicGuide],
  ['eye_makeup_ethnic', 'eyes', 'Eyeshadow by Skin Tone and Eye Shape', eyeMakeupEthnic],
  ['eyeliner_styles_guide', 'eyes', 'Eyeliner Styles and the Waterline', eyelinerStylesGuide],
  ['eye_beauty_ethnic_guide', 'eyes', 'Eye Beauty and Dark Circles', eyeBeautyEthnicGuide],
  ['lash_guide', 'eyes', 'Lashes: Mascara, Lifts and Extensions', lashGuide],
  ['eye_care_ethnic_guide', 'eyes', 'Eye Care by Community', eyeCareEthnicGuide],
  ['eye_care_beauty', 'eyes', 'Under-Eye Care', eyeCareBeauty],
  ['makeup_for_glasses', 'eyes', 'Makeup with Glasses', makeupForGlasses],
  ['beauty_for_glasses_wearers', 'eyes', 'Glasses and Contact Lens Beauty', beautyForGlassesWearers],
  ['hair_painter', 'hair', 'Hair Colours, Textures and Styles', hairPainter],
  ['balayage_engine', 'hair', 'Balayage, Ombré and Highlight Techniques', balayageEngine],
  ['hair_color_ethnic_guide', 'hair', 'Hair Colour by Community', hairColorEthnicGuide],
  ['hair_colour_guide_ethnic', 'hair', 'Hair Colour Science, Henna and Grey', hairColourGuideEthnic],
  ['hair_colouring_guide', 'hair', 'Lightening Dark and Coily Hair Safely', hairColouringGuide],
  ['hair_porosity_guide', 'hair', 'Hair Porosity', hairPorosityGuide],
  ['hair_texture_guide', 'hair', 'Hair Texture, Curl Science and Politics', hairTextureGuide],
  ['hair_care_routines', 'hair', 'Hair Care Routines by Community', hairCareRoutines],
  ['hair_care_routines_by_type', 'hair', 'Hair Care by Curl Type', hairCareRoutinesByType],
  ['hair_damage_guide', 'hair', 'Hair Damage and Bond Repair', hairDamageGuide],
  ['protective_styles_extended', 'hair', 'Protective Styles: Braids, Twists and Locs', protectiveStylesExtended],
  ['wig_guide_ethnic', 'hair', 'Wigs: Construction, Install and Care', wigGuideEthnic],
  ['hair_growth_guide', 'growth', 'Growth, Retention and Edges', hairGrowthGuide],
  ['hair_growth_science', 'growth', 'The Hair Growth Cycle', hairGrowthScience],
  ['hair_growth_ethnic_guide', 'growth', 'Hair Growth by Community', hairGrowthEthnicGuide],
  ['hair_growth_guide_ethnic', 'growth', 'Growth Traditions and Ingredients', hairGrowthGuideEthnic],
  ['hair_care_science_extended', 'growth', 'Heat, Protein and Moisture: the Science', hairCareScienceExtended],
  ['scalp_care_guide', 'growth', 'Scalp Care', scalpCareGuide],
  ['scalp_conditions_guide', 'growth', 'Scalp Conditions: Dandruff to Tinea', scalpConditionsGuide],
  ['scalp_health_ethnic_guide', 'growth', 'Scalp Health by Community', scalpHealthEthnicGuide],
  ['hair_extensions_guide', 'growth', 'Extensions and Added Hair', hairExtensionsGuide],
  ['hyperpigmentation_ethnic_guide', 'skin', 'Dark Marks, Melasma and Safe Brightening', hyperpigmentationEthnicGuide],
  ['acne_ethnic_guide', 'skin', 'Breakouts by Community', acneEthnicGuide],
  ['acne_science_extended', 'skin', 'The Acne Treatment Ladder', acneScienceExtended],
  ['acne_management_ethnic', 'skin', 'Acne and the Marks It Leaves', acneManagementEthnic],
  ['spf_guide_ethnic', 'skin', 'SPF Without a White Cast', spfGuideEthnic],
  ['sun_care_ethnic_guide', 'skin', 'Sun Care Traditions and Today', sunCareEthnicGuide],
  ['suncare_ethnic_guide', 'skin', 'Sunscreen Types and Vitamin D', suncareEthnicGuide],
  ['sun_protection_extended', 'skin', 'Sun Protection by Community', sunProtectionExtended],
  ['sun_damage_guide', 'skin', 'Sun Damage and Repair', sunDamageGuide],
  ['skin_barrier_guide', 'skin', 'Skin Barrier Repair', skinBarrierGuide],
  ['skin_barrier_ethnic_guide', 'skin', 'Skin Barrier by Community', skinBarrierEthnicGuide],
  ['sensitive_skin_guide', 'skin', 'Eczema, Rosacea and Sensitive Skin', sensitiveSkinGuide],
  ['sensitive_skin_ethnic', 'skin', 'Sensitive Skin by Community', sensitiveSkinEthnic],
  ['colour_correcting_guide', 'complexion', 'Colour Correcting', colourCorrectingGuide],
  ['colour_theory_makeup', 'complexion', 'Colour Theory for Makeup', colourTheoryMakeup],
  ['foundation_guide_extended', 'complexion', 'Foundation: Formula, Coverage and Undertone', foundationGuideExtended],
  ['makeup_finishes_guide', 'complexion', 'Finishes, Prep and Long Wear', makeupFinishesGuide],
  ['setting_products_guide', 'complexion', 'Primer, Powder, Spray and Flashback', settingProductsGuide],
  ['contouring_guide_ethnic', 'complexion', 'Contour by Face Shape', contouringGuideEthnic],
  ['contouring_guide_v2', 'complexion', 'Contour and Highlight Techniques', contouringGuideV2],
  ['cheek_makeup_guide', 'complexion', 'Blush, Bronzer and Highlighter', cheekMakeupGuide],
  ['makeup_tools_guide', 'complexion', 'Brushes, Sponges and Tools', makeupToolsGuide],
  ['makeup_removal_guide', 'complexion', 'Taking It All Off', makeupRemovalGuide],
  ['colour_theory_ethnic', 'colour', 'Undertones and Colour Formulas', colourTheoryEthnic],
  ['colour_theory_beauty', 'colour', 'Colour Theory: Eyes, Hair and Clothes', colourTheoryBeauty],
  ['color_theory_ethnic_guide', 'colour', 'Colour Theory by Community', colorTheoryEthnicGuide],
  ['colour_theory_ethnic_skin', 'colour', 'Colour Theory Fundamentals', colourTheoryEthnicSkin],
  ['makeup_ethnic_guide', 'colour', 'Makeup Traditions by Community', makeupEthnicGuide],
  ['makeup_products_db', 'colour', 'Brands, Heritage Products and Picks by Concern', makeupProductsDb],
  ['lip_art_guide', 'colour', 'Lip Art: Finishes, Liner and Ombre', lipArtGuide],
  ['lip_colour_guide_extended', 'colour', 'Lip Colour by Depth and Undertone', lipColourGuideExtended],
  ['lip_care_guide', 'colour', 'Lip Care Routines and Darkening', lipCareGuide],
  ['lip_care_ethnic_guide', 'colour', 'Lip Care Traditions by Community', lipCareEthnicGuide],
  ['lip_care_guide_ethnic', 'colour', 'Lip Darkening: Types and Treatments', lipCareGuideEthnic],
  ['lip_health_ethnic_guide', 'colour', 'Lip Health and Ingredients', lipHealthEthnicGuide],
  ['nail_artistry', 'nails', 'Nail Shapes, Colours and Art Styles', nailArtistry],
  ['nail_colours_guide', 'nails', 'Nail Colour by Depth, Finishes and French', nailColoursGuide],
  ['nail_care_ethnic', 'nails', 'Nail Health, Enhancements and Dark Streaks', nailCareEthnic],
  ['nail_art_advanced', 'nails', 'Nail Art Techniques and Products', nailArtAdvanced],
  ['nail_art_guide_ethnic', 'nails', 'Nail Art by Community', nailArtGuideEthnic],
  ['nail_beauty_ethnic_guide', 'nails', 'Nail Biology and Care by Community', nailBeautyEthnicGuide],
  ['nail_care_guide_ethnic', 'nails', 'Nail Care Basics, Gel and Acrylic', nailCareGuideEthnic],
  ['nail_care_ethnic_guide', 'nails', 'Nail Conditions and Safety', nailCareEthnicGuide],
  ['fragrance_layering_guide', 'nails', 'Fragrance Families, Concentration and Layering', fragranceLayeringGuide],
  ['fragrance_guide_extended', 'nails', 'Applying and Layering Fragrance', fragranceGuideExtended],
  ['fragrance_atlas', 'nails', 'Fragrance Atlas: Notes and Traditions', fragranceAtlas],
  ['fragrance_communities_guide', 'nails', 'Attar, Oud, Rose, Sandalwood and Musk', fragranceCommunitiesGuide],
  ['fragrance_ethnic_guide', 'nails', 'Fragrance by Community', fragranceEthnicGuide],
  ['fragrance_guide_ethnic', 'nails', 'Fragrance Science and Traditional Scents', fragranceGuideEthnic],
  ['aging_skin_ethnic_guide', 'ageing', 'Skin Ageing: Science, Decades and Traditions', agingSkinEthnicGuide],
  ['aging_gracefully_ethnic_guide', 'ageing', 'Ageing Gracefully: Attitudes and Routines', agingGracefullyEthnicGuide],
  ['anti_aging_ethnic', 'ageing', 'Longevity Protocols and Ingredients', antiAgingEthnic],
  ['mature_beauty_guide', 'ageing', 'Beauty in Your 40s, 50s and 60s+', matureBeautyGuide],
  ['skincare_routines_by_age', 'ageing', 'Skincare Routines from Teens to 50s+', skincareRoutinesByAge],
  ['collagen_guide', 'ageing', 'Collagen: Types, Loss, Topicals and Supplements', collagenGuide],
  ['menopause_beauty', 'ageing', 'Menopause: Skin, Hair and Hormone Therapy', menopauseBeauty],
].map(([id, shelf, title, mod]) => ({ id, shelf, title, mod }));
