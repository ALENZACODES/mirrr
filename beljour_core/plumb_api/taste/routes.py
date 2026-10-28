"""
FastAPI routes for the Beljour × Qloo Taste integration.

Endpoints:

    POST /api/taste/profile
        Body: { inputs: ["Burna Boy", "Afrobeats", "natural hair"], city?: "Lagos" }
        Returns: resolved Qloo entities + taste profile + aesthetic vector

    POST /api/taste/looks
        Body: { inputs: [...], shade_depth?: "deep" | "medium" | "light", top_n?: 3 }
        Returns: ranked look recommendations with products + wigs

    GET /api/taste/archetypes
        Returns: the full list of supported aesthetic archetypes

    GET /api/taste/health
        Returns: { qloo_configured: bool, version: str }
"""

from __future__ import annotations

import logging
import os
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .aesthetic_engine import AestheticVector, build_aesthetic_vector
from .look_engine import Look, LookProduct, WigStyle, recommend_looks
from .qloo_client import QlooClient, QlooError

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/taste", tags=["taste"])


# ---------------------------------------------------------------------------
# Dependency: Qloo client (per-request, context-managed)
# ---------------------------------------------------------------------------

def _qloo_client() -> QlooClient:
    api_key = os.environ.get("QLOO_API_KEY", "")
    return QlooClient(api_key=api_key)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class TasteProfileRequest(BaseModel):
    inputs: list[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Names of artists, shows, brands, cuisines, aesthetics the user likes.",
        example=["Burna Boy", "Afrobeats", "natural hair", "earthy tones"],
    )
    city: str | None = Field(None, description="Optional city for localised signals.")


class ResolvedEntity(BaseModel):
    input: str
    qloo_id: str | None
    qloo_name: str | None
    qloo_type: str | None
    resolved: bool


class TasteProfileResponse(BaseModel):
    resolved: list[ResolvedEntity]
    qloo_tags: list[dict]
    aesthetic: dict
    unresolved_inputs: list[str]
    trace: list[str]


class LookRecommendationRequest(BaseModel):
    inputs: list[str] = Field(..., min_length=1, max_length=20)
    shade_depth: str | None = Field(
        None,
        description="User's skin depth: 'light', 'medium', 'deep', 'rich'. Used to tailor shade notes.",
    )
    top_n: int = Field(3, ge=1, le=6)


class ProductOut(BaseModel):
    category: str
    name: str
    finish: str
    shade_notes: str
    why: str


class WigOut(BaseModel):
    style_name: str
    texture: str
    cap_type: str
    length_options: list[str]
    cultural_notes: str
    why: str


class LookOut(BaseModel):
    name: str
    tagline: str
    archetype: str
    aesthetic_summary: str
    products: list[ProductOut]
    wigs: list[WigOut]
    tags: list[str]
    cultural_roots: str
    why_this_look: str
    vto_eligible: bool


class LookRecommendationResponse(BaseModel):
    looks: list[LookOut]
    aesthetic: dict
    cultural_signal_summary: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
async def taste_health() -> dict:
    api_key = os.environ.get("QLOO_API_KEY", "")
    return {
        "qloo_configured": bool(api_key),
        "version": "1.0.0",
        "note": "Qloo Taste AI integration for Beljour — beauty personalised by cultural identity.",
    }


# ---------------------------------------------------------------------------
# Archetypes catalogue
# ---------------------------------------------------------------------------

