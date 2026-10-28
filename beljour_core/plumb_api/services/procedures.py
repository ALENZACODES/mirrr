"""Face procedure previews: catalogue, plan building and realism guardrails.

Each procedure maps one 0..100 slider to YouCam face-reshape parameters (1 unit per
preview, whatever the number of procedures) or to a free local warp. Sliders snap to steps
of 10 so repeat previews hit the cache. Mappings marked "approximate" are our reading of
what the procedure changes, not a clinical model.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

STEP = 10


@dataclass(frozen=True)
class Procedure:
    id: str
    name: str
    area: str
    plain: str
    engine: str                      # "youcam" (face-reshape) | "lift" (face-lift) | "local" | "planned"
    params: dict[str, float] = field(default_factory=dict)  # value at slider 100
    natural_max: int = 60            # past this, we warn that it may look unnatural
    approximate: bool = False


CATALOGUE: list[Procedure] = [
    # Nose
    Procedure("rhino_bridge", "Nose bridge narrowing", "Nose", "Narrows the bony bridge of the nose.", "youcam", {"nose_bridge_width": -70}),
    Procedure("rhino_tip", "Nose tip refinement", "Nose", "Slims the tip and turns it up slightly.", "youcam", {"nose_tip_width": -60, "nose_tip": -30}),
    Procedure("rhino_lift", "Nose lift", "Nose", "Raises the tip angle of the nose.", "youcam", {"nose_lift": 60}),
    Procedure("rhino_size", "Smaller nose", "Nose", "Reduces overall nose size.", "youcam", {"nose_size": -60}),
    Procedure("rhino_wings", "Nostril narrowing", "Nose", "Narrows the nostrils (alar base).", "youcam", {"nose_wing": -70}),
    Procedure("nose_filler", "Nose filler look", "Nose", "Non surgical smoothing of the profile; seen from the front as a straighter, slightly lifted nose.", "youcam", {"nose_lift": 30, "nose_bridge_width": -20}, 50, True),
    # Chin and jaw
    Procedure("chin_augment", "Chin augmentation", "Chin and jaw", "Lengthens and projects the chin.", "youcam", {"chin_length": 60}),
    Procedure("chin_reduce", "Chin reduction", "Chin and jaw", "Shortens the chin.", "youcam", {"chin_length": -60}),
    Procedure("chin_slim", "Narrower chin", "Chin and jaw", "Narrows the width of the chin.", "youcam", {"chin_reshape_left": -50, "chin_reshape_right": -50}),
    Procedure("jaw_slim", "Jawline slimming", "Chin and jaw", "Tucks in the jaw angle, as seen after jaw muscle relaxing or contouring.", "youcam", {"jaw": 70}),
    Procedure("jaw_filler", "Jawline filler look", "Chin and jaw", "A more defined lower face; shown as a slightly wider chin line.", "youcam", {"chin_reshape_left": 25, "chin_reshape_right": 25}, 50, True),
    # Cheeks
    Procedure("cheekbone_contour", "Cheekbone contouring", "Cheeks", "Tucks in prominent cheekbones.", "youcam", {"cheekbones": 70}),
    Procedure("cheek_filler", "Cheek filler look", "Cheeks", "Fuller mid face; shown as a slightly wider upper face.", "youcam", {"face_width": 15}, 40, True),
    Procedure("buccal_fat_removal", "Buccal fat removal look", "Cheeks", "Slight hollowing below the cheekbones.", "local", {}, 60, True),
    Procedure("face_slim", "Face slimming", "Cheeks", "Narrows the lower face on both sides.", "youcam", {"face_reshape_left": -40, "face_reshape_right": -40}),
    # Lips
    Procedure("lip_filler", "Lip filler", "Lips", "Fuller lips, top and bottom.", "youcam", {"lip_size": 60, "lip_height_top": 40, "lip_height_bottom": 30}),
    Procedure("lip_peak", "Cupid's bow definition", "Lips", "Sharper peaks on the upper lip.", "youcam", {"lip_peak": 70}),
    Procedure("lip_reduce", "Lip reduction", "Lips", "Thinner, narrower lips.", "youcam", {"lip_size": -50, "lip_height_top": -30, "lip_height_bottom": -30}),
    Procedure("lip_lift", "Lip lift", "Lips", "Shortens the space between nose and lip, showing more upper lip.", "local", {}, 60),
    # Eyes and brows
    Procedure("brow_lift", "Brow lift", "Eyes and brows", "Raises the brows, more at the outer tail.", "local", {}, 60),
    Procedure("upper_bleph", "Upper eyelid lift look", "Eyes and brows", "A more open eye; shown as a slightly taller eye opening.", "youcam", {"eye_height": 35}, 50, True),
    Procedure("canthal_tilt", "Eye corner lift look", "Eyes and brows", "Tilts the outer eye corners up.", "youcam", {"eye_angle": 40}, 50, True),
    # Face lift engine (YouCam face-lift: eye_bag, cheek, forehead, shape, mouth, 0..100)
    Procedure("lower_bleph", "Lower eyelid and eye bag removal", "Eyes and brows", "Smooths puffiness under the eyes.", "lift", {"eye_bag": 90}),
    Procedure("facelift", "Facelift", "Skin", "Lifts the cheeks and firms the face outline.", "lift", {"cheek": 70, "shape": 60}),
    Procedure("skin_tightening", "Skin tightening look", "Skin", "A gentler, firmer outline without a full lift.", "lift", {"shape": 40, "cheek": 25}, 60, True),
    Procedure("wrinkle_relax", "Forehead line relaxing look", "Skin", "Softer forehead lines, as after a muscle relaxing injection.", "lift", {"forehead": 80}, 60, True),
    Procedure("smile_lines", "Smile line softening look", "Skin", "Softer lines around the mouth.", "lift", {"mouth": 70}, 60, True),
    # Local, approximate: the face mesh doesn't cover the ears, and a dimple is shading, not shape
    Procedure("otoplasty", "Ear pinning look", "Ears", "Brings ears that stick out closer to the head, seen from the front.", "local", {}, 70, True),
    Procedure("cleft_chin", "Chin dimple look", "Chin and jaw", "Adds a soft vertical dimple to the chin.", "local", {}, 70, True),
]
BY_ID = {p.id: p for p in CATALOGUE}

PARAM_LIMIT_WARN = 70     # any single YouCam parameter beyond this
TOTAL_CHANGE_WARN = 220   # sum of absolute parameter values across the plan


def snap(value: float) -> int:
    return max(0, min(100, int(round(value / STEP) * STEP)))


@dataclass
class Plan:
    reshape: dict[str, int]
    local: list[tuple[str, float]]
    applied: list[dict]
    warnings: list[str]
    skipped: list[str]
    lift: dict[str, int] = field(default_factory=dict)

    @property
    def units(self) -> int:
        return (1 if any(self.reshape.values()) else 0) + (1 if any(self.lift.values()) else 0)


def build_plan(selection: dict[str, float]) -> Plan:
    reshape: dict[str, float] = {}
    lift: dict[str, float] = {}
    local: list[tuple[str, float]] = []
    applied, warnings, skipped = [], [], []
    for proc_id, raw in selection.items():
        proc = BY_ID.get(proc_id)
        if proc is None:
            raise ValueError(f"unknown procedure: {proc_id}")
        level = snap(raw)
        if level == 0:
            continue
        if proc.engine == "planned":
            skipped.append(proc.name)
            continue
        if level > proc.natural_max:
            warnings.append(f"{proc.name} at {level}% is past what usually looks natural ({proc.natural_max}%).")
        if proc.engine in ("youcam", "lift"):
            target = reshape if proc.engine == "youcam" else lift
            for name, full in proc.params.items():
                target[name] = target.get(name, 0) + full * level / 100
        else:
            local.append((proc.id, level / 100))
        applied.append({"id": proc.id, "name": proc.name, "level": level, "engine": proc.engine,
                        "approximate": proc.approximate})
    clipped: dict[str, int] = {}
    for name, value in sorted(reshape.items()):
        low = 0 if name in ("cheekbones", "jaw") else -100
        v = int(round(max(low, min(100, value))))
        if abs(value) > PARAM_LIMIT_WARN:
            warnings.append(f"Combined changes push '{name.replace('_', ' ')}' to {v}, which can look unnatural.")
        if v:
            clipped[name] = v
    lift_clean = {k: int(round(min(100, v))) for k, v in sorted(lift.items()) if round(v)}
    for name, value in lift.items():
        if value > 100:
            warnings.append(f"Combined lift settings push '{name.replace('_', ' ')}' past its maximum.")
    total = sum(abs(v) for v in clipped.values())
    if total > TOTAL_CHANGE_WARN:
        warnings.append("Many changes at once. Real treatment plans usually change fewer things, more gently.")
    return Plan(clipped, local, applied, warnings, skipped, lift_clean)


def catalogue_json() -> list[dict]:
    return [{k: v for k, v in asdict(p).items() if k != "params"} for p in CATALOGUE]
