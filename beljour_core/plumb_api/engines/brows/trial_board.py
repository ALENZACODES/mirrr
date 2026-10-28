"""Original-first brow simulation comparison with a photo-free recipe.

Each option renders independently against the unmodified input frame. The
recipe contains control choices only, not image bytes or landmarks.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, cast

from .trial import (
    MODES,
    SHADES,
    BrowTrialResult,
    BrowTrialSession,
    ByteFrame,
    FaceBox,
    Mode,
    checked_image,
    checked_level,
)


@dataclass(frozen=True)
class BrowChoice:
    mode: Mode
    shade: str
    level: float

    def normalized(self) -> BrowChoice:
        if self.mode not in MODES or self.shade not in SHADES:
            raise ValueError("unknown brow consultation option")
        return BrowChoice(self.mode, self.shade, checked_level(self.level))


@dataclass(frozen=True)
class BrowPanel:
    choice: BrowChoice
    result: BrowTrialResult


@dataclass(frozen=True)
class BrowBoard:
    panels: tuple[BrowPanel, ...]
    original: ByteFrame
    status: Literal["ready", "refused"]

    def safe_recipe(self) -> dict[str, object]:
        if self.status != "ready" or not self.panels:
            raise ValueError("refused brow board cannot be exported")
        return {
            "format": "beljour-brow-consultation/1",
            "simulation": True,
            "options": [
                {"mode": panel.choice.mode, "shade": panel.choice.shade, "level": panel.choice.level}
                for panel in self.panels
            ],
        }


def compare_brow_styles(
    session: BrowTrialSession,
    image: ByteFrame,
    box: FaceBox | None,
    options: tuple[BrowChoice, ...],
    *,
    revision: str = "0",
) -> BrowBoard:
    if not isinstance(options, tuple) or not 1 <= len(options) <= 4:
        raise ValueError("brow board accepts one to four options")
    checked = [option.normalized() for option in options]
    keys = [(option.mode, option.shade, option.level) for option in checked]
    if len(keys) != len(set(keys)):
        raise ValueError("brow board cannot repeat an identical option")
    checked_image(image)
    originals = image.copy()
    panels: list[BrowPanel] = []
    for option in checked:
        result = session.render(
            originals, box=box, mode=option.mode, shade=option.shade,
            level=option.level, revision=revision,
        )
        if result.status not in ("rendered", "neutral"):
            return BrowBoard((), originals, "refused")
        panels.append(BrowPanel(option, result))
    return BrowBoard(tuple(panels), originals, "ready")


def parse_brow_recipe(document: object) -> tuple[BrowChoice, ...]:
    if not isinstance(document, dict):
        raise ValueError("brow recipe must be an object")
    if set(document) != {"format", "simulation", "options"}:
        raise ValueError("brow recipe keys are not supported")
    if document["format"] != "beljour-brow-consultation/1" or document["simulation"] is not True:
        raise ValueError("brow recipe needs a simulation declaration")
    raw = document["options"]
    if not isinstance(raw, list) or not 1 <= len(raw) <= 4:
        raise ValueError("brow recipe requires one to four options")
    options = []
    for value in raw:
        if not isinstance(value, dict) or set(value) != {"mode", "shade", "level"}:
            raise ValueError("brow option contains unsupported fields")
        mode = value["mode"]
        shade = value["shade"]
        level = value["level"]
        if not isinstance(mode, str) or mode not in MODES:
            raise ValueError("unknown brow consultation mode")
        if not isinstance(shade, str) or shade not in SHADES:
            raise ValueError("unknown brow consultation shade")
        if not isinstance(level, (float, int)) or isinstance(level, bool):
            raise ValueError("brow consultation level must be numeric")
        options.append(BrowChoice(cast(Mode, mode), shade, checked_level(level)))
    result = tuple(options)
    keys = {(option.mode, option.shade, option.level) for option in result}
    if len(keys) != len(result):
        raise ValueError("duplicate brow consultation choices")
    return result
