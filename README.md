# 🪞 MIRRR — Your Taste. Your Looks. Your Style.

> **Most beauty apps were built for the West. MIRRR was built for the rest.**

**MIRRR** is a multicultural beauty discovery agent powered by [Qloo Taste AI](https://qloo.com). It uses Qloo's 250M+ entity cultural graph to decode a user's aesthetic DNA from the artists, films, and brands they love — and serve personalized beauty looks, foundation shades, and wig matches calibrated to their cultural community.

**Live Demo:** https://mirrr-upbn.onrender.com

---

## What is MIRRR?

MIRRR stands for **Multicultural Intelligence for Real-time Recommendation and Reflection**.

Black, South Asian, Arab, Latina, Caribbean, and East Asian women represent 4+ billion people globally — yet most beauty AI products are tuned on Western beauty standards, Western skin tones, and Western aesthetic references. MIRRR inverts this: Qloo's cultural intelligence is the core, and every recommendation starts from the user's own cultural world.

---

## How Qloo Powers MIRRR

MIRRR uses Qloo in three distinct, non-trivial ways:

### 1. Entity Resolution → Cultural Graph
Users enter cultural signals: an artist name, a film, a city, a brand. MIRRR calls `GET /v2/search` to resolve these to Qloo entity IDs within a 250M+ entity graph. This is not a keyword lookup — it's a semantic match into a cultural knowledge graph.

### 2. Taste Profile → Aesthetic Vector
Resolved entity IDs feed `POST /v2/taste`, requesting `urn:entity:tag` outputs. Qloo returns affinity-scored cultural tags (e.g. `afrobeats`, `bold-glam`, `warm-earth`). MIRRR maps these tags onto a 5-dimension **AestheticVector**: `{intensity, warmth, boldness, texture, colour_palette}`.

### 3. Trending Artists → Verified Cultural Feed
`GET /api/trending` uses Qloo taste affinity from regional anchor artists as seeds, fetching `urn:entity:music:artist` outputs. Results are cross-verified against a curated multi-chart anchor database (Oct 2026) — only artists confirmed trending in ≥2 sources are surfaced. This is MIRRR's live, Qloo-powered "Trending Now" panel.

---

## Architecture

```
User input (artists / brands / places)
        │
        ▼
[Qloo /v2/search] → Entity Resolution (Qloo IDs)
        │
        ▼
[Qloo /v2/taste]  → Cultural Tag Affinities
        │
        ▼
AestheticVector   → intensity / warmth / boldness / texture / palette
        │
        ├──► LookEngine     → 60 multicultural looks across 9 archetypes, scored + ranked
        ├──► ShadeFinder    → 60-point shade spectrum, community-calibrated
        ├──► WigMatchmaker  → 42 wig styles matched to aesthetic + community
        └──► TrendingArtists → Qloo-verified regional trending artists (9 regions)
```

**Stack:** Pure Node.js (zero npm packages), ESM modules, Render free tier  
**API:** Qloo Hackathon API (`https://hackathon.api.qloo.com`)

---

## The Three Engines

### 🎨 ShadeFinder
30-shade foundation spectrum calibrated for deeper and warmer skin tones (N10–N65). Community-aware: West African users get a different starting range than East Asian users, reflecting real dermographic distribution. Undertone-filtered (warm / cool / neutral / olive).

### 💇🏾 WigMatchmaker
42 wig styles scored against the AestheticVector. Box Braids, Senegalese Twists, Goddess Locs, Bone-Straight, Kinky-Afro, Silk Press, and more — matched to the user's community, aesthetic intensity, and texture preference.

### ✨ LookEngine
60 complete multicultural beauty looks (makeup + wig combos): Afro-Glam Editorial, Gulf Glam, K-Beauty Glass Skin, Caribbean Carnival, Bollywood Bridal, and more. Each look includes formula-level product recommendations tuned to the user's skin depth.

---

## Trending Artists (Multi-Source Failsafe)

MIRRR's Trending Now panel surfaces regionally trending artists across 9 cultural regions:

- **West Africa** · **East Africa** · **Black America** · **Caribbean** · **South Asian** · **Arab World** · **Latina** · **East Asian** · **South Africa**

**Failsafe architecture:**
1. **Source 1 (Qloo):** Use anchor artists as seeds → `POST /v2/taste` with `output_type: urn:entity:music:artist` → live recommendations
2. **Source 2 (Curated):** Oct 2026 multi-chart verified anchor database (Billboard Afrobeats, UK Afro, Apple Music regional, Spotify)
3. **Verification:** Only surface artists confirmed by ≥2 sources OR flagged as multi-year chart anchors

Users tap any trending artist to instantly add them to their taste profile → Qloo resolves and recommendations update.

---

## Cultural DNA Quiz

A 5-question quiz that scores the user's cultural community before any Qloo data is available. Questions reference real trending artists (Tiwa Savage, Nicki Minaj, Anitta, BLACKPINK) and culturally specific occasions (Owambe, HBCU Homecoming, Desi wedding, Carnival).

Quiz results seed the AestheticVector and pre-configure ShadeFinder + WigMatchmaker — ensuring recommendations are relevant even before the user types anything.

---

## Impact

**The problem is real:** A 2021 McKinsey study found that beauty brands targeting Black consumers outperform the market by 2.4×, yet receive a fraction of product R&D investment. Fenty Beauty's 2017 40-shade launch was news precisely because it was rare.

**The opportunity:** 4+ billion women in MIRRR's target communities are currently served by beauty apps designed for someone else. Qloo's cultural intelligence enables MIRRR to flip this by default — not as an afterthought.

**What MIRRR demonstrates:** That Qloo's taste graph, normally used for travel or restaurant recommendations, is a powerful substrate for a completely different vertical: personalized beauty for the world's underserved majority.

---

## Running Locally

```bash
git clone https://github.com/ALENZACODES/mirrr
cd mirrr
QLOO_API_KEY=your_key node src/server.js
# → http://localhost:3000
```

No npm install needed. Zero external dependencies.

---

## Team

Built solo by **John Khan** (ALENZACODES / Alenza Capital) for the **Qloo Agentic Hackathon 2026**.

---

*Built for the Qloo Agentic Hackathon 2026 · Powered by Qloo Taste AI*
