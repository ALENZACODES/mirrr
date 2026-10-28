"""Consent-neutral contracts for thirteen local W-series cosmetic previews.

The inputs are display RGB and user-provided region masks, not face inference.
Every feature describes an *illustrated simulation*, never a prediction of
physical makeup, a medical outcome, or personal beauty/attractiveness.

Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

FeatureId = Literal[
    "W4", "W5", "W7", "W8", "W9", "W10", "W11", "W12",
    "W13", "W15", "W16", "W17", "W18",
    "W19", "W20", "W21", "W22", "W23", "W24", "W25", "W26", "W27",
    "W29", "W30", "W31", "W32", "W33", "W34", "W35", "W36",
    "W37", "W38", "W40", "W43", "W44",
    "W59", "W60", "W61", "W62", "W63", "W64", "W65", "W66",
    "W67", "W68", "W69", "W70", "W71", "W72", "W73", "W75", "W76",
]
RegionId = Literal[
    "face", "cheek_left", "cheek_right", "under_eye_left", "under_eye_right",
    "eyelid_left", "eyelid_right", "lips", "jaw", "neck",
    "hair", "roots", "tips", "crown", "hair_left", "hair_right",
    "scalp", "hairline", "fringe",
    "lash_left", "lash_right", "lid_left", "lid_right",
    "liner_left", "liner_right", "iris_left", "iris_right",
    "brow_left", "brow_right",
]


@dataclass(frozen=True, slots=True)
class FeatureSpec:
    id: FeatureId
    name: str
    regions: tuple[RegionId, ...]
    variants: tuple[str, ...]
    max_channel_delta: int
    promise: str
    non_promise: str
    reason: str


FEATURE_SPECS: tuple[FeatureSpec, ...] = (
    FeatureSpec(
        "W4", "Undertone palette preview", ("cheek_left", "cheek_right"),
        ("warm", "cool", "neutral"), 44,
        "Mask-bound example cheek colour from a chosen undertone family.",
        "No automatic undertone diagnosis or foundation match.",
        "The person selects the display undertone; appearance is not inferred.",
    ),
    FeatureSpec(
        "W5", "Outfit palette preview", ("eyelid_left", "eyelid_right", "lips"),
        ("complement", "analogous", "muted"), 48,
        "Suggested eye and lip colours derived from a user-selected outfit swatch.",
        "No recognition of clothing, brand, or aesthetic suitability score.",
        "Only the supplied outfit colour is used; no image upload or classifier.",
    ),
    FeatureSpec(
        "W7", "Concealer placement preview", ("under_eye_left", "under_eye_right"),
        ("brighten", "neutral", "warm"), 42,
        "Placement-constrained light tint on explicitly supplied under-eye masks.",
        "Not a blemish diagnosis, skincare recommendation or true shade measurement.",
        "The user controls regions and intensity; no face features are inferred.",
    ),
    FeatureSpec(
        "W8", "Colour correction map", ("under_eye_left", "under_eye_right", "cheek_left", "cheek_right"),
        ("peach", "green", "lavender"), 46,
        "A sample corrective hue within user-provided cosmetic regions.",
        "No diagnosis of pigmentation, inflammation or health conditions.",
        "The user chooses the hue and masks; changes are local and reversible.",
    ),
    FeatureSpec(
        "W9", "Cream and powder finish", ("face",),
        ("cream", "powder"), 28,
        "Small local RGB texture and highlight adjustments within a face mask.",
        "Not a physical powder, shine, pore or wear prediction.",
        "A simulated visual finish uses only local image pixels.",
    ),
    FeatureSpec(
        "W10", "Dewy, matte and tint finish", ("face",),
        ("dewy", "matte", "tint"), 30,
        "Locally bounded finish brightness and texture examples.",
        "Not skin condition detection or a product performance guarantee.",
        "The source remains unchanged and the selected finish is labelled simulation.",
    ),
    FeatureSpec(
        "W11", "Blush placement guide", ("cheek_left", "cheek_right"),
        ("lifted", "rounded", "soft"), 50,
        "User-directed blush shapes inside explicit cheek masks.",
        "No automatic face-shape classification or flattering-look score.",
        "Choice of placement, not appearance judgement, controls the example.",
    ),
    FeatureSpec(
        "W12", "Contour and bronzer map", ("cheek_left", "cheek_right", "jaw"),
        ("contour", "bronze", "soft"), 45,
        "A light/dark contour overlay confined to chosen cheek and jaw masks.",
        "No prediction of facial reshaping or physical makeup wear.",
        "Only display-space shading is applied; geometric facial structure is untouched.",
    ),
    FeatureSpec(
        "W13", "Reference swatch recreation", ("eyelid_left", "eyelid_right", "cheek_left", "cheek_right", "lips"),
        ("reference", "muted"), 52,
        "Displays a user-chosen reference swatch in pre-authorized makeup regions.",
        "Does not copy a face, impersonate another person or recreate branded products.",
        "Only a manually supplied RGB swatch is accepted; reference photos never leave the browser.",
    ),
    FeatureSpec(
        "W15", "Bridal trial palette", ("eyelid_left", "eyelid_right", "cheek_left", "cheek_right", "lips"),
        ("day", "evening", "soft"), 52,
        "Three restrained, original event-themed makeup colour sets.",
        "No bridal perfection score or prediction of all-day durability.",
        "Original locally composed palette; no model of real product or occasion norms.",
    ),
    FeatureSpec(
        "W16", "No-makeup makeup calibration", ("face", "cheek_left", "cheek_right", "lips"),
        ("minimal", "balanced"), 24,
        "Mild softening and tint within explicit masks with a strength control.",
        "Does not remove natural features, score skin, or promise undetectable makeup.",
        "Keeps editable original and alpha; strength zero is a strict identity.",
    ),
    FeatureSpec(
        "W17", "Foundation colour-shift timeline", ("face",),
        ("warm_shift", "neutral_shift"), 30,
        "Illustrative colour drift controlled by a user-selected hour setting.",
        "Not a chemical oxidation or real-product longevity prediction.",
        "The timeline is a fictional screen simulation, not product performance evidence.",
    ),
    FeatureSpec(
        "W18", "Seasonal display-shade mixing", ("face", "neck"),
        ("spring", "summer", "autumn", "winter"), 44,
        "Visual mixing ratio between two selected fictional display swatches.",
        "Not a measured skin-tone or season classification or retail shade equivalence.",
        "Blend ratio and colour pair are user-controlled, with bounded output.",
    ),
    FeatureSpec(
        "W19", "Clip-in placement and tone study", ("hair", "tips"),
        ("soft-volume", "long-ribbon", "face-frame"), 44,
        "A mask-limited extension colour and volume illustration on authorized hair pixels.",
        "Not a generated extension, new hair strand, or supplier fit prediction.",
        "Only painted hair and tip masks are used; no unseen hair is synthesized.",
    ),
    FeatureSpec(
        "W20", "Weft extension placement study", ("hair", "hair_left", "hair_right"),
        ("tape", "sew", "subtle"), 38,
        "Shows local weft-inspired shadow and tone bands inside selected hair areas.",
        "Not a claim about attachment safety, suitability, or installed volume.",
        "Illustration requires explicit existing hair masks; no head geometry is inferred.",
    ),
    FeatureSpec(
        "W21", "Topper edge and crown colour study", ("crown", "roots"),
        ("feathered", "dense", "subtle"), 38,
        "Visually shades manually marked crown and roots to inspect topper colour transitions.",
        "Not a physical hair-topper reconstruction or clinical hair-loss assessment.",
        "Crown and roots must be provided by the caller; nothing else is inspected.",
    ),
    FeatureSpec(
        "W22", "Fashion wig colour study", ("hair", "fringe"),
        ("natural", "bold", "soft"), 54,
        "Applies locally bounded original swatches to a user-authorized wig-shaped region.",
        "Not a simulated physical fit, hair generation or purchase-ready wig match.",
        "The provided mask defines every pixel; background and alpha are untouched.",
    ),
    FeatureSpec(
        "W23", "Root touch-up colour study", ("roots", "hairline"),
        ("powder", "mist", "soft"), 47,
        "Locally colours selected roots and hairline to compare temporary touch-up appearance.",
        "Not coverage, durability or true colour compatibility evidence.",
        "The chosen display colours and masks determine all output without a vendor call.",
    ),
    FeatureSpec(
        "W24", "Scalp-area concealer illustration", ("scalp", "hairline"),
        ("soft-shade", "fine-grain", "neutral"), 42,
        "A reversible tonal concealer pattern within manually marked scalp pixels.",
        "Not medical hair-loss detection, a growth claim or a real-product efficacy test.",
        "Only selected pixels are shaded and grain remains a screen illustration.",
    ),
    FeatureSpec(
        "W25", "Topical fibre appearance study", ("scalp", "crown"),
        ("sparse", "medium", "full"), 42,
        "Shows reproducible fibre-like dots on approved crown or scalp regions.",
        "Not measured fibre retention or a promise of physical thickness.",
        "Deterministic screen grain needs no camera upload or diagnosis.",
    ),
    FeatureSpec(
        "W26", "Semi-permanent tint colour study", ("hair", "tips"),
        ("soft", "vivid", "washed"), 50,
        "Applies adjustable original temporary colour swatches only inside hair masks.",
        "Not actual dye chemistry, processing time or longevity.",
        "Colour parameters are user selected and rendered locally.",
    ),
    FeatureSpec(
        "W27", "Gloss and toner display study", ("hair", "tips"),
        ("cool", "warm", "clear"), 38,
        "Introduces bounded sheen and warmth changes to authorized hair pixels.",
        "Not a test of brassiness, professional toner or actual light reflection.",
        "The outcome is a deterministic RGB illustration with no external scoring.",
    ),
    FeatureSpec(
        "W29", "Face-framing money-piece swatch", ("hair_left", "hair_right", "fringe"),
        ("soft", "contrast", "balanced"), 48,
        "Shows a locally painted brighter framing colour within selected hair masks.",
        "Not a generated strand, supplier formula or measured colour lift.",
        "The operator edits only explicitly provided front-hair regions.",
    ),
    FeatureSpec(
        "W30", "Foil, lowlight and babylight layout", ("hair", "hair_left", "hair_right"),
        ("lowlights", "babylights", "foils"), 45,
        "Renders three independently spaced strand-toning patterns in a hair mask.",
        "Not an actual salon placement map or chemical colour forecast.",
        "No strand geometry is generated outside the user-approved hair area.",
    ),
    FeatureSpec(
        "W31", "Chunky and lived-in highlights", ("hair", "tips"),
        ("chunky", "lived-in", "diffused"), 48,
        "Compares original broad highlight and softened-end colour patterns.",
        "Not a guarantee about salon colour technique or hair health.",
        "The screen-only highlight guide remains within approved masks.",
    ),
    FeatureSpec(
        "W32", "Grey-tonal blending preview", ("hair", "roots", "tips"),
        ("silver", "smoke", "soft"), 45,
        "Shows user-selected grey and neutral swatches on hair or root masks.",
        "Not ageing inference or permanent colour removal.",
        "This local preview cannot predict natural greying or product results.",
    ),
    FeatureSpec(
        "W33", "Grey transition storyboard", ("roots", "hair", "tips"),
        ("early", "middle", "late"), 47,
        "Shows three manually chosen grey-mix stages as fictional colour studies.",
        "Not a biological change, age prediction or time-to-grey estimate.",
        "All timeline stages are editorial choices, never measured hair changes.",
    ),
    FeatureSpec(
        "W34", "Colour-melt and ombre study", ("roots", "hair", "tips"),
        ("seamless", "contrast", "cool"), 50,
        "Visualizes an upper-to-lower screen-colour transition on masked hair.",
        "Not a forecast of dyed hair or simulated additional length.",
        "Only two user-provided RGB colours and selected masks are involved.",
    ),
    FeatureSpec(
        "W35", "Split-dye contrast study", ("hair_left", "hair_right", "fringe"),
        ("balanced", "left-bright", "right-bright"), 52,
        "Shows two independently masked colour halves and an optional fringe accent.",
        "Not automatic part detection or a hairstyle transformation.",
        "Both halves require explicit user-approved segmentation.",
    ),
    FeatureSpec(
        "W36", "Peekaboo colour placement", ("hair", "tips", "hair_left", "hair_right"),
        ("underlayer", "side-slice", "soft"), 49,
        "Illustrates concealed accent bands within manually selected hair portions.",
        "Not visibility prediction during movement or a physical dye result.",
        "An effect applies only where its matching caller mask has nonzero opacity.",
    ),
    FeatureSpec(
        "W37", "Fringe colour-and-texture guide", ("fringe", "hairline"),
        ("curtain", "wispy", "straight"), 42,
        "Compares mask-limited tonal cues for three editorial fringe references.",
        "Does not create bangs, remove hair or alter a forehead outline.",
        "A hand-authorized fringe mask is mandatory; no new pixels are synthesized.",
    ),
    FeatureSpec(
        "W38", "Haircut length-guide swatches", ("hair", "tips", "fringe"),
        ("bob", "crop", "layers"), 42,
        "Adds reversible shade markers describing short and layered styling ideas.",
        "Not a generated haircut or prediction of physical styling results.",
        "No clipping or face-shape inference; image geometry is left intact.",
    ),
    FeatureSpec(
        "W40", "Curl-definition screen preview", ("hair", "hair_left", "hair_right"),
        ("definition", "soft-frizz", "shine"), 34,
        "Adjusts masked hair RGB texture to illustrate several curl-finish options.",
        "Not curl-type classification, hair repair or anti-frizz performance evidence.",
        "No curl structure is inferred and every source pixel stays reversible.",
    ),
    FeatureSpec(
        "W43", "Heat-style visual reference", ("hair", "tips"),
        ("waves", "straight", "volume"), 38,
        "Displays three masked strand-light and shadow patterns for styling ideas.",
        "Not a heat-styling safety claim, damage forecast or physical transformation.",
        "Only original local colour textures are used with no device controls.",
    ),
    FeatureSpec(
        "W44", "Humidity scenario styling reference", ("hair", "tips"),
        ("dry", "humid", "rainy"), 38,
        "Compares three optional editor-set hair finish scenarios on a static image.",
        "Not a real weather forecast or humidity-resistance guarantee.",
        "The scene is hypothetical and uses no location or weather data.",
    ),
    FeatureSpec(
        "W59", "Lash-extension density illustration", ("lash_left", "lash_right"),
        ("natural", "fan", "wispy"), 48,
        "Displays original darkened and highlighted lines in painted lash regions.",
        "Not generated lashes, an actual extension length or product fit.",
        "Local mask geometry is supplied; no eye landmarks are discovered.",
    ),
    FeatureSpec(
        "W60", "Lash styling reference chooser", ("lash_left", "lash_right"),
        ("open", "cat", "rounded"), 45,
        "Three user-picked lash tint distributions confined to supplied masks.",
        "Not automatic eye-shape assessment or beauty scoring.",
        "The wearer picks a reference style without face classification.",
    ),
    FeatureSpec(
        "W61", "Lash lift-and-tint colour study", ("lash_left", "lash_right"),
        ("lift", "brown", "black"), 45,
        "Shows an original lift-inspired stripe and simple lash tints.",
        "Not physical curling, procedure effects or lash growth.",
        "Output changes display RGB only within approved lash regions.",
    ),
    FeatureSpec(
        "W62", "Strip-and-cluster lash look", ("lash_left", "lash_right"),
        ("strip", "cluster", "minimal"), 44,
        "Reversible stylised clusters inside a user-painted eyelash boundary.",
        "Not an actual extension overlay beyond the source silhouette.",
        "The guide never creates pixels in surrounding skin or eye whites.",
    ),
    FeatureSpec(
        "W63", "Mascara finish comparison", ("lash_left", "lash_right"),
        ("length", "volume", "soft"), 38,
        "Locally compares strand, shadow and sheen treatments on lashes.",
        "Not tested product wear or a physical lengthening result.",
        "All variations are local and require an explicit lash mask.",
    ),
    FeatureSpec(
        "W64", "Eyeliner wing colour guide", ("liner_left", "liner_right"),
        ("short", "long", "soft"), 46,
        "Shows chosen eyeliner shade intensity inside a painted wing region.",
        "No inferred eye contour or new geometry is drawn automatically.",
        "The person paints or approves both liner masks.",
    ),
    FeatureSpec(
        "W65", "Graphic and smoky eyeliner study", ("liner_left", "liner_right", "lid_left", "lid_right"),
        ("graphic", "smoke", "fine"), 48,
        "Illustrates liner edge weight and blend within authorized eye masks.",
        "Not an exact tattoo, stencil or physical application result.",
        "There are no remote style references or skin diagnoses.",
    ),
    FeatureSpec(
        "W66", "Eyeshadow placement references", ("lid_left", "lid_right"),
        ("halo", "crease", "wash"), 48,
        "Compares original masked lid-colour placement and gradient fields.",
        "Not a prediction of cosmetics on varying physical textures.",
        "Only user-selected eyeshadow colours and masks enter the renderer.",
    ),
    FeatureSpec(
        "W67", "Foiled and duochrome shadow study", ("lid_left", "lid_right"),
        ("foil", "duochrome", "soft"), 48,
        "Uses finite deterministic RGB sparkle and two-tone shadow hints.",
        "Not a lighting-accurate pigment or real-product reflectance model.",
        "The deterministic effect is a screen simulation only.",
    ),
    FeatureSpec(
        "W68", "Fashion iris-colour preview", ("iris_left", "iris_right"),
        ("blue", "hazel", "violet"), 49,
        "Locally recolours explicitly masked irises with original swatches.",
        "Not contact-lens safety advice or a vision or lens-fit prediction.",
        "Eye whites, pupil, surrounding skin and source alpha remain unchanged.",
    ),
    FeatureSpec(
        "W69", "Brow tint preview", ("brow_left", "brow_right"),
        ("warm", "cool", "deep"), 45,
        "Shows three simple reversible tint colours in approved eyebrow masks.",
        "Not chemical tint longevity or hair-colour diagnosis.",
        "No brow edges or new hair are synthesized.",
    ),
    FeatureSpec(
        "W70", "Brow lamination visual reference", ("brow_left", "brow_right"),
        ("raised", "feathered", "flat"), 42,
        "Suggests different brow strand-light directions inside painted masks.",
        "Not a predicted treatment or a changed brow silhouette.",
        "Original pixel positions stay fixed throughout.",
    ),
    FeatureSpec(
        "W71", "Microblading colour-reference guide", ("brow_left", "brow_right"),
        ("hair-stroke", "soft", "defined"), 42,
        "Illustrates stroke-like cosmetic RGB texture inside selected brows.",
        "Not a cosmetic procedure recommendation, safety or healed-result claim.",
        "Every stroke comes from deterministic local pixels, not user identity.",
    ),
    FeatureSpec(
        "W72", "Powder and nano-brow simulation", ("brow_left", "brow_right"),
        ("powder", "nano", "ombre"), 42,
        "Combines finite powder and fine-stroke screen-colour patterns.",
        "Not tattoo permanence, device guidance or a clinical outcome.",
        "The overlay cannot extend outside the approved brow masks.",
    ),
    FeatureSpec(
        "W73", "User-directed brow shape reference", ("brow_left", "brow_right"),
        ("soft-arch", "straight", "high-arch"), 42,
        "Tonal placement guide for three manually chosen brow preferences.",
        "Not automatic face-shape diagnosis or attractiveness scoring.",
        "Any outline change must come from explicitly supplied masks.",
    ),
    FeatureSpec(
        "W75", "Hooded and monolid makeup study", ("lid_left", "lid_right", "liner_left", "liner_right"),
        ("hooded", "monolid", "deep-set"), 45,
        "Offers original placement suggestions selected by the user.",
        "Not recognition of eye type or automatic personal recommendations.",
        "The local overlay edits only masks supplied in advance.",
    ),
    FeatureSpec(
        "W76", "Coloured liner-and-mascara pairing", ("liner_left", "liner_right", "lash_left", "lash_right"),
        ("plum", "navy", "bronze"), 48,
        "Shows matching example colours in eyeliner and lash regions.",
        "Not real brand matching or a product-performance promise.",
        "A local colour combination is never represented as a measured result.",
    ),
)

BY_ID: dict[str, FeatureSpec] = {feature.id: feature for feature in FEATURE_SPECS}
assert len(BY_ID) == len(FEATURE_SPECS)
ALL_REGIONS: tuple[RegionId, ...] = (
    "face", "cheek_left", "cheek_right", "under_eye_left", "under_eye_right",
    "eyelid_left", "eyelid_right", "lips", "jaw", "neck",
    "hair", "roots", "tips", "crown", "hair_left", "hair_right",
    "scalp", "hairline", "fringe",
    "lash_left", "lash_right", "lid_left", "lid_right",
    "liner_left", "liner_right", "iris_left", "iris_right",
    "brow_left", "brow_right",
)


def spec_for(value: str) -> FeatureSpec:
    """Fail closed for unavailable, rights-blocked or unknown W IDs."""
    try:
        return BY_ID[value]
    except KeyError as exc:
        raise ValueError(f"R20c does not offer feature {value!r}") from exc
