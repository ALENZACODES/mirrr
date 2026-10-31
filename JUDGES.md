# MIRRR: for the judges

**Live app:** https://mirrr-upbn.onrender.com · **Code:** this repo (MIT licence) · **Hackathon:** Qloo Agentic Hackathon, "Agents, but with taste"

> The free host sleeps when idle. If the first load takes 30–60 seconds, that is the server waking up, not the app.

---

## 1. What MIRRR does

> **Who it is for:** MIRRR is made for women — and a woman is anyone who identifies as one. Trans women are welcome here, always.

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

### Beauty News (the first source of beauty news to you)

| What | How it works | See it (live) |
|---|---|---|
| Beauty News: headlines about brands that make beauty for Black, Latina, South Asian, East & Southeast Asian, MENA and Indigenous women | Pulls 20 public RSS/Atom feeds (beauty publications and brand blogs) plus Google News searches for 31 brands and 13 community topics, every 30 minutes. Each source is fetched with a timeout and its own error handling; items are de-duplicated, filtered (beauty only, no men's grooming, no slurs, no colourist "whitening" products, nothing off-topic) and sorted newest first. Only the headline, source, date, a one-line feed snippet and a link out are shown, with a plain initial tile instead of copied images. **3 fail-safe layers:** A direct feeds, B Google News when A finds too few, C the last good set saved to disk plus a real snapshot committed in the repo (`src/news/news-snapshot.json`, refreshed by a GitHub Action every 6 hours), so a cold start shows real headlines at once. The page says when it was updated and which layer served it. Filters start unselected. Sources: [/api/news/sources](https://mirrr-upbn.onrender.com/api/news/sources). Tests: `test/news.test.mjs` | Top bar **Beauty News**, the home band, the footer, [/#news](https://mirrr-upbn.onrender.com/#news) · screenshots: [live](docs/judges/news-live.webp), [every feed blocked, served from the snapshot](docs/judges/news-feeds-blocked.webp) |

---

## 2. How MIRRR uses Qloo

The Qloo key stays on the server (`QLOO_API_KEY`); the browser never sees it. All calls go through `src/qloo.js` (`QlooClient`).

| Qloo call | Where in the code | What it does for MIRRR | What a judge sees |
|---|---|---|---|
| `GET /v2/search` | `QlooClient.search` / `resolveName` in `src/qloo.js`, called from `qlooTaste()` in `src/taste_signals.js` | Resolves what she typed to a Qloo entity, preferring artist, person, movie, TV show, brand, destination, book and podcast types | The badge names the entity Qloo resolved ("Burna Boy → …") |
| `GET /v2/insights`, `filter.type=urn:tag`, `filter.tag.types=urn:tag:genre:music` | `QlooClient.insightTagsOfType` via `qlooTaste()` | Music-genre tags with affinity for her taste | Look cards show the Qloo tags that ranked them ("Qloo: afrobeats, naija, Africa") |
| `GET /v2/insights`, `urn:tag:genre:media,urn:tag:keyword:media` | same | Media themes and keywords with affinity | Same badge and cards; counts of tags received and kept |
| `GET /v2/insights`, `filter.type=urn:entity:brand`, `signal.interests.entities=…` | `QlooClient.insightBrands` via `qlooTaste()`, run alongside the two tag calls | Brands with taste affinity to what she typed; MIRRR keeps only those whose Qloo category tags (or name) say beauty or fashion, and drops any Qloo also files under drinks, apps, electronics, sport clubs or shops | A row under the Taste badge: "Brands Qloo links to this taste" with each brand's affinity (Rihanna → Fenty Beauty first; for some artists Qloo returns no beauty or fashion brand, and the row is simply not shown) |
| `GET /v2/insights`, `filter.type=urn:entity:music:artist`, `signal.interests.entities=…` | `QlooClient.tasteProfile`, called from `getTrendingArtists()` in `src/trending_artists.js` | Artists with taste affinity to each region's anchor artists | The **Trending Now** artists per region, merged with a curated list of regional anchor artists |

**The agent.** `src/agent/mirrr_agent.js` (`MirrrAgent`, served at `POST /api/agent/run`) runs a traced, multi-step loop: perceive the inputs → resolve them with Qloo → build a taste vector → reason over 69 looks → recommend looks, shades and products → narrate. `POST /api/agent/refine` lets her keep talking to it ("make it bolder", "what about for a wedding?"), and the ranking visibly changes or the agent says it did not. The Occasion Planner (`/api/plan`) sends her taste chips to Qloo too.

**How the Qloo answer drives the ranking.** Each taste input makes 4 Qloo calls (one search, three insights: music tags, media tags and brands; each extra name adds one search) and gets back up to 50 tags (25 music genres, 25 media themes) and up to 50 brands. A beauty-vocabulary allowlist and a safety blocklist (`src/taste_signals.js`) keep only the tags that can mean something for a look. Each look is then scored as **0.5 × taste-vector fit + 0.5 × Qloo evidence share**, with no clamp and no bonus, and the trace prints the arithmetic ("Afrobeats Concert: score 0.58 = 0.5 × fit 0.88 + 0.5 × Qloo share 0.28 (afrobeats, naija, Africa)").

**Live results, Oct 30, 2026** (from `POST /api/agent/run`): Burna Boy → 50 tags, 14 kept → Afrobeats Concert. BLACKPINK → 22 kept → K-Beauty Glass Skin. Bad Bunny → 17 kept → Latina Glam. Rihanna → 7 kept → Y2K Revival. Nancy Ajram → 9 kept → Turkish Glam. Five inputs, five different top looks and five different opening lines.

**When Qloo is down** the app shows a red **DEMO DATA, not from Qloo** banner and never pretends. Narration on the live app is written from templates (`narration_source: "template"` in the API reply) and is labelled that way; no language model writes it.

---

## 3. How MIRRR makes money

MIRRR is free for her. It has **many honest entry points to revenue**, each labelled in the app with its real status. **No revenue has been earned yet, there is no paywall, and nothing is sponsored.** Every page below is one tap from the home page ("MIRRR's business, in the open"), the top bar (**How MIRRR earns**), the footer and Help & Privacy.

| # | Revenue stream | Status | What is live | See it (live) | Screenshot |
|---|---|---|---|---|---|
| 1 | Named products from brands' own stores | **Built today** | 64 real products from 14 brands on 50 of 69 looks and all 8 Style Match guides; price as of Oct 30, 2026; links tagged `utm_source=mirrr`; labelled "no affiliate deal, MIRRR earns nothing from these links today" | Any look → **Shop this look** | [money-01-products](docs/judges/money-01-products.webp) |
| 2 | Shop-by-look bundles | **Built today** | 14 bundles, each with item count and total at listed prices (`GET /api/shop/bundles`) | [/#shop](https://mirrr-upbn.onrender.com/#shop) | [money-2-shop](docs/judges/money-2-shop.webp) |
| 3 | Complete-the-routine cross-sell in studios | **Built today** | Colour & Lip, Smile & Lip Care, Brow & Kohl, Skin Clinic and Complexion end with real products for that routine (`GET /api/shop/routine/:routine`). Nails, Hair Colour Lab and Wig Match say plainly there are no named products yet and point to the stylist and brand lists | Bottom of each studio | [money-2-studio-lips](docs/judges/money-2-studio-lips.webp), [money-2-studio-wig](docs/judges/money-2-studio-wig.webp) |
| 4 | MIRRR Plus founding-member list | **Built today, no charge** | Offered only after Save, a finished try-on or a Leap result; closable, box unticked, at most once per visit | Footer → MIRRR Plus, [/#plus](https://mirrr-upbn.onrender.com/#plus) | [money-02-waitlist-prompt](docs/judges/money-02-waitlist-prompt.webp) |
| 5 | Digital guides (Bridal beauty plan, Look book, Routine card) | **Built today as a founding list, no charge**; paid guides **Planned** | Founding-list form; Bridal Countdown and Look Book end with a "download planned" note | [/#guides](https://mirrr-upbn.onrender.com/#guides) | [money-2-guides](docs/judges/money-2-guides.webp) |
| 6 | Referral codes on shared links | **Built today** | `/?ref=<surface>-<look>`; code names the look, never the person; landings counted as totals | [/api/stats](https://mirrr-upbn.onrender.com/api/stats) | [money-05-share-link](docs/judges/money-05-share-link.webp) |
| 7 | For brands: Qloo taste trends + interest list | **Built today** | Live counts of the Qloo taste tags and top looks from live taste runs (`GET /api/brands/trends`: tag names and look ids only, no person, input text or IP); email-only interest form, consent unticked | [/#brands](https://mirrr-upbn.onrender.com/#brands) | [money-2-brands](docs/judges/money-2-brands.webp) |
| 8 | For stylists & salons: interest list | **Built today** | Email-only interest form for braiders, wig installers, colourists, makeup artists, bridal artists and salons | [/#pros](https://mirrr-upbn.onrender.com/#pros) | [money-2-pros](docs/judges/money-2-pros.webp) |
| 9 | Affiliate commission on product links | **Ready to switch on** | Links already carry tags; needs a signed agreement with a brand or network. **None exists.** | Any product link | n/a |
| 10 | Sponsored placement slot | **Ready to switch on** | One slot on Shop by look, marked "available, not yet sold" | [/#shop](https://mirrr-upbn.onrender.com/#shop) | [money-2-shop](docs/judges/money-2-shop.webp) |
| 11 | Brand taste-insight reports | **Ready to switch on** | The trends feed exists; a paid report needs a first brand customer. **None yet.** | [/#brands](https://mirrr-upbn.onrender.com/#brands) | [money-2-brands](docs/judges/money-2-brands.webp) |
| 12 | MIRRR Plus subscription | **Planned** | Unlimited Leaps and try-ons, full Bridal Countdown, cloud Vanity; no price, no checkout | [/#plus](https://mirrr-upbn.onrender.com/#plus) | [money-03-plus-page](docs/judges/money-03-plus-page.webp) |
| 13 | Paid digital guides | **Planned** | No checkout exists | [/#guides](https://mirrr-upbn.onrender.com/#guides) | [money-2-guides](docs/judges/money-2-guides.webp) |
| 14 | Stylist listings and booking referrals | **Planned** | Not built beyond the interest form | [/#pros](https://mirrr-upbn.onrender.com/#pros) | [money-2-pros](docs/judges/money-2-pros.webp) |
| 15 | Beauty News sign-up list | **Built today, no charge** | "Get the news" form on Beauty News: email, optional interests (none ticked), consent unticked, remove-my-email on the same page. The list is an audience asset; **no emails are sent yet** | [/#news](https://mirrr-upbn.onrender.com/#news) | [news-live](docs/judges/news-live.webp) |
| 16 | Sponsored Beauty News newsletter slot | **Planned** | One marked sponsor slot in the future email digest. No digest is sent and no sponsor exists | [/#news](https://mirrr-upbn.onrender.com/#news) | n/a |

The full table, with the same statuses, is in the app at [/#money](https://mirrr-upbn.onrender.com/#money) ([money-2-how-money](docs/judges/money-2-how-money.webp)). Screenshots are kept in the build workspace, not in this repo.

**Rules every stream follows (and the tests check):** no paywall; options, never a forced funnel; nothing pre-selected; every consent box starts unticked; no fake sponsors, partners, affiliate deals or revenue numbers; anonymous totals only (`/api/stats`). Interest lists and the founding list hold only an email she typed with the box ticked, can be removed on the same page, and sit in a server file that this free host wipes on restart (the pages say so). Tests: `test/money.test.mjs`, `test/money_entry_points.test.mjs`.

**Potential Impact tie-in.** The same honest commerce that funds MIRRR sends traffic to the brands women of colour are often told don't exist: of the 64 products, 13 are from brands sourced as Black-owned and 34 carry a sourced Black-founded, Latina-owned, South Asian-founded, women-of-colour-owned or Indigenous-owned label. The stylist list points at the braiders, wig installers and colourists these looks depend on, and the brand trends show indie brands what this audience's taste actually leads to, from Qloo, in totals only.

## Three hard questions, answered straight

**"There are no users or revenue yet."** True, and we say so. MIRRR launched for this hackathon. What exists today is the measurement: every product link is UTM-tagged, [`/api/stats`](https://mirrr-upbn.onrender.com/api/stats) counts taste runs, try-ons, saves and product clicks (anonymous totals only; this free host resets them on every restart), and the MIRRR Plus founding list is consent-first. The first milestone after the hackathon is real usage numbers from those counters, then a first brand partnership with one of the brands already linked.

**"Perfect Corp (YouCam) and L'Oréal already do beauty AI."** They start from the face: scan it, then sell a product. MIRRR starts from taste: what she listens to and watches, through Qloo, and from her culture, before any face scan. MIRRR's 60-shade range (CIELAB L* 14.6 to 93.9) is checked against all 10 tones of the Monk Skin Tone scale, the deepest included, each matched within ΔE2000 3 (`test/shade_match.test.mjs`), and its Looks studio covers 9 communities. The two can work together: MIRRR could send a chosen look to a try-on engine.

**"Why would she come back next week?"** Because her occasions change: a concert, a wedding, Eid, Diwali, Carnival. The Occasion Planner plans for whatever event she names, Bridal Countdown counts down to the wedding, Skin Clinic shows what to expect at weeks and months, a new artist gives a new look, and she can save looks in her browser to come back to. Planned, not built: reminders before the occasion she saved.

## One-line answers per judging criterion

- **Technological Implementation:** 4 Qloo calls per taste input (one search; insights for music tags, media tags and beauty or fashion brands), plus a separate artist-affinity insights call for Trending. Qloo evidence is half of every look's score, with the arithmetic on screen.
- **Design:** one 60-second path from a song to a named shade, a plan and a before-and-after, then 20+ studios.
- **Potential Impact:** women of colour (MIRRR is for anyone who identifies as a woman), a shade range that reaches the deepest Monk tones, named products from brands owned by the communities MIRRR serves, and safety-first skin guidance (Skin Clinic opens with when to see a doctor first).
- **Quality of the Idea:** taste picks the look. What she listens to says more about how she wants to look than a selfie does, and Qloo is how MIRRR reads it.

---

## 4. Official judging criteria, mapped

Criteria from the official rules at https://qloo.devpost.com/rules (Stage 2, equally weighted).

| Criterion (official wording, shortened) | MIRRR's evidence | Where to see it |
|---|---|---|
| **Stage 1 (pass/fail): fits the theme and uses the required APIs** | An agentic tool (`MirrrAgent`, multi-step, traced, multi-turn refine) built on live Qloo search and insights | Taste tab badge; `src/agent/mirrr_agent.js`; `src/qloo.js` |
| **Technological Implementation:** how thoroughly and skillfully does it use Qloo; is the code genuine and non-trivial? | 5 Qloo call patterns (search; insights for music tags, media tags, beauty and fashion brands, and artist affinity), 4 calls per taste input. Qloo evidence is half of every look's score, with the formula shown. Allowlist and safety filtering (43 of 250 tags dropped as unsafe across 5 live runs), honest failure modes, key server-side only. 60-shade range validated against the Monk Skin Tone scale with CIEDE2000. 400+ node tests and 300+ jest tests pass | Taste badge and look cards; trace "Reason" step; `test/` |
| **Design:** a complete, coherent product, not a proof of concept | One 60-second path from taste to face (6 steps, nothing pre-selected, Back at every step), plus 20+ studios (Shades, Wig Match with 42 styles, Occasions planner, Taste Leap, Bridal Countdown, Skin Clinic and more), photographic imagery, a home-page quote that rotates every minute through 30 sourced quotes in their own languages, and Help & Privacy | Live site: the top bar and its **More** menu |
| **Potential Impact:** a credible, specific case for a real problem and real audience, and does the demo address it? | The audience is women of colour, whose taste, skin depth and beauty traditions most beauty tools rank last. MIRRR answers with: a 60-shade range whose deep end is real skin (darkest L* 14.6, every Monk tone matched within ΔE 3), a shade finder that says "no honest match" instead of faking one, looks for 9 communities, and named products from Black-owned, Latina-owned, South Asian-founded and Indigenous-owned brands | Shades tab; any look's "Shop this look"; the 60-Second shade step |
| **Quality of the Idea:** creative, non-obvious use of Qloo; real understanding of the problem space | Using a taste graph of music, film and media to choose **makeup and hair** is the non-obvious step: what she listens to says more about the look she wants than a selfie does. **Leap this look** re-reads the same look in three other cultures. Women only, honest labels, nothing pre-selected and no forced funnel show we understand who this is for | 60-Second Transformation; Taste Leap; "Leap this look" on every look card |

---

## 5. Why MIRRR should win

- **Qloo is the engine, not a garnish.** Half of every look's score is Qloo evidence, the arithmetic is on screen, and swapping one artist swaps the whole result. Take Qloo away and the app says DEMO DATA in red.
- **It is a whole product.** A first-time visitor goes from one song to a named shade, a plan and a before-and-after in about a minute, and can keep going into 20+ studios.
- **It is honest where most beauty apps bluff.** No fake match percentages, no "AI" label on templates, "no honest match" when nothing fits, sources on every brand label, and a money model that says what earns nothing today.
- **It serves people the industry under-serves,** with a deep-shade range checked against a published skin-tone scale and brands owned by the communities it serves.
- **It is built to make money without breaking trust:** 8 revenue entry points are live today (named products, bundles, studio cross-sell, Plus and guide founding lists, referral codes, brand trends and interest, stylist interest), 3 are ready to switch on the day an agreement or first customer exists, and 3 are planned. Each is labelled with that status in the app, and all are measured in anonymous totals.

---

## 6. Privacy and honesty notes

- **On-device photos.** Photo shade matching and try-on run in the browser; her photo is not uploaded.
- **Before & After studio.** Open **Before & After** in the top bar: use your own photo (upload or camera, processed in the tab, never uploaded) or pick a natural-look model (AI-generated, bare-faced), play with makeup on the still photo, drag the before/after slider, then choose a look under "How she got the look" to see it built step by step with real products per step. Nothing is pre-selected.
- **Live try-on camera.** Open **Try it on (live)** in the top bar (or tap a sample photo if you have no camera). The camera starts only when she taps Start camera, every frame is processed in the browser tab, nothing is uploaded, and leaving the page turns the camera off. Every picker starts at "Choose…".
- **What leaves the device:** her taste words (sent to Qloo through our server) and, only if she ticks the box, an email for the MIRRR Plus list. Anonymous totals only; no cookies, visitor IDs or stored IP addresses.
- **Honest labels.** Shade matches use CIEDE2000 bands (≤3 match, 3–6 "check in daylight", >6 "outside our honest range"). Template text says it is a template. Products say "price as of Oct 30, 2026" and "no affiliate deal".
- **No real people.** Every face and person shown in MIRRR is an AI-generated photo, not a real person and not a model's likeness. No real faces were used to build or tune the shade matching; its accuracy numbers come from a synthetic test harness and are published in `docs/SCORECARD.md` with their limits.
- **Women only,** by design.
