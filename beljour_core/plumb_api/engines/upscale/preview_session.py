"""Source-revision tickets for guarded upscale previews and full-size releases.

Every slider change asks for a ticket. A preview ticket renders a bounded copy
(longest edge at most 512 pixels) and can never be exported; a release ticket
renders at full size. A result is accepted only if its ticket is the newest of
its kind for the current source revision and was not cancelled, so a slow,
earlier job can never overwrite a newer one, and opening another photo
invalidates everything outstanding. Tickets hold settings and counters only.
Author: John Khan.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from ...pro.strength import validate_level

Kind = Literal["preview", "release"]
PREVIEW_MAX_EDGE = 512
_HASH = re.compile(r"[0-9a-f]{64}\Z")


@dataclass(frozen=True)
class Ticket:
    kind: Kind
    revision: int
    sequence: int
    scale: int
    detail_level: float
    lock_level: float
    width: int
    height: int

    @property
    def full_resolution(self) -> bool:
        return self.kind == "release"


def preview_size(width: int, height: int) -> tuple[int, int]:
    """Source size used for a preview: the longest edge capped at 512 pixels."""
    if type(width) is not int or type(height) is not int or not (8 <= width <= 16_384) or not (
        8 <= height <= 16_384
    ):
        raise ValueError("invalid source dimensions")
    longest = max(width, height)
    if longest <= PREVIEW_MAX_EDGE:
        return width, height
    factor = PREVIEW_MAX_EDGE / longest
    return max(8, round(width * factor)), max(8, round(height * factor))


class PreviewSession:
    def __init__(self) -> None:
        self._source: str | None = None
        self._size = (0, 0)
        self._revision = 0
        self._sequence = 0
        self._latest: dict[str, int] = {}
        self._cancelled: set[int] = set()

    @property
    def revision(self) -> int:
        return self._revision

    def open(self, source_sha256: str, width: int, height: int) -> int:
        """A new or replaced photo starts a revision; older tickets go stale."""
        if not isinstance(source_sha256, str) or _HASH.match(source_sha256) is None:
            raise ValueError("source digest must be 64 lowercase hexadecimal characters")
        preview_size(width, height)
        self._source = source_sha256
        self._size = (width, height)
        self._revision += 1
        self._latest.clear()
        self._cancelled.clear()
        return self._revision

    def close(self) -> None:
        self._source = None
        self._revision += 1
        self._latest.clear()
        self._cancelled.clear()

    def _issue(self, kind: Kind, scale: int, detail: float, lock: float, size: tuple[int, int]) -> Ticket:
        if self._source is None:
            raise ValueError("no photo is open")
        if scale not in (2, 4) or type(scale) is not int:
            raise ValueError("scale must be 2 or 4")
        self._sequence += 1
        self._latest[kind] = self._sequence
        return Ticket(kind, self._revision, self._sequence, scale,
                      validate_level(detail), validate_level(lock), size[0], size[1])

    def preview(self, *, scale: int = 2, detail_level: float = 3.0, lock_level: float = 5.0) -> Ticket:
        if self._source is None:
            raise ValueError("no photo is open")
        return self._issue("preview", scale, detail_level, lock_level, preview_size(*self._size))

    def release(self, *, scale: int = 2, detail_level: float = 3.0, lock_level: float = 5.0) -> Ticket:
        return self._issue("release", scale, detail_level, lock_level, self._size)

    def cancel(self, ticket: Ticket) -> None:
        self._cancelled.add(ticket.sequence)

    def accepts(self, ticket: Ticket) -> bool:
        """Only the newest, uncancelled ticket of its kind for this revision."""
        return (
            self._source is not None
            and ticket.revision == self._revision
            and self._latest.get(ticket.kind) == ticket.sequence
            and ticket.sequence not in self._cancelled
        )

    def exportable(self, ticket: Ticket) -> bool:
        """A preview is never exportable; a release only while it is current."""
        return ticket.full_resolution and self.accepts(ticket)
