"""Every loader kind on tiny drawn layouts: counts, keys, hashes and labels.

Includes a RecordIO file built byte by byte with a split record and a
multi-label header. Everything lives in tmp_path.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import struct
from pathlib import Path

import pytest

from lab.facescale.loaders import (
    CsvLabelledLoader,
    FlatLoader,
    IdentityLoader,
    LoaderError,
    ManifestLoader,
    NpzSidecarLoader,
    RecordIOLoader,
    TsvPhotoLoader,
    group_of,
    loader_for,
)
from lab.facescale.loaders import recordio as rio
from lab.facescale.loaders.base import clean_label, safe_key
from lab.facescale.registry import load_local
from lab.facescale.synthetic import (
    all_layouts,
    make_csv_labelled,
    make_flat,
    make_identity,
    make_manifest,
    make_npz_sidecar,
    make_recordio,
    make_tsv_photos,
    sources_file,
)


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_flat_folder_and_numbered_subfolders(tmp_path: Path) -> None:
    keys = make_flat(tmp_path / "a", 5, per_folder=2)
    loader = FlatLoader("S04", tmp_path / "a", {"max_depth": 2, "extensions": [".png"]})
    assert loader.keys() == keys
    items = list(loader.iter_items())
    assert [i.item_key for i in items] == keys
    assert items[0].content_sha256 == _sha(tmp_path / "a" / keys[0])
    assert items[0].open_fn() == (tmp_path / "a" / keys[0]).read_bytes()
    shallow = FlatLoader("S04", tmp_path / "a", {"max_depth": 1, "extensions": [".png"]})
    assert shallow.keys() == []


def test_flat_ignores_hidden_and_other_extensions(tmp_path: Path) -> None:
    make_flat(tmp_path, 2)
    (tmp_path / ".hidden.png").write_bytes(b"x")
    (tmp_path / "notes.txt").write_text("x")
    assert FlatLoader("S08", tmp_path, {"max_depth": 1}).keys() == ["00000.png", "00001.png"]


def test_flat_missing_root_and_bad_depth(tmp_path: Path) -> None:
    with pytest.raises(LoaderError):
        FlatLoader("S04", tmp_path / "none", {}).keys()
    with pytest.raises(LoaderError, match="max_depth"):
        FlatLoader("S04", tmp_path, {"max_depth": 0}).keys()


def test_identity_folders(tmp_path: Path) -> None:
    keys = make_identity(tmp_path, 3, 2)
    loader = IdentityLoader("S06", tmp_path, {"subdir": "train"})
    assert loader.keys() == keys
    item = loader.item(keys[2])
    assert item.labels["identity"] == "n000001"
    assert item.group() == "unlabelled"
    assert item.content_sha256 == _sha(tmp_path / "train" / keys[2])


def test_identity_without_split_folder(tmp_path: Path) -> None:
    keys = make_identity(tmp_path, 2, 1, subdir="")
    assert IdentityLoader("S10", tmp_path, {"subdir": ""}).keys() == keys


def test_csv_labelled_joins_csvs_and_maps_values(tmp_path: Path) -> None:
    rows = [{"image_id": f"{n:06d}.jpg", "Male": "1" if n % 2 else "-1", "Young": "-1"}
            for n in range(1, 5)]
    make_csv_labelled(tmp_path, rows, key_column="image_id", csv_names=["attr.csv"],
                      image_dir="img")
    (tmp_path / "part.csv").write_text(
        "image_id,partition\n" + "".join(f"{r['image_id']},2\n" for r in rows))
    (tmp_path / "img" / "000004.jpg").unlink()
    options = {"csvs": ["attr.csv", "part.csv", "absent.csv"], "key_column": "image_id",
               "image_dir": "img",
               "columns": {"gender": "Male", "age": "Young", "partition": "partition"},
               "values": {"gender": {"1": "male", "-1": "female"},
                          "age": {"1": "young", "-1": "older"}}}
    loader = CsvLabelledLoader("S07", tmp_path, options)
    assert loader.keys() == ["000001.jpg", "000002.jpg", "000003.jpg"]
    labels = loader.labels_for("000001.jpg")
    assert dict(labels) == {"gender": "male", "age": "older", "partition": "2"}
    assert group_of(labels) == "unknown/male/older"
    assert loader.stats.skipped == {"csv_missing": 1, "image_missing": 1}


def test_csv_with_split_paths_and_race_labels(tmp_path: Path) -> None:
    rows = [{"file": "train/1.jpg", "age": "20-29", "gender": "Male", "race": "East Asian"},
            {"file": "val/2.jpg", "age": "", "gender": "Female", "race": "Group B"}]
    make_csv_labelled(tmp_path, rows, key_column="file", csv_names=["t.csv", "v.csv"])
    loader = CsvLabelledLoader("S01", tmp_path, {
        "csvs": ["t.csv", "v.csv"], "key_column": "file",
        "columns": {"race": "race", "gender": "gender", "age": "age"}})
    assert loader.keys() == ["train/1.jpg", "val/2.jpg"]
    assert loader.item("train/1.jpg").group() == "east_asian/male/20-29"
    assert loader.labels_for("val/2.jpg")["age"] == "unknown"


def test_csv_without_key_column_or_files(tmp_path: Path) -> None:
    (tmp_path / "a.csv").write_text("name,age\nx,1\n")
    with pytest.raises(LoaderError, match="no 'file' column"):
        CsvLabelledLoader("S01", tmp_path, {"csvs": ["a.csv"]}).keys()
    with pytest.raises(LoaderError, match="none of the label CSVs"):
        CsvLabelledLoader("S01", tmp_path, {"csvs": ["b.csv"]}).keys()
    with pytest.raises(LoaderError, match="at least one"):
        CsvLabelledLoader("S01", tmp_path, {"csvs": []}).keys()


def test_csv_refuses_keys_that_climb_out(tmp_path: Path) -> None:
    (tmp_path / "a.csv").write_text("file\n../up.jpg\nok.jpg\n")
    (tmp_path / "ok.jpg").write_bytes(b"x")
    loader = CsvLabelledLoader("S01", tmp_path, {"csvs": ["a.csv"]})
    assert loader.keys() == ["ok.jpg"]
    assert loader.stats.skipped == {"bad_key": 1}


def test_tsv_photos_count_missing_downloads(tmp_path: Path) -> None:
    make_tsv_photos(tmp_path, ["zz", "aa", "mm"], ["aa", "zz"])
    loader = TsvPhotoLoader("S03", tmp_path, {})
    assert loader.keys() == ["aa.jpg", "zz.jpg"]
    assert loader.stats.skipped == {"image_missing": 1}
    assert loader.labels_for("aa.jpg")["kind"] == "photo"


def test_tsv_without_table(tmp_path: Path) -> None:
    with pytest.raises(LoaderError, match="photo table"):
        TsvPhotoLoader("S03", tmp_path, {}).keys()


def test_npz_sidecar_parts(tmp_path: Path) -> None:
    keys = make_npz_sidecar(tmp_path, ["part1", "part2"], 3)
    loader = NpzSidecarLoader("S02", tmp_path, {"parts": ["part1", "part2", "part9"]})
    assert loader.keys() == keys
    first = loader.labels_for("part1/images/000000.jpg")
    assert dict(first) == {"part": "part1", "has_landmarks": "yes", "has_segmentation": "yes"}
    assert loader.labels_for("part2/images/000001.jpg")["has_landmarks"] == "no"
    marks = loader.landmarks("part1/images/000002.jpg")
    assert marks is not None and marks.shape == (68, 2) and float(marks[0, 0]) == 2.0
    assert loader.landmarks("part1/images/000001.jpg") is None


def test_npz_sidecar_discovers_parts_and_ignores_bad_npz(tmp_path: Path) -> None:
    make_npz_sidecar(tmp_path, ["p"], 1)
    (tmp_path / "p" / "landmarks" / "000000.npz").write_bytes(b"broken")
    loader = NpzSidecarLoader("S02", tmp_path, {})
    assert loader.keys() == ["p/images/000000.jpg"]
    assert loader.landmarks("p/images/000000.jpg") is None
    with pytest.raises(LoaderError, match="no part folders"):
        NpzSidecarLoader("S02", tmp_path / "p" / "images", {}).keys()


def test_manifest_lists_only_present_files(tmp_path: Path) -> None:
    keys = make_manifest(tmp_path, [7, 3, 9], extra_unlisted=1)
    with (tmp_path / "manifest.jsonl").open("a") as handle:
        handle.write('{"file": "seed_00000099.png", "seed": 99}\n{bad json\n')
    loader = ManifestLoader("S05", tmp_path, {})
    assert loader.keys() == keys
    assert loader.stats.skipped == {"unlisted_file": 1, "image_missing": 1,
                                    "bad_manifest_line": 1}
    assert dict(loader.labels_for(keys[0])) == {"generator": "gen-a", "seed": "3"}


def test_manifest_missing(tmp_path: Path) -> None:
    with pytest.raises(LoaderError, match="manifest"):
        ManifestLoader("S05", tmp_path, {}).keys()


def _record(payload: bytes, flag: int = 0) -> bytes:
    pad = (4 - len(payload) % 4) % 4
    return struct.pack("<II", rio.MAGIC, (flag << 29) | len(payload)) + payload + b"\0" * pad


def test_recordio_three_records_built_byte_by_byte(tmp_path: Path) -> None:
    img_a, img_b, img_c = b"JPEGDATA-A", b"B" * 13, b"PART1" + b"xyz" + rio.MAGIC_BYTES + b"tail"
    first = struct.pack("<IfQQ", 0, 4.0, 1, 0) + img_a
    multi = struct.pack("<IfQQ", 2, 0.0, 2, 0) + struct.pack("<2f", 7.0, 0.5) + img_b
    split = struct.pack("<IfQQ", 0, 9.0, 3, 0) + img_c
    cut = split.index(rio.MAGIC_BYTES)
    assert cut % 4 == 0
    blob = _record(first) + _record(multi)
    offset_c = len(blob)
    blob += _record(split[:cut], 1) + _record(split[cut + 4 :], 3)
    rec = tmp_path / "train.rec"
    rec.write_bytes(blob)
    assert list(rio.scan_offsets(rec)) == [0, len(_record(first)), offset_c]
    count = rio.rebuild_idx(rec, tmp_path / "train.idx")
    assert count == 3
    loader = RecordIOLoader("S09", tmp_path, {})
    keys = loader.keys()
    assert keys == ["000000000", "000000001", "000000002"]
    assert [loader.opener(k)() for k in keys] == [img_a, img_b, img_c]
    assert [loader.labels_for(k)["identity"] for k in keys] == ["4", "7", "9"]
    header = rio.RecordOpener(str(rec), len(_record(first))).header()
    assert header.flag == 2 and header.label == (7.0, 0.5) and header.id == 2
    item = loader.item(keys[2])
    assert item.content_sha256 == hashlib.sha256(img_c).hexdigest()


def test_recordio_writer_round_trip_skips_meta_record(tmp_path: Path) -> None:
    images = make_recordio(tmp_path, [3.0, 3.0, 5.0], meta=True)
    loader = RecordIOLoader("S09", tmp_path, {})
    keys = loader.keys()
    assert keys == ["000000001", "000000002", "000000003"]
    assert [loader.opener(k)() for k in keys] == images
    assert loader.stats.skipped == {"meta_record": 1}


def test_recordio_writer_splits_payloads_holding_the_magic(tmp_path: Path) -> None:
    image = b"ab" + b"cd" + rio.MAGIC_BYTES * 2 + b"end"
    header = rio.IRHeader(0, (1.0,), 0, 0)
    framed = rio.frame(rio.pack(header, image))
    assert framed.count(rio.MAGIC_BYTES) == 3
    rio.write_records(tmp_path / "train.rec", tmp_path / "train.idx", [(header, image)])
    assert RecordIOLoader("S09", tmp_path, {}).opener("0")() == image


def test_recordio_without_idx_scans_in_memory(tmp_path: Path) -> None:
    make_recordio(tmp_path, [1.0, 2.0])
    (tmp_path / "train.idx").unlink()
    loader = RecordIOLoader("S09", tmp_path, {})
    assert len(loader.keys()) == 2
    assert loader.stats.skipped == {"idx_rebuilt_in_memory": 1}
    assert not (tmp_path / "train.idx").exists()


@pytest.mark.parametrize(
    ("blob", "message"),
    [
        (struct.pack("<II", 0x12345678, 4) + b"abcd", "bad magic"),
        (struct.pack("<II", rio.MAGIC, 40) + b"short", "truncated record payload"),
        (b"\x0a\x23", "truncated record header"),
        (_record(b"x" * 8, 2), "without a start"),
        (_record(b"x" * 8, 5), "continuation flag"),
    ],
)
def test_recordio_damage_is_reported(tmp_path: Path, blob: bytes, message: str) -> None:
    rec = tmp_path / "bad.rec"
    rec.write_bytes(blob)
    with pytest.raises(rio.RecordIOError, match=message):
        list(rio.scan_offsets(rec))


def test_recordio_bad_idx_and_payload(tmp_path: Path) -> None:
    (tmp_path / "x.idx").write_text("1 2 3\n")
    with pytest.raises(rio.RecordIOError, match="idx line 1"):
        rio.read_idx(tmp_path / "x.idx")
    with pytest.raises(rio.RecordIOError, match="shorter than IRHeader"):
        rio.unpack(b"tiny")
    with pytest.raises(rio.RecordIOError, match="label list"):
        rio.unpack(struct.pack("<IfQQ", 3, 0.0, 0, 0) + b"\0\0\0\0")
    with pytest.raises(LoaderError, match="missing"):
        RecordIOLoader("S09", tmp_path, {}).keys()


def test_safe_key_and_labels() -> None:
    assert safe_key("a/b.jpg") == "a/b.jpg"
    for bad in ("", "/abs", "a/../b", "a//b", "a\\b", "./a"):
        with pytest.raises(LoaderError):
            safe_key(bad)
    assert clean_label("  East Asian ") == "east_asian"
    assert clean_label(None) == "unknown"
    assert group_of({}) == "unlabelled"


def test_loader_for_every_registry_layout(tmp_path: Path) -> None:
    entries = all_layouts(tmp_path / "sets")
    local = load_local(sources_file(tmp_path / "sources.json", entries))
    counts = {sid: len(list(loader_for(e).iter_items())) for sid, e in local.items()}
    assert counts == {"S01": 4, "S02": 4, "S03": 2, "S04": 3, "S05": 2, "S06": 4, "S07": 3,
                      "S08": 3, "S09": 3}
    s07 = loader_for(local["S07"])
    assert s07.labels_for("000001.jpg")["gender"] == "male"
    assert s07.labels_for("000001.jpg")["partition"] == "1"


def test_loaders_never_write(tmp_path: Path) -> None:
    entries = all_layouts(tmp_path / "sets")
    before = sorted(p.as_posix() for p in (tmp_path / "sets").rglob("*"))
    local = load_local(sources_file(tmp_path / "sources.json", entries))
    for entry in local.values():
        for item in loader_for(entry).iter_items():
            item.open_fn()
    after = sorted(p.as_posix() for p in (tmp_path / "sets").rglob("*"))
    assert before == after
