"""Preregistered R17B pass definitions. Author: John Khan.

These thresholds are criteria only. Loading or validating them does not imply a
real-face PASS. The frozen 100,000-face release gate remains separate.
"""
from __future__ import annotations

from plumb_api.arena.r17b_evidence import MetricRule, PassDefinition
from plumb_api.engines.hair_women.contracts import FEATURES as HAIR_FEATURES
from plumb_api.engines.makeup_w.contracts import FEATURES as MAKEUP_FEATURES
from plumb_api.engines.workflow_w.contracts import FEATURES as WORKFLOW_FEATURES


def _hair(feature: str) -> PassDefinition:
    rules = [
        MetricRule("outside_error", "max", 0.005, "Fraction of changed pixels outside declared hair/scalp coverage."),
        MetricRule("alpha_error", "max", 0.0, "Maximum normalized alpha difference."),
        MetricRule("texture_ratio", "min", 0.78, "Edge-energy retention inside edited hair coverage."),
    ]
    evidence = ["image", "hair_mask", "scalp_mask", "head_landmarks"]
    notes = ["Synthetic parity does not satisfy this real-face criterion."]
    if feature == "W33":
        rules.append(MetricRule("timeline_monotone", "eq", True, "Grey natural-share timeline never reverses."))
        evidence.append("grey_observation")
    if feature == "W40":
        rules.append(MetricRule("curl_structure_retained", "eq", True, "Curl edge structure remains above its feature floor."))
    if feature == "W42":
        rules.append(MetricRule("sensitive_copy", "eq", True, "Calm copy presents keeping the current look as an equal option."))
        evidence.append("sensitivity_mode")
    if feature == "W44":
        rules.append(MetricRule("humidity_user_entered", "eq", True, "Forecast uses user-entered humidity and is labelled estimate."))
        evidence.append("humidity")
    return PassDefinition(
        id=feature,
        group="hair_women",
        title=f"R17B women hair {feature}",
        scope="local visual simulation; outside-mask preservation and texture retention",
        rules=tuple(rules),
        required_evidence=tuple(evidence),
        notes=tuple(notes),
    )


def _makeup(feature: str) -> PassDefinition:
    rules = [
        MetricRule("outside_error", "max", 0.005, "Fraction changed outside declared cosmetic coverage."),
        MetricRule("alpha_error", "max", 0.0, "Maximum normalized alpha difference."),
        MetricRule("chroma_ratio", "min", 0.78, "Deep-skin chroma retention inside the edited coverage."),
        MetricRule("mean_luminance_delta", "max", 0.03, "Covered-region normalized luminance increase ceiling."),
        MetricRule("brand_name_free", "eq", True, "No brand or celebrity name appears in the recipe or rendered report."),
    ]
    evidence = ["image", "skin_mask"]
    notes = ["Shade simulation is not a promise of physical product match."]
    if feature in {"W7", "W8", "W11", "W12", "W13", "W14", "W16"}:
        evidence.append("face_region_masks")
    if feature == "W13":
        evidence.extend(["checked_reference", "checked_reference_masks"])
        rules.append(MetricRule("checked_reference_only", "eq", True, "Reference recreation uses user-checked regions, not an automatic parser."))
    if feature == "W14":
        rules.append(MetricRule("original_look_name", "eq", True, "Look name is one of the original generic R17B names."))
    if feature == "W17":
        rules.append(MetricRule("oxidation_labelled_estimate", "eq", True, "Oxidation timeline is explicitly an estimate from user-entered behaviour."))
    return PassDefinition(
        id=feature,
        group="makeup_w",
        title=f"R17B makeup {feature}",
        scope="local colour/finish simulation; no automatic skin lightening",
        rules=tuple(rules),
        required_evidence=tuple(dict.fromkeys(evidence)),
        notes=tuple(notes),
    )


