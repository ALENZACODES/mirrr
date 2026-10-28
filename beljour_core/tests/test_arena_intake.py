"""Capture intake (arena/intake.py) on drawn faces: a complete, attested capture is READY, and
every format, pairing, consent, licence and synthetic rule refuses what it should. The
"captures" are tinted copies of drawn faces, made up here. Author: John Khan.
"""
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
from plumb_api.arena import freeze, intake  # noqa: E402
from plumb_api.arena import slots as S  # noqa: E402


def sidecar(**changes):
    data = {"format": intake.CAPTURE_FORMAT, "producer": intake.PRODUCER, "app_version": "made-up 1.0",
            "tier": "Pro", "settings": "default", "device": "test device", "captured_by": "operator",
            "captured_on": "2026-10-28", "terms_reviewed": True, "terms_note": "made-up note",
            "adults_only": True, "synthetic": False,
            "third_party_upload": {"fairface": True, "sfhq": True, "adversarial": True}}
    data.update(changes)
    return data


class IntakeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix="arena-intake-"))
        cls.root = F.build(cls.tmp / "faces", per_cell=1, sfhq=4, landmarks=False)
        freeze.freeze(cls.root)
        cls.slots = S.Slots(cls.root)
        cls.sealed = [fid for fid, row in cls.slots.rows.items() if row["baseline"] == "1"]

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def setUp(self):
        self.capture = Path(tempfile.mkdtemp(prefix="capture-", dir=self.tmp))
        for n, fid in enumerate(self.sealed):
            for k, filt in enumerate(C.FILTERS):
                if filt == "gender_swap" and self.slots.rows[fid].get("gender", "").lower() not in ("male", "female"):
                    continue
                image = S.load_image(self.slots.path(S.ORIGINAL, filt, fid)).astype(int)
                S.save_png(self.capture / f"{fid}_{filt}.png", np.clip(image + 3 + k + n % 7, 0, 255).astype(np.uint8))
        self.write(sidecar())

    def write(self, data):
        (self.capture / intake.SIDECAR).write_text(json.dumps(data))

    def check(self):
        return intake.check_capture(self.root, self.capture)

    def test_complete_attested_capture_is_ready(self):
        report = self.check()
        self.assertEqual(report.status, intake.READY, report.text())
        self.assertEqual(report.missing, [])
        self.assertGreater(len(report.accepted), 2 * len(self.sealed))
        self.assertIn("READY", report.text())

    def test_missing_result_is_incomplete(self):
        (self.capture / f"{self.sealed[0]}_old.png").unlink()
        report = self.check()
        self.assertEqual(report.status, intake.INCOMPLETE)
        self.assertEqual(report.missing, [(self.sealed[0], "old")])

    def refused(self, needle):
        report = self.check()
        self.assertEqual(report.status, intake.REFUSED, report.text())
        self.assertTrue(any(needle in p for p in report.problems), report.problems)

    def test_sidecar_rules(self):
        for changes, needle in (({"producer": "some app"}, "producer"), ({"settings": "custom"}, "default"),
                                ({"terms_reviewed": False}, "terms_reviewed"), ({"adults_only": None}, "adults_only"),
                                ({"third_party_upload": {"fairface": True}}, "third_party_upload.sfhq"),
                                ({"captured_on": "yesterday"}, "captured_on"), ({"app_version": ""}, "app_version"),
                                ({"format": "other"}, "format")):
            with self.subTest(changes=changes):
                self.write(sidecar(**changes))
                self.refused(needle)
        (self.capture / intake.SIDECAR).unlink()
        self.refused("no capture.json")

    def test_synthetic_capture_never_enters_a_real_folder(self):
        self.write(sidecar(synthetic=True))
        self.refused("only enters a dry-run folder")

    def test_pairing_rules(self):
        fid = self.sealed[0]
        original = S.load_image(self.slots.path(S.ORIGINAL, "old", fid))
        (self.capture / "old").mkdir()
        S.save_png(self.capture / "old" / f"{fid}.png", np.clip(original.astype(int) + 9, 0, 255).astype(np.uint8))
        self.refused("second image")

    def test_format_rules(self):
        fid, other = self.sealed[0], self.sealed[1]
        original = S.load_image(self.slots.path(S.ORIGINAL, "old", fid))
        cases = [(lambda: S.save_png(self.capture / f"{fid}_old.png", original), "identical to the original"),
                 (lambda: shutil.copy(self.capture / f"{fid}_young.png", self.capture / f"{other}_young.png"),
                  "the same file as"),
                 (lambda: S.save_png(self.capture / f"{fid}_old.png", original[:20, :20]), "pixels on the short side"),
                 (lambda: (self.capture / "LG9999_old.png").write_bytes(b"x"), "not in the frozen set"),
                 (lambda: (self.capture / "notes.txt").write_text("x"), "not an image named"),
                 (lambda: (self.capture / f"{fid}_old.png").write_bytes(b"not a png"), "unreadable")]
        for make, needle in cases:
            with self.subTest(needle=needle):
                self.setUp()
                make()
                self.refused(needle)

    def test_metadata_and_aspect_are_reported(self):
        from PIL import Image
        fid = self.sealed[0]
        (self.capture / f"{fid}_old.png").unlink()
        image = S.load_image(self.slots.path(S.ORIGINAL, "old", fid))
        exif = Image.Exif()
        exif[0x0131] = "made-up editor"
        Image.fromarray(np.pad(image, ((0, 0), (12, 12), (0, 0)), mode="edge")).save(self.capture / f"{fid}_old.jpg", exif=exif)
        report = self.check()
        self.assertEqual(report.status, intake.READY, report.text())
        self.assertTrue(any("exif" in w for w in report.warnings))
        self.assertTrue(any("centre-crop" in w for w in report.warnings))

    def test_mapping_file_is_read_instead_of_names(self):
        (self.capture / intake.MAPPING).write_text("face_id,filter,file\nLG0001,older,nowhere.png\n,old,x.png\n")
        report = self.check()
        self.assertTrue(any("line 3" in p for p in report.problems))
        self.assertTrue(any("file is missing" in p for p in report.problems))

    def test_face_rights(self):
        row = {"face_id": "LG0001", "licence": "", "source": "UTKFace", "rel_path": "x.png", "age_bin": "10-19"}
        reasons = " ".join(intake.face_rights(row))
        for needle in ("no licence", "banned source", "under 20"):
            self.assertIn(needle, reasons)
        self.assertEqual(intake.face_rights({"face_id": "LG0002", "licence": "CC0", "source": "SFHQ", "rel_path": "a.png"}), [])


if __name__ == "__main__":
    unittest.main()
