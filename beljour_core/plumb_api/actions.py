"""Styling actions the background task API accepts: a name, the YouCam feature it maps to, and
a builder that validates the request and returns the payload.

Only makeup and hair styling live here, because those are the only YouCam features in scope
(decisions.md). Builders validate everything first, so a bad request fails for free.

Hair payload shapes are ASSUMED from the YouCam docs pattern until spikes S2 and S3 confirm
them against real replies; each builder says what it assumes.

Author: John Khan.
"""
from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from .youcam import payloads

HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
TEMPLATE_ID = re.compile(r"^[A-Za-z0-9_.:-]{1,80}$")


class ActionError(ValueError):
    pass


@dataclass(frozen=True)
class Action:
    name: str
    feature: str
    build: Callable[[dict[str, Any]], dict]
    assumed: bool          # payload shape not yet confirmed by a recorded reply
    simulation: bool       # changes how the person looks; image gets the simulation label


def _int(value: Any, low: int, high: int, name: str) -> int:
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        raise ActionError(f"{name} must be a number") from None
    if not low <= number <= high:
        raise ActionError(f"{name} must be between {low} and {high}")
    return number


def _hex(value: Any, name: str) -> str:
    if not isinstance(value, str) or not HEX.match(value):
        raise ActionError(f"{name} must be a colour like #8A5A3C")
    return value.upper()


def makeup(body: dict[str, Any]) -> dict:
    """Effects already built by state.makeup_payload are passed through payloads.makeup, which
    validates them. Accepts {"effects": [...]}."""
    effects = body.get("effects")
    if not isinstance(effects, list) or not effects:
        raise ActionError("choose at least one makeup effect")
    return payloads.makeup(effects)


def hair_color(body: dict[str, Any]) -> dict:
    """ASSUMED shape: {"color": "#RRGGBB", "intensity": 0..100} for one colour, or
    {"mode": "ombre", "color": top, "color_end": tips, ...} for ombre."""
    mode = body.get("mode", "solid")
    if mode not in ("solid", "ombre"):
        raise ActionError("mode must be solid or ombre")
    out: dict[str, Any] = {"mode": mode, "color": _hex(body.get("color"), "color"),
                           "intensity": _int(body.get("intensity", 80), 0, 100, "intensity")}
    if mode == "ombre":
        out["color_end"] = _hex(body.get("color_end"), "color_end")
        out["ombre_start"] = _int(body.get("ombre_start", 50), 0, 100, "ombre_start")
    return out


def hair_style(body: dict[str, Any]) -> dict:
    """ASSUMED shape: {"template_id": "..."} for a preset from the template list (S1), or a
    reference cut uploaded as ref_file_id by the gateway (S2)."""
    template = body.get("template_id")
    if template is None:
        raise ActionError("choose a hairstyle")
    if not isinstance(template, str) or not TEMPLATE_ID.match(template):
        raise ActionError("that hairstyle id isn't valid")
    return {"template_id": template}


def hair_transfer(body: dict[str, Any]) -> dict:
    """Reference image is uploaded using the existing gateway refs dict, not JSON.

    The client supplies only a separate reference_photo_id and rights checkbox to the
    route. Neither image bytes nor an imagined provider template enters this payload.
    S2 has not verified the endpoint payload; the name/version remain ASSUMED.
    """
    if body:
        raise ActionError("reference haircut has no extra styling parameters until S2 confirms them")
    return {}


def _strength(feature_name: str) -> Callable[[dict[str, Any]], dict]:
    def build(body: dict[str, Any]) -> dict:
        """ASSUMED shape: {"strength": 0..100}."""
        return {"strength": _int(body.get("strength", 50), 1, 100, f"{feature_name} strength")}
    return build


ACTIONS: dict[str, Action] = {a.name: a for a in (
    Action("makeup", "makeup-vto", makeup, assumed=False, simulation=False),
    Action("hair-color", "hair-color", hair_color, assumed=True, simulation=False),
    Action("hair-style", "hair-style", hair_style, assumed=True, simulation=True),
    Action("hair-transfer", "hair-transfer", hair_transfer, assumed=True, simulation=True),
    Action("hair-bang", "hair-bang", _strength("bangs"), assumed=True, simulation=True),
    Action("hair-curl", "hair-curl", _strength("curl"), assumed=True, simulation=True),
    Action("hair-extension", "hair-extension", _strength("extension"), assumed=True, simulation=True),
    Action("hair-volume", "hair-volume", _strength("volume"), assumed=True, simulation=True),
)}


def build(name: str, body: dict[str, Any]) -> tuple[str, dict]:
    """(feature, payload) for an action, or ActionError."""
    action = ACTIONS.get(name)
    if action is None:
        raise ActionError(f"unknown styling action {name}")
    return action.feature, action.build(body)
