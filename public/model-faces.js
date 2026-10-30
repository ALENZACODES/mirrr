/**
 * Built-in model faces for the try-on, so it can be played with no upload. Generated sample photos
 * of women (not real people), one per community, light to deep. `L` is the skin lightness (CIELAB
 * L*) the photo engine measures on each face; Taste Leap uses it to pick the face nearest the tone
 * chosen there.
 */
export const MODEL_FACES = [
  { id: 'east-asian', label: 'East Asian', src: '/model-face-east-asian.webp', L: 76.5 },
  { id: 'arab', label: 'Arab', src: '/model-face-arab.webp', L: 67.7 },
  { id: 'latina', label: 'Latina', src: '/model-face-latina.webp', L: 65.3 },
  { id: 'south-asian', label: 'South Asian', src: '/model-face-south-asian.webp', L: 63.7 },
  { id: 'caribbean', label: 'Caribbean', src: '/model-face-caribbean.webp', L: 55.4 },
  { id: 'south-african', label: 'South African', src: '/model-face-south-african.webp', L: 42.9 },
  { id: 'black-american', label: 'Black American', src: '/model-face-black-american.webp', L: 41.7 },
  { id: 'west-african', label: 'West African', src: '/model-face-west-african.webp', L: 39.8 },
  { id: 'east-african', label: 'East African', src: '/model-face-east-african.webp', L: 37.3 },
];

/** The model face whose skin lightness is closest to `L`. */
export function nearestModelFace(L) {
  return MODEL_FACES.reduce((best, f) => (Math.abs(f.L - L) < Math.abs(best.L - L) ? f : best), MODEL_FACES[0]);
}

export const MODEL_FACE_NOTE = 'Model faces are generated sample photos of women, not real people.';
