# 🪞 MIRRR — Your Taste. Your Looks. Your Style.

> **For judges: start here → [JUDGES.md](JUDGES.md)** · what MIRRR does, a 60-second walkthrough, how it uses Qloo, how it makes money, and each official criterion mapped to evidence.
>
> **How MIRRR makes money:** 16 revenue streams, each labelled built / ready to switch on / planned, live at https://mirrr-upbn.onrender.com/#money (no revenue yet, no paywall, nothing sponsored).

> **Most beauty apps were built for the West. MIRRR was built for the rest.**

**MIRRR** is a multicultural beauty discovery agent powered by [Qloo Taste AI](https://qloo.com). It sends the artists, shows and brands a woman loves to Qloo's taste graph, filters the cultural tags Qloo returns, and uses them to rank makeup and hair looks, then pairs them with a foundation shade and a step-by-step plan for her community.

**Live Demo:** https://mirrr-upbn.onrender.com

---

## Who MIRRR is for

**MIRRR is made for women — and a woman is anyone who identifies as one. Trans women are welcome here, always.**

MIRRR celebrates women of every culture, community, skin depth, hair texture, body, age and ability. Guides that apply only to some bodies (pregnancy, postpartum, hair removal, cycle care) are written as "if this applies to you", never as a definition of what a woman is.

---

## What is MIRRR?

MIRRR stands for **Multicultural Intelligence for Real-time Recommendation and Reflection**.

Black, South Asian, Arab, Latina, Caribbean and East Asian women are often an afterthought in beauty tools built around Western beauty standards, skin tones and aesthetic references. MIRRR inverts this: Qloo's cultural intelligence is the core, and every recommendation starts from the user's own cultural world.

---

## How Qloo Powers MIRRR

All Qloo calls go through `src/qloo.js` (`QlooClient`) on the server; the API key never reaches the browser. MIRRR uses Qloo in four ways:

### 1. Entity resolution: `GET /v2/search`
She types an artist, show, film or brand. `qlooTaste()` in `src/taste_signals.js` calls `GET /v2/search` to resolve it to a Qloo entity, preferring artist, person, movie, TV show, brand, destination, book and podcast types. The badge names the entity Qloo resolved.

### 2. Taste tags: `GET /v2/insights` (music genres and media themes)
For the resolved entity, MIRRR calls `GET /v2/insights` twice with `filter.type=urn:tag` and `signal.interests.entities=<id>`: once with `filter.tag.types=urn:tag:genre:music` and once with `urn:tag:genre:media,urn:tag:keyword:media`. Together with the brand call below, that is 4 Qloo calls per taste input (one search, three insights; each extra name adds one search), returning up to 50 affinity-scored tags (25 + 25). A beauty-vocabulary allowlist and a safety blocklist keep the tags that can inform a look (for example `afrobeats`, `naija`, `Africa` for Burna Boy). The tags feed a taste vector (`src/aesthetic.js`: intensity, warmth, boldness, texture, colour palette), and each look is scored as **0.5 × taste-vector fit + 0.5 × Qloo evidence share**, with the arithmetic shown in the agent trace.

### 3. Beauty and fashion brands: `GET /v2/insights` (brand affinity)
Alongside the two tag calls, `QlooClient.insightBrands` calls `GET /v2/insights` with `filter.type=urn:entity:brand` and the same entities as signals, and gets up to 50 brands with affinity. `beautyBrands()` in `src/taste_signals.js` keeps a brand only when one of its Qloo tags is a beauty or fashion category (or its name is an unmistakable beauty or fashion house) and no tag files it under another industry (drinks, apps, electronics, sport clubs, shops). The top 8 appear under the Taste badge as "Brands Qloo links to this taste", each with its affinity and, in the API reply, the Qloo tag that qualified it. Live on Oct 30, 2026, Rihanna → Fenty Beauty first. If Qloo links no beauty or fashion brand to a taste, the row is not shown.

### 4. Trending artists: `GET /v2/insights` (artist affinity)
`GET /api/trending` resolves each region's anchor artists with `/v2/search`, then calls `GET /v2/insights` with `filter.type=urn:entity:music:artist` and those entities as signals (`src/trending_artists.js`). Artists Qloo returns that are also on MIRRR's curated regional list are marked as confirmed by two sources; Qloo's top 3 are shown even if they are not on the list; the rest of the panel is filled from the curated list. If Qloo is unreachable, the curated list is used on its own.

---

## Architecture

```
User input (artists / brands / places)
        │
        ▼
[Qloo GET /v2/search]   → Entity resolution (Qloo IDs)
        │
        ▼
[Qloo GET /v2/insights] → Music + media tags with affinity → allowlist + safety filter
        │
        ▼
AestheticVector   → intensity / warmth / boldness / texture / palette
        │
        ├──► LookEngine     → 63 multicultural looks across 9 archetypes, scored + ranked
        ├──► ShadeFinder    → 60-point shade spectrum, community-calibrated
        ├──► WigMatchmaker  → 42 wig styles matched to aesthetic + community
        └──► TrendingArtists → Qloo-verified regional trending artists (9 regions)
```

**Stack:** Pure Node.js (no runtime npm packages; Jest is a dev-only test tool), ESM modules, Render free tier  
**API:** Qloo Hackathon API (`https://hackathon.api.qloo.com`)

---

## The Three Engines

### 🎨 ShadeFinder
60-shade foundation spectrum from very light to very deep skin (CIELAB L* 14.6–93.9), checked against the Monk Skin Tone scale, with 14 shades in the deep and rich-deep tiers. Photo matches report CIEDE2000 distance in bands (≤3 match, 3–6 close, >6 outside the range) and say so when nothing fits. Community-aware starting range; undertone-filtered (warm / cool / neutral / olive).

### 💇🏾 WigMatchmaker
42 wig styles (Knotless Box Braids, Senegalese Twists, Goddess Braids, Bone Straight, Kinky Coily Afro, Silk Press and more), filtered by the length and texture she picks and ranked on three shown checks: hair vibe, community and look style. Wigs appear only if she chooses them.

### ✨ LookEngine
63 complete multicultural beauty looks (makeup, with hair and finishing steps only if she picks them): Afro-Glam Editorial, Gulf Glam, K-Beauty Glass Skin, Caribbean Carnival, Bollywood Bridal, and more. Each look lists product types (category, shade range, finish), and 50 of the 63 looks also show named products from brands' own stores, with prices as of Oct 30, 2026.

### 🪞 Live Try-On (on your device)
Lipstick (creme, gloss, matte), liner and kohl, lashes, brows, eyeshadow, blush and 18 wig previews on her own face, live through her camera, on a photo she picks, or on one of MIRRR's sample photos (for anyone without a camera). A face tracker with 478 landmarks runs inside the browser tab; no frame or photo is uploaded and MIRRR's server never sees it. Lipstick is recoloured pixel by pixel in CIELAB so her own lip lines and light stay; edges are feathered; lashes are drawn as tapered strands along the upper lash line; wigs are hair-only cutouts from MIRRR's own wig photos, fitted to her eye corners and chin so they scale and tilt with her head. Limits, said in the app: colours are colour words, not exact product shades; wigs are a placement preview and some of her own hair can still show; very turned heads track less closely.

---

## Trending Artists (Multi-Source Failsafe)

MIRRR's Trending Now panel surfaces regionally trending artists across 9 cultural regions:

- **West Africa** · **East Africa** · **Black America** · **Caribbean** · **South Asia** · **Arab World** · **Latin America** · **East Asia** · **South Africa**

**How it works:**
1. **Qloo:** each region's anchor artists are resolved with `GET /v2/search`, then `GET /v2/insights` with `filter.type=urn:entity:music:artist` returns artists with taste affinity to them.
2. **Curated list:** a hand-compiled list of regional anchor artists (Oct 2026) in `src/trending_artists.js`.
3. **Merge:** Qloo artists that are also on the curated list are marked as confirmed by two sources; Qloo's top 3 are kept even if not on the list; the panel is filled from the curated list. If Qloo fails, the curated list is shown alone.

Tapping a trending artist starts a new taste profile with that artist (the app says so on the button) → Qloo resolves it and the looks update. To combine artists, add them in Taste.

---

## Cultural DNA Quiz

A 5-question quiz that scores the user's cultural community before any Qloo data is available. Questions reference real trending artists (Tiwa Savage, Nicki Minaj, Anitta, BLACKPINK) and culturally specific occasions (Owambe, HBCU Homecoming, Desi wedding, Carnival).

Quiz results seed the taste vector and the starting community for Shades and Wig Match, so the first recommendations reflect her answers before she types anything.

---

## Impact

**The opportunity:** women in MIRRR's target communities are mostly served by beauty apps designed for someone else. Qloo's cultural intelligence enables MIRRR to flip this by default — not as an afterthought.

**What MIRRR demonstrates:** that the cultural tags in Qloo's taste graph (music genres, media themes) can drive a different vertical: personal beauty looks for women whose taste and skin most tools serve last.

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

No npm install needed to run it (no runtime dependencies). Run `npm install` then `npm test` and `npm run test:node` for the test suites.

---

## Team

Built solo by **John Khan** (ALENZACODES / Alenza Capital) for the **Qloo Agentic Hackathon 2026**.

---

*Built for the Qloo Agentic Hackathon 2026 · Powered by Qloo Taste AI*
