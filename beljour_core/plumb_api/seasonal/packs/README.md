# Seasonal packs

Author: John Khan.

Fun seasonal looks for the photo editor: frames, colour grades, face-tracked
accessories, face paint, light effects and greetings. All art is drawn in code.
The package never detects faces; the caller passes the chosen face.

## Module map

| Module | Role |
| --- | --- |
| `occasions.py` | The 14 frozen occasion ids, names, default greetings, dating rule. |
| `forbidden.py` | Forbidden motif tokens and the check every pack and card must pass. |
| `model.py` | `SeasonalPack`, `Look`, `LookKind`, `Palette`, strength levels and curves. |
| `target.py` | `FaceTarget` (box, roll, landmarks), face-local frame, effect region, eye and mouth regions, masks. |
| `raster.py` | Anti-aliased `Layer` and compositing (over, multiply, screen); `keep_only`. |
| `shapes.py` | Vector primitives shared by SVG output and raster stamping. |
| `motifs.py` | Motif library, `register_motif`, `MotifProvider` contract, `PackMotifProvider`. |
| `frames.py`, `grades.py`, `accessories.py`, `facepaint.py`, `particles.py`, `greeting.py` | One renderer family each. |
| `render.py` | Renderer registry and the locality guard applied after every face-anchored look. |
| `registry.py` | `PackRegistry`, `register_pack`, `get_pack`, `list_packs`. |
| `apply.py`, `stack.py`, `animate.py` | `apply_look`, `apply_looks`, `animate_look`. |
| `halloween.py` ... `easter.py`, `builtin.py` | The five shipped packs and their registration. |
| `hebrew.py`, `lunar_table.py`, `calendar.py`, `calendar_ics.py` | Dates, suggestions, year view, iCalendar export. |
| `catalogue.py` | JSON document for the web picker. |
| `audit.py` | Respect-rule audit across packs and motifs. |
| `synthetic.py`, `preview.py` | Drawn test portraits, contact sheets and the motif gallery. |

## Coordinates

Face-local units: `u` to the right on screen, `v` down, both in face-box units, so
the box spans -0.5..0.5 on each axis. Roll is in degrees, positive turns the face
clockwise on screen. Accessories and particles are written in these units, so they
follow any box and roll.

## Rules the code enforces

1. Whole-image looks (frame, grade, greeting) ignore the target.
2. Face looks (accessory, paint, light) may change only the effect region of the
   chosen face; eyes and mouth are always restored byte for byte. `render()` does
   this after every renderer, including renderers added by other packages.
3. No geometry change: overlays and colour only. Grades never raise luminance;
   paint uses multiply.
4. No forbidden motif ids anywhere (`forbidden.py`); `audit()` must return nothing.
5. Every random choice is seeded; the same inputs give the same pixels.

## Adding an occasion from another package

```python
import random

from plumb_api.seasonal.packs import (
    Look,
    LookKind,
    Palette,
    SeasonalPack,
    register_motif,
    register_pack,
)
from plumb_api.seasonal.packs.shapes import Shape, oval


def diya(rng: random.Random) -> tuple[Shape, ...]:
    flame = rng.choice(("#ffb703", "#fb8500"))
    return (oval("#a0522d", (0.5, 0.72), (0.4, 0.16)), oval(flame, (0.5, 0.42), (0.08, 0.18)))


register_motif("diwali", "diya", diya)
register_pack(
    SeasonalPack(
        occasion="diwali",
        title="Diwali",
        palette=Palette("#ff9933", "#c2185b", "#ffd54f", "#3b1f0e", "#fff8e7"),
        motifs=("diya",),
        looks=(
            Look(
                "diya_frame",
                LookKind.FRAME,
                "Diya frame",
                "frame.border",
                {"motifs": ("diya",)},
                motifs=("diya",),
            ),
        ),
        greeting="Happy Diwali",
    )
)
```

Then list your files in your own `lane_registry/k_*.py` and run `audit()` in a test.
