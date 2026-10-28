"""Source registry flags and sources.local.json validation.

Uses synthetic sources files in tmp_path only; no face set is touched.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.facescale import registry as R
from lab.facescale.synthetic import sources_file


def test_every_source_is_test_only_and_never_trained_or_shown() -> None:
    assert sorted(R.SOURCES) == [f"S{n:02d}" for n in range(1, 11)]
    for source in R.SOURCES.values():
        assert source.test_only is True
        assert source.train_allowed is False
        assert source.show_allowed is False
        assert source.layout in R.LAYOUT_KINDS
        assert "{name}" in source.attribution_template
        assert "(test-only" in source.licence


def test_held_source_is_disabled_and_needs_a_form() -> None:
    held = R.SOURCES["S10"]
    assert held.needs_access_form is True
    assert held.default_enabled is False
    assert [s.id for s in R.SOURCES.values() if s.needs_access_form] == ["S10"]


def test_licence_tags_are_stored_exactly() -> None:
    assert R.SOURCES["S01"].licence == "CC-BY-4.0 (test-only)"
    assert R.SOURCES["S03"].licence == "Vendor-Lite-Terms (test-only, internal)"
    assert R.SOURCES["S09"].licence == "non-commercial research only (test-only)"
    assert R.SOURCES["S07"].expected_count == 202_599
    assert R.SOURCES["S08"].expected_count == 30_000


def test_registry_refuses_a_trainable_source() -> None:
    bad = R._source("S99", "x", "flat", (), None, "", {})
    object.__setattr__(bad, "train_allowed", True)
    with pytest.raises(R.SourceError, match="test-only"):
        R._assert_test_only({"S99": bad})


def test_attribution_fills_the_box_side_name() -> None:
    text = R.SOURCES["S04"].attribution("set four")
    assert "set four" in text and "S04" in text and "never trained on" in text


def test_load_local_accepts_a_valid_file(tmp_path: Path) -> None:
    root = tmp_path / "faces"
    root.mkdir()
    path = sources_file(tmp_path / "sources.local.json",
                        {"S04": {"name": "four", "root": str(root), "enabled": True}})
    local = R.load_local(path)
    assert list(local) == ["S04"]
    assert local["S04"].root == root
    assert local["S04"].attribution().startswith("Test images from four")
    assert [e.id for e in R.enabled(local)] == ["S04"]


def test_relative_root_resolves_against_the_file(tmp_path: Path) -> None:
    (tmp_path / "rel").mkdir()
    path = sources_file(tmp_path / "s.json", {"S08": {"root": "rel"}})
    assert R.load_local(path)["S08"].root == tmp_path / "rel"


@pytest.mark.parametrize(
    ("entries", "message"),
    [
        ({"S77": {"root": "/x"}}, "unknown source id"),
        ({"S04": {"root": "/no/such/folder", "enabled": True}}, "does not exist"),
        ({"S04": {"enabled": True}}, "missing root"),
        ({"S10": {"root": "/tmp", "enabled": True}}, "held for John"),
    ],
)
def test_refusals(tmp_path: Path, entries: dict[str, dict[str, object]], message: str) -> None:
    path = sources_file(tmp_path / "s.json", entries)
    with pytest.raises(R.SourceError, match=message):
        R.load_local(path)


def test_held_source_loads_once_access_is_granted(tmp_path: Path) -> None:
    root = tmp_path / "ten"
    root.mkdir()
    path = sources_file(tmp_path / "s.json",
                        {"S10": {"root": str(root), "enabled": True, "access_granted": True}})
    assert R.load_local(path)["S10"].access_granted is True


def test_disabled_source_may_have_a_missing_root(tmp_path: Path) -> None:
    path = sources_file(tmp_path / "s.json", {"S10": {"root": "/nope"}})
    assert R.load_local(path)["S10"].enabled is False


def test_root_inside_the_repo_is_refused(tmp_path: Path) -> None:
    path = sources_file(tmp_path / "s.json", {"S04": {"root": str(R.REPO_ROOT / "lab")}})
    with pytest.raises(R.SourceError, match="inside the repo"):
        R.load_local(path)


def test_sources_file_inside_the_repo_is_refused() -> None:
    with pytest.raises(R.SourceError, match="outside the repo"):
        R.load_local(R.REPO_ROOT / "sources.local.json")


def test_bad_format_and_bad_json(tmp_path: Path) -> None:
    bad = tmp_path / "bad.json"
    bad.write_text("{not json")
    with pytest.raises(R.SourceError, match="cannot read"):
        R.load_local(bad)
    other = tmp_path / "other.json"
    other.write_text('{"format": "x", "sources": {}}')
    with pytest.raises(R.SourceError, match="format"):
        R.load_local(other)


def test_kaggle_mode_reads_slugs_under_kaggle_input(tmp_path: Path) -> None:
    data = {"format": R.LOCAL_FORMAT,
            "sources": {"S04": {"kaggle_slug": "owner/set-four", "enabled": False,
                                "kaggle_subdir": "imgs"}}}
    local = R.parse_local(data, tmp_path, kaggle=True)
    assert local["S04"].root == Path("/kaggle/input/set-four/imgs")
    with pytest.raises(R.SourceError, match="kaggle_slug"):
        R.parse_local({"format": R.LOCAL_FORMAT, "sources": {"S04": {"enabled": False}}},
                      tmp_path, kaggle=True)
    with pytest.raises(R.SourceError, match="bad Kaggle slug"):
        R.kaggle_root("noslash")


def test_layout_overrides_merge_over_registry_options(tmp_path: Path) -> None:
    (tmp_path / "r").mkdir()
    path = sources_file(tmp_path / "s.json",
                        {"S04": {"root": str(tmp_path / "r"), "layout_options": {"max_depth": 1}}})
    options = R.load_local(path)["S04"].options()
    assert options["max_depth"] == 1
    assert options["extensions"] == [".png", ".jpg"]


def test_describe_never_carries_names() -> None:
    rows = R.describe()
    assert len(rows) == 10
    assert all("name" not in row for row in rows)
