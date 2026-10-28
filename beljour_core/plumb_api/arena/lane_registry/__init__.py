"""Stable, typed contracts for independently owned registry contributions.

Each lane owns its file. Contributions are evaluated by numeric historical order;
registry.py requires no edits when a lane adds its next extension.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class LaneContribution:
    order: int
    owner: str
    extra_rows: Callable[[Path], list[dict[str, Any]]] | None = None
    module_paths: Callable[[Path], list[str]] | None = None


# Owners of the new lane-registry source modules (no feature status change).
LANE_FILE_OWNERS: Mapping[str, str] = {
    "api/plumb_api/arena/lane_registry/__init__.py": "A",
    "api/plumb_api/arena/lane_registry/legacy.py": "A",
    "api/plumb_api/arena/lane_registry/a.py": "A",
    "api/plumb_api/arena/lane_registry/b.py": "B",
    "api/plumb_api/arena/lane_registry/c.py": "C",
    "api/plumb_api/arena/lane_registry/d.py": "D",
    "api/plumb_api/arena/lane_registry/e.py": "E",
    "api/plumb_api/arena/lane_registry/f.py": "F",
    "api/plumb_api/arena/lane_registry/g.py": "G",
}
