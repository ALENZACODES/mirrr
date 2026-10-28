"""Exact synthetic-head parity for the new public hair studio renderer."""
from __future__ import annotations

import base64
import json
from pathlib import Path

import numpy as np

from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.menshair import render_style_for_face
from plumb_api.engines.menshair.public_render import StyleRender
from tests.test_menshair_render_entry import anchors, synthetic_head

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "parity/menshair-r26f.json"


class PassThrough:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        assert lock_level == 5.0
        return CoverDecision(after.copy(), 1.0, False)


def encode(data: np.ndarray) -> str:
    return base64.b64encode(data.tobytes()).decode("ascii")


def expected_vectors() -> dict[str, object]:
    img, hair = synthetic_head("straight", (61, 43, 36))
    results: list[dict[str, object]] = []
    ids = ("local-low-fade", "local-high-fade", "local-buzz-1")
    for ident in ids:
        for level in (1.0, 3.0, 5.0):
            out = render_style_for_face(img, hair, anchors(), ident, level, guard=PassThrough())
            assert isinstance(out, StyleRender)
            results.append({"id": ident, "level": level, "pixels": encode(out.image),
                            "changed_pixel_share": round(out.changed_pixel_share, 10)})
    return {"format": "beljour-menshair-render-parity/1", "width": img.shape[1],
            "height": img.shape[0], "channels": img.shape[2],
            "anchors": anchors().to_json(), "source": encode(img), "mask": encode(hair),
            "cases": results}


def test_public_render_matches_committed_python_vectors():
    assert json.loads(PATH.read_text()) == expected_vectors()


if __name__ == "__main__":
    PATH.parent.mkdir(parents=True, exist_ok=True)
    PATH.write_text(json.dumps(expected_vectors(), sort_keys=True, separators=(",", ":")) + "\n")
