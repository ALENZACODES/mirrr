"""R13 frozen-10000 runner support (realface-10000-spec.md items 1-8).

Pass definition: the five synthetic checks the spec lists, plus the make targets
and ignore rule. (1) shard filtering returns exactly the requested rows; (2) a
shard run's plan differs from a full run's plan and cannot satisfy a whole-set
definition; (3) `age_band_r12` is read when present, with `age_band` as the
fallback; (4) `derived_*` pool columns never fill reference labels; (5) every
definitions-10000 file names frozen-10000 with 10,000 faces and is otherwise
identical to its frozen-1000 twin, thresholds included.
Fixtures: tiny byte files and hand-written manifests in a temporary folder.
No faces, models or network. Author: John Khan.
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
REALFACE = ROOT / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import definitions  # noqa: E402
import face_set  # noqa: E402
import gates  # noqa: E402
import realface_lib as lib  # noqa: E402
import report  # noqa: E402
import run_state  # noqa: E402

OLD = REALFACE / "pass_definitions"
NEW = REALFACE / "pass_definitions-10000"
FIELDS = ("file", "source", "licence", "slice", "race", "gender", "age_band", "age_band_r12",
          "shard", "tags", "derived_yaw_deg", "derived_face_lum", "derived_n_faces_yunet")


def make_set(root: Path, rows: list[dict], name: str = "frozen-10000") -> Path:
    folder = root / name / "fairface"
    folder.mkdir(parents=True, exist_ok=True)
    with (folder / "manifest.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in FIELDS})
            (folder / row["file"]).write_bytes(f"synthetic image bytes {row['file']}".encode())
    return root


def rows_for(count: int, *, shards: int = 10) -> list[dict]:
    return [{"file": f"img{i:03d}.png", "source": "fairface", "licence": "CC BY 4.0", "gender": "Female",
             "age_band": "20-39", "age_band_r12": "20-29", "shard": str(i % shards),
             "tags": "derived:yaw_mp_side;glasses" if i % 3 == 0 else ""} for i in range(count)]


# --- 1. shard filtering ---------------------------------------------------------

def test_shard_filtering_returns_exactly_the_requested_rows(tmp_path):
    root = make_set(tmp_path, rows_for(40))
    faces = lib.discover(root, ("frozen-10000",))
    assert len(faces) == 40
    chosen = face_set.select_shards(faces, face_set.parse_shards("0,3"))
    assert sorted(f.path.name for f in chosen) == sorted(
        f"img{i:03d}.png" for i in range(40) if i % 10 in (0, 3))
    assert all(int(f.row["shard"]) in (0, 3) for f in chosen)
    assert face_set.select_shards(faces, None) == faces
    assert face_set.shard_counts(chosen) == {"0": 4, "3": 4}
    assert [f.path for f in face_set.select_shards(faces, (3, 0))] == [f.path for f in chosen]


@pytest.mark.parametrize("text", ("10", "-1", "0,0", "a", "0,,3", "1.5"))
def test_bad_shard_requests_are_refused(text):
    with pytest.raises(face_set.ScopeError):
        face_set.parse_shards(text)


def test_shard_run_refuses_rows_without_a_shard(tmp_path):
    rows = rows_for(5)
    rows[2]["shard"] = ""
    faces = lib.discover(make_set(tmp_path, rows), ("frozen-10000",))
    with pytest.raises(face_set.ScopeError, match="shard"):
        face_set.select_shards(faces, (0,))
    assert len(face_set.select_shards(faces, None)) == 5  # a full run needs no shard


def test_cli_shard_flag_is_parsed_before_any_face_is_read(tmp_path, capsys):
    import run_realface as cli
    with pytest.raises(SystemExit):
        cli.main(["--faces", str(tmp_path), "--shards", "12"])
    assert "shards" in capsys.readouterr().err


# --- 2. a shard plan is a declared subset ------------------------------------------

def frozen_plan(faces, shards=None):
    defs = definitions.load_definitions(("regions",), NEW)
    return run_state.freeze(faces, defs, lib.API.parent, max_side=640, include=("frozen-10000",),
                            shards=shards)


def test_shard_run_plan_differs_from_full_run_plan(tmp_path):
    faces = lib.discover(make_set(tmp_path, rows_for(20)), ("frozen-10000",))
    full = frozen_plan(faces)
    every_shard = frozen_plan(faces, shards=tuple(range(10)))
    shard0 = frozen_plan(face_set.select_shards(faces, (0,)), shards=(0,))
    assert "shards" not in full and "shard_counts" not in full
    assert every_shard["shards"] == list(range(10))
    # Same images, but one plan was frozen as a shard run: never interchangeable.
    assert every_shard["face_set_sha256"] != full["face_set_sha256"]
    assert len({full["run_id"], every_shard["run_id"], shard0["run_id"]}) == 3
    assert shard0["shards"] == [0] and shard0["shard_counts"] == {"0": 2}
    assert all(face["shard"] == 0 for face in shard0["faces"])


def test_freeze_refuses_a_face_outside_the_declared_shards(tmp_path):
    faces = lib.discover(make_set(tmp_path, rows_for(4)), ("frozen-10000",))
    with pytest.raises(ValueError, match="outside the requested shards"):
        frozen_plan(faces, shards=(0,))


def synthetic_plan(definition, shards=None, counts=None, count=2):
    faces = [{"face_id": f"f{i}", "labels": {"monk": "5", "gender": "female", "age": "20-29",
              "monk_gender_age": "5/female/20-29", "source": "s", "race": "r", "slice": "s",
              "size": "large_ge128", "yaw": "frontal", "occlusion": "none"}} for i in range(count)]
    plan = {"run_id": "run", "faces": faces, "face_set_sha256": "x", "engine_sha256": "e", "max_side": 640,
            "include": [definition.content["face_set"]["id"]], "model_hashes": {},
            "definitions": {definition.id: definition.sha256}, "definition_committed": True}
    if shards is not None:
        plan["shards"], plan["shard_counts"] = shards, counts
    return plan


def shard_definition(ids=(0,), per=2):
    data = json.loads((NEW / "regions.json").read_text())
    data["face_set"]["shards"] = {"ids": list(ids), "faces_per_shard": per}
    data["face_set"]["number_of_faces"] = per * len(ids)
    definitions.validate(data, "regions")
    return definitions.Definition("regions", run_state.digest(data), data, True)


def test_a_shard_result_cannot_stand_in_for_the_whole_set_definition():
    whole = definitions.load_definition("regions", NEW)
    plan = synthetic_plan(whole, shards=[0], counts={"0": 2})
    output = gates.evaluate([], {"regions": whole}, plan)
    assert output["gates"][0]["status"] != "PASS"
    assert any("cannot stand in" in m for m in output["gates"][0]["missing_evidence"])


def test_definition_declaring_shards_must_match_exactly():
    declared = shard_definition((0,), 2)
    assert gates._shard_scope(declared, synthetic_plan(declared, [0], {"0": 2})) == []
    for shards, counts in (([0, 3], {"0": 2, "3": 2}), ([3], {"3": 2}), ([0], {"0": 1}), (None, None)):
        assert gates._shard_scope(declared, synthetic_plan(declared, shards, counts)), (shards, counts)


@pytest.mark.parametrize("shards", ({"ids": [0, 0], "faces_per_shard": 1000}, {"ids": [10], "faces_per_shard": 1000},
                                    {"ids": [0], "faces_per_shard": 0}, {"ids": [0]}, [0],
                                    {"ids": [0, 1], "faces_per_shard": 1000}))
def test_malformed_or_inconsistent_shard_declarations_are_refused(shards):
    data = json.loads((NEW / "regions.json").read_text())
    data["face_set"]["shards"] = shards
    data["face_set"]["number_of_faces"] = 1000
    with pytest.raises(definitions.DefinitionError, match="shards"):
        definitions.validate(data, "regions")


# --- 3. age_band_r12 fallback ------------------------------------------------------

def test_age_band_r12_is_read_with_age_band_fallback(tmp_path):
    rows = rows_for(3)
    rows[1]["age_band_r12"] = ""
    rows[2]["age_band_r12"] = "0-9"
    faces = {f.path.name: f for f in lib.discover(make_set(tmp_path, rows), ("frozen-10000",))}
    assert faces["img000.png"].age == "20-29"
    assert faces["img001.png"].age == "20-39"  # fallback to the frozen-1000 style band
    assert faces["img002.png"].age == "0-9"   # kept separate, never folded into 10-19
    assert run_state.face_labels(faces["img000.png"])["age"] == "20-29"
    assert run_state.face_labels(faces["img000.png"])["monk_gender_age"].endswith("/20-29")


def test_frozen_1000_rows_without_r12_column_are_unchanged(tmp_path):
    folder = tmp_path / "frozen-1000" / "fairface"
    folder.mkdir(parents=True)
    (folder / "manifest.csv").write_text("file,licence,gender,age_band\na.png,CC BY 4.0,Male,40-59\n")
    (folder / "a.png").write_bytes(b"a")
    (face,) = lib.discover(tmp_path)
    assert face.age == "40-59"
    assert lib.age_band({"age_band": "60+"}) == "60+"
    assert lib.age_band({"age_band": "60+", "age_band_r12": " "}) == "60+"


# --- 4. derived columns are not labels ---------------------------------------------

def test_derived_columns_never_fill_reference_label_fields(tmp_path):
    rows = rows_for(1)
    rows[0].update(derived_yaw_deg="2.5", derived_face_lum="0.41", derived_n_faces_yunet="1")
    (face,) = lib.discover(make_set(tmp_path, rows), ("frozen-10000",))
    labels = run_state.face_labels(face)
    assert labels["yaw"] == "unknown"
    assert labels["size"] == "unknown"
    assert labels["occlusion"] == "unknown"
    assert labels["monk"] == "unknown"
    with pytest.raises(face_set.ScopeError, match="derived"):
        face_set.reference_value(face.row, "derived_yaw_deg")
    assert face_set.derived_columns(face.row) == {"derived_yaw_deg": "2.5", "derived_face_lum": "0.41",
                                                 "derived_n_faces_yunet": "1"}


def test_a_derived_column_named_like_a_label_still_cannot_fill_it(tmp_path):
    image = tmp_path / "a.png"
    image.write_bytes(b"x")
    face = lib.Face(image, "s", "CC BY 4.0", "", row={"derived_monk": "4", "derived_occlusion": "glasses",
                                                     "derived_yaw_degrees": "70"})
    labels = run_state.face_labels(face)
    assert (labels["monk"], labels["occlusion"], labels["yaw"]) == ("unknown", "unknown", "unknown")


def test_derived_values_appear_only_in_a_separate_report_column():
    rows = [{"module": "landmarks", "check": "detect", "pass": True, "face_id": "a", "source": "s", "file": "a",
             "derived_yaw_deg": "50", "yaw": "unknown", "tags": "derived:yaw_mp_side;glasses"},
            {"module": "landmarks", "check": "detect", "pass": False, "face_id": "b", "source": "s", "file": "b",
             "derived_yaw_deg": "3", "yaw": "unknown", "tags": "glasses"}]
    text = report.markdown(rows, ["landmarks"], title="t", notes=[])
    assert "Detection by derived yaw — derived (not ground truth)" in text
    assert "side 100.0% (1/1)" in text and "frontal 0.0% (0/1)" in text
    assert "Detection by annotated yaw: unknown" in text
    tags_at = text.index("## Tags (leads from the manifest")
    derived_at = text.index("## derived (not ground truth)")
    assert tags_at < derived_at
    assert "| glasses | 50.0% (1/2) |" in text[tags_at:derived_at]
    assert "| derived:yaw_mp_side | 100.0% (1/1) |" in text[derived_at:]
    assert "derived:yaw_mp_side" not in text[tags_at:derived_at]


def test_tags_stay_out_of_the_gates():
    definition = definitions.load_definition("regions", NEW)
    assert "tags" not in definition.content["slices"]
    assert face_set.split_tags("a; b;;a ;derived:x") == ["a", "b", "derived:x"]
    assert face_set.split_tags(None) == []


# --- 5. definitions-10000 match the folder ------------------------------------------

def test_definitions_10000_match_their_frozen_1000_twins_except_set_and_version():
    old = {p.name for p in OLD.glob("*.json")}
    new = {p.name for p in NEW.glob("*.json")}
    assert len(old) == len(definitions.REGISTERED_IDS) and old == new
    for name in sorted(old):
        before = json.loads((OLD / name).read_text())
        after = json.loads((NEW / name).read_text())
        assert after["version"] > before["version"], name
        assert after["threshold"] == before["threshold"], name
        if name == "missing_folder.json":
            assert after["face_set"] == before["face_set"]
            assert after["face_set"]["number_of_faces"] == 0
        else:
            assert after["face_set"]["id"] == "frozen-10000", name
            assert after["face_set"]["number_of_faces"] == 10000, name
        strip = lambda d: {k: v for k, v in d.items() if k not in {"version", "face_set"}}  # noqa: E731
        assert strip(after) == strip(before), name
        rest = lambda d: {k: v for k, v in d["face_set"].items() if k not in {"id", "number_of_faces"}}  # noqa: E731
        assert rest(after) == rest(before), name


def test_every_definitions_10000_file_validates():
    loaded = definitions.load_definitions(definitions.REGISTERED_IDS, NEW)
    assert {d.expected_faces for k, d in loaded.items() if k != "missing_folder"} == {10000}


def test_a_folder_or_count_mismatch_is_unproven():
    definition = definitions.load_definition("regions", NEW)
    plan = synthetic_plan(definition)
    output = gates.evaluate([], {"regions": definition}, plan)
    assert output["gates"][0]["status"] != "PASS"
    assert any("Expected 10000 faces from frozen-10000; measured 2" in m
               for m in output["gates"][0]["missing_evidence"])
    plan["include"] = ["frozen-1000"]
    plan["faces"] = plan["faces"] * 5000
    output = gates.evaluate([], {"regions": definition}, plan)
    assert any("Expected 10000 faces from frozen-10000" in m for m in output["gates"][0]["missing_evidence"])


# --- make targets and ignore rule ---------------------------------------------------

def test_make_targets_and_gitignore():
    makefile = (ROOT / "Makefile").read_text()
    assert "REALFACE_DEFINITIONS ?= tests/realface/pass_definitions\n" in makefile
    assert "realface-10000:" in makefile and "realface-test-10000:" in makefile
    assert 'REALFACE_ARGS="--include frozen-10000"' in makefile
    assert "REALFACE_REPORT=quality-reports/realface-10000.md" in makefile
    assert "--validate-definitions --definitions tests/realface/pass_definitions-10000" in makefile
    assert "REALFACE_SHARDS=$(REALFACE_SHARDS)" in makefile
    ignored = (ROOT / ".gitignore").read_text().splitlines()
    assert "frozen-10000/" in ignored and "frozen-1000/" in ignored
