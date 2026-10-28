"""Bounded recipe snapshots for cross-language behavior tests.

The budget accounts for JSON size times four, a conservative approximation for
serialized strings and object snapshots, not a Python heap guarantee.
"""

from __future__ import annotations

from dataclasses import dataclass

from .contracts import Recipe
from .serialization import decode_recipe, encode_recipe


def _size(key: str) -> int:
    return len(key.encode("utf-8")) * 4


@dataclass(frozen=True)
class HistoryState:
    length: int
    position: int
    estimated_bytes: int
    byte_cap: int
    can_undo: bool
    can_redo: bool


class RecipeHistory:
    def __init__(self, initial: Recipe | None = None, limit: int = 40, byte_cap: int = 131072) -> None:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 2 <= limit <= 100:
            raise ValueError("invalid history count limit")
        if isinstance(byte_cap, bool) or not isinstance(byte_cap, int) or not 8192 <= byte_cap <= 4194304:
            raise ValueError("invalid history byte limit")
        self._limit = limit
        self._cap = byte_cap
        key = encode_recipe(initial if initial is not None else Recipe())
        if _size(key) > byte_cap:
            raise ValueError("initial recipe exceeds history byte limit")
        self._keys = [key]
        self._position = 0

    @property
    def current(self) -> Recipe:
        return decode_recipe(self._keys[self._position])

    @property
    def state(self) -> HistoryState:
        return HistoryState(len(self._keys), self._position,
                            sum(_size(key) for key in self._keys), self._cap,
                            self._position > 0, self._position < len(self._keys) - 1)

    def commit(self, recipe: Recipe) -> bool:
        key = encode_recipe(recipe)
        if key == self._keys[self._position]:
            return False
        if _size(key) > self._cap:
            raise ValueError("recipe exceeds history byte limit")
        self._keys = self._keys[:self._position + 1] + [key]
        while len(self._keys) > self._limit or sum(_size(part) for part in self._keys) > self._cap:
            self._keys.pop(0)
        self._position = len(self._keys) - 1
        return True

    def undo(self) -> Recipe:
        self._position = max(0, self._position - 1)
        return self.current

    def redo(self) -> Recipe:
        self._position = min(len(self._keys) - 1, self._position + 1)
        return self.current

    def reset(self, recipe: Recipe | None = None) -> None:
        key = encode_recipe(recipe if recipe is not None else Recipe())
        if _size(key) > self._cap:
            raise ValueError("recipe exceeds history byte limit")
        self._keys = [key]
        self._position = 0
