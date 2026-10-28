"""R28F settings-only local hair recipes: strict import, exact export, no photo data.

Pass definition: export carries only the chosen controls; import refuses oversized,
malformed, unknown, private, out-of-catalogue and non-tenth inputs with codes; import
never renders. The exported text is identical in web/test/r28f-local-hair-recipe.test.mjs.
Author: John Khan.
"""
from __future__ import annotations

import json

import pytest

from plumb_api.commerce.local_hair_recipe import (
    FORMAT,
    LocalHairRecipe,
    RecipeError,
    export_recipe,
    import_recipe,
)

FIBRE_TEXT = '{"format":"beljour-local-hair-recipe/1","kind":"fibre","level":3.0,"lock_level":5.0,' \
             '"shade_id":null,"zone":"crown"}'


def test_exports_are_compact_sorted_and_round_trip() -> None:
    fibre = LocalHairRecipe("fibre", 3.0, zone="crown")
    assert export_recipe(fibre) == FIBRE_TEXT
    for recipe in (fibre, LocalHairRecipe("palette", 4.5, 3.2, shade_id="natural-05-n", allow_lightening=True),
                   LocalHairRecipe("short-sides", 1.0, style_id="local-low-fade"),
                   LocalHairRecipe("fibre", 2.3, zone="hairline", shade_id="natural-04-n")):
        assert import_recipe(export_recipe(recipe)) == recipe


@pytest.mark.parametrize("change,code", [
    ({"photo": "abc"}, "private_field"),
    ({"landmarks": [[1, 2]]}, "private_field"),
    ({"hash": "00"}, "private_field"),
    ({"colour": "red"}, "unknown_key"),
    ({"level": 3.05}, "invalid_level"),
    ({"level": 5.1}, "invalid_level"),
    ({"level": True}, "invalid_level"),
    ({"zone": "temple"}, "invalid_value"),
    ({"shade_id": "brand-123"}, "unknown_id"),
    ({"format": "other/1"}, "wrong_format"),
    ({"kind": "wig"}, "invalid_value"),
])
def test_import_refusals_are_coded(change: dict[str, object], code: str) -> None:
    data = json.loads(FIBRE_TEXT)
    data.update(change)
    with pytest.raises(RecipeError) as raised:
        import_recipe(json.dumps(data))
    assert raised.value.code == code


def test_size_json_and_kind_specific_rules() -> None:
    with pytest.raises(RecipeError) as large:
        import_recipe(" " * 1025)
    assert large.value.code == "too_large"
    with pytest.raises(RecipeError) as broken:
        import_recipe("{")
    assert broken.value.code == "invalid_json"
    for bad in ({"format": FORMAT, "kind": "palette", "level": 3.0},
                {"format": FORMAT, "kind": "short-sides", "level": 3.0, "style_id": "no-such-style"},
                {"format": FORMAT, "kind": "fibre", "zone": "crown"}):
        with pytest.raises(RecipeError):
            import_recipe(json.dumps(bad))
    palette = {"format": FORMAT, "kind": "palette", "level": 3.0, "shade_id": "natural-05-n", "zone": "crown"}
    with pytest.raises(RecipeError) as extra:
        import_recipe(json.dumps(palette))
    assert extra.value.code == "unknown_key"


def test_recipe_has_no_photo_fields_and_import_does_not_render(monkeypatch: pytest.MonkeyPatch) -> None:
    from plumb_api.engines.concealer.cover import CoverSession

    def forbidden(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("import must not render")

    monkeypatch.setattr(CoverSession, "render", forbidden)
    recipe = import_recipe(FIBRE_TEXT)
    assert set(recipe.settings()) == {"format", "kind", "level", "lock_level", "zone", "shade_id"}
    assert not any(name in recipe.__slots__ for name in ("image", "mask", "landmarks"))
