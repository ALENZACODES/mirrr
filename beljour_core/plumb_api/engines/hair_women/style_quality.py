"""Read-only pixel evidence for women's hair-guide previews. Author: John Khan.

An automatic synthetic invariant check is not a real-face appearance judgment.
Missing checked evidence is UNPROVEN; this module can report FAIL but not PASS.
"""

from __future__ import annotations

import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Literal, TypeAlias

import numpy as np
from numpy.typing import NDArray

from .style_guides import StyleKey, TextureKey, definition
from .style_preview import StylePreview

ByteImage: TypeAlias = NDArray[np.uint8]
FloatPlane: TypeAlias = NDArray[np.float64]
AuditStatus: TypeAlias = Literal["FAIL", "UNPROVEN"]
GROUPS = frozenset({"monk", "gender", "age", "yaw", "texture", "occlusion", "intersection"})


@dataclass(frozen=True)
class StylePixelEvidence:
    style_id: StyleKey
    texture: TextureKey
    level: float
    selected_pixel_count: int
    changed_pixel_count: int
    outside_pixel_count: int
    protected_pixel_count: int
    alpha_pixel_count: int
    clipped_channel_count: int
    mean_selected_delta: float
    maximum_selected_delta: int
    guard_called: bool
    status: AuditStatus


def _checked_bytes(before: ByteImage, after: ByteImage) -> None:
    if before.dtype != np.uint8 or after.dtype != np.uint8:
        raise ValueError("evaluation requires uint8 frames")
    if before.shape != after.shape or before.ndim != 3 or before.shape[2] not in (3, 4):
        raise ValueError("image pair dimensions do not match")


def _checked_mask(mask: FloatPlane, shape: tuple[int, int]) -> FloatPlane:
    if not isinstance(mask, np.ndarray) or mask.shape != shape:
        raise ValueError("evaluation requires an explicit full-sized mask")
    if not np.issubdtype(mask.dtype, np.number):
        raise ValueError("evaluation mask must be numeric")
    converted = mask.astype(np.float64)
    if not np.all(np.isfinite(converted)) or np.any(converted < 0) or np.any(converted > 1):
        raise ValueError("evaluation mask outside [0,1]")
    return converted


def audit_style(
    original: ByteImage,
    preview: StylePreview,
    allowed_mask: FloatPlane,
    *,
    protected_mask: FloatPlane | None = None,
) -> StylePixelEvidence:
    """Measure actual rendered bytes independently from the engine's report."""
    if preview.status != "rendered":
        raise ValueError("refused render is not equivalent to a rendered result")
    before = np.asarray(original)
    after = np.asarray(preview.image)
    _checked_bytes(before, after)
    definition(preview.style_id)
    permitted = _checked_mask(allowed_mask, before.shape[:2]) > 0
    protected = np.zeros(before.shape[:2], dtype=bool)
    if protected_mask is not None:
        protected = _checked_mask(protected_mask, before.shape[:2]) > 0
    selected = permitted & ~protected
    difference = np.abs(after[..., :3].astype(np.int16) - before[..., :3].astype(np.int16))
    changed = np.any(difference > 0, axis=2)
    outside = int(np.count_nonzero(changed & ~permitted))
    inside_protected = int(np.count_nonzero(changed & protected))
    alpha = 0
    if before.shape[2] == 4:
        alpha = int(np.count_nonzero(before[..., 3] != after[..., 3]))
    selected_values = difference[selected]
    mean = float(np.mean(selected_values)) if selected_values.size else 0.0
    maximum = int(np.max(selected_values)) if selected_values.size else 0
    before_selected = before[..., :3][selected]
    after_selected = after[..., :3][selected]
    newly_clipped = np.count_nonzero(
        ((after_selected == 0) | (after_selected == 255)) &
        ((before_selected != 0) & (before_selected != 255))
    )
    errors = outside > 0 or inside_protected > 0 or alpha > 0 or not preview.guard_called
    if preview.level == 1.0 and np.any(changed):
        errors = True
    if preview.coverage.shape != permitted.shape:
        errors = True
    else:
        errors = errors or bool(np.any((preview.coverage > 0) & ~selected))
    if not math.isfinite(mean) or maximum > 255:
        errors = True
    return StylePixelEvidence(
        style_id=preview.style_id,
        texture=preview.texture,
        level=preview.level,
        selected_pixel_count=int(np.count_nonzero(selected)),
        changed_pixel_count=int(np.count_nonzero(changed)),
        outside_pixel_count=outside,
        protected_pixel_count=inside_protected,
        alpha_pixel_count=alpha,
        clipped_channel_count=int(newly_clipped),
        mean_selected_delta=mean,
        maximum_selected_delta=maximum,
        guard_called=preview.guard_called,
        status="FAIL" if errors else "UNPROVEN",
    )


