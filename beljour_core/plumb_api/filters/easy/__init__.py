"""Lane B original EASY filters. Author: John Khan."""

from .bridal import LABEL as BRIDAL_LABEL
from .bridal import BridalOptions, FlashReport
from .bridal import flash_check as bridal_flash_check
from .bridal import render as bridal_render
from .catalogue import FILTERS, SKIPPED, validate_catalogue
from .evaluation import PASS_DEFINITIONS, validate_definitions
from .evaluation import evaluate as evaluate_identity
from .eye_colour import LABEL as EYE_COLOUR_LABEL
from .eye_colour import EyeColourOptions
from .eye_colour import render as eye_colour_render
from .fun import LABEL as FUN_LABEL
from .fun import FunOptions
from .fun import render as fun_render
from .glasses import LABEL as GLASSES_LABEL
from .glasses import GlassesOptions
from .glasses import render as glasses_render
from .retro import LABEL as RETRO_LABEL
from .retro import RetroOptions
from .retro import render as retro_render
from .summer import LABEL as SUMMER_LABEL
from .summer import SummerOptions
from .summer import render as summer_render

ADULT_ONLY = True

__all__ = [
    "ADULT_ONLY",
    "BRIDAL_LABEL",
    "BridalOptions",
    "EYE_COLOUR_LABEL",
    "FILTERS",
    "PASS_DEFINITIONS",
    "EyeColourOptions",
    "FUN_LABEL",
    "FlashReport",
    "FunOptions",
    "GLASSES_LABEL",
    "GlassesOptions",
    "RETRO_LABEL",
    "RetroOptions",
    "SKIPPED",
    "SUMMER_LABEL",
    "SummerOptions",
    "bridal_flash_check",
    "bridal_render",
    "evaluate_identity",
    "eye_colour_render",
    "fun_render",
    "glasses_render",
    "retro_render",
    "summer_render",
    "validate_catalogue",
    "validate_definitions",
]
