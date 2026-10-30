# MIRRR: for the judges

**Live app:** https://mirrr-upbn.onrender.com · **Code:** this repo (MIT licence) · **Hackathon:** Qloo Agentic Hackathon, "Agents, but with taste"

> The free host sleeps when idle. If the first load takes 30–60 seconds, that is the server waking up, not the app.

---

## 1. What MIRRR does

MIRRR is a beauty agent for women of colour that starts from culture, not from a face scan. She names one song, artist or show she loves; MIRRR asks Qloo's taste graph what that taste means, turns the answer into ranked makeup and hair looks from her own and neighbouring cultures, and finishes on a named foundation shade, a step-by-step plan and a before-and-after on a face. Every number on screen says where it came from, and when MIRRR is not sure (no Qloo answer, no honest shade match) it says so instead of guessing.

### 60-second walkthrough (exact clicks on the live site)

1. Open https://mirrr-upbn.onrender.com and click the **60-Second Transformation** card near the top of the home page.
2. **Step 1:** click a community (for example **West African**). Nothing is pre-selected.
3. **Step 2:** type an artist, for example `Burna Boy`, and continue. The reply line reads *"Live Qloo: 'Burna Boy' resolved to Burna Boy; 14 taste tags picked these looks"* and the top looks appear (Afrobeats Concert, Afro-Glam Editorial, Amapiano Beat on our live run).
4. **Step 3:** pick one of the looks.
5. **Step 4:** tap a depth and an undertone (for example **Deep** + **Warm**). MIRRR names the shade (for example *"Your TrueTone shade: Garnet (D40)"*) and says plainly it is a ranking, not a skin scan.
6. **Step 5–6:** read the 3-stage plan, then see the before and after painted on the generated model face nearest that shade. Press **Save**. Only now does a small, closable MIRRR Plus card appear, with its consent box unticked.
7. Bonus 20 seconds: open **Taste** from the top bar, run `BLACKPINK` and then `Bad Bunny`. The **POWERED BY QLOO · LIVE** badge shows how many Qloo tags came back, how many were used and why the rest were dropped, and the top looks change completely. On any look card, click **Leap this look: see it in three other cultures →**.

The progress bar counts down ("Step n of 6 · ~Xs left") and Back works at every step.

---

## 2. How MIRRR uses Qloo

The Qloo key stays on the server (`QLOO_API_KEY`); the browser never sees it. All calls go through `src/qloo.js` (`QlooClient`).

| Qloo call | Where in the code | What it does for MIRRR | What a judge sees |
|---|---|---|---|
| `GET /v2/search` | `QlooClient.search` / `resolveName` in `src/qloo.js`, called from `qlooTaste()` in `src/taste_signals.js` | Resolves what she typed to a Qloo entity, preferring artist, person, movie, TV show, brand, destination, book and podcast types | The badge names the entity Qloo resolved ("Burna Boy → …") |
| `GET /v2/insights`, `filter.type=urn:tag`, `filter.tag.types=urn:tag:genre:music` | `QlooClient.insightTagsOfType` via `qlooTaste()` | Music-genre tags with affinity for her taste | Look cards show the Qloo tags that ranked them ("Qloo: afrobeats, naija, Africa") |
| `GET /v2/insights`, `urn:tag:genre:media,urn:tag:keyword:media` | same | Media themes and keywords with affinity | Same badge and cards; counts of tags received and kept |
| `GET /v2/insights`, `filter.type=urn:entity:music:artist`, `signal.interests.entities=…` | `QlooClient.tasteProfile`, called from `getTrendingArtists()` in `src/trending_artists.js` | Artists with taste affinity to each region's anchor artists | The **Trending Now** artists per region, merged with a curated list of regional anchor artists |

**The agent.** `src/agent/mirrr_agent.js` (`MirrrAgent`, served at `POST /api/agent/run`) runs a traced, multi-step loop: perceive the inputs → resolve them with Qloo → build a taste vector → reason over 60 looks → recommend looks, shades and products → narrate. `POST /api/agent/refine` lets her keep talking to it ("make it bolder", "what about for a wedding?"), and the ranking visibly changes or the agent says it did not. The Occasion Planner (`/api/plan`) sends her taste chips to Qloo too.

**How the Qloo answer drives the ranking.** Each taste input makes 3 Qloo calls (one search, two insights) and gets back up to 50 tags (25 music genres, 25 media themes). A beauty-vocabulary allowlist and a safety blocklist (`src/taste_signals.js`) keep only the tags that can mean something for a look. Each look is then scored as **0.5 × taste-vector fit + 0.5 × Qloo evidence share**, with no clamp and no bonus, and the trace prints the arithmetic ("Afrobeats Concert: score 0.58 = 0.5 × fit 0.88 + 0.5 × Qloo share 0.28 (afrobeats, naija, Africa)").

**Live results, Oct 30, 2026** (from `POST /api/agent/run`): Burna Boy → 50 tags, 14 kept → Afrobeats Concert. BLACKPINK → 22 kept → K-Beauty Glass Skin. Bad Bunny → 17 kept → Latina Glam. Rihanna → 7 kept → Y2K Revival. Nancy Ajram → 9 kept → Turkish Glam. Five inputs, five different top looks and five different opening lines.

**When Qloo is down** the app shows a red **DEMO DATA, not from Qloo** banner and never pretends. Narration on the live app is written from templates (`narration_source: "template"` in the API reply) and is labelled that way; no language model writes it.

---

## 3. How MIRRR makes money

