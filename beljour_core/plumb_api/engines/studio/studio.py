"""One entry point for the local photo studio tools. Author: John Khan.

    blur       background blur from her person area (no depth model)   feature 57
    replace    her on a procedural backdrop                            features 58, 68
    remove     transparent background                                  feature 58
    relight    soft key light that keeps her face's average brightness
    headshot   backdrop, light, light retouch and crops per industry    feature 62
    authentic  light, contrast and crop with the Still Her check        feature 63

Every tool raises StudioRefusal (coded) instead of returning a guessed picture.
"""
from __future__ import annotations

from typing import Any

from .authentic import authenticity
from .blur import background_blur
from .common import StudioResult
from .headshot import headshot
from .matte import remove, replace
from .relight import relight

TOOLS = ("blur", "replace", "remove", "relight", "headshot", "authentic")


def render(tool: str, image: Any, person: Any, points: Any = None, *, strength: float = 60,
           backdrop: str = "chinon", side: str = "upper-left", industry: str = "technology") -> StudioResult:
    if tool == "blur":
        return background_blur(image, person, strength)
    if tool == "replace":
        return replace(image, person, backdrop)
    if tool == "remove":
        return remove(image, person)
    if tool == "relight":
        return relight(image, person, points, side=side, amount=strength)
    if tool == "headshot":
        return headshot(image, person, points, industry)
    if tool == "authentic":
        return authenticity(image, person, points, strength)
    raise ValueError(f"tool must be one of {', '.join(TOOLS)}")
