"""Deterministic authored-block Python/TypeScript topical fibre vectors."""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

import numpy as np

from plumb_api.engines.concealer import CoverResult, CoverSession
from plumb_api.engines.menshair import HairAnchors
from tests.test_concealer_levels import block_case

LOCAL_HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "parity/fibre-r26f.json"


def b64(value: np.ndarray) -> str:
    return base64.b64encode(value.tobytes()).decode("ascii")


def make_vectors() -> dict[str, object]:
    image, region, scalp = block_case((64, 41, 39), (178, 144, 105))
    vectors: list[dict[str, object]] = []
    session = CoverSession()
    for level in (1.0, 2.0, 3.0, 4.0, 5.0):
        result = session.render(image, region, scalp, zone="crown", level=level, landmarks=LOCAL_HEAD)
        assert isinstance(result, CoverResult)
        vectors.append({"level": level, "after": b64(result.image),
                        "scalp_share_after": round(result.after_share, 10),
                        "changed_pixels": result.changed_pixels})
    assert session.zone_grid_calls == 1
    return {"format": "beljour-fibre-parity/1", "width": image.shape[1], "height": image.shape[0],
            "channels": image.shape[2], "image": b64(image), "region": b64(region),
            "scalp": b64(scalp), "sha256": hashlib.sha256(image.tobytes()).hexdigest(),
            "vectors": vectors, "zone_grid_calls": session.zone_grid_calls}


def test_fibre_parity_source_matches_committed_vectors():
    stored = json.loads(VECTORS.read_text())
    assert stored == make_vectors()
    assert stored["zone_grid_calls"] == 1


if __name__ == "__main__":
    VECTORS.parent.mkdir(parents=True, exist_ok=True)
    VECTORS.write_text(json.dumps(make_vectors(), separators=(",", ":"), sort_keys=True) + "\n")