**Built and live today**
- **Named products, from the brands' own stores.** 64 products from 14 brands (`src/data/products_live.json`), each with its page URL, the price as shown, the currency and the date checked (Oct 30, 2026). They cover all 8 Style Match guides and 50 of the 60 looks; the other 10 looks honestly say "product types only". Ownership labels appear only where a source says so, and each links that source: 13 products are from brands sourced as **Black-owned**, plus Black-founded, Latina-owned, South Asian-founded, owned by women of colour, and Indigenous-owned (Canada).
- **Tagged outbound links.** Every product link carries `utm_source=mirrr&utm_medium=app&utm_campaign=qloo2026&utm_content=<look>`, so a brand can see the traffic MIRRR sends. The app says plainly: **no affiliate deal, MIRRR earns nothing from these links today.**
- **MIRRR Plus founding-member list.** Offered only after a moment she chose (Save this look, a finished try-on, a Leap result), at most once per visit, as a small closable card with the consent box **unticked**. The Plus page says "Nothing to buy today. Everything in MIRRR stays free." There is no paywall, price, card field or checkout, and there is a "Remove my email" form.
- **Referral codes on share links.** Shares carry `/?ref=<surface>-<look>`. The code names the card and the look, never the person.
- **Totals-only stats** at `/api/stats`: taste runs, try-ons, saves, Leap results, shares, product clicks, list sign-ups and referral landings. No cookies, IDs, fingerprints or stored IP addresses.

**Planned, not built**
- Affiliate or brand-partner agreements with the brands already linked, using the traffic the UTM tags measure.
- MIRRR Plus as a paid tier (unlimited Leaps and try-ons, the full Bridal Countdown, a cloud Vanity). All three are marked "coming later" in the app.

No revenue has been earned and none is claimed. The list and counts live on a free server and reset on every restart; the app says so.

---

## 4. Official judging criteria, mapped

Criteria from the official rules at https://qloo.devpost.com/rules (Stage 2, equally weighted).

| Criterion (official wording, shortened) | MIRRR's evidence | Where to see it |
|---|---|---|
| **Stage 1 (pass/fail): fits the theme and uses the required APIs** | An agentic tool (`MirrrAgent`, multi-step, traced, multi-turn refine) built on live Qloo search and insights | Taste tab badge; `src/agent/mirrr_agent.js`; `src/qloo.js` |
| **Technological Implementation:** how thoroughly and skillfully does it use Qloo; is the code genuine and non-trivial? | 4 Qloo call patterns (search; insights for music tags, media tags and artist affinity). Qloo evidence is half of every look's score, with the formula shown. Allowlist and safety filtering (43 of 250 tags dropped as unsafe across 5 live runs), honest failure modes, key server-side only. 60-shade range validated against the Monk Skin Tone scale with CIEDE2000. 379 node tests and 313 jest tests pass | Taste badge and look cards; trace "Reason" step; `test/` |
| **Design:** a complete, coherent product, not a proof of concept | One 60-second path from taste to face (6 steps, nothing pre-selected, Back at every step), plus 20+ studios (Shades, Wig Match with 42 styles, Occasions planner, Taste Leap, Bridal Countdown, Skin Clinic and more), photographic imagery, a home-page quote that rotates every minute through 30 sourced quotes in their own languages, and Help & Privacy | Live site: the top bar and its **More** menu |
| **Potential Impact:** a credible, specific case for a real problem and real audience, and does the demo address it? | The audience is women of colour, whose taste, skin depth and beauty traditions most beauty tools rank last. MIRRR answers with: a 60-shade range whose deep end is real skin (darkest L* 14.6, every Monk tone matched within ΔE 3), a shade finder that says "no honest match" instead of faking one, looks from 10 communities, and named products from Black-owned, Latina-owned, South Asian-founded and Indigenous-owned brands | Shades tab; any look's "Shop this look"; the 60-Second shade step |
| **Quality of the Idea:** creative, non-obvious use of Qloo; real understanding of the problem space | Using a taste graph of music, film and media to choose **makeup and hair** is the non-obvious step: what she listens to says more about the look she wants than a selfie does. **Leap this look** re-reads the same look in three other cultures. Women only, honest labels, nothing pre-selected and no forced funnel show we understand who this is for | 60-Second Transformation; Taste Leap; "Leap this look" on every look card |

---

## 5. Why MIRRR should win

- **Qloo is the engine, not a garnish.** Half of every look's score is Qloo evidence, the arithmetic is on screen, and swapping one artist swaps the whole result. Take Qloo away and the app says DEMO DATA in red.
- **It is a whole product.** A first-time visitor goes from one song to a named shade, a plan and a before-and-after in about a minute, and can keep going into 20+ studios.
- **It is honest where most beauty apps bluff.** No fake match percentages, no "AI" label on templates, "no honest match" when nothing fits, sources on every brand label, and a money model that says what earns nothing today.
- **It serves people the industry under-serves,** with a deep-shade range checked against a published skin-tone scale and brands owned by the communities it serves.
- **It is built to make money without breaking trust:** tagged brand traffic and a consent-first, no-paywall Plus list are live today, and both are measured in anonymous totals.

---

## 6. Privacy and honesty notes

- **On-device photos.** Photo shade matching and try-on run in the browser; her photo is not uploaded.
- **What leaves the device:** her taste words (sent to Qloo through our server) and, only if she ticks the box, an email for the MIRRR Plus list. Anonymous totals only; no cookies, visitor IDs or stored IP addresses.
- **Honest labels.** Shade matches use CIEDE2000 bands (≤3 match, 3–6 "check in daylight", >6 "outside our honest range"). Template text says it is a template. Products say "price as of Oct 30, 2026" and "no affiliate deal".
- **No real people.** Every face and person shown in MIRRR is an AI-generated photo, not a real person and not a model's likeness. No real faces were used to build or tune the shade matching; its accuracy numbers come from a synthetic test harness and are published in `docs/SCORECARD.md` with their limits.
- **Women only,** by design.
