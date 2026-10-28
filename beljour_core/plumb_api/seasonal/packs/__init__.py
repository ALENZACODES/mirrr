"""Seasonal packs: frames, grades, accessories, light effects and greetings.

Public API: list_packs, get_pack, apply_look, suggest and register_pack, plus
the model and target types callers need to build them. Extras: apply_looks
(stacking), animate_look (light-effect frames), catalogue (picker JSON) and
occurrences_between (a year view of the calendar). Importing the package
registers the Halloween, Christmas, Thanksgiving, New Year and Easter packs.
Author: John Khan.
"""

from __future__ import annotations

from .accessories import register_accessory
from .animate import Clip, animate_look
from .apply import apply_look
from .audit import AuditFinding, audit
from .builtin import BUILTIN_PACKS, register_builtin
from .calendar import Occurrence, Suggestion, next_occurrence, occurrences_between, suggest
from .calendar_ics import occurrences_ics
from .catalogue import catalogue, catalogue_json
from .forbidden import FORBIDDEN_TOKENS, forbidden_problems, is_forbidden
from .model import (
    Look,
    LookKind,
    PackError,
    Palette,
    SeasonalPack,
    StrengthCurve,
    strength_amount,
    validate_strength,
)
from .motifs import MotifProvider, PackMotifProvider, register_motif
from .occasions import OCCASION_IDS, OCCASIONS, UnknownOccasionError
from .registry import PackRegistry, get_pack, list_packs, register_pack
from .render import RenderRequest, register_renderer
from .serialize import pack_from_json, pack_to_json
from .stack import StackItem, apply_looks
from .target import FaceBox, FaceLandmarks, FaceTarget, TargetError

__all__ = [
    "AuditFinding",
    "BUILTIN_PACKS",
    "audit",
    "pack_from_json",
    "pack_to_json",
    "occurrences_ics",
    "Clip",
    "StackItem",
    "animate_look",
    "apply_looks",
    "catalogue",
    "catalogue_json",
    "occurrences_between",
    "FORBIDDEN_TOKENS",
    "OCCASIONS",
    "OCCASION_IDS",
    "FaceBox",
    "FaceLandmarks",
    "FaceTarget",
    "Look",
    "LookKind",
    "MotifProvider",
    "Occurrence",
    "PackError",
    "PackMotifProvider",
    "PackRegistry",
    "Palette",
    "RenderRequest",
    "SeasonalPack",
    "StrengthCurve",
    "Suggestion",
    "TargetError",
    "UnknownOccasionError",
    "apply_look",
    "forbidden_problems",
    "get_pack",
    "is_forbidden",
    "list_packs",
    "next_occurrence",
    "register_accessory",
    "register_builtin",
    "register_motif",
    "register_pack",
    "register_renderer",
    "strength_amount",
    "suggest",
    "validate_strength",
]
