"""Frozen test set: selection, ordering, hashing, verification and append-only versions."""
from __future__ import annotations

import csv
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import arena_fixtures as F  # noqa: E402

from plumb_api.arena import constants as C  # noqa: E402
from plumb_api.arena import freeze  # noqa: E402


class FreezeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tmp = Path(tempfile.mkdtemp(prefix="arena-freeze-"))
        cls.root = F.build(cls.tmp / "faces", per_cell=2, landmarks=False)
        cls.lock = freeze.freeze(cls.root, now="2026-10-23T05:00:00+00:00")
        cls.rows = freeze.read_manifest(cls.root)

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_equal_fairface_cells_and_minors_left_out(self) -> None:
        ff = [r for r in self.rows if r["set"] == "fairface"]
        self.assertEqual(len(ff), 140)
        cells = {(r["race"], r["gender"], r["age_band"]) for r in ff}
        self.assertEqual(len(cells), 70)
        self.assertTrue(all(r["age_bin"] not in C.MINOR_AGE_BINS for r in ff))
        self.assertEqual(self.lock["excluded"].get("labelled under 20 (adults only)"), 2)
        self.assertEqual(self.lock["counts"], {"fairface": 140, "sfhq": 6, "adversarial": 4})

    def test_shortfall_is_reported_not_padded(self) -> None:
        # 2 faces per cell exist, the full set wants 10: every cell is short by 8, never filled from another cell
        self.assertEqual(self.lock["shortfall"]["fairface:Black|Female|30-39"], 8)
        self.assertEqual(self.lock["shortfall"]["sfhq"], C.SFHQ_COUNT - 6)
        self.assertEqual(self.lock["shortfall"]["adversarial"], C.ADVERSARIAL_COUNT - 4)

    def test_baseline_block_covers_every_cell_first(self) -> None:
        first = self.rows[:C.BASELINE_COUNT]
        self.assertEqual([r["face_id"] for r in self.rows[:3]], ["LG0001", "LG0002", "LG0003"])
        self.assertTrue(all(r["baseline"] == "1" for r in first))
        self.assertTrue(all(r["baseline"] == "0" for r in self.rows[C.BASELINE_COUNT:]))
        cells = {(r["race"], r["gender"], r["age_band"]) for r in first if r["set"] == "fairface"}
        self.assertEqual(len(cells), 70, "one FairFace face per cell in the first 100")
        sets = {r["set"] for r in first}
        self.assertEqual(sets, {"fairface", "sfhq", "adversarial"})
        adv = [r["tags"] for r in first if r["set"] == "adversarial"]
        self.assertEqual(len(adv), len(set(adv)), "adversarial faces in the block have different tags")

    def test_manifest_rows_carry_licence_slice_hash_and_flags(self) -> None:
        for row in self.rows:
            self.assertEqual(len(row["sha256"]), 64)
            self.assertTrue(row["licence"])
            self.assertTrue(row["flags"])
        sf = next(r for r in self.rows if r["set"] == "sfhq")
        self.assertIn("provenance review", sf["flags"])
        ff = next(r for r in self.rows if r["set"] == "fairface")
        self.assertIn("Karkkainen", ff["attribution"])
        adv = {r["tags"] for r in self.rows if r["set"] == "adversarial"}
        self.assertIn("side_profile", adv, "tags are normalised ('side profile' -> side_profile)")

    def test_lock_verifies_and_detects_changes(self) -> None:
        self.assertEqual(freeze.verify(self.root), [])
        victim = self.root / C.FROZEN_DIR / self.rows[5]["rel_path"]
        original = victim.read_bytes()
        try:
            victim.write_bytes(original + b"x")
            problems = freeze.verify(self.root)
            self.assertTrue(any("LG0006: file changed" in p for p in problems))
        finally:
            victim.write_bytes(original)
        self.assertEqual(freeze.verify(self.root), [])

    def test_frozen_set_refuses_a_silent_refreeze(self) -> None:
        with self.assertRaises(freeze.FreezeError):
            freeze.freeze(self.root)

    def test_same_seed_same_order(self) -> None:
        found = freeze.scan(self.root, decode=False)
        a = freeze.order_faces(freeze.select(found.candidates).faces)
        b = freeze.order_faces(freeze.select(found.candidates).faces)
        self.assertEqual([c.sha256 for c in a], [c.sha256 for c in b])


class FreezeEdgeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="arena-freeze-edge-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_banned_source_stops_the_freeze(self) -> None:
        root = F.build(self.tmp / "faces", per_cell=1, landmarks=False)
        bad = root / C.FROZEN_DIR / "sfhq" / "manifest.csv"
        text = bad.read_text().replace("SFHQ part 1", "CelebA-HQ re-upload", 1)
        bad.write_text(text)
        with self.assertRaises(freeze.FreezeError) as ctx:
            freeze.freeze(root)
        self.assertIn("celeba", str(ctx.exception))

    def test_duplicates_and_unlabelled_files_are_left_out(self) -> None:
        root = F.build(self.tmp / "faces", per_cell=1, landmarks=False)
        ff = root / C.FROZEN_DIR / "fairface-ccby4"
        shutil.copy(ff / "ff_0001.png", ff / "copy_of_1.png")
        with (ff / "manifest.csv").open("a", newline="") as fh:
            csv.writer(fh).writerow([])  # blank line is ignored
        shutil.copy(ff / "ff_0002.png", ff / "no_row.png")
        found = freeze.scan(root, decode=False)
        reasons = " ".join(found.excluded)
        self.assertIn("no manifest.csv row", reasons)
        self.assertTrue(any(k.startswith("duplicate of") for k in found.excluded) or "copy_of_1.png" in
                        " ".join(p for v in found.excluded.values() for p in v))

    def test_new_version_appends_and_keeps_ids(self) -> None:
        root = F.build(self.tmp / "faces", per_cell=1, adversarial_tags=("glasses",), landmarks=False)
        first = freeze.freeze(root)
        before = freeze.read_manifest(root)
        adv = root / C.FROZEN_DIR / "adversarial" / "stocksnap"
        F._save(adv / "adv_new.png", 999, "very_dark")
        with (adv / "manifest.csv").open("a", newline="", encoding="utf-8") as fh:
            fh.write("adv_new.png,,CC0,very dark skin low light,StockSnap\n")
        second = freeze.freeze(root, new_version=True)
        after = freeze.read_manifest(root)
        self.assertEqual(second["version"], first["version"] + 1)
        self.assertEqual(after[:len(before)], before, "old faces keep their ids, order and rows")
        self.assertEqual(len(after), len(before) + 1)
        self.assertEqual(after[-1]["tags"], "very_dark_skin_low_light")
        self.assertEqual(after[-1]["baseline"], "0")
        self.assertEqual(freeze.verify(root), [])

    def test_pool_fills_short_cells_only(self) -> None:
        root = F.build(self.tmp / "faces", per_cell=1, landmarks=False)
        pool_dir = self.tmp / "pool"
        pool_dir.mkdir()
        lines = ["file,age,gender,race,service_test"]
        for i, (race, band) in enumerate((("Black", "30-39"), ("Indian", "60-69"), ("White", "10-19"))):
            F._save(pool_dir / f"p{i}.png", 500 + i, "dark")
            lines.append(f"p{i}.png,{band},Female,{race},True")
        (pool_dir / "labels.csv").write_text("\n".join(lines) + "\n")
        pool = freeze.pool_candidates(pool_dir / "labels.csv", pool_dir)
        self.assertEqual(len(pool), 2, "the 10-19 face is never a candidate")
        copied = freeze.fill_from_pool(root, pool)
        self.assertEqual(copied, {"Black|Female|30-39": 1, "Indian|Female|60+": 1})
        found = freeze.scan(root, decode=False)
        self.assertEqual(sum(1 for c in found.candidates if c.cell == ("Black", "Female", "30-39")), 2)


if __name__ == "__main__":
    unittest.main()