@router.get("/archetypes")
async def list_archetypes() -> dict:
    return {
        "archetypes": [
            {
                "id": "afro_glam",
                "name": "Afro-Glam",
                "description": "Afrobeats, West African fashion, Caribbean energy. Rich pigments, graphic liner, jewel tones.",
                "cultural_roots": ["West Africa", "Caribbean diaspora", "Afrobeats", "Dancehall"],
            },
            {
                "id": "hip_hop_glam",
                "name": "Hip Hop Glam",
                "description": "Hip hop and R&B beauty from Harlem to Compton. Bronzed base, lashes, edges.",
                "cultural_roots": ["African-American culture", "Hip hop", "R&B", "Trap"],
            },
            {
                "id": "desi_glam",
                "name": "Desi Glam",
                "description": "South Asian celebration beauty. Kohl, gold, warm base, bold lip.",
                "cultural_roots": ["South Asia", "Bollywood", "South Asian diaspora"],
            },
            {
                "id": "k_beauty",
                "name": "K-Beauty",
                "description": "Korean glass skin and gradient lip. Skin-first, luminous, soft.",
                "cultural_roots": ["Korea", "K-pop", "K-drama"],
            },
            {
                "id": "gulf_glam",
                "name": "Gulf Glam",
                "description": "Middle Eastern beauty. Smoky eye, warm highlight, striking brow.",
                "cultural_roots": ["Gulf states", "Arabic culture", "Middle Eastern diaspora"],
            },
            {
                "id": "latina_glam",
                "name": "Latina Glam",
                "description": "Latin American beauty. Bold lip, bronzed glow, full lashes.",
                "cultural_roots": ["Latin America", "Caribbean Latina", "Afro-Latina"],
            },
            {
                "id": "clean_minimal",
                "name": "Clean Minimal",
                "description": "Skinimalism for every skin tone. Your skin, perfected.",
                "cultural_roots": ["Universal", "skincare community"],
            },
        ]
    }


# ---------------------------------------------------------------------------
# Taste profile
# ---------------------------------------------------------------------------

@router.post("/profile", response_model=TasteProfileResponse)
async def taste_profile(body: TasteProfileRequest) -> TasteProfileResponse:
    """
    Resolve user inputs via Qloo and build an aesthetic vector.

    The aesthetic vector is what Beljour uses downstream to select and
    personalise looks. Returns the raw Qloo tags plus the computed vector
    so the frontend can show the user exactly what signals drove their
    recommendations.
    """
    client = _qloo_client()
    api_key = os.environ.get("QLOO_API_KEY", "")

    resolved_list: list[ResolvedEntity] = []
    entity_ids: list[str] = []
    unresolved: list[str] = []
    qloo_tags: list[dict] = []

    if api_key:
        async with client:
            # Resolve entities
            for inp in body.inputs:
                try:
                    entity = await client.resolve_name(inp)
                    if entity:
                        resolved_list.append(ResolvedEntity(
                            input=inp,
                            qloo_id=entity.get("id"),
                            qloo_name=entity.get("name"),
                            qloo_type=entity.get("type"),
                            resolved=True,
                        ))
                        entity_ids.append(entity["id"])
                    else:
                        resolved_list.append(ResolvedEntity(
                            input=inp, qloo_id=None, qloo_name=None, qloo_type=None, resolved=False
                        ))
                        unresolved.append(inp)
                except QlooError as exc:
                    log.warning("Qloo resolve error for %r: %s", inp, exc)
                    resolved_list.append(ResolvedEntity(
                        input=inp, qloo_id=None, qloo_name=None, qloo_type=None, resolved=False
                    ))
                    unresolved.append(inp)

            # Get aesthetic tags from Qloo
            if entity_ids:
                try:
                    qloo_tags = await client.insight_tags(entity_ids, limit=40)
                except QlooError as exc:
                    log.warning("Qloo insight_tags error: %s", exc)
    else:
        # Demo mode — use the inputs as synthetic tags
        log.info("QLOO_API_KEY not set; running in demo mode")
        for inp in body.inputs:
            resolved_list.append(ResolvedEntity(
                input=inp, qloo_id=None, qloo_name=inp, qloo_type="demo", resolved=True
            ))
        qloo_tags = [{"name": inp, "affinity": 0.75} for inp in body.inputs]

    vec = build_aesthetic_vector(qloo_tags, extra_inputs=unresolved)

    return TasteProfileResponse(
        resolved=resolved_list,
        qloo_tags=qloo_tags,
        aesthetic=vec.to_dict(),
        unresolved_inputs=unresolved,
        trace=vec.trace,
    )


