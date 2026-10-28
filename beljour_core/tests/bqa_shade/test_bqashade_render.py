"""VTO-02 render probe and CON-03@27 corrector probe tests.

Pass definition: a flat shade patch goes through the makeup engine's public
render() and comes back as a finite Lab with a CIEDE2000 to the swatch; the
outcome groups by product type and colour source; the corrector probe counts
answers without a validated tone range; a report naming a two-step range is
accepted. Drawn patches only. Author: John Khan.
"""
from __future__ import annotations

import math

from lab.bqa_shade import engine, render_check, stats


def test_render_case_reads_back_a_lab() -> None:
    case = render_check.RenderCase("SHD-FND-001", "foundation", (60.0, 14.0, 20.0), "measured")
    result = render_check.render_case(case)
    assert not isinstance(result, engine.Unavailable)
    assert all(math.isfinite(v) for v in result.rendered_lab)
    assert result.delta_e >= 0


def test_vto_outcome_groups() -> None:
    cases = [render_check.RenderCase(f"SHD-FND-{i:03d}", "foundation", (40.0 + 5 * i, 12.0, 18.0),
                                     "catalogue") for i in range(4)]
    found = render_check.vto_outcome(cases, 3.0)
    assert not isinstance(found, engine.Unavailable)
    assert found.n == 4
    assert {g.axis for g in found.groups} == {"product_type", "colour_source"}
    assert "render_de00_median_foundation" in found.measured


def test_corrector_probe_and_range_rule() -> None:
    probe = render_check.corrector_probe()
    assert not isinstance(probe, engine.Unavailable)
    assert probe.n == 10 * len(render_check.CORRECTOR_ISSUES)
    if probe.measured["without_range"]:
        assert probe.status == stats.FAIL
        assert "product_report_lacks_tone_range" in probe.reason_codes
    assert render_check.report_has_range({"validated_mst_steps": [6, 10]})
    assert not render_check.report_has_range({"correction_issue": "redness"})
