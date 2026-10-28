"""Public naming and internal-boundary guards. Author: John Khan."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web"
FULL = "BELJOUR — FULL BEAUTY STUDIO"
LINE = "Your best day. Still you."


class PublicBrandTests(unittest.TestCase):
    def test_pages_carry_exact_lockup(self) -> None:
        for page in ("home.html", "trust.html", "studio.html", "index.html"):
            with self.subTest(page=page):
                source = (WEB / page).read_text(encoding="utf-8")
                self.assertIn(FULL, source)
                self.assertIn(LINE, source)
                self.assertNotIn("LOOK." + "GOOD", source)
                self.assertNotIn(">LG<", source)

    def test_icon_and_install_manifest(self) -> None:
        manifest = json.loads((WEB / "public/manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], FULL)
        self.assertEqual(manifest["short_name"], FULL)
        self.assertEqual(manifest["icons"][0]["src"], "/icons/beljour.svg")
        icon = (WEB / "public/icons/beljour.svg").read_text(encoding="utf-8")
        self.assertIn(FULL, icon)
        self.assertIn(LINE, icon)
        self.assertNotIn(">LG<", icon)

    def test_data_schema_identifiers_are_unchanged(self) -> None:
        source = (WEB / "src/layout/editorial/proof-graphic.ts").read_text(encoding="utf-8")
        self.assertIn('"beljour-proof-graphic/1"', source)
        source = (WEB / "src/layout/my-looks.ts").read_text(encoding="utf-8")
        self.assertIn('"beljour-my-look/1"', source)

    def test_internal_registry_exists_without_shared_view_mutation(self) -> None:
        source = (ROOT / "api/plumb_api/arena/lane_registry/d.py").read_text(encoding="utf-8")
        self.assertIn('"web/test/beljour-brand-r35d.test.mjs"', source)
        self.assertIn('"api/tests/test_lane_d_brand_r35d.py"', source)


if __name__ == "__main__":
    unittest.main()
