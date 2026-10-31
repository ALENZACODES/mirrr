/**
 * Taste Leap city portraits: one model photo of a woman per city,
 * wearing that city's look. `shows` describes what the photo actually shows, and is the alt text;
 * the look the leap ranks for your taste is named separately, beside the photo.
 */
const P = (id, shows) => ({ src: `/leap/${id}.webp`, shows });
export const LEAP_PORTRAITS = {
  lagos: P('lagos', 'emerald and gold gele headwrap, bronze-gold eyes, berry gloss'),
  accra: P('accra', 'kente headwrap and drape, gold shimmer eyes, terracotta lip'),
  johannesburg: P('johannesburg', 'beaded collar, copper eyes, glossy bronze skin'),
  nairobi: P('nairobi', 'long braids, red, white and blue beaded collar, plum lip'),
  kingston: P('kingston', 'electric-blue winged liner, sleek high ponytail, gold hoops'),
  mumbai: P('mumbai', 'kajal and winged liner, bindi, nose ring, silk saree border'),
  dubai: P('dubai', 'black kohl wing, gold-shimmer lids, sheer black shayla'),
  tehran: P('tehran', 'arched brows, winged liner, turquoise and saffron silk scarf'),
  seoul: P('seoul', 'dewy glass skin, soft straight brows, peach lip tint'),
  tokyo: P('tokyo', 'soft gyaru eyes, high pink blush, honey-brown waves'),
  mexico_city: P('mexico_city', 'marigold and bougainvillea flower crown, red lip, embroidered blouse'),
  rio: P('rio', 'bronzed glow, gem-dotted eyes, coral gloss, flower in her curls'),
  marrakech: P('marrakech', 'black kohl eyes, silver coin headpiece, saffron and indigo scarf'),
  istanbul: P('istanbul', 'smoky warm-brown eyes, rosewood lip, ruby velvet'),
  bangkok: P('bangkok', 'rose-gold lids, rosy cheeks, orchid in a low bun'),
  addis_ababa: P('addis_ababa', 'shuruba braids, white netela with tibeb border, gold cross pendant'),
};
export const portraitFor = id => LEAP_PORTRAITS[id] ?? null;
