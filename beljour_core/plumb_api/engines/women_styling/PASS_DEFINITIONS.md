# R20c women's features — preregistered pass definitions

Author: John Khan. These definitions are for **screen-colour simulations**, not physical cosmetic results, medical claims, face-shape recognition, attractiveness rankings, or real-product matches. Implementations process only explicitly supplied region masks and only on-device in the browser. No third-party face photographs, model weights, product names or live YouCam calls are included.

## Quality evidence status

**UNPROVEN.** The tests in this package use algebraic RGB/RGBA arrays. They establish *program invariants*, not photorealism, demographic fairness, accuracy against makeup products or passage of the project's frozen 100,000-face release gate. The Lane A real-face runner, fixtures, lock and reports have **not** been edited. A future consented and frozen run must record results by permitted demographic strata, expose actual counts, handle insufficient group samples honestly, and fail release on any relevant group failing the predeclared minimum. No metrics have been invented here.

## Universal acceptance and stop conditions

1. **Inputs:** RGB or RGBA, 8-bit channels, nonempty caller-provided uint8 masks exactly matching frame shape. Invalid or unauthorized masks refuse to render; no automatic whole-frame or server fallback.
2. **Inside regions:** At strength above zero, the output must visibly change at least one authorized pixel on a representative supplied mask. `strength=0` is byte-identical to the input. Feature variants must not all be indistinguishable.
3. **Outside regions:** Changed RGB pixels outside the union of the feature's authorized masks: **0**. This is measured on the final exported bytes, not only in the working float layer.
4. **Transparency:** Alpha pixels changed: **0**, even inside the effect region. RGBA and RGB both supported; original source and mask arrays unchanged.
5. **RGB bound:** Every channel must stay within the feature's maximum channel delta relative to the original. No geometry, image dimensions or pixel positions change.
6. **Privacy:** Browser code makes **0** network calls, writes **0** tracking events and persists **0** images or masks. No live vendor inference; remote YouCam integration belongs to the existing removable adapter, not these local effects.
7. **Performance:** Tiled rendering must be byte-for-byte identical to untiled output for all declared operations, including 3×3 blur and grain. Python and TypeScript generated-vector differences must be **at most 1** integer channel value. Per-device latency has **not** been measured; the broader project's device budgets remain unproven.
8. **Disclosure:** Every preview and exported evaluation carries **screen-colour simulation** wording. Product wear, physical treatment outcome, exact colour science, personal beauty score and medical diagnosis must never be inferred from pixel effects.
9. **Fairness:** The implementation uses only explicit mask geometry, colour selections, numerical pixels and slider values, not demographic or identity metadata. This design choice is not proof of equitable perceptual quality across real faces.

## Feature-specific contracts

| ID | Screen effect that should change | Authorized supplied regions | RGB bound | Limitations requiring user-facing disclosure |
|---|---|---|---:|---|
| W4 | A user-selected warm, cool or neutral fictional palette tints the cheeks | Left and right cheek | 44 | No automatic undertone diagnosis or retail foundation match |
| W5 | A chosen outfit RGB yields bounded eye/lip harmony examples | Two eyelids, lips | 48 | No automatic clothes inference, brand/product or beauty rating |
| W7 | A light cosmetic placement overlay | Two under-eye masks | 42 | No medical concealment, pathology screening or exact shade |
| W8 | Peach, green or lavender sample colour-correction tint | Under-eyes and cheeks | 46 | No inferred redness, pigmentation diagnosis or skin-condition label |
| W9 | Cream/powder alternatives modify local luminance and blur/grain | Face | 28 | Does not predict material texture or durability |
| W10 | Dewy/matte/tint examples adjust finish locally | Face | 30 | Not a physical product performance prediction |
| W11 | Lifted, rounded and soft blush placements have different spatial fields | Cheeks | 50 | No face-shape classification or attractiveness optimization |
| W12 | User-controlled bronzer/contour tonal shadows | Cheeks and jaw | 45 | No geometric change or prediction of actual facial shape |
| W13 | Selected reference RGB is remapped into owned makeup masks | Eyelids, cheeks, lips | 52 | Cannot reproduce a third-party face or branded product; no photo upload |
| W15 | Three original event-palette combinations | Eyelids, cheeks, lips | 52 | No judgement of beauty or wear for an actual wedding |
| W16 | Subtle colour and local diffusion at chosen strength | Face, cheeks, lips | 24 | No facial alteration or claim of invisible makeup |
| W17 | Time slider produces a fictional colour shift, identity at zero | Face | 30 | Not a chemical oxidation prediction or actual wear-time estimate |
| W18 | Two manually selected fictional shades blend for display | Face, neck | 44 | No automatic season classification or measured true shade |

Each row has a matching typed `FeatureSpec` in `specs.py`/`specs.ts`, plan in `operations.py`/`operations.ts`, Python/TS render tests, cross-runtime parity vector, and a `PassDefinition` returned by `definitions.py`/`definitions.ts`. The numerical evaluator recomputes the metrics from original and output pixels and rejects falsified evidence. The table is deliberately explanatory; programmatic limits are authoritative in those typed definitions.

## Integration handoff (important)

The checked-in `api/plumb_api/arena/features.json` is a **generated** registry. Its own description names `api/plumb_api/arena/women-100-features.json` as its canonical source, which is **not included** in the available `f1e4f37` file subset. The `registry.py` module provides a one-to-one, safe integration overlay for W4, W5, W7–W13 and W15–W18. It refuses rights-blocked W3/W14 and emits only `implemented-synthetic-tests-only` capability labels. **No generated registry row or shared owner file was mutated.** The registry owner must merge the thirteen registrations into the canonical source and regenerate the published registry before showing them as built in app navigation. This gate remains outstanding and is not disguised as completed work.

To run the standalone engines on an authorized RGB/RGBA image:

```python
from plumb_api.engines.women_styling import PreviewRequest, apply_preview_tiled
# image: H×W×3 or H×W×4 uint8; approved_masks: name → H×W uint8
result = apply_preview_tiled(image, approved_masks, PreviewRequest('W11', 'lifted', strength=50))
assert result.evidence.outside_mask_changed == 0
```

The browser analogue imports `applyPreviewTiled` from `web/src/engines/women_styling/index.ts`. The caller owns the image, masks, consent and UI; no hidden segmentation or network fallback occurs. Materializing effects in the public app requires the external verified region-mask provider and release-quality gates already owned by other lanes.
