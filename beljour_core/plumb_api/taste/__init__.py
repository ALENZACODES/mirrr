"""
Beljour Taste — cultural identity to beauty aesthetic.

Uses Qloo's Taste AI to map a person's cultural preferences (music, film,
fashion, food, travel) to beauty aesthetic signals, then surfaces those signals
inside Beljour's shade-matching and look-dossier pipeline.

Flow:
  1. POST /api/taste/profile   — resolve entities + build taste profile
  2. POST /api/taste/aesthetic — translate taste profile → beauty aesthetic vector
  3. POST /api/taste/looks     — recommend looks + products from aesthetic vector
  4. GET  /api/taste/explain   — explain why a look fits the user's taste
"""