def monotone_coverage(rows: Sequence[StylePreview]) -> bool:
    """Check absolute selected-pixel count, not a misleading mean-opacity proxy."""
    if not rows:
        raise ValueError("coverage sequence is empty")
    first = rows[0]
    seen_levels: set[float] = set()
    previous_count = -1
    for row in sorted(rows, key=lambda entry: entry.level):
        if row.style_id != first.style_id or row.texture != first.texture:
            raise ValueError("mixed style or texture in one monotonicity series")
        if row.coverage.shape != first.coverage.shape:
            raise ValueError("mixed image dimensions")
        if row.level in seen_levels:
            raise ValueError("duplicate level")
        seen_levels.add(row.level)
        count = int(np.count_nonzero(row.coverage > 0))
        if count < previous_count:
            return False
        previous_count = count
    return True


@dataclass(frozen=True)
class EvidenceCount:
    group_kind: str
    group_name: str
    observed: int
    failed: int
    unproven: int
    outside_mask_errors: int
    alpha_errors: int


def count_groups(
    entries: Iterable[tuple[str, str, StylePixelEvidence]],
) -> tuple[EvidenceCount, ...]:
    """Aggregate only safe counts; return no filenames, hashes, or subject records.

    Group names are descriptive labels provided externally, never inferred from
    pixels. The caller must not supply personally identifying labels.
    """
    summary: dict[tuple[str, str], list[int]] = {}
    for group_kind, group_name, audit in entries:
        if group_kind not in GROUPS:
            raise ValueError("unknown evidence group kind")
        if not isinstance(group_name, str) or not group_name or len(group_name) > 40:
            raise ValueError("invalid group label")
        if any(not (char.isalnum() or char in " _-+") for char in group_name):
            raise ValueError("unsafe group label")
        key = (group_kind, group_name)
        counts = summary.setdefault(key, [0, 0, 0, 0, 0])
        counts[0] += 1
        counts[1] += audit.status == "FAIL"
        counts[2] += audit.status == "UNPROVEN"
        counts[3] += audit.outside_pixel_count + audit.protected_pixel_count
        counts[4] += audit.alpha_pixel_count
    return tuple(
        EvidenceCount(kind, name, *summary[(kind, name)])
        for kind, name in sorted(summary)
    )


def assert_evidence_schema(records: Iterable[Mapping[str, object]]) -> int:
    """Fail closed on identity-bearing fields in count-only external reports."""
    allowed = {"group_kind", "group_name", "observed", "failed", "unproven", "outside_mask_errors", "alpha_errors"}
    observed = 0
    for record in records:
        if set(record) != allowed:
            raise ValueError("unexpected evidence fields")
        kind = record.get("group_kind")
        group = record.get("group_name")
        if not isinstance(kind, str) or kind not in GROUPS or not isinstance(group, str):
            raise ValueError("invalid group identity")
        for field in ("observed", "failed", "unproven", "outside_mask_errors", "alpha_errors"):
            value = record.get(field)
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise ValueError("invalid evidence count")
        total = record.get("observed")
        bad = record.get("failed")
        unknown = record.get("unproven")
        if not isinstance(total, int) or not isinstance(bad, int) or not isinstance(unknown, int):
            raise ValueError("missing evidence counts")
        if total != bad + unknown:
            raise ValueError("synthetic evidence cannot claim a pass")
        observed += total
    return observed
