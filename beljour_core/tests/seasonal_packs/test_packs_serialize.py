"""Serialization tests: packs round-trip through JSON and bad data is refused.

Author: John Khan.
"""

from __future__ import annotations

import copy
import json

import numpy as np
import pytest

from plumb_api.seasonal.packs import PackError, PackRegistry, apply_look, list_packs
from plumb_api.seasonal.packs.serialize import (
    SCHEMA_VERSION,
    look_from_dict,
    pack_from_dict,
    pack_from_json,
    pack_to_dict,
    pack_to_json,
)
from plumb_api.seasonal.packs.synthetic import single


@pytest.mark.parametrize("pack", list_packs(), ids=lambda pack: pack.occasion)
def test_every_shipped_pack_round_trips(pack: object) -> None:
    from plumb_api.seasonal.packs import SeasonalPack

    assert isinstance(pack, SeasonalPack)
    again = pack_from_json(pack_to_json(pack))
    assert again == pack
    assert pack_to_json(again) == pack_to_json(pack)


def test_loaded_pack_renders_like_the_original() -> None:
    original = list_packs()[0]
    loaded = pack_from_json(pack_to_json(original))
    registry = PackRegistry()
    registry.register(loaded)
    image, target = single(128)
    for look in original.looks:
        ours = apply_look(image, original.occasion, look.id, target, seed=2)
        theirs = apply_look(image, original.occasion, look.id, target, seed=2, registry=registry)
        assert np.array_equal(ours, theirs)


def test_json_is_plain_and_versioned() -> None:
    data = json.loads(pack_to_json(list_packs()[1]))
    assert data["schema"] == SCHEMA_VERSION
    assert isinstance(data["looks"][0]["params"]["motifs"], list)


def _sample() -> dict[str, object]:
    return copy.deepcopy(pack_to_dict(list_packs()[4]))


@pytest.mark.parametrize(
    ("change", "message"),
    [
        (lambda d: d.update(colour="red"), "unknown keys"),
        (lambda d: d.update(schema=2), "schema"),
        (lambda d: d.update(looks="all"), "must be a list"),
        (lambda d: d.update(occasion=5), "occasion must be text"),
        (lambda d: d.update(motifs="egg"), "list of text"),
        (lambda d: d["palette"].update(shade="#000000"), "unknown keys"),
        (lambda d: d["palette"].update(primary="pink"), "#rrggbb"),
        (lambda d: d["looks"][0].update(kind="sticker"), "sticker"),
        (lambda d: d["looks"][0].update(curve="wobbly"), "wobbly"),
        (lambda d: d["looks"][0].update(default_strength="high"), "number"),
        (lambda d: d["looks"][0].update(default_strength=2.55), "step grid"),
        (lambda d: d["looks"][0]["params"].update(motifs=["egg", 3]), "only text"),
        (lambda d: d["looks"][0]["params"].update(bad={"a": 1}), "unsupported"),
        (lambda d: d["looks"][0].update(extra=1), "unknown keys"),
    ],
)
def test_bad_pack_data_is_refused(change: object, message: str) -> None:
    data = _sample()
    assert callable(change)
    change(data)
    with pytest.raises(PackError, match=message):
        pack_from_dict(data)


def test_forbidden_motifs_in_data_are_refused() -> None:
    data = _sample()
    data["motifs"] = ["egg", "church_window"]
    with pytest.raises(PackError, match="forbidden"):
        pack_from_dict(data)


def test_numeric_list_params_and_defaults() -> None:
    look = look_from_dict(
        {
            "id": "g",
            "kind": "grade",
            "title": "G",
            "renderer": "grade.split_tone",
            "params": {"weights": [1, 2.5]},
        }
    )
    assert look.params["weights"] == (1.0, 2.5)
    assert look.default_strength == 3.0
    assert look.motifs == ()


def test_invalid_json_is_a_pack_error() -> None:
    with pytest.raises(PackError, match="not valid"):
        pack_from_json("{oops")
    with pytest.raises(PackError, match="object"):
        pack_from_json("[1, 2]")