# ---------------------------------------------------------------------------
# Look recommendations
# ---------------------------------------------------------------------------

@router.post("/looks", response_model=LookRecommendationResponse)
async def look_recommendations(body: LookRecommendationRequest) -> LookRecommendationResponse:
    """
    Full pipeline: inputs → Qloo taste profile → aesthetic vector → look recommendations.

    Returns ranked looks with makeup products, wig styles, cultural context,
    and a personalised explanation of why each look fits the user's taste.
    """
    # Step 1: build profile (reuse the profile endpoint logic)
    profile_req = TasteProfileRequest(inputs=body.inputs)
    profile = await taste_profile(profile_req)

    # Step 2: rebuild AestheticVector from the profile response
    vec = AestheticVector(**{
        k: v for k, v in profile.aesthetic.items()
        if k in AestheticVector.__dataclass_fields__
    })

    # Step 3: recommend looks
    looks = recommend_looks(vec, top_n=body.top_n)

    # Step 4: apply shade_depth personalisation to shade notes
    if body.shade_depth:
        looks = _apply_shade_depth(looks, body.shade_depth)

    # Step 5: build cultural signal summary
    summary = _cultural_signal_summary(vec)

    return LookRecommendationResponse(
        looks=[_look_to_out(look) for look in looks],
        aesthetic=profile.aesthetic,
        cultural_signal_summary=summary,
    )


def _apply_shade_depth(looks: list[Look], depth: str) -> list[Look]:
    """Add shade-depth context to foundation shade notes."""
    depth_notes = {
        "light": "Choose the lightest shades in the range; look for N10–N20 or equivalent.",
        "medium": "Mid-range shades — N30–N40 or equivalent; check for olive vs. pink undertone.",
        "deep": "Deep shades — N50–N60 or equivalent; warm golden brown undertones.",
        "rich": "Deepest shades — N70–N90 or equivalent; cool-neutral or warm-mahogany undertones.",
    }
    note = depth_notes.get(depth.lower(), "")
    if not note:
        return looks

    for look in looks:
        for product in look.products:
            if product.category == "foundation":
                product.shade_notes = f"{product.shade_notes} {note}"
    return looks


def _cultural_signal_summary(vec: AestheticVector) -> str:
    """One-paragraph summary of what the cultural taste signals say about this person's aesthetic."""
    lines: list[str] = []

    if vec.archetypes:
        lines.append(f"Your taste profile maps to {', '.join(vec.archetypes[:2])} aesthetics.")
    else:
        lines.append("Your taste profile spans multiple aesthetic traditions.")

    if vec.intensity > 0.65:
        lines.append("You lean toward full-glam, high-intensity looks.")
    elif vec.intensity < 0.35:
        lines.append("You lean toward natural, skin-forward beauty.")

    if vec.warmth > 0.6:
        lines.append("Warm undertones, golden pigments, and earthy palettes fit your aesthetic.")
    elif vec.warmth < 0.4:
        lines.append("Cool undertones and clean palettes fit your aesthetic.")

    if vec.hair_vibe in ("textured", "protective"):
        lines.append("We prioritise natural textures and protective styles — deeply underrepresented in mainstream beauty apps.")

    return " ".join(lines)


def _look_to_out(look: Look) -> LookOut:
    return LookOut(
        name=look.name,
        tagline=look.tagline,
        archetype=look.archetype,
        aesthetic_summary=look.aesthetic_summary,
        products=[ProductOut(**p.__dict__) for p in look.products],
        wigs=[WigOut(**w.__dict__) for w in look.wigs],
        tags=look.tags,
        cultural_roots=look.cultural_roots,
        why_this_look=look.why_this_look,
        vto_eligible=look.vto_eligible,
    )
