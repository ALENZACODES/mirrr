# Event cards (task C1)

Greeting cards built around an already edited photo for 14 occasions, with a uniqueness
engine so no two cards look the same. Author: John Khan.

- Public API: see `__init__.py` (make_card, make_another, edit_text, export_png,
  export_svg, export_payload, extras and the JSON handlers).
- Full hand-off, measured numbers and assumptions: `docs/handoff-k/C1-CARDS.md` and
  `docs/reviews/C1-CARDS-assumptions.md`.
- Tests: `api/tests/seasonal_cards/` (run `cd api && python -m pytest -q tests/seasonal_cards`).

Module map:

| Module | Role |
| --- | --- |
| occasions.py | occasion ids, looks, palettes, forbidden motif list |
| motifs.py, provider.py | built-in ornaments and the shared MotifProvider contract |
| patterns.py, grammar.py | seeded design grammar producing a frozen CardDesign |
| text.py, photo.py | text sanitising and layout; photo intake, stripping, fit, masks |
| compose.py, render_svg.py, render_raster.py | one composition, two renderers |
| access.py, vision.py | measured text contrast, colour-vision report |
| fingerprint.py, store.py, uniqueness.py | fingerprints, SQLite store, retry engine |
| export.py, service.py, handlers.py | PNG and payload export, API, JSON handlers |
| keepsakes.py, printing.py, animate.py, gallery.py, bundle.py | extras |
| design_space.py, synthetic.py, scene.py, geometry.py, shapes.py, colour.py, errors.py | support |

Respect rules: all art is drawn in code; only greeting symbols communities use themselves;
no figures, scripture, sacred buildings or caricature; the Khanda is never used.
`FORBIDDEN_MOTIFS` and `audit_provider` enforce this for any motif provider.
