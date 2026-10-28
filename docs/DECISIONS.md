# Architecture Decision Records — MIRRR

> *"Most beauty apps were built for the West. MIRRR was built for the rest."*

This document records the key architectural decisions made during the design and build of MIRRR for the Qloo Agentic Hackathon (Oct 30, 2026).

---

## ADR-001: Standalone Node.js Express server (not a framework)

**Decision:** Plain Express 4.x with zero additional framework dependencies.

**Rationale:**  
- Hackathon timebox: Express ships with zero config overhead  
- Qloo integration is pure HTTP — no ORM, no session state needed  
- Easier to audit for judges  
- ESM (`"type": "module"`) keeps code modern and import/export clean

**Alternatives considered:** Fastify, Hono, Next.js API routes  
**Why rejected:** All add indirection between the Qloo API client and the route handlers with no benefit in this context.

---

## ADR-002: Qloo as the sole external data dependency

**Decision:** All cultural taste intelligence flows exclusively through Qloo's Taste AI API. No additional social graph, trend API, or recommendation engine.

**Rationale:**  
- The hackathon requirement is to demonstrate Qloo's value  
- Qloo's cultural entity graph already covers Afrobeats, Bollywood, K-pop, Caribbean, Gulf — the exact cultures MIRRR targets  
- A single API dependency means faster cold starts and a simpler auth surface

**Risk mitigated:** Demo mode (ADR-003) ensures the app works end-to-end even during Qloo API outages or rate limits during judging.

---

## ADR-003: Demo mode with curated seed profiles

**Decision:** 7 pre-built cultural profiles (`src/demo_profiles.js`) that bypass the Qloo API entirely, each with realistic entity lists, insight tags, and free-text signals.

**Rationale:**  
- Judges can explore all archetypes instantly without entering a Qloo API key  
- The `POST /api/taste/demo` endpoint accepts a profile key and returns a full pipeline result  
- Seed data was built from real Qloo tag vocabulary so it flows naturally into the aesthetic engine

**Profiles:** afrobeats, hiphop, bollywood, gulf, caribbean, latina, kbeauty

---

## ADR-004: Aesthetic vector as a 4-dimensional space

**Decision:** All Qloo insight tags are mapped to a 4-dimensional numeric vector: `intensity`, `warmth`, `boldness`, `texture`. Two additional fields — `colour_palette` and `hair_vibe` — carry discrete recommendations.

**Rationale:**  
- Numeric dimensions allow deterministic scoring without a neural network  
- The 4 dimensions capture the aesthetically meaningful axes: energy level (intensity), colour temperature (warmth), statement-making (boldness), and finish type (texture)  
- Each dimension maps to objective makeup and wig properties (foundation depth, eyeshadow finish, etc.)

**Alternative considered:** Embedding-based similarity (cosine distance in high-dimensional tag space)  
**Why rejected:** Requires an embedding model at inference time; deterministic scoring is faster, explainable, and runs without additional API calls.

---

## ADR-005: Three-tier LLM narration cascade

**Decision:** Narration is attempted in order: OpenAI GPT-4o-mini → Google Gemini 1.5 Flash → built-in template. The template is the guaranteed fallback.

**Rationale:**  
- Narration enriches the experience but must never crash the pipeline  
- Two external LLM providers cover each other's outages  
- The template narration (`src/llm/index.js :: templateNarration`) is rich enough to stand alone — it uses archetype-specific intros and product details

**Error behaviour:** Each LLM tier logs a warning on failure and falls through silently; the response always includes a `narration` field and a `source` field indicating which tier produced it.

---

## ADR-006: In-process TTL cache for Qloo responses

**Decision:** `TtlCache` class in `src/qloo.js` — LRU, max 800 entries, 6-hour TTL, no Redis.

**Rationale:**  
- Qloo rate limits are real; repeated lookups for the same cultural entity (e.g. "Burna Boy") should not cost extra requests  
- A hackathon deployment has one process — distributed cache is over-engineering  
- 6hr TTL matches the expected session lifecycle during judging

**Eviction:** Least-recently-used when `maxEntries` is exceeded (the 801st set evicts the oldest).

---

## ADR-007: Mobile-first dark-theme SPA

**Decision:** Single HTML/CSS/JS page served from `public/` with no build step.

**Rationale:**  
- MIRRR's target users — Black, South Asian, Arab, Latina, Caribbean, East Asian women — skew mobile  
- No bundler means judges can inspect source directly in DevTools  
- Dark theme + warm earth palette (terracotta, gold, ivory) reflects the brand's cultural richness without defaulting to Eurocentric pastels

**Typography:** Cormorant Garamond (editorial, serif) + Inter (clean, functional) — a pairing that reads luxury without being cold.

---

## ADR-008: Ethnic archetypes as first-class citizens

**Decision:** The eight look archetypes are ordered with culturally-specific looks first; "Clean Minimal" (the universal fallback) is listed last.

**Rationale:**  
- This ordering reflects MIRRR's core product thesis: other apps default to Western looks and treat ethnic looks as add-ons. MIRRR reverses that priority.  
- The homepage "Why MIRRR" section leads with the ethnic beauty gap, not product features.  
- Cultural chip order on the discovery form mirrors the same principle.

---

## ADR-009: Entity resolution with graceful degradation

**Decision:** `resolveMany()` in `src/qloo.js` runs name lookups with configurable concurrency (default 5) and returns `null` for failed lookups rather than throwing.

**Rationale:**  
- A user might enter "Tiwa Savage" and "jollof rice" — the latter may not resolve. The pipeline should continue with the entities that did resolve.  
- The `/api/taste/looks` response includes a `meta.failed` array so the frontend can surface "we couldn't find X" without blocking the full result.

---

## ADR-010: beljour_core / beljour_web integration

**Decision:** MIRRR includes the Python API layer (`beljour_core/`) and TypeScript frontend (`beljour_web/`) from the Beljour project, authorized by John Khan as creator of both projects.

**Rationale:**  
- The Beljour codebase contains 19,512 LOC of Python beauty AI infrastructure and 134,025 LOC of production-grade TypeScript frontend  
- These shared foundations accelerate MIRRR's development within the hackathon timebox  
- MIRRR's ethnic-first aesthetic engine and Qloo integration layer are original to this repo; Beljour code provides supporting infrastructure
