"""Fixed vocabularies of the quality arena. Changing any of these changes the rules, so
each one points at the line of the master command or the women-first brief it comes from.
Author: John Khan.
"""
from __future__ import annotations

import os
from pathlib import Path

# Test faces: outside the repo, never committed (decisions.md Oct 22 11:57 PM ET).
DEFAULT_FACES = Path(os.environ.get("REALFACE_DIR", "/workspace/shared/hackathons/beljour/test-faces"))
FROZEN_DIR = "frozen-1000"
ARENA_DIR = "_arena"  # holdout ledger, slots, runs and results; beside the faces, never in the repo

# The three hero filters (master command v1, "Scope").
FILTERS: tuple[str, ...] = ("old", "young", "gender_swap")
FILTER_LABELS = {"old": "Older", "young": "Younger", "gender_swap": "Gender swap"}

# Loser reasons. The first eight are v1's fixed list; the ninth is the women-first brief's
# "Arena change". Judges pick exactly one per judgement. The order is the display order.
REASONS: tuple[str, ...] = (
    "Lost Identity",
    "Not Her / Erased Marks",
    "Plastic Skin",
    "Warped Glasses/Ears/Background",
    "Fake Hair",
    "Fake Teeth",
    "Too Strong",
    "Too Weak",
    "Uncanny/Scary",
)

# Score dimensions, 1-10 (v1 "Scores", women-first "Still Her" sixth score).
DIMENSIONS: tuple[str, ...] = ("identity", "realism", "artifact_free", "flattering", "fairness", "still_her")
DIMENSION_LABELS = {"identity": "Identity", "realism": "Realism", "artifact_free": "Artifact-Free",
                    "flattering": "Flattering", "fairness": "Fairness", "still_her": "Still Her"}

# Ship gates (v2 "SHIP GATE"; Still Her added by the women-first brief, ASSUMED extension).
HERO_OVERALL_MIN = 0.55
HERO_SLICE_MIN = 0.48
FEATURE_AVERAGE_MIN = 8.0
FEATURE_SLICE_MIN = 7.0
# A slice needs this many human judgements before it can count toward a PASS (ASSUMED; the
# master command sets no number). Fewer means the slice is UNTESTED, so the filter can't PASS.
MIN_SLICE_JUDGEMENTS = 20
MIN_SLICE_SCORED_IMAGES = 10

# Test set composition (v1 "Test set").
FAIRFACE_COUNT = 700
SFHQ_COUNT = 200
ADVERSARIAL_COUNT = 100
BASELINE_COUNT = 100  # the reference app's Pro outputs exist for the first 100 faces only

FAIRFACE_RACES: tuple[str, ...] = ("White", "Black", "Latino_Hispanic", "East Asian", "Southeast Asian",
                                   "Indian", "Middle Eastern")
FAIRFACE_GENDERS: tuple[str, ...] = ("Male", "Female")
# FairFace's own bins, mapped onto adult bands. The app is for adults (consent gate, R9), so
# faces labelled under 20 are left out of the arena. ASSUMED policy, John's call (HANDOFF).
FAIRFACE_AGE_TO_BAND = {"20-29": "20-29", "30-39": "30-39", "40-49": "40-49", "50-59": "50-59",
                        "60-69": "60+", "more than 70": "60+", "70+": "60+"}
MINOR_AGE_BINS = frozenset({"0-2", "3-9", "10-19"})
ADULT_BANDS: tuple[str, ...] = ("20-29", "30-39", "40-49", "50-59", "60+")

ADVERSARIAL_TAGS: tuple[str, ...] = (
    "glasses", "beard", "bald", "hijab", "vitiligo", "scars", "tattoos", "very_dark_skin_low_light",
    "very_pale_skin_harsh_light", "side_profile", "hand_on_face", "laughing_with_teeth", "squinting",
    "old_scanned_photo", "group_photo_crop",
)

SETS: tuple[str, ...] = ("fairface", "sfhq", "adversarial")

# Never used, in any form (v1 "Components"; decisions.md Oct 22 11:57 PM ET).
BANNED_SOURCES: tuple[str, ...] = ("celeba", "celeba-hq", "celebamask", "utkface", "vggface2", "digiface",
                                   "facesynthetics", "face_synthetics", "ms-celeb", "ms1m", "msceleb",
                                   "casia-webface", "pexels")

JUDGE_KINDS: tuple[str, ...] = ("human", "model")
IMAGE_EXTS = frozenset({".jpg", ".jpeg", ".png", ".webp"})


def norm_tag(value: str) -> str:
    """'Very dark skin, low light' -> 'very_dark_skin_low_light'."""
    out = "".join(ch if ch.isalnum() else "_" for ch in value.strip().lower())
    while "__" in out:
        out = out.replace("__", "_")
    return out.strip("_")


TAG_ALIASES = {
    "beards": "beard", "glass": "glasses", "eyeglasses": "glasses", "scar": "scars", "tattoo": "tattoos",
    "profile": "side_profile", "hand": "hand_on_face", "laughing": "laughing_with_teeth", "teeth": "laughing_with_teeth",
    "squint": "squinting", "old_photo": "old_scanned_photo", "scanned": "old_scanned_photo",
    "old_scanned_photos": "old_scanned_photo", "group_crop": "group_photo_crop", "group_photo_crops": "group_photo_crop",
    "crops_from_group_photos": "group_photo_crop", "very_dark_skin": "very_dark_skin_low_light",
    "dark_skin_low_light": "very_dark_skin_low_light", "very_pale_skin": "very_pale_skin_harsh_light",
    "pale_skin_harsh_light": "very_pale_skin_harsh_light",
}


def canonical_tag(value: str) -> str:
    tag = norm_tag(value)
    return TAG_ALIASES.get(tag, tag)
