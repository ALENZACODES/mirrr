"""Stale-safe debounced preview controller over the guarded command backend.

No background jobs or timers are started. Browser and API callers schedule the
latest request and call render_ready themselves; stale revisions refuse before
committing. Export always processes the full original resolution.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass
from time import perf_counter

from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame, resize_reference
from .guarded import GuardedProExecutor, ProExecutionResult
from .performance import PerformanceBudget, RenderQuality
from .pro_plan import ProPlan

MillisClock = Callable[[], float]


@dataclass(frozen=True, slots=True)
class PreviewTicket:
    revision: int
    plan: ProPlan
    quality: RenderQuality
    scheduled_ms: float
    photo_generation: int

    def __post_init__(self) -> None:
        if type(self.revision) is not int or self.revision <= 0:
            raise CommandValidationError("invalid_revision", "Preview revision is invalid.")
        if type(self.photo_generation) is not int or self.photo_generation < 0:
            raise CommandValidationError("invalid_revision", "Photo generation is invalid.")
        if not math.isfinite(self.scheduled_ms) or self.scheduled_ms < 0:
            raise CommandValidationError("invalid_preview_time", "Preview scheduling time is invalid.")
        if self.quality not in ("preview", "export"):
            raise CommandValidationError("invalid_quality", "Preview quality is invalid.")


class PreviewCoordinator:
    """One session per photo; never share biometric caches between photos."""

    def __init__(
        self,
        executor: GuardedProExecutor,
        *,
        debounce_ms: int = 60,
        budget: PerformanceBudget | None = None,
        clock_ms: MillisClock | None = None,
    ) -> None:
        if type(debounce_ms) is not int or not 0 <= debounce_ms <= 500:
            raise CommandValidationError("invalid_debounce", "Preview debounce is invalid.")
        self._executor = executor
        self._debounce_ms = debounce_ms
        self._budget = budget if budget is not None else PerformanceBudget()
        self._clock = clock_ms if clock_ms is not None else self._default_clock
        self._revision = 0
        self._photo_generation = 0
        self._pending: PreviewTicket | None = None
        self._original: ImageFrame | None = None

    @staticmethod
    def _default_clock() -> float:
        return perf_counter() * 1000.0

    def open_photo(self, source: ImageFrame) -> None:
        if not isinstance(source, ImageFrame):
            raise CommandValidationError("invalid_frame", "Preview needs a validated image.")
        self._photo_generation += 1
        self._revision += 1
        self._original = source
        self._pending = None
        self._executor.clear_photo()

    def close_photo(self) -> None:
        self._original = None
        self._photo_generation += 1
        self._revision += 1
        self._pending = None
        self._executor.clear_photo()

    def request(self, plan: ProPlan, *, quality: RenderQuality = "preview") -> PreviewTicket:
        if self._original is None:
            raise CommandUnavailable("photo_missing", "Select a photo before editing.")
        if not isinstance(plan, ProPlan):
            raise CommandValidationError("invalid_pro_plan", "Preview needs a typed plan.")
        if quality not in ("preview", "export"):
            raise CommandValidationError("invalid_quality", "Requested quality is invalid.")
        now = self._clock()
        if not math.isfinite(now) or now < 0:
            raise CommandValidationError("invalid_clock", "Preview clock is invalid.")
        self._revision += 1
        delay = self._debounce_ms if quality == "preview" else 0
        ticket = PreviewTicket(self._revision, plan, quality, now + delay, self._photo_generation)
        self._pending = ticket
        return ticket

    def is_current(self, ticket: PreviewTicket) -> bool:
        return (
            self._pending is ticket
            and ticket.revision == self._revision
            and ticket.photo_generation == self._photo_generation
            and self._original is not None
        )

    def ready(self, ticket: PreviewTicket) -> bool:
        return self.is_current(ticket) and self._clock() >= ticket.scheduled_ms

    @property
    def pending(self) -> PreviewTicket | None:
        return self._pending

    def _preview_image(self, source: ImageFrame) -> ImageFrame:
        maximum = max(source.width, source.height)
        if maximum <= self._budget.preview_long_edge:
            return source
        multiplier = self._budget.preview_long_edge / maximum
        width = max(1, int(round(source.width * multiplier)))
        height = max(1, int(round(source.height * multiplier)))
        return resize_reference(source, width, height)

    def render_ready(self, ticket: PreviewTicket) -> ProExecutionResult:
        if not self.is_current(ticket):
            raise CommandUnavailable("stale_preview", "A newer photo or edit replaced this request.")
        if not self.ready(ticket):
            raise CommandUnavailable("preview_debouncing", "This preview has not reached its schedule.")
        source = self._original
        if source is None:
            raise CommandUnavailable("photo_missing", "The current photo has been removed.")
        input_frame = self._preview_image(source) if ticket.quality == "preview" else source
        result = self._executor.run(
            ticket.plan,
            input_frame,
            quality=ticket.quality,
            is_current=lambda: self.is_current(ticket),
        )
        if not self.is_current(ticket):
            raise CommandUnavailable("stale_preview", "Preview was replaced during rendering.")
        self._pending = None
        return result
