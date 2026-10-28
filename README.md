# MIRRR 🪞

> **Most beauty apps were built for the West. MIRRR was built for the rest.**

MIRRR is a culturally-intelligent beauty discovery app for Black, South Asian, Arab, Latina, Caribbean, and East Asian women — the communities that mainstream beauty platforms have historically underserved.

Built for the **Qloo Agentic Hackathon** (due Oct 30, 2026).

---

## What it does

You tell MIRRR what you love — music, film, fashion, food — and it maps your cultural taste to a personalised beauty look using **Qloo's Taste AI**.

```
Cultural taste (Afrobeats, Bollywood, K-pop…)
   ↓  Qloo Taste AI → insight tags
   ↓  Aesthetic engine → 4-D vector (intensity · warmth · boldness · texture)
   ↓  Look engine → ranked beauty archetypes
   ↓  LLM narration → personalised story
```

**Eight look archetypes:**
- 🌍 Afro-Glam Editorial
- 🎤 Hip-Hop Glam
- 🎉 Caribbean Carnival
- 💎 Desi Glam
- ✨ Gulf Glam
- 🌺 Latina Glam
- 🍃 K-Beauty Glass Skin
- 🤍 Clean Minimal

Each archetype includes full makeup product recommendations + wig styling for every hair texture.

---

## Quick start

```bash
cp .env.example .env
# Add QLOO_API_KEY (required for live mode; not needed for demo mode)
npm install
npm start
# → http://localhost:3000
```

**No API key?** Click "Try a demo profile" on the homepage — 7 curated cultural profiles work out of the box.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 ESM |
| Server | Express 4 |
| Taste AI | Qloo Hackathon API |
| Narration | GPT-4o-mini → Gemini 1.5 Flash → template |
| Frontend | Vanilla JS + CSS (no build step) |
| Tests | Jest 29 (ESM mode) |

---

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Status + Qloo key check |
| GET | `/api/archetypes` | All 8 archetype metadata |
| GET | `/api/looks` | Full look catalogue |
| POST | `/api/taste/profile` | Aesthetic vector from inputs |
| POST | `/api/taste/looks` | Full pipeline: vector + ranked looks + narration |
| POST | `/api/taste/demo` | Demo mode (no Qloo key needed) |

### POST `/api/taste/looks`

```json
{
  "inputs": ["Burna Boy", "Davido", "Afrobeats", "Lagos"],
  "freeText": "I love bold colours and glass skin",
  "topN": 3
}
```

Response:

```json
{
  "aesthetic": {
    "intensity": 0.82,
    "warmth": 0.76,
    "boldness": 0.71,
    "texture": "glass",
    "colour_palette": "rich-earth",
    "hair_vibe": "natural-afro",
    "archetypes": ["afro_glam", "hip_hop_glam"]
  },
  "looks": [...],
  "narration": "Your taste is telling a story...",
  "meta": { "source": "openai", "resolved": 4, "failed": 0 }
}
```

---

## Tests

```bash
node --experimental-vm-modules node_modules/.bin/jest
```

---

## Docs

- [`docs/ARCHETYPES.md`](docs/ARCHETYPES.md) — Detailed archetype guide
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Architecture decision records

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `QLOO_API_KEY` | For live mode | Qloo Taste AI authentication |
| `OPENAI_API_KEY` | Optional | GPT-4o-mini narration |
| `GEMINI_API_KEY` | Optional | Gemini 1.5 Flash narration fallback |
| `PORT` | Optional | Server port (default 3000) |

---

## Why MIRRR?

Beauty apps have a representation problem:
- Shade ranges default to 20 fair shades, 2 deep
- "Natural" hair means straight; textured hair is an afterthought
- Filters lighten skin by default
- Cultural aesthetics (Desi bridal, Gulf kohl, Afrobeats editorial) are invisible

MIRRR leads with the aesthetics mainstream apps treat as edge cases. Every look is designed from the ground up for women of colour, with shade ranges, textures, and cultural references that reflect their actual world.

---

*Built by Alenza Capital / ALENZACODES*
