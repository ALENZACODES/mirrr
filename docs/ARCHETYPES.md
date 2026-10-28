# MIRRR Look Archetypes

MIRRR defines eight look archetypes that map cultural taste signals — drawn from Qloo's Taste AI — to full beauty looks including makeup, wigs, and styling direction.

---

## 1. Afro-Glam Editorial

**Cultural roots:** West African diaspora, Afrobeats, Nigerian fashion, Lagos street style  
**Archetype ID:** `afro_glam`

A bold, high-drama look that celebrates deep skin tones, glass skin, and sculptural silhouettes. Drawn from the editorial energy of Lagos Fashion Week and the stage presence of artists like Tiwa Savage and Burna Boy.

**Signature elements:**
- Foundation: deep espresso / rich mahogany shades
- Eye: warm bronze + copper metallics
- Lip: burgundy, plum, or cognac satin
- Wig: long kinky wavy (honey/chocolate)
- Aesthetic: intensity HIGH · warmth WARM · boldness HIGH

---

## 2. Hip-Hop Glam

**Cultural roots:** African-American hip-hop and R&B, urban streetwear, nail culture  
**Archetype ID:** `hiphop_glam`

The full-glam statement look rooted in Black American beauty culture: flawless base, lash stacks, glossy lips. References Cardi B, Nicki Minaj, SZA, and the visual language of major label rollouts.

**Signature elements:**
- Foundation: caramel / medium tan with golden undertones
- Eye: black smoky with rhinestone detail
- Lip: nude gloss or hot pink gloss
- Wig: sleek bone-straight or deep body wave
- Aesthetic: intensity HIGH · warmth WARM · boldness HIGH · texture SHIMMER

---

## 3. Caribbean Carnival

**Cultural roots:** Trinidadian Carnival, Jamaican dancehall, Barbadian crop-over, soca culture  
**Archetype ID:** `caribbean_carnival`

Festival-ready colour explosion — maximum vibrancy, glitter, and body jewels. Inspired by mas camps, sound system events, and the electric energy of carnival season.

**Signature elements:**
- Foundation: warm golden-brown to deep
- Eye: tropical sunset (coral/orange/fuchsia)
- Lip: coral gloss
- Wig: long wet-wavy curls or braid-out
- Aesthetic: intensity HIGH · warmth WARM · boldness HIGH · texture SHIMMER

---

## 4. Desi Glam

**Cultural roots:** South Asian weddings, Bollywood film, mehndi culture, Pakistani bridal  
**Archetype ID:** `desi_glam`

The ultimate bridal fantasy — jewel tones, gold leaf, precise liner, and a luminous base for every complexion from fair north Indian to deep south Indian. Draws from Manish Malhotra aesthetics and Bollywood red-carpet moments.

**Signature elements:**
- Foundation: ivory-warm to deep brown spectrum
- Eye: jewel tones (emerald, ruby, sapphire) + gold liner
- Lip: deep berry or classic red
- Wig: ultra long straight (jet black or warm brown)
- Aesthetic: intensity HIGH · warmth WARM · boldness HIGH · texture SHIMMER/GLASS

---

## 5. Gulf Glam

**Cultural roots:** Arabian Peninsula luxury, Saudi and Emirati fashion, oud culture, Arab weddings  
**Archetype ID:** `gulf_glam`

Opulence refined to a razor edge — pristine skin, kohl-rimmed eyes, and a world-class fragrance palette. Inspired by Arab runway shows, luxury brand campaigns shot in the Gulf, and the intersection of modest fashion and maximalist beauty.

**Signature elements:**
- Foundation: porcelain to warm olive spectrum
- Eye: intense kohl smoked with gold or deep plum
- Lip: nude to dusty rose (perfection over drama)
- Wig: ultra long, silky straight (black or warm brown)
- Aesthetic: intensity HIGH · warmth WARM · boldness MEDIUM-HIGH · texture GLASS

---

## 6. Latina Glam

**Cultural roots:** Latina pageant culture, telenovela aesthetics, Mexican quinceañera, Colombian vallenato  
**Archetype ID:** `latina_glam`

Full glamour with warmth — a sun-kissed bronze base, sculpted cheekbones, and a lip that closes the deal. References J.Lo, Selena Quintanilla, and the pan-Latin beauty tradition that crosses from Mexico City to Bogotá to Miami.

**Signature elements:**
- Foundation: warm golden olive to tan-rich
- Eye: warm copper/burnt orange + bronze shimmer
- Lip: warm red or terracotta satin
- Wig: long curly ombre or voluminous wavy
- Aesthetic: intensity HIGH · warmth WARM · boldness HIGH · texture SHIMMER

---

## 7. K-Beauty Glass Skin

**Cultural roots:** South Korean beauty (K-beauty), K-pop idol aesthetics, Seoul street style  
**Archetype ID:** `k_beauty_glass`

The opposite pole from maximalism — a luminous, pore-less base, straight brows, gradient lip, and barely-there liner. Inspired by K-pop idols, Korean skincare culture, and the global popularity of the "glass skin" trend that K-beauty originated.

**Signature elements:**
- Foundation: porcelain to light neutral
- Eye: barely-there shimmer with wispy liner
- Lip: MLBB (my lips but better) gradient
- Wig: sleek straight bob or long silky
- Aesthetic: intensity LOW · warmth COOL · boldness LOW · texture GLASS

---

## 8. Clean Minimal

**Cultural roots:** Pan-cultural minimalism, wellness aesthetic, quiet luxury  
**Archetype ID:** `clean_minimal`

The universal starting point — no-makeup makeup that enhances without shouting. Appeals across all cultures as a daytime or off-duty look and serves as the transition state when no strong cultural signal is detected.

**Signature elements:**
- Foundation: skin-match across all depths
- Eye: mascara + soft brown shadow
- Lip: tinted balm or soft nude
- Wig: natural texture bob or no wig
- Aesthetic: intensity LOW · warmth NEUTRAL · boldness LOW · texture MATTE

---

## Scoring Model

Each archetype is scored against an **aesthetic vector** derived from Qloo taste tags:

```
score = Σ(|vector[dim] - look.weights[dim]| × -1 × dimWeight) + bonuses
```

- **Base score**: 0–0.75 (closeness across 4 dimensions)
- **Archetype bonus**: +0.15 if user's vector archetype matches look's archetype
- **Cultural bonus**: +0.05 per matching cultural keyword (max +0.10)
- **Final range**: 0.00 – 1.00

A score ≥ 0.4 is shown; results are returned ranked highest first.

---

## Wig Selection Logic

Within each look, the wig recommendation uses `hair_vibe` from the aesthetic vector:

| hair_vibe | Preferred wig texture |
|---|---|
| `natural-afro` | kinky, coily, afro |
| `long-sleek-wig` | bone-straight, silky |
| `straight-sleek` | straight, sleek |
| `long-wavy-indian` | wavy, indian remy |
| `curly-ombre` | curly, ombre |
| `long-silky` | silky, straight |
| `natural` | natural, textured |

The engine picks the wig from the look's `wig_styles[]` array whose texture field matches the `hair_vibe` keyword. Falls back to index 0 when no match.
