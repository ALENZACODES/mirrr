'Hair feature safety, privacy, and claim boundaries. Author: John Khan.'
from __future__ import annotations

SENSITIVE_FEATURES = {'W24', 'W25', 'W41', 'W42'}
MEDICAL_WORDS = {'diagnose', 'treat', 'cure', 'regrow guaranteed', 'alopecia diagnosis', 'chemotherapy advice'}

def claim_safe(text: str) -> bool:
    lowered = text.casefold()
    return not any(word in lowered for word in MEDICAL_WORDS)

def label_for(feature: str) -> str:
    if feature == 'W41':
        return 'Postpartum regrowth appearance simulation; not medical advice or a growth prediction.'
    if feature == 'W42':
        return 'Calm sensitive-mode wig/scalp visual aid; optional and not medical advice.'
    if feature == 'W44':
        return 'Hair forecast estimate from user-entered humidity; actual response varies.'
    return 'Local hair simulation; salon result, fit, wear and growth may differ.'

def sensitive_strength(feature: str, requested: float) -> float:
    value = max(0.0, min(float(requested), 1.0))
    if feature == 'W42':
        return min(value, 0.45)
    if feature in SENSITIVE_FEATURES:
        return min(value, 0.7)
    return value

def no_pressure_copy(feature: str) -> tuple[str, ...]:
    if feature == 'W42':
        return ('Preview only if useful to you.', 'Keeping your current look is always an equal option.', 'Comfort and scalp care come before visual coverage.')
    if feature == 'W33':
        return ('Continue colouring', 'Blend gradually', 'Grow out naturally')
    return ()
