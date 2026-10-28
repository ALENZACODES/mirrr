"""Original-photo measurements for the Still Her proxy, built once per photo.

still_her.measure_image() runs once per recipe (61 per face on the real-face
bench). Most of its work on the ORIGINAL photo does not depend on the recipe:
the Lab skin pixels and their chroma, hue and spread, the inter-ocular scale,
the freckle and mole search, the face frame, and the original side of the
arena's unrequested-change check (skin and background median Lab, and the
dilated background mask). OriginalMeasurements holds those, frozen, so a
bench builds it once and passes it to every recipe. Every value is computed
by the same calls on the same arrays as before, so results are identical
(tested field by field with ==).
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ...arena import identity as I
from ...arena import marks as M
from ...engines.core.distance import dilate
from ..colour import space as S
from ..frame import Frame, whole

# Original skin chroma (mean C*ab) under which hue and chroma rules cannot be
# measured: the hue of a near-grey pixel is noise (ASSUMED floor; C16).
HUE_RULE_CHROMA = 5.0


@dataclass(frozen=True)
class OriginalMeasurements:
    shape: tuple[int, int]
    skin: np.ndarray
    lab: np.ndarray
    before: np.ndarray
    chroma: np.ndarray
    hue: np.ndarray
    spread: float
    skin_l: float
    scale: float
    marks: tuple[M.Mark, ...]
    frame: Frame
    skin_lab: tuple[float, float, float] | None
    background: np.ndarray
    background_lab: tuple[float, float, float] | None

    @property
    def hue_rule_applies(self) -> bool:
        return float(self.chroma.mean()) >= HUE_RULE_CHROMA if self.chroma.size else False

    def matches(self, image: np.ndarray, skin_mask: np.ndarray) -> bool:
        return tuple(image.shape[:2]) == self.shape and np.array_equal(skin_mask >= 0.5, self.skin)

    def skin_shift(self, after: np.ndarray,
                   skin_mask: np.ndarray) -> tuple[float | None, float | None]:
        """arena.scorer.skin_shift with the original side already measured."""
        la = I.mean_lab(after, skin_mask)
        ba = I.mean_lab(after, self.background)
        skin_dl = None if self.skin_lab is None or la is None else la[0] - self.skin_lab[0]
        background_dl = (None if self.background_lab is None or ba is None
                         else ba[0] - self.background_lab[0])
        return skin_dl, background_dl


def build(image: np.ndarray, points: np.ndarray, skin_mask: np.ndarray,
          face_centre: tuple[float, float] | None = None) -> OriginalMeasurements:
    """Everything measure_image needs from the original photo and its skin mask."""
    skin = skin_mask >= 0.5
    lab = S.srgb_to_lab(S.bytes_to_unit(image[..., :3]))
    before = lab[skin]
    chroma = np.hypot(before[:, 1], before[:, 2])
    hue = np.degrees(np.arctan2(before[:, 2], before[:, 1]))
    scale = I.iod(points)
    marks = tuple(M.find_marks(image, skin_mask, scale))
    background = 1.0 - (dilate((np.asarray(skin_mask) >= 0.5).astype(np.float32), 6.0) > 0)
    return OriginalMeasurements(
        shape=(int(image.shape[0]), int(image.shape[1])), skin=skin, lab=lab, before=before,
        chroma=chroma, hue=hue, spread=float(before[:, 0].std()),
        skin_l=float(before[:, 0].mean()), scale=scale, marks=marks,
        frame=whole(image, face_centre), skin_lab=I.mean_lab(image, skin_mask),
        background=background, background_lab=I.mean_lab(image, background))
