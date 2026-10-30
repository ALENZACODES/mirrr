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

export const SHELVES = [
  { id: 'rituals', title: 'Rituals & Heritage', blurb: 'Haldi, hammam, shea, mehndi, bathhouse and festival traditions, with the steps to do them at home.' },
  { id: 'eyes', title: 'Eyes, Brows & Kohl', blurb: 'Kohl and kajal traditions, brow threading and architecture, lashes, eye care, and makeup with glasses.' },
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
].map(([id, shelf, title, mod]) => ({ id, shelf, title, mod }));
