"""The Still you parity vectors still describe what the Python arena computes."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import make_parity_qa  # noqa: E402


class StillYouParityTest(unittest.TestCase):
    def test_vectors_are_current(self) -> None:
        self.assertEqual(make_parity_qa.main(["--check"]), 0, "run python api/scripts/make_parity_qa.py")

    def test_vectors_cover_kept_smoothed_and_lightened(self) -> None:
        data = make_parity_qa.build()
        for case in data["cases"]:
            by = {a["name"]: a for a in case["afters"]}
            self.assertEqual(by["untouched"]["kept"], by["untouched"]["found"])
            self.assertLess(by["smoothed"]["kept"], by["smoothed"]["found"] * 0.7)
            self.assertTrue(by["lightened"]["lightened"])
            self.assertFalse(by["untouched"]["lightened"])


if __name__ == "__main__":
    unittest.main()
