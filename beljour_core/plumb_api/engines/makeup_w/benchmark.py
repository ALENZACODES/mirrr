'Written R17B makeup pass definitions. Author: John Khan.'
from .contracts import FEATURES

PASS_DEFINITIONS = {feature: 'Outside declared cosmetic regions unchanged <=0.5%; alpha exact; mean covered luminance may not increase materially; deep-skin chroma ratio >=0.78; no brand names; real-face evidence required.' for feature in FEATURES}
PASS_DEFINITIONS['W13'] += ' Reference regions must be user-checked; no automatic face parser.'
PASS_DEFINITIONS['W14'] += ' Only original generic look names are permitted.'
PASS_DEFINITIONS['W17'] += ' Oxidation is labelled an estimate from user-entered behaviour.'
