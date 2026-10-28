"""
Look recommendation engine.

Maps an AestheticVector (from Qloo taste data) to concrete look recommendations:
makeup looks, wig/hair styles, and product categories — with special depth for
Black and urban cultural aesthetics that mainstream apps consistently fail to
represent well.

This module deliberately leads with the aesthetics mainstream apps deprioritise:
  - Afrobeats / West African fashion (rich pigments, graphic liner, jewel tones)
  - Hip hop / trap / R&B (bold liner, bronzed skin, long lashes, edge control)
  - Dancehall / Caribbean (vibrant colour, sheer skin, tropical palettes)
  - Desi / South Asian (kuhl-rimmed eyes, warm bronze, gold)
  - K-beauty (gradient lip, glass skin, straight brows)
  - Afro-Latina (bold lip, sculpted cheek, Afro-textured hair representation)

Each look is returnable as a structured dict the frontend can render
directly into Beljour's VTO (virtual try-on) pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .aesthetic_engine import AestheticVector


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class LookProduct:
    """A single product recommendation within a look."""
    category: str        # e.g. "foundation", "lip", "liner", "wig"
    name: str            # product / style name
    finish: str          # e.g. "matte", "satin", "gloss", "sheer"
    shade_notes: str     # guidance for finding the right shade
    why: str             # plain-language explanation tied to taste signal


@dataclass
class WigStyle:
    """A wig or protective style recommendation."""
    style_name: str          # e.g. "Body Wave Lace Front", "Box Braids"
    texture: str             # e.g. "wavy", "coily", "straight", "braided"
    cap_type: str            # e.g. "lace front", "full lace", "U-part", "knotless"
    length_options: list[str]
    cultural_notes: str      # context on this style's cultural roots
    why: str                 # why this fits the taste profile


@dataclass
class Look:
    """A complete recommended look: makeup + hair."""
    name: str
    tagline: str
    archetype: str              # e.g. "Afro-Glam", "K-Beauty", "Hip Hop Glam"
    aesthetic_summary: str      # one-line vibe description
    products: list[LookProduct]
    wigs: list[WigStyle]
    tags: list[str]             # for UI filtering
    cultural_roots: str         # plain-language cultural context
    why_this_look: str          # personalised explanation from taste signals
    vto_eligible: bool = True   # whether Beljour's VTO pipeline can render it


# ---------------------------------------------------------------------------
# Look catalogue
# ---------------------------------------------------------------------------
# These are the curated look templates. In production they'd be stored in a
# database; for the hackathon they're inline and selected dynamically.

_LOOKS: list[dict[str, Any]] = [

    # ── BLACK / AFROBEATS / WEST AFRICAN ───────────────────────────────

    {
        "id": "afro_glam_editorial",
        "archetype": "Afro-Glam",
        "name": "Lagos Editorial",
        "tagline": "The look of Afrobeats: sculptured, rich, unapologetically bold.",
        "aesthetic_summary": "Deep jewel liner, bronzed glow, full coverage — West African high fashion energy.",
        "cultural_roots": (
            "Rooted in the Afrobeats and West African fashion scenes — Lagos, Accra, Abuja. "
            "Think Tiwa Savage, Yemi Alade, Simi: graphic liner, bold lashes, a sculpted brow "
            "and that specifically Nigerian glow that no filter can replicate."
        ),
        "products": [
            {"category": "foundation", "name": "Full-Coverage Satin", "finish": "satin",
             "shade_notes": "Match your deepest neck shade; go two shades warmer for a sun-kissed finish.",
             "why": "West African editorial looks use warmth, not pale matches."},
            {"category": "liner", "name": "Graphic Wing", "finish": "matte",
             "shade_notes": "Black kohl or rich espresso; extend past the outer corner.",
             "why": "The graphic liner silhouette is central to Afrobeats aesthetic."},
            {"category": "highlighter", "name": "Gold Body Glow", "finish": "glitter/shimmer",
             "shade_notes": "Rich gold, not silver. Concentrate at cheekbone and décolletage.",
             "why": "The Lagos glow uses warm gold, never cool highlight."},
            {"category": "lip", "name": "Berry or Brick", "finish": "gloss",
             "shade_notes": "Deep berry for cool undertones; burnt brick for warm. Avoid the nude wash-out.",
             "why": "Afrobeats beauty reclaims pigment — bold lip over nude."},
        ],
        "wigs": [
            {"style_name": "Knotless Box Braids", "texture": "braided", "cap_type": "knotless",
             "length_options": ["medium (shoulder)", "long (waist)"],
             "cultural_notes": "Knotless braids are a protective and fashion staple across West Africa and the diaspora.",
             "why": "Pairs with editorial looks; lighter than traditional knots."},
            {"style_name": "Kinky Afro Wig", "texture": "coily 4C", "cap_type": "full lace",
             "length_options": ["teenie weenie (TWA)", "mid length"],
             "cultural_notes": "4C representation in wigs is still rare. This is intentional.",
             "why": "Centres coily textures that most beauty apps render poorly."},
        ],
        "tags": ["afrobeats", "west african", "editorial", "bold", "jewel", "black culture"],
        "dimensions": {"intensity": (0.7, 1.0), "warmth": (0.6, 1.0), "boldness": (0.6, 1.0)},
    },

    # ── HIP HOP / R&B / URBAN ──────────────────────────────────────────

    {
        "id": "hip_hop_glam",
        "archetype": "Afro-Glam",
        "name": "808 Glam",
        "tagline": "Bronzed, lashed, edges laid. The club is the runway.",
        "aesthetic_summary": "Long lashes, edge control, smoky liner, full-coverage bronze base.",
        "cultural_roots": (
            "Hip hop and R&B beauty from the 90s to now: Rihanna, Cardi B, Beyoncé, Doja Cat, SZA. "
            "Full coverage base, smoked liner, sky-high lashes, and edges that could cut glass. "
            "This look says: I put in the work and I look like it."
        ),
        "products": [
            {"category": "foundation", "name": "24H Full Coverage Matte", "finish": "matte",
             "shade_notes": "Match your true undertone — warm bronze for warm, deep neutral for cool.",
             "why": "Hip hop glam requires a base that holds through a video shoot."},
            {"category": "contour", "name": "Sculpt & Bronze", "finish": "matte",
             "shade_notes": "Go 2-3 shades deeper than base; warm brown, never grey.",
             "why": "Sculpted cheeks and a chiselled nose are core to this look."},
            {"category": "lashes", "name": "Dramatic Strip Lash", "finish": "faux mink",
             "shade_notes": "Black; length 20-25mm; band colour matches liner.",
             "why": "Lashes are non-negotiable in this aesthetic."},
            {"category": "liner", "name": "Smoky Kohl", "finish": "smudged",
             "shade_notes": "Black or dark brown; smoke out the lower lash line.",
             "why": "The smoked liner reads in every setting from club to magazine."},
            {"category": "lip", "name": "Nude Gloss", "finish": "glossy",
             "shade_notes": "Warm nude matched to your undertone — not too pink, not too brown.",
             "why": "Hip hop beauty balances a bold eye with a luminous nude lip."},
        ],
        "wigs": [
            {"style_name": "Body Wave Lace Front", "texture": "wavy", "cap_type": "lace front",
             "length_options": ["long (waist)", "extra long (hip)"],
             "cultural_notes": "Body wave is the signature of R&B and hip hop video aesthetics.",
             "why": "Volume and movement read on camera and in person."},
            {"style_name": "Sleek Straight Lace", "texture": "straight", "cap_type": "HD lace front",
             "length_options": ["shoulder", "long (waist)"],
             "cultural_notes": "The silk press / bone straight look is a staple across Black beauty.",
             "why": "Clean, polished — pairs with glam looks."},
            {"style_name": "Senegalese Twists", "texture": "twisted", "cap_type": "knotless",
             "length_options": ["medium (shoulder)", "long (waist)"],
             "cultural_notes": "Senegalese twists are a protective style with roots across the continent.",
             "why": "A textured alternative to straight styles; just as polished."},
        ],
        "tags": ["hip hop", "r&b", "urban", "glam", "edges", "bronze", "black culture"],
        "dimensions": {"intensity": (0.65, 1.0), "warmth": (0.5, 0.9), "boldness": (0.5, 0.9)},
    },

    # ── CARIBBEAN / DANCEHALL ───────────────────────────────────────────

    {
        "id": "caribbean_carnival",
        "archetype": "Afro-Glam",
        "name": "Carnival Bombshell",
        "tagline": "Soca energy, Jamaican heat, Caribbean colour.",
        "aesthetic_summary": "Vibrant lip, sheer glowing base, graphic liner, tropical palette.",
        "cultural_roots": (
            "Dancehall queens, Carnival, soca anthems — Jamaica, Trinidad, Barbados, Guyana. "
            "Think Spice, Shenseea, Machel Montano's backing dancers: sheer skin that glows, "
            "vibrant colour, and a look that can keep up with the music."
        ),
        "products": [
            {"category": "foundation", "name": "Sheer Glow Serum", "finish": "dewy",
             "shade_notes": "Match undertone exactly; the goal is your skin, perfected.",
             "why": "Caribbean beauty shows skin — the sheer base lets it breathe."},
            {"category": "blush", "name": "Tropical Flush", "finish": "cream",
             "shade_notes": "Mango, guava, hibiscus — pick the one closest to your natural flush.",
             "why": "Cream blush reads under Caribbean sun without flashback."},
            {"category": "liner", "name": "Graphic Graphic Liner", "finish": "matte",
             "shade_notes": "White or neon for festival; black for Carnival night.",
             "why": "Graphic liner is part of the dancehall visual vocabulary."},
            {"category": "lip", "name": "Tropical Brights", "finish": "gloss",
             "shade_notes": "Coral, mango, hibiscus pink — rich, not washed out.",
             "why": "Caribbean colour palette: saturated, sun-drenched, alive."},
        ],
        "wigs": [
            {"style_name": "Curly Afro-Caribbean", "texture": "loose curl 3B-3C", "cap_type": "full lace",
             "length_options": ["medium", "long"],
             "cultural_notes": "The curly afro is central to Caribbean identity across the diaspora.",
             "why": "Celebrates natural curl textures from the region."},
            {"style_name": "Jumbo Passion Twists", "texture": "twisted/wavy", "cap_type": "half wig",
             "length_options": ["long (waist)"],
             "cultural_notes": "Passion twists blend twist and bohemian curl — very popular in the Caribbean diaspora.",
             "why": "Effortless volume that moves."},
        ],
        "tags": ["caribbean", "dancehall", "soca", "reggae", "tropical", "vibrant", "black culture"],
        "dimensions": {"intensity": (0.5, 0.85), "warmth": (0.6, 1.0), "boldness": (0.5, 0.85)},
    },

    # ── DESI / SOUTH ASIAN ─────────────────────────────────────────────

    {
        "id": "desi_glam",
        "archetype": "Desi Glam",
        "name": "Shaadi Ready",
        "tagline": "Gold, kohl, and the warmth of a South Asian palette.",
        "aesthetic_summary": "Kohl-rimmed eyes, gold highlight, warm bronze base, bold lip.",
        "cultural_roots": (
            "Bollywood, South Asian weddings, mehndi nights. "
            "Think Priyanka Chopra, Deepika Padukone, Alia Bhatt. The aesthetic is warm, "
            "golden, richly pigmented — not the washed-out 'South Asian' look that mainstream "
            "apps generate by defaulting to warm-undertone rules made for other skin types."
        ),
        "products": [
            {"category": "foundation", "name": "Warm Olive Match", "finish": "satin",
             "shade_notes": "South Asian skin ranges from light to deep; match the neck. Warm or olive undertone.",
             "why": "Desi glam starts with the right base — never ashy, never pink."},
            {"category": "liner", "name": "Black Kohl", "finish": "smudged",
             "shade_notes": "Kohl in the waterline and tight-line; smoke out below.",
             "why": "Kohl is the defining feature of South Asian eye looks across every ceremony."},
            {"category": "highlighter", "name": "24K Gold Glow", "finish": "shimmer",
             "shade_notes": "Warm gold — specifically gold, not champagne.",
             "why": "Gold is the metal of South Asian adornment; it reads in every light."},
            {"category": "lip", "name": "Deep Red or Raspberry", "finish": "matte",
             "shade_notes": "For warm undertones: deep red. For neutral: raspberry or wine.",
             "why": "The bold lip is the south Asian celebration statement."},
        ],
        "wigs": [
            {"style_name": "Long Straight Blowout", "texture": "straight", "cap_type": "lace front",
             "length_options": ["long (waist)", "extra long (hip)"],
             "cultural_notes": "Long straight hair is the Bollywood signature.",
             "why": "Classic South Asian glam aesthetic."},
            {"style_name": "Loose Wavy Blowout", "texture": "wavy 2B", "cap_type": "lace front",
             "length_options": ["long", "medium"],
             "cultural_notes": "Wavy blowout is the South Asian fusion look — traditional meets modern.",
             "why": "More movement, still polished."},
        ],
        "tags": ["south asian", "desi", "bollywood", "hindi", "shaadi", "gold", "kohl"],
        "dimensions": {"intensity": (0.6, 1.0), "warmth": (0.55, 1.0), "boldness": (0.55, 1.0)},
    },

    # ── K-BEAUTY ────────────────────────────────────────────────────────

    {
        "id": "k_beauty_glass",
        "archetype": "K-Beauty",
        "name": "Glass Skin Edit",
        "tagline": "Lit-from-within glow, gradient lip, barely-there liner.",
        "aesthetic_summary": "Dewy base, blurred skin, puppy liner, berry gradient lip.",
        "cultural_roots": (
            "K-beauty and K-pop aesthetics: the skin-first, glow-forward look from Seoul. "
            "Think BLACKPINK, IU, NewJeans: luminous base, soft diffused liner, gradient lip "
            "that fades into the centre — the antithesis of heavy contouring."
        ),
        "products": [
            {"category": "skincare base", "name": "Essence + Serum Layer", "finish": "glassy",
             "shade_notes": "Match skin exactly; the goal is invisible.",
             "why": "K-beauty starts with skin prep — no coverage can replace it."},
            {"category": "foundation", "name": "Cushion or Serum Foundation", "finish": "luminous",
             "shade_notes": "Match perfectly; K-beauty does not go warmer than the face.",
             "why": "Dewy finish, buildable — the Korean cushion formula."},
            {"category": "liner", "name": "Puppy Eye Wing", "finish": "matte",
             "shade_notes": "Brown or black; tail drops slightly past the outer corner.",
             "why": "The puppy liner creates the wide-eyed K-beauty shape."},
            {"category": "lip", "name": "Gradient Berry Lip", "finish": "stain",
             "shade_notes": "Concentrate colour at centre; blend outward to diffuse.",
             "why": "The bitten-lip gradient is the K-beauty signature."},
        ],
        "wigs": [
            {"style_name": "Straight Bob with Bangs", "texture": "straight", "cap_type": "lace front",
             "length_options": ["chin (bob)", "shoulder"],
             "cultural_notes": "The Korean bob with blunt fringe is iconic in K-pop and K-drama.",
             "why": "Pairs with the glass skin look perfectly."},
        ],
        "tags": ["k-beauty", "k-pop", "korean", "glass skin", "dewy", "gradient lip"],
        "dimensions": {"intensity": (0.2, 0.6), "warmth": (0.3, 0.6), "boldness": (0.1, 0.5)},
    },

    # ── CLEAN MINIMAL ───────────────────────────────────────────────────

    {
        "id": "clean_minimal",
        "archetype": "Clean Minimal",
        "name": "Your Skin, Perfected",
        "tagline": "Nothing to hide. Everything to show.",
        "aesthetic_summary": "Sheer skin tint, brow gel, mascara, tinted lip balm — that's it.",
        "cultural_roots": (
            "Clean beauty and skinimalism: the movement toward letting real skin show. "
            "Across every culture, the no-makeup makeup look is reclaimed as confidence, "
            "not absence. This version centres every skin tone, undertone, and texture equally."
        ),
        "products": [
            {"category": "skin tint", "name": "Sheer Skin Tint SPF", "finish": "skin-like",
             "shade_notes": "Match to neck precisely; minimal pigment.",
             "why": "Skinimalism enhances; it doesn't cover."},
            {"category": "brow", "name": "Clear Lamination Gel", "finish": "clear",
             "shade_notes": "No tint needed; lift and set only.",
             "why": "Brushed-up brows are the one grooming cue in clean beauty."},
            {"category": "mascara", "name": "Brown-Black Lengthening", "finish": "natural",
             "shade_notes": "Brown-black reads natural on all depths; jet black only if very dark lashes.",
             "why": "One coat; the goal is your lashes, longer."},
            {"category": "lip", "name": "Tinted Balm", "finish": "glossy",
             "shade_notes": "One shade deeper than your natural lip colour.",
             "why": "Enhances without overpowering."},
        ],
        "wigs": [
            {"style_name": "Natural Textured Afro Wig", "texture": "coily 4A-4C", "cap_type": "full lace",
             "length_options": ["TWA", "medium", "long"],
             "cultural_notes": "Natural hair in clean beauty spaces is still underrepresented. We fix that.",
             "why": "Clean aesthetic + natural texture = an underserved combination we lead with."},
        ],
        "tags": ["clean beauty", "minimal", "skinimalism", "no makeup", "natural"],
        "dimensions": {"intensity": (0.0, 0.35), "warmth": (0.3, 0.7), "boldness": (0.0, 0.4)},
    },
]


# ---------------------------------------------------------------------------
# Recommendation engine
# ---------------------------------------------------------------------------

def score_look(look: dict, vec: AestheticVector) -> float:
    """Score how well a look matches an aesthetic vector."""
    dims = look.get("dimensions", {})
    score = 0.0
    checks = 0

    def _dim_score(value: float, lo: float, hi: float) -> float:
        if lo <= value <= hi:
            # Higher score the closer to the midpoint of the range
            mid = (lo + hi) / 2
            return 1.0 - abs(value - mid) / max(hi - lo, 0.01) * 0.5
        # Penalty for being outside the range
        dist = max(lo - value, value - hi)
        return max(0.0, 0.5 - dist)

    for dim, (lo, hi) in dims.items():
        v = getattr(vec, dim, None)
        if v is not None:
            score += _dim_score(float(v), lo, hi)
            checks += 1

    # Archetype bonus
    if any(a in vec.archetypes for a in [look.get("archetype", "")]):
        score += 0.5

    # Tag overlap bonus
    look_tags = set(look.get("tags", []))
    taste_tags = set(t.lower() for t in vec.cultural_tags)
    overlap = len(look_tags & taste_tags)
    score += overlap * 0.15

    return score / max(checks, 1) + (0.5 if checks == 0 else 0)


def recommend_looks(
    vec: AestheticVector,
    *,
    top_n: int = 3,
    min_score: float = 0.2,
) -> list[Look]:
    """
    Return the top N looks for an aesthetic vector, scored and ranked.

    Args:
        vec: AestheticVector from aesthetic_engine.build_aesthetic_vector
        top_n: how many looks to return
        min_score: minimum score threshold

    Returns:
        List of Look objects, best match first
    """
    scored = []
    for raw in _LOOKS:
        s = score_look(raw, vec)
        if s >= min_score:
            scored.append((s, raw))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_n]

    results: list[Look] = []
    for score, raw in top:
        why = _build_why(raw, vec, score)
        products = [LookProduct(**p) for p in raw["products"]]
        wigs = [WigStyle(**w) for w in raw["wigs"]]
        look = Look(
            name=raw["name"],
            tagline=raw["tagline"],
            archetype=raw["archetype"],
            aesthetic_summary=raw["aesthetic_summary"],
            products=products,
            wigs=wigs,
            tags=raw["tags"],
            cultural_roots=raw["cultural_roots"],
            why_this_look=why,
        )
        results.append(look)

    return results


def _build_why(raw: dict, vec: AestheticVector, score: float) -> str:
    """Build a personalised 'why this look' explanation."""
    parts: list[str] = []

    archetype = raw.get("archetype", "")
    if archetype in vec.archetypes:
        parts.append(f"Your taste signals cluster strongly around {archetype} aesthetics.")

    look_tags = set(raw.get("tags", []))
    taste_tags = [t for t in vec.cultural_tags if t.lower() in look_tags]
    if taste_tags:
        parts.append(f"Tags from your Qloo profile — {', '.join(taste_tags[:3])} — align directly with this look.")

    if vec.intensity > 0.65 and raw.get("dimensions", {}).get("intensity", (0, 0))[0] > 0.5:
        parts.append("You lean toward high-intensity, glam looks.")
    elif vec.intensity < 0.35 and raw.get("dimensions", {}).get("intensity", (1, 1))[1] < 0.5:
        parts.append("Your taste gravitates toward natural, skin-forward aesthetics.")

    if vec.warmth > 0.6 and raw.get("dimensions", {}).get("warmth", (0, 0))[0] > 0.5:
        parts.append("Warm pigments and earthy golds are in your aesthetic DNA.")

    if not parts:
        parts.append(f"This look matched your taste profile with a score of {score:.0%}.")

    return " ".join(parts)
