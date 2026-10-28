"""Versioned recipe tests: synthetics only, no real photos."""

from __future__ import annotations

import json

import pytest

from plumb_api.pro import Crop, CurvePoint, Recipe, ToneCurves
from plumb_api.pro.serialization import FORMAT, decode_recipe, encode_recipe


def test_recipe_round_trip_with_nontrivial_edit() -> None:
    curve = (CurvePoint(0, 0), CurvePoint(0.5, 0.7), CurvePoint(1, 1))
    recipe = Recipe(curves=ToneCurves(red=curve),
                    crop=Crop(x=0.15, y=0.1, width=0.65, height=0.8, aspect="portrait", rotation=-17.25),
                    export="lossless")
    json_data = encode_recipe(recipe)
    assert decode_recipe(json_data) == recipe
    assert FORMAT in json_data
    assert "simulationLabel" in json_data
    assert "simulation_label" not in json_data
    assert "photo" not in json_data


def test_recipe_rejects_invalid_schemas() -> None:
    source = json.loads(encode_recipe(Recipe()))
    invalid = [
        {**source, "format": "future/9"},
        {**source, "unexpected": "value"},
        {**source, "recipe": {**source["recipe"], "photo": "forbidden"}},
        {**source, "recipe": {**source["recipe"], "export": "missing"}},
        {**source, "recipe": {**source["recipe"], "simulationLabel": 1}},
    ]
    for item in invalid:
        with pytest.raises(ValueError):
            decode_recipe(json.dumps(item))
    with pytest.raises(ValueError):
        decode_recipe("{")
    with pytest.raises(ValueError):
        decode_recipe("a" * 9_000)


def test_recipe_rejects_nonfinite_values_and_unsafe_points() -> None:
    source = json.loads(encode_recipe(Recipe()))
    source["recipe"]["crop"]["x"] = float("nan")
    with pytest.raises(ValueError):
        decode_recipe(json.dumps(source))
    source = json.loads(encode_recipe(Recipe()))
    source["recipe"]["curves"]["red"] = [{"x": 0, "y": 0}, {"x": 1, "y": -1}]
    with pytest.raises(ValueError):
        decode_recipe(json.dumps(source))


def test_recipe_defaults_preserve_simulation_disclosure() -> None:
    result = decode_recipe(encode_recipe(Recipe()))
    assert result.simulation
    assert result.simulation_label
    assert result.export == "original"
