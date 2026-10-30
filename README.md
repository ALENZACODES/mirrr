# 🪞 MIRRR — Your Taste. Your Looks. Your Style.

> **For judges: start here → [JUDGES.md](JUDGES.md)** · what MIRRR does, a 60-second walkthrough, how it uses Qloo, how it makes money, and each official criterion mapped to evidence.

> **Most beauty apps were built for the West. MIRRR was built for the rest.**

**MIRRR** is a multicultural beauty discovery agent powered by [Qloo Taste AI](https://qloo.com). It uses Qloo's cultural graph to decode a user's aesthetic DNA from the artists, films, and brands they love — and serve personalized beauty looks, foundation shades, and wig matches calibrated to their cultural community.

**Live Demo:** https://mirrr-upbn.onrender.com

---

## What is MIRRR?

MIRRR stands for **Multicultural Intelligence for Real-time Recommendation and Reflection**.

Black, South Asian, Arab, Latina, Caribbean, and East Asian women are a large share of the world's beauty buyers, yet most beauty AI products are tuned on Western beauty standards, Western skin tones, and Western aesthetic references. MIRRR inverts this: Qloo's cultural intelligence is the core, and every recommendation starts from the user's own cultural world.

---

## How Qloo Powers MIRRR

MIRRR uses Qloo in three distinct, non-trivial ways:

### 1. Entity Resolution → Cultural Graph
Users enter cultural signals: an artist name, a film, a city, a brand. MIRRR calls `GET /v2/search` to resolve these to Qloo entity IDs within Qloo's entity graph. This is not a keyword lookup — it's a semantic match into a cultural knowledge graph.

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
60-shade foundation spectrum from very light to very deep skin (CIELAB L* 15–94), checked against the Monk Skin Tone scale, with 14 shades in the deep and rich-deep tiers. Photo matches report CIEDE2000 distance in bands (≤3 match, 3–6 close, >6 outside the range) and say so when nothing fits. Community-aware starting range; undertone-filtered (warm / cool / neutral / olive).

### 💇🏾 WigMatchmaker
42 wig styles scored against the AestheticVector. Box Braids, Senegalese Twists, Goddess Braids, Bone Straight, Kinky Coily Afro, Silk Press, and more — matched to the user's community, aesthetic intensity, and texture preference.

### ✨ LookEngine
60 complete multicultural beauty looks (makeup, with hair and finishing steps only if she picks them): Afro-Glam Editorial, Gulf Glam, K-Beauty Glass Skin, Caribbean Carnival, Bollywood Bridal, and more. Each look includes formula-level product recommendations tuned to the user's skin depth.

---

## Trending Artists (Multi-Source Failsafe)

MIRRR's Trending Now panel surfaces regionally trending artists across 9 cultural regions:

- **West Africa** · **East Africa** · **Black America** · **Caribbean** · **South Asian** · **Arab World** · **Latina** · **East Asian** · **South Africa**

**Failsafe architecture:**
1. **Source 1 (Qloo):** Use anchor artists as seeds → `POST /v2/taste` with `output_type: urn:entity:music:artist` → live recommendations
2. **Source 2 (Curated):** Oct 2026 multi-chart verified anchor database (Billboard Afrobeats, UK Afro, Apple Music regional, Spotify)
3. **Verification:** Only surface artists confirmed by ≥2 sources OR flagged as multi-year chart anchors

Tapping a trending artist starts a new taste profile with that artist (the app says so on the button) → Qloo resolves it and the looks update. To combine artists, add them in Taste.

---

## Cultural DNA Quiz

A 5-question quiz that scores the user's cultural community before any Qloo data is available. Questions reference real trending artists (Tiwa Savage, Nicki Minaj, Anitta, BLACKPINK) and culturally specific occasions (Owambe, HBCU Homecoming, Desi wedding, Carnival).

Quiz results seed the AestheticVector and pre-configure ShadeFinder + WigMatchmaker — ensuring recommendations are relevant even before the user types anything.

---

## Impact

**The problem is real:** Fenty Beauty's 2017 40-shade foundation launch was news precisely because that range was rare.

**The opportunity:** women in MIRRR's target communities are mostly served by beauty apps designed for someone else. Qloo's cultural intelligence enables MIRRR to flip this by default — not as an afterthought.

**What MIRRR demonstrates:** That Qloo's taste graph, normally used for travel or restaurant recommendations, is a powerful substrate for a completely different vertical: personalized beauty for the world's underserved majority.

---

## Images

All people shown in MIRRR are AI-generated photos, not real people. Product photos use blank, unbranded packaging.

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
