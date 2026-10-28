"""Local hair colour engines: W39 curl-respecting recolour (recolour.py) and W28 balayage
placement painter (balayage.py). Numpy only, no models. Author: John Khan."""

from .consultation import Choice, HairColourSession, LocalChangeGuard, PreviewResult
from .consultation_audit import PixelEvidence, audit_pixels, merge_group_counts
from .consultation_board import BoardResult, Selection, build_board, safe_board_recipe

__all__ = [
    "BoardResult",
    "Choice",
    "HairColourSession",
    "LocalChangeGuard",
    "PixelEvidence",
    "PreviewResult",
    "Selection",
    "audit_pixels",
    "build_board",
    "merge_group_counts",
    "safe_board_recipe",
]