def _workflow(feature: str) -> PassDefinition:
    common = [
        MetricRule("round_trip", "eq", True, "Canonical local representation round-trips."),
        MetricRule("network_calls", "eq", 0.0, "Workflow produces no network calls."),
    ]
    if feature == "W94":
        common.append(MetricRule("estimate_label", "eq", True, "Price bands are labelled estimates and retain a range."))
    if feature == "W99":
        common.append(MetricRule("calendar_deterministic", "eq", True, "Same start date and interval produce the same maintenance dates."))
    if feature == "W100":
        common.append(MetricRule("integrity_check", "eq", True, "Shade Passport detects altered canonical payloads."))
    return PassDefinition(
        id=feature,
        group="workflow_w",
        title=f"R17B workflow {feature}",
        scope="local planning/export workflow",
        rules=tuple(common),
        required_evidence=("workflow_input",),
        notes=("Price and maintenance outputs are estimates where applicable.",),
    )


DEFINITIONS: dict[str, PassDefinition] = {}
for _feature in HAIR_FEATURES:
    DEFINITIONS[_feature] = _hair(_feature)
for _feature in MAKEUP_FEATURES:
    DEFINITIONS[_feature] = _makeup(_feature)
for _feature in WORKFLOW_FEATURES:
    DEFINITIONS[_feature] = _workflow(_feature)

DEFINITIONS["UPSCALE2"] = PassDefinition(
    id="UPSCALE2",
    group="upscale",
    title="R17B classical 2x upscale",
    scope="classical edge-directed 2x image enlargement",
    rules=(
        MetricRule("psnr_gain_vs_bicubic", "min", 0.0, "PSNR is strictly better than the declared bicubic reference on synthetic downscales."),
        MetricRule("ssim_gain_vs_bicubic", "min", 0.0, "SSIM proxy is strictly better than the declared bicubic reference."),
        MetricRule("ringing", "max", 0.55, "Edge ringing score remains under the preregistered ceiling."),
        MetricRule("alpha_exact", "eq", True, "Alpha follows the same interpolation contract without RGB halo contamination."),
    ),
    required_evidence=("low_resolution", "checked_high_resolution_target"),
)
DEFINITIONS["UPSCALE4"] = PassDefinition(
    id="UPSCALE4",
    group="upscale",
    title="R17B classical 4x upscale",
    scope="classical edge-directed 4x image enlargement",
    rules=DEFINITIONS["UPSCALE2"].rules,
    required_evidence=DEFINITIONS["UPSCALE2"].required_evidence,
)
DEFINITIONS["GENDER"] = PassDefinition(
    id="GENDER",
    group="gender_look",
    title="R17B full-look non-geometric signals",
    scope="brow, texture, and imported stubble signals only; no geometry change",
    rules=(
        MetricRule("identity_pins_exact", "eq", True, "Declared identity pins remain byte-identical."),
        MetricRule("geometry_changed", "eq", False, "No geometric movement is permitted."),
        MetricRule("cheek_delta_e", "max", 4.0, "Protected cheek colour delta-E proxy remains at or below four."),
        MetricRule("alpha_error", "max", 0.0, "Alpha is exact."),
    ),
    required_evidence=("image", "brow_mask", "skin_mask", "stubble_mask", "cheek_mask", "identity_pins"),
)
DEFINITIONS["SHAVE"] = PassDefinition(
    id="SHAVE",
    group="shave",
    title="R17B clean-shave estimate",
    scope="stubble and short-beard visual estimate",
    rules=(
        MetricRule("outside_error", "max", 0.005, "Changes stay inside supplied beard coverage."),
        MetricRule("cheek_delta_e", "max", 4.0, "Result remains consistent with checked cheek colour."),
        MetricRule("alpha_error", "max", 0.0, "Alpha is exact."),
        MetricRule("estimate_label", "eq", True, "Output is labelled visual estimate."),
    ),
    required_evidence=("image", "beard_mask", "cheek_mask", "beard_length_scope"),
)

EXPECTED_IDS = tuple(HAIR_FEATURES) + tuple(MAKEUP_FEATURES) + tuple(WORKFLOW_FEATURES) + ("UPSCALE2", "UPSCALE4", "GENDER", "SHAVE")
ALL = DEFINITIONS
