"""Produce compact live cross-runtime brow vectors using artificial pixels.

No image file or committed generated parity dump is needed.
Author: John Khan.
"""

from __future__ import annotations

import json
import numpy as np

from plumb_api.engines.brows.trial import BrowObservation, BrowTrialSession
from plumb_api.engines.brows.trial_evidence import audit_brow_trial


def drawn_brows(
    channels: int = 3,
    hidden: str | None = None,
    protected: bool = False,
    base: int = 128,
) -> tuple[np.ndarray, BrowObservation]:
    height, width = 32, 48
    picture = np.full((height, width, channels), base, dtype=np.uint8)
    yy, xx = np.indices((height, width))
    for channel in range(3):
        picture[..., channel] = np.uint8(np.clip(base + (xx % 7) * 3 - (yy % 4) * 2, 0, 255))
    if channels == 4:
        picture[..., 3] = 255
        picture[:2, :, 3] = 0
    masks = {
        "right_brow": np.zeros((height, width), dtype=np.float64),
        "left_brow": np.zeros((height, width), dtype=np.float64),
    }
    masks["right_brow"][10:15, 7:17] = 1.0
    masks["left_brow"][10:15, 31:41] = 1.0
    states = {side: "visible" for side in masks}
    if hidden:
        masks[hidden + "_brow"][:] = 0
        states[hidden + "_brow"] = "not_visible:hidden_by_turn"
    protect_mask = None
    if protected:
        protect_mask = np.zeros((height, width), dtype=np.float64)
        protect_mask[11:13, 8:10] = 1.0
    return picture, BrowObservation(masks, states, protected=protect_mask)


class DrawnBrowSource:
    def __init__(self, observed: BrowObservation) -> None:
        self.observed = observed
        self.calls = 0

    def observe(self, digest: str, photo: np.ndarray) -> BrowObservation:
        if not digest or not isinstance(photo, np.ndarray):
            raise ValueError("brow observation lacks a local input")
        self.calls += 1
        return self.observed


def vectors() -> list[dict[str, object]]:
    cases = []
    for channels, hidden, mode, level in (
        (3, None, "tint", 5.0),
        (4, None, "powder", 3.5),
        (3, "left", "lamination", 5.0),
        (4, "right", "tint", 2.0),
        (3, None, "powder", 1.0),
        (4, None, "lamination", 4.9),
        (3, "right", "tint", 4.0),
        (4, "left", "powder", 3.0),
    ):
        image, observed = drawn_brows(channels, hidden, True)
        source = DrawnBrowSource(observed)
        session = BrowTrialSession(source)
        result = session.render(image, box=(0, 0, 1, 1), mode=mode, level=level)
        evidence = audit_brow_trial(image, result, observed.masks, observed.protected)
        cases.append({
            "width": image.shape[1],
            "height": image.shape[0],
            "channels": channels,
            "mode": mode,
            "level": level,
            "hidden": hidden,
            "original": image.reshape(-1).tolist(),
            "masks": {side: mask.reshape(-1).tolist() for side, mask in observed.masks.items()},
            "protected": observed.protected.reshape(-1).tolist() if observed.protected is not None else None,
            "states": dict(observed.states),
            "rendered": result.image.reshape(-1).tolist(),
            "status": result.status,
            "changed": result.changed_pixels,
            "guard_called": result.guard_called,
            "limited": result.limited,
            "similarity": result.similarity_proxy,
            "evidence": evidence.safe_counts(),
        })
    return cases


if __name__ == "__main__":
    print(json.dumps(vectors(), separators=(",", ":")))
