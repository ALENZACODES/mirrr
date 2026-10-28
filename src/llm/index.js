/**
 * LLM narration for MIRRR look recommendations.
 *
 * Tries OpenAI (gpt-4o-mini) first, then Gemini, then falls back
 * to a rich template-based narrator that never fails.
 *
 * Env vars:
 *   OPENAI_API_KEY   — optional
 *   GEMINI_API_KEY   — optional
 */

// ---------------------------------------------------------------------------
// Template fallback (always works, no API key)
// ---------------------------------------------------------------------------

const ARCHETYPE_INTROS = {
  afro_glam:
    'Your taste is rooted in Afrobeats culture — West African editorial energy, '
    + 'Nollywood glam, the kind of looks that command a room.',
  hip_hop_glam:
    'Your taste traces back to hip-hop and urban culture — '
    + 'the beauty aesthetic that Black women built and the world eventually borrowed.',
  caribbean_carnival:
    'Your taste is pure Caribbean energy — '
    + 'sun, rhythm, and the most joyful makeup tradition on earth.',
  desi_glam:
    'Your taste speaks Bollywood and South Asian festivities — '
    + 'jewel-toned, dramatic, and rooted in one of the richest beauty traditions anywhere.',
  gulf_glam:
    'Your taste is Gulf luxury — '
    + 'Khaleeji grace, Levantine finesse, Persian artistry. Understated power.',
  latina_glam:
    'Your taste is Latin heat — '
    + 'bronzed, bold-lipped, and built from a culture that invented sensuality.',
  k_beauty:
    'Your taste is glass-skin Seoul — '
    + 'K-beauty\'s porcelain precision and Hallyu cultural confidence.',
  clean_minimal:
    'Your taste is effortless and skin-first — '
    + 'the hardest aesthetic to pull off and the most universally beautiful.',
};

const DEFAULT_INTRO =
  'Your cultural taste signature is unique — a blend across traditions '
  + 'that mainstream beauty apps were never built to serve.';

/**
 * Generate a narration string from pipeline results (template, no API).
 *
 * @param {object} results — from runPipeline()
 * @returns {string}
 */
function templateNarration(results) {
  const { aesthetic, looks, entities, meta } = results;
  const primaryArchetype = aesthetic?.archetypes?.[0] ?? 'clean_minimal';
  const intro = ARCHETYPE_INTROS[primaryArchetype] ?? DEFAULT_INTRO;

  const entityNames = entities?.slice(0, 3).map((e) => e.name ?? e.input).join(', ') ?? '';
  const entityLine = entityNames ? `\n\nYou're drawn to ${entityNames}.` : '';

  const topLook = looks?.[0]?.look;
  const lookLine = topLook
    ? `\n\nYour signature look is **${topLook.name}** — ${topLook.description}`
    : '';

  const wigLine =
    looks?.[0]?.wigStyle
      ? `\n\nCompletely this look: ${looks[0].wigStyle.name} wig.`
      : '';

  const archLines = (aesthetic?.archetypes ?? [])
    .slice(0, 3)
    .map((a) => a.replace(/_/g, ' '))
    .join(', ');
  const archLine = archLines ? `\n\nYour aesthetic archetypes: ${archLines}.` : '';

  return `${intro}${entityLine}${lookLine}${wigLine}${archLine}`;
}

// ---------------------------------------------------------------------------
// OpenAI narrator
// ---------------------------------------------------------------------------

async function openaiNarration(results) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no OPENAI_API_KEY');

  const prompt = buildPrompt(results);

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You write short, vivid beauty narrations for MIRRR — a beauty app built for Black, '
            + 'South Asian, Arab, Latina, Caribbean, and East Asian women. '
            + 'Be warm, specific, and culturally grounded. 3–4 sentences max. No emojis.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ---------------------------------------------------------------------------
// Gemini narrator
// ---------------------------------------------------------------------------

async function geminiNarration(results) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('no GEMINI_API_KEY');

  const prompt = buildPrompt(results);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{
          text:
            'You write short, vivid beauty narrations for MIRRR — a beauty app built for Black, '
            + 'South Asian, Arab, Latina, Caribbean, and East Asian women. '
            + 'Be warm, specific, and culturally grounded. 3–4 sentences max. No emojis.',
        }],
      },
      generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
    }),
  });

  if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

// ---------------------------------------------------------------------------
// Shared prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(results) {
  const { aesthetic, looks, entities } = results;
  const topLook = looks?.[0]?.look?.name ?? 'Custom Look';
  const archetypes = aesthetic?.archetypes?.join(', ') ?? 'unknown';
  const entityNames = entities?.slice(0, 4).map((e) => e.name ?? e.input).join(', ') ?? 'their taste';
  const tags = results.tags?.slice(0, 6).map((t) => t.name ?? t).join(', ') ?? '';

  return [
    `The user's top cultural references: ${entityNames}.`,
    `Qloo taste tags: ${tags}.`,
    `Aesthetic archetypes: ${archetypes}.`,
    `Top recommended look: ${topLook}.`,
    'Write a 3–4 sentence beauty narration for this user.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a narration for MIRRR pipeline results.
 * Tries LLM providers in order; falls back to template.
 *
 * @param {object} results — from runPipeline()
 * @param {object} [opts]
 * @param {boolean} [opts.useTemplate] — skip LLM and use template directly
 * @returns {Promise<{ narration: string, source: string }>}
 */
export async function narrate(results, { useTemplate = false } = {}) {
  if (!useTemplate) {
    // Try OpenAI
    try {
      const narration = await openaiNarration(results);
      if (narration) return { narration, source: 'openai' };
    } catch { /* fall through */ }

    // Try Gemini
    try {
      const narration = await geminiNarration(results);
      if (narration) return { narration, source: 'gemini' };
    } catch { /* fall through */ }
  }

  // Template fallback — always works
  return { narration: templateNarration(results), source: 'template' };
}
