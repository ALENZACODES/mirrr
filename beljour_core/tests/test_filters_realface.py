"""The A9 real-face filter bench (tests/realface/filters_bench.py), run here on drawn faces only.

The bench itself runs on the box with `make realface-filters`; no real face is attached or used
in this suite. These tests check its machinery: rows per face and filter, the no-face path, the
open-error path and the report, with drawn faces written to a temporary folder and a stand-in
detector that returns their recorded mesh."""
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.recipe import registry

REPO = Path(__file__).resolve().parents[2]


def bench():  # type: ignore[no-untyped-def]
    sys.path.insert(0, str(REPO / "tests/realface"))
    spec = importlib.util.spec_from_file_location("filters_bench", REPO / "tests/realface/filters_bench.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RealFaceBenchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.B = bench()
        cls.recipes = [registry.default().get(x) for x in ("C08", "C01", "M04")]

    def test_rows_per_face_and_filter(self) -> None:
        p = F.portrait("dark")
        rows = self.B.bench_face(p.image, p.face.points, self.recipes, source="drawn", file="a.png", group="dark")
        self.assertEqual([r["check"] for r in rows], ["detect", "C08", "C01", "M04"])
        self.assertTrue(all(r["pass"] for r in rows), [r.get("problems") for r in rows])
        self.assertTrue(all(0 <= r["marks_kept"] <= 1 for r in rows[1:]))

    def test_no_face_found_is_counted_for_detection_and_every_filter(self) -> None:
        p = F.portrait("medium")
        rows = self.B.bench_face(p.image, None, self.recipes, source="drawn", file="b.png", group="medium")
        self.assertEqual([row["check"] for row in rows], ["detect", "C08", "C01", "M04"])
        self.assertTrue(all(row["pass"] is False for row in rows))

    def test_run_and_report_with_a_stand_in_detector(self) -> None:
        from PIL import Image

        lib = sys.modules["realface_lib"]
        with tempfile.TemporaryDirectory() as tmp:
            faces, meshes = [], {}
            for i, tone in enumerate(("very_light", "medium", "very_dark")):
                p = F.portrait(tone, seed=i + 1)
                path = Path(tmp) / f"{tone}.png"
                Image.fromarray(p.image).save(path)
                meshes[p.image.tobytes()] = p.face.points
                faces.append(lib.Face(path, "drawn", "own work", "", race="", gender="", age=""))
            (Path(tmp) / "broken.png").write_bytes(b"not an image")
            faces.append(lib.Face(Path(tmp) / "broken.png", "drawn", "own work", ""))
            h, w = 240, 200

            def detect(img: np.ndarray) -> list[np.ndarray]:
                pts = meshes.get(img.tobytes())
                return [] if pts is None else [np.c_[pts[:, 0] / w, pts[:, 1] / h, np.zeros(len(pts))]]

            rows = self.B.run(faces, detect, self.recipes)
        text = self.B.markdown(rows, self.recipes, notes=["drawn test run"])
        self.assertIn("landmarks found on 3 (75.0%)", text)
        self.assertIn("unreadable 1", text)
        self.assertIn("| C08 | Èze | 4 | 75.0% |", text)
        self.assertNotIn(".png", text, "no file names in the report")


if __name__ == "__main__":
    unittest.main()
