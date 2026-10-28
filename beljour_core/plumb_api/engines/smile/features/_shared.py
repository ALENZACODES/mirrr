'Shared checked-annotation helpers for smile feature orchestration. Author: John Khan.'

from __future__ import annotations

from ..contracts import SmileAnnotation
from ..engine import render


def require(annotation: SmileAnnotation, *names: str) -> None:
    for name in names:
        value = getattr(annotation, name)
        if not value or len(value) < 3:
            raise ValueError(f'checked {name} annotation required')

def render_feature(photo, feature: str, annotation: SmileAnnotation, amount: float, adult: bool):
    return render(photo, {'feature': feature, 'amount': amount, 'adult_confirmed': adult, 'annotation': {'teeth': annotation.teeth, 'gum': annotation.gum, 'midline_x': annotation.midline_x}}).image
