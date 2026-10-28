"""Slots, the reference app baseline importer, blind pairs, bundles and unblinding."""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import arena_fixtures as F  # noqa: E402

from plumb_api.arena import constants as C  # noqa: E402
from plumb_api.arena import freeze, judging, pairs  # noqa: E402
from plumb_api.arena import slots as S  # noqa: E402


def _tint(image: np.ndarray, amount: int) -> np.ndarray:
    return np.clip(image.astype(int) + amount, 0, 255).astype(np.uint8)


class SlotAndPairTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="arena-pairs-"))
        self.root = F.build(self.tmp / "faces", per_cell=1, landmarks=False)
        freeze.freeze(self.root)
        self.slots = S.Slots(self.root)
        self.faces = ["LG0001", "LG0002", "LG0003", "LG0004"]

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _fill(self, slot: str, version: str, amount: int) -> None:
        self.slots.create(slot, "ours", version)
        for fid in self.faces:
            orig = S.load_image(self.slots.path(S.ORIGINAL, "old", fid))
            for filt in C.FILTERS:
                self.slots.put(slot, filt, fid, _tint(orig, amount))

    def test_slot_rules(self) -> None:
        with self.assertRaises(S.SlotError):
            self.slots.create("reference_app", "external", "x")  # the external slot is only ever "baseline"
        with self.assertRaises(S.SlotError):
            self.slots.create("Bad Name", "ours", "x")
        with self.assertRaises(S.SlotError):
            self.slots.put(S.ORIGINAL, "old", "LG0001", np.zeros((4, 4, 3), np.uint8))
        self._fill("ours-v2", "v2", 9)
        self.assertEqual(self.slots.coverage("ours-v2"), {"old": 4, "young": 4, "gender_swap": 4})
        with self.assertRaises(S.SlotError):
            self.slots.create("ours-v2", "ours", "v3")

    def test_parse_baseline_names(self) -> None:
        self.assertEqual(S.parse_name(Path("LG0007_old.jpg")), ("LG0007", "old"))
        self.assertEqual(S.parse_name(Path("young/lg0012.png")), ("LG0012", "young"))
        self.assertEqual(S.parse_name(Path("dump/LG0003 gender-swap.jpg")), ("LG0003", "gender_swap"))
        self.assertIsNone(S.parse_name(Path("IMG_2041.jpg")))
        self.assertIsNone(S.parse_name(Path("LG0004_old_young.jpg")), "two filters in one name is ambiguous")

    def test_import_strips_metadata_and_refuses_the_untouched_photo(self) -> None:
        from PIL import Image
        dump = self.tmp / "dump"
        dump.mkdir()
        orig = S.load_image(self.slots.path(S.ORIGINAL, "old", "LG0001"))
        exif = Image.Exif()
        exif[0x0131] = "Reference App Pro"  # Software tag
        Image.fromarray(_tint(orig, 20)).save(dump / "LG0001_old.jpg", exif=exif.tobytes(), quality=95)
        Image.fromarray(orig).save(dump / "LG0001_young.png")  # identical to the original: refused
        Image.fromarray(_tint(orig, -10)).save(dump / "LG0150_gender.png")  # not a baseline face: kept, flagged
        rep = S.import_baseline(self.root, dump)
        self.assertIn(("LG0001", "old"), rep.imported)
        self.assertTrue(any("identical to the original" in s for s in rep.skipped))
        stored = self.slots.path(S.BASELINE, "old", "LG0001")
        raw = stored.read_bytes()
        self.assertNotIn(b"Reference App", raw)
        with Image.open(stored) as img:
            self.assertEqual(dict(img.getexif()), {})
            self.assertEqual(img.format, "PNG")
        baseline_faces = sum(1 for r in self.slots.rows.values() if r["baseline"] == "1")
        self.assertEqual(len(rep.missing), baseline_faces * 3 - 1)
        self.assertTrue(any("LG0150" in s for s in rep.skipped), "a face outside the frozen set is skipped")
        self.assertEqual(self.slots.info(S.BASELINE).kind, "external")

    def test_conform_removes_crop_and_size_tells(self) -> None:
        a = np.zeros((120, 100, 3), np.uint8)
        b = np.zeros((100, 100, 3), np.uint8)
        out, tells = S.conform([a, b], long_side=64)
        self.assertEqual(out[0].shape, out[1].shape)
        self.assertTrue(any("aspect" in t for t in tells))

    def test_pairs_are_blind_balanced_and_spread_over_judges(self) -> None:
        self._fill("ours-v2", "v2", 9)
        self._fill("ours-v1", "v1", -9)
        run = pairs.plan_run(self.slots, "qa1", self.faces, matchups=[("ours-v2", "ours-v1"), ("ours-v2", S.ORIGINAL)],
                             judgements_per_pair=3, judges=4, secret="00" * 16)
        self.assertEqual(len(run.assignments), 4 * 3 * 2 * 3)
        by_pair: dict[str, list] = {}
        for item in run.assignments:
            by_pair.setdefault(item.pair_id, []).append(item)
        for items in by_pair.values():
            self.assertEqual(len({i.judge_slot for i in items}), 3, "each judgement of a pair goes to a different judge")
            self.assertEqual(len({(i.face_id, i.filter) for i in items}), 1, "same face and filter on both sides")
        balance = pairs.side_balance(run)
        self.assertTrue(all(0.3 <= v <= 0.7 for v in balance.values()), balance)
        again = pairs.plan_run(self.slots, "qa1", self.faces, matchups=[("ours-v2", "ours-v1"), ("ours-v2", S.ORIGINAL)],
                               judgements_per_pair=3, judges=4, secret="00" * 16)
        self.assertEqual([a.id for a in again.assignments], [a.id for a in run.assignments], "seeded by the run secret")
        with self.assertRaises(pairs.PairError):
            pairs.plan_run(self.slots, "qa2", self.faces, matchups=[("ours-v2", "ours-v1")], judgements_per_pair=3, judges=2)

    def test_missing_baseline_is_listed_not_faked(self) -> None:
        self._fill("ours-v2", "v2", 9)
        self.slots.create(S.BASELINE, "external", "default-settings")
        run = pairs.plan_run(self.slots, "qa1", self.faces[:2], matchups=[("ours-v2", S.BASELINE)],
                             judgements_per_pair=1, judges=1)
        self.assertEqual(run.assignments, [])
        self.assertEqual(len(run.missing), 2 * 3)

    def test_bundles_hide_producers_and_unblind_correctly(self) -> None:
        self._fill("ours-v2", "v2", 9)
        run = pairs.plan_run(self.slots, "qa1", self.faces, filters=("old",), matchups=[("ours-v2", S.ORIGINAL)],
                             judgements_per_pair=2, judges=2, secret="11" * 16)
        folder = pairs.write_run(self.slots, run, long_side=64)
        for bundle in sorted((folder / "bundles").iterdir()):
            self.assertEqual(pairs.bundle_leaks(bundle, ["ours-v2", "baseline", "original"]), [])
            manifest = json.loads((bundle / "manifest.json").read_text())
            self.assertEqual(manifest["reasons"], list(C.REASONS))
        with self.assertRaises(pairs.PairError):
            pairs.write_run(self.slots, run)
        key = pairs.read_key(folder)
        records = []
        for aid, row in key.items():
            ours_side = "A" if row["a"] == "ours-v2" else "B"
            records.append(judging.validate({"assignment": aid, "judge": f"j{row['judge_slot']}", "kind": "human",
                                             "winner": ours_side, "reason": "Too Weak"}))
        outcomes, problems = judging.unblind(records, key)
        self.assertEqual(problems, [])
        self.assertTrue(all(o.winner == "ours-v2" and o.loser == S.ORIGINAL for o in outcomes))


if __name__ == "__main__":
    unittest.main()
