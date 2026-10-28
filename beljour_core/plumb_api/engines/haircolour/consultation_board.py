"""Original-first, photo-free W28/W39 consultation comparison board.

Rendered tiles are kept in memory and independent: no option uses another
option's edited pixels. Only chosen control values may be exported.
Author: John Khan.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .consultation import Choice, HairColourSession, IdentityGuard, parse_recipe

ByteFrame = NDArray[np.uint8]
MAX_CHOICES = 4
BOARD_FORMAT = "beljour-hair-board/1"
BOARD_DISCLOSURE = "Local colour simulations only. Physical results require a strand test."
CHOICE_ID = re.compile(r"^[a-z][a-z0-9-]{0,31}$")


@dataclass(frozen=True)
class Selection:
    key: str
    choice: Choice
    strokes: object | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.key, str) or CHOICE_ID.fullmatch(self.key) is None:
            raise ValueError("style choice id must be lowercase letters, digits and hyphens")
        if self.choice.mode == "W39" and self.strokes is not None:
            raise ValueError("W39 does not accept a painted balayage placement")


@dataclass(frozen=True)
class BoardTile:
    key: str
    image: ByteFrame
    mode: Literal["W28", "W39"]
    level: float
    changed_share: float
    mean_delta: float
    guard_applied: bool
    disclosure: str = BOARD_DISCLOSURE


@dataclass(frozen=True)
class BoardResult:
    original: ByteFrame
    tiles: tuple[BoardTile, ...]
    disclosure: str = BOARD_DISCLOSURE
    realface_status: str = "unproven"

    def counts_only(self) -> dict[str, str | int]:
        return {
            "format": BOARD_FORMAT,
            "tile_count": len(self.tiles),
            "guarded_tiles": sum(1 for tile in self.tiles if tile.guard_applied),
            "realface_status": self.realface_status,
        }


def _check_selection(selections: list[Selection]) -> None:
    if not 1 <= len(selections) <= MAX_CHOICES:
        raise ValueError("choose between one and four independent local styles")
    keys = [selection.key for selection in selections]
    if len(set(keys)) != len(keys):
        raise ValueError("style choices must have distinct ids")


def build_board(
    session: HairColourSession,
    selections: list[Selection],
    *,
    guard: IdentityGuard | None = None,
    lock_level: float = 1.0,
    preview_edge: int | None = None,
) -> BoardResult:
    """Every tile starts from the unchanged session source, never the prior tile."""
    _check_selection(selections)
    tiles: list[BoardTile] = []
    for selection in selections:
        rendered = session.render(
            selection.choice,
            strokes=selection.strokes,
            guard=guard,
            lock_level=lock_level,
            preview_edge=preview_edge,
        )
        tiles.append(
            BoardTile(
                key=selection.key,
                image=rendered.image.copy(),
                mode=rendered.mode,
                level=rendered.level,
                changed_share=rendered.changed_share,
                mean_delta=rendered.mean_delta,
                guard_applied=rendered.lock_applied,
            )
        )
    return BoardResult(original=session.original(), tiles=tuple(tiles))


def safe_board_recipe(selections: list[Selection]) -> dict[str, object]:
    """Export controls only: no source image, hair mask or placement pixels."""
    _check_selection(selections)
    return {
        "format": BOARD_FORMAT,
        "disclosure": BOARD_DISCLOSURE,
        "choices": [
            {"id": selection.key, "recipe": selection.choice.safe_recipe()}
            for selection in selections
        ],
    }


def parse_board_recipe(data: object) -> list[Selection]:
    if not isinstance(data, dict) or set(data) != {"format", "disclosure", "choices"}:
        raise ValueError("board must contain only the supported fields")
    if data["format"] != BOARD_FORMAT or data["disclosure"] != BOARD_DISCLOSURE:
        raise ValueError("unsupported board version or missing simulation disclosure")
    raw = data["choices"]
    if not isinstance(raw, list) or not 1 <= len(raw) <= MAX_CHOICES:
        raise ValueError("board must contain one to four choices")
    choices: list[Selection] = []
    for row in raw:
        if not isinstance(row, dict) or set(row) != {"id", "recipe"}:
            raise ValueError("invalid board choice fields")
        if not isinstance(row["id"], str):
            raise ValueError("board choice id must be text")
        choices.append(Selection(key=row["id"], choice=parse_recipe(row["recipe"])))
    _check_selection(choices)
    return choices
