/**
 * MIRRR Hair Damage Guide
 * Types of hair damage, bond repair science, protein treatments,
 * recovery protocols, and ethnic hair damage considerations
 */

// ─── HAIR STRUCTURE ───────────────────────────────────────────────────────────

export const HAIR_STRUCTURE = {
  cuticle: {
    layer: 'Cuticle (Outermost)',
    description: 'Overlapping scales (like roof tiles or fish scales) that protect the inner hair structure. Healthy cuticle: smooth, flat, tightly sealed → hair is shiny, smooth, resistant to moisture loss. Damaged cuticle: lifted, chipped, missing scales → hair is dull, porous, frizzy, prone to breakage.',
    damaged_by: ['Heat styling', 'Chemical processing', 'Mechanical friction', 'UV radiation', 'Hard water minerals', 'Alkaline products (high pH)'],
    repaired_by: ['Acidic rinses (ACV — apple cider vinegar; pH 2.5-3.5)', 'Cuticle-sealing conditioners', 'Protein treatments (temporary filling)', 'Silicone coating (temporary smoothing)', 'Healthy hair practices (low heat, low friction)'],
  },
  cortex: {
    layer: 'Cortex (Middle)',
    description: 'The bulk of the hair shaft. Made of keratin proteins organised into fibrils. Contains melanin granules (hair colour). Determines hair strength, elasticity, and curl pattern. Chemical damage (bleach, relaxers) disrupts cortex structure.',
    damaged_by: ['Bleaching (oxidises melanin; disrupts disulfide bonds; swells cortex)', 'Relaxers/perms (breaks and reforms disulfide bonds)', 'Over-processing with any chemical', 'Severe physical damage'],
    repaired_by: ['Bond repair treatments (Olaplex, K18, Wellaplex)', 'Protein reconstruction treatments', 'Moisture and care protocols (cannot fully restore cortex — prevention is best)'],
  },
  medulla: {
    layer: 'Medulla (Inner Core)',
    description: 'Present in coarser, thicker hair strands. May be absent in fine hair. Function not fully understood. Not a primary target of damage or repair.',
  },
  bonds: {
    disulfide_bonds: {
      description: 'Strong covalent bonds between sulfur atoms in adjacent keratin chains. Responsible for hair\'s permanent shape — straight, wavy, or curly based on bond pattern.',
      damaged_by: 'Chemical processing (relaxers, perms, bleach). Bleach does NOT break disulfide bonds (it targets melanin via oxidation) but secondary processes can damage them.',
      repaired_by: 'Bond-building treatments: Olaplex (bis-aminopropyl diglycol dimaleate, which the brand says relinks broken disulfide bonds) and K18 (a peptide the brand says repairs keratin chains).',
    },
    hydrogen_bonds: {
      description: 'Temporary bonds that can be broken by water and reformed on drying. Give hair its "memory" of shape — responsible for temporary set from rollers, blowout, etc.',
      damaged_by: 'Every wash breaks them; they reform as hair dries. Normal — not damage.',
      repaired_by: 'Reform naturally when hair dries. Heat styling also temporarily breaks and reforms hydrogen bonds.',
    },
    salt_bonds: {
      description: 'Ionic bonds disrupted by extreme pH (very acidic or very alkaline). Contribute to hair strength.',
      damaged_by: 'Extremely alkaline products (some relaxers; traditional soap); very acidic products.',
      repaired_by: 'Normalised by returning to normal pH range. ACV rinse or acidic conditioner.',
    },
  },
};

// ─── DAMAGE TYPES ────────────────────────────────────────────────────────────

export const DAMAGE_TYPES = {
  heat_damage: {
    type: 'Heat Damage',
    causes: 'Flat irons, curling irons, blow dryers used at excessive temperatures. Safe temperature ranges: fine hair 180°C/356°F max; medium hair 200°C/392°F; coarse hair up to 230°C/446°F max.',
    signs: [
      'Loss of curl pattern that does not return when wet (permanent straightening — not reversal)',
      'Dryness and brittleness',
      'Split ends',
      'Hair "cooked" appearance — rough, dull texture',
      'Breakage when attempting styling',
    ],
    critical_note: 'Heat damage on curly/coily hair can permanently alter the curl pattern. Once the cortex protein is denatured by heat, the damage is largely permanent — only cutting off the damaged length truly resolves it.',
    ethnic_note: 'Type 4 (coily) hair is most vulnerable to heat damage because its structure requires hair to be manipulated at high tension to straighten, AND the natural curl pattern makes damage most visible as pattern alteration. Heat training (repeated high-heat styling) is not hair health.',
    prevention: [
      'Always use heat protectant — creates a thermal barrier',
      'Start at lowest effective temperature',
      'Never use heat on soaking wet hair (explosion of steam from inside hair shaft)',
      'Limit heat styling frequency',
      'Use ionic dryers (reduce drying time; less heat exposure)',
    ],
    heat_protectants: {
      how_they_work: 'Form a thin film over the cuticle that absorbs heat before the hair does. Delay temperature reaching damaging threshold.',
      ingredients: 'Dimethicone; cyclopentasiloxane; castor oil; hydrolysed proteins; panthenol.',
      application: 'Apply to DAMP hair, not soaking wet; distribute evenly; allow to absorb slightly before applying heat.',
    },
  },
  chemical_damage: {
    type: 'Chemical Damage (Colour, Bleach, Relaxer, Perm)',
    bleach_damage: {
      what_happens: 'Bleach (hydrogen peroxide + ammonium persulphate) penetrates hair shaft, oxidises melanin (destroying colour), and degrades protein structure. Raises cuticle permanently in process. Creates porous, weakened hair.',
      signs: ['Extreme dryness and brittleness', 'Hair feels like cotton or candy floss when wet', 'Extreme elasticity (stretches excessively, snaps)', 'Mushy feel when wet (over-processed)', 'Breakage when combing'],
      recovery: 'Bond-building treatments (Olaplex, K18) are widely used by colourists for bleach-damaged hair. Protein treatments for protein loss. Moisture for dryness. Cannot restore completely — prevent future damage.',
    },
    relaxer_damage: {
      what_happens: 'Chemical relaxers (NaOH or guanidine) break disulfide bonds in hair at high pH (12-14). Bonds reform in new, straight configuration. Process leaves hair chemically altered and protein-depleted.',
      signs: ['Extreme brittleness, especially at the "line of demarcation" — where relaxed meets natural hair', 'Breakage at this line', 'Scalp burns or scarring if over-processed', 'Thinning'],
      
      recovery: 'Protein treatments; careful moisture-protein balance; transition to natural or "big chop"; minimal manipulation; protective styles during transition.',
    },
    colour_damage: {
      what_happens: 'Permanent colour uses hydrogen peroxide (10-40 volume) + ammonia. Penetrates cuticle; deposits colour in cortex. Repeated processing depletes protein and dries hair.',
      semi_permanent: 'No peroxide; coats hair externally; less damaging. Fades with washing.',
      protection: 'Colour-safe shampoos (sulfate-free to prevent colour stripping); cold water rinses; bond treatment before colour; less frequent washing.',
    },
    perm_damage: {
      what_happens: 'Permanent waves break disulfide bonds (ammonium thioglycolate), reform hair around rods (waving lotion → neutraliser). Less protein damage than relaxers if done correctly.',
      signs: 'Over-processed perms: extreme dryness, mushy texture, breakage.',
    },
  },
  mechanical_damage: {
    type: 'Mechanical Damage (Physical Trauma)',
    causes: ['Aggressive detangling — especially when dry', 'Fine-tooth combs on curly/coily hair', 'Tight hairstyles (traction)', 'Sleeping on rough pillowcases (cotton)', 'Elastic hair ties with metal crimps', 'Over-manipulation of any kind'],
    signs: ['Breakage — primarily at manipulation points', 'Thinning at temples and edges (traction alopecia)', 'Split ends throughout', 'Frizz from cuticle disruption'],
    ethnic_note: 'Type 4 coily hair is most susceptible to mechanical damage because each coil is a potential breakage point, and the structure requires more manipulation to style.',
    prevention: [
      'Always detangle on wet, conditioned hair',
      'Start from ends, work to roots',
      'Use a wide-tooth comb or Denman brush',
      'Silk or satin pillowcases/bonnets (reduce friction by 43%)',
      'Seamless hair ties (no metal)',
      'Protective styles to reduce daily manipulation',
      'Gentle handling at all times',
    ],
  },
  environmental_damage: {
    type: 'Environmental Damage',
    UV: 'UV radiation degrades protein in hair shaft; photo-oxidises melanin (colour fading); makes hair dry and brittle over time. Hair has no repair mechanism for UV damage.',
    hard_water: 'Calcium and magnesium minerals deposit on hair shaft; create film; interfere with product penetration; make hair feel rough, stiff, and dull.',
    pollution: 'Particulate matter deposits on hair; may penetrate into cortex; accelerates oxidation. Particularly damaging in highly polluted cities.',
    chlorine: 'Pool chlorine oxidises hair protein; removes natural oils; can green-tint blonde/light hair (actually from copper, not chlorine itself).',
    salt_water: 'Drying; dehydrating; strips moisture from cortex. Beautiful beach waves come at a moisture cost.',
    protection: ['SPF hair spray or UV-protective leave-in for sun', 'Chelating shampoo monthly for hard water', 'Rinse hair before swimming; wear swim cap; wet hair first absorbs less chlorine', 'Immediate post-swim rinse and deep condition'],
  },
};

// ─── BOND REPAIR SCIENCE ──────────────────────────────────────────────────────

export const BOND_REPAIR_SCIENCE = {
  overview: {
    what_is_it: 'A category of hair treatments that work by repairing broken chemical bonds in the hair\'s protein structure. Primarily targeting disulfide bonds damaged by bleach, colour, and chemical processing.',
    revolution: 'The category was created by Olaplex (invented 2014 by Craig Hawker and Eric Pressly at UC Santa Barbara). It made bond-protecting additives a standard part of salon lightening.',
  },
  olaplex: {
    brand: 'Olaplex',
    active_ingredient: 'Bis-aminopropyl diglycol dimaleate (Olaplex\'s patented molecule)',
    mechanism: 'Seeks out and connects broken disulfide bonds within the hair shaft. Works during and after chemical processing.',
    products: {
      no1: 'No.1 Bond Multiplier — professional add-in to bleach/colour during service',
      no2: 'No.2 Bond Perfector — professional rinse-out after colour service',
      no3: 'No.3 Hair Perfector — at-home weekly treatment',
      no4: 'No.4 Bond Maintenance Shampoo',
      no5: 'No.5 Bond Maintenance Conditioner',
      no6: 'No.6 Bond Smoother — leave-in reparative styling cream',
      no7: 'No.7 Bonding Oil',
      no8: 'No.8 Bond Intense Moisture Mask',
    },
    how_to_use_no3: 'Apply to unwashed, towel-dried hair. Leave minimum 10 min (ideally 45 min to overnight). Rinse; shampoo and condition as normal. Use weekly for damaged hair; monthly for maintenance.',
    limitations: 'Cannot restore severely damaged hair to "virgin" state. Most effective when used during chemical services (preventative) and as ongoing maintenance. Not a substitute for cutting damaged ends.',
  },
  k18: {
    brand: 'K18',
    active_ingredient: 'K18Peptide — a bioidentical peptide matching a specific keratin chain sequence',
    mechanism: 'Peptide molecule (small enough to penetrate deep into cortex) reconnects broken polypeptide chains in the hair\'s keratin network.',
    key_difference_from_olaplex: 'K18 says it targets polypeptide chains rather than disulfide bonds, a different approach; many professionals use both.',
    how_to_use: 'Shampoo (no conditioner). Towel dry. Apply K18 mask. Wait 4 minutes. Style as normal — does not need to be rinsed out.',
    main_claim: '4-minute treatment with professional-level repair. No rinsing required.',
  },
  wellaplex: {
    brand: 'Wellaplex / FIBREPLEX',
    description: 'Wella\'s bond builder. Uses Bis-Aminopropyl Diglycol Dimaleate (same class as Olaplex). Professional use.',
  },
  comparison: {
    olaplex_vs_k18: 'Olaplex: older; more research; targets disulfide bonds. K18: newer; faster processing; targets polypeptide chains. Best results: combine both for comprehensive repair.',
    when_to_use: 'Before, during, and after any chemical service. Weekly maintenance for chemically-treated hair. Emergency repair protocol for severely damaged hair.',
  },
};

// ─── PROTEIN TREATMENTS ───────────────────────────────────────────────────────

export const PROTEIN_TREATMENTS = {
  why_protein: {
    
    note: 'Protein ≠ bond repair. Protein treatments deposit protein externally and temporarily. Bond repair works internally on chemical bonds. Both are needed for comprehensive recovery from chemical damage.',
  },
  protein_types: {
    hydrolysed_keratin: {
      protein: 'Hydrolysed Keratin',
      description: 'Broken-down keratin (the hair\'s own protein). Small fragments can penetrate the cuticle. Best protein for strengthening and smoothing.',
    },
    hydrolysed_wheat: {
      protein: 'Hydrolysed Wheat Protein',
      description: 'Adds body and volume; strengthens. Good for fine, fragile hair.',
    },
    hydrolysed_silk: {
      protein: 'Hydrolysed Silk Protein',
      description: 'Very small molecule; deep penetration; adds shine and smoothness.',
    },
    hydrolysed_collagen: {
      protein: 'Hydrolysed Collagen Protein',
      description: 'Strengthening; moisture-binding. Good all-around protein.',
    },
    eggs: {
      protein: 'Egg (DIY protein treatment)',
      description: 'Raw egg contains albumin proteins and fatty yolk. An excellent DIY protein treatment: beat egg; apply to clean damp hair; leave 20-30 min; rinse with COOL water (hot water scrambles the egg in your hair — a very messy mistake).',
    },
  },
  moisture_protein_balance: {
    concept: 'The MOST important principle in curly and chemically-treated hair care. Hair needs BOTH moisture AND protein in balance. Too much protein → hair is hard, stiff, snaps (protein overload). Too much moisture → hair is mushy, limp, no structure (hygral fatigue).',
    identifying_protein_need: [
      'Stretches excessively when wet then snaps — needs protein',
      'Hair feels gummy or mushy — needs protein',
      'Extreme porosity, cannot hold moisture — needs protein',
    ],
    identifying_moisture_need: [
      'Hair is hard, stiff, brittle — needs moisture',
      'No stretch at all when wet — needs moisture',
      'Rough, dry texture — needs moisture',
    ],
    protocol: 'If protein depleted: 1-3 protein treatments, then return to moisture routine. If over-proteinised: skip protein; use deep conditioning moisture masks until balance restores.',
  },
  popular_treatments: {
    aphogee_two_step: 'ApHogee 2-Step Protein Treatment — strongest OTC protein treatment. For severely damaged, over-processed hair. Hardens the hair temporarily while drying — must not manipulate or it will break. Followed by the balancing moisturiser.',
    hask_keratin: 'HASK Keratin Protein Smoothing Conditioner — lighter, daily-use protein maintenance.',
    giovanni_nutrafix: 'Giovanni Nutrafix — affordable light protein treatment.',
  },
};

// ─── RECOVERY PROTOCOLS ───────────────────────────────────────────────────────

export const DAMAGE_RECOVERY_PROTOCOLS = {
  bleach_damage: {
    protocol: 'Bleach Damage Recovery Protocol',
    steps: [
      '1. STOP: No more bleach until hair is significantly recovered',
      '2. Professional assessment: consult a trusted hairstylist for realistic recovery plan',
      '3. Bond repair: begin Olaplex No.3 weekly; consider salon No.1 and No.2 service',
      '4. Protein balance: monthly ApHogee 2-Step for severely damaged hair; then lighter weekly protein',
      '5. Deep moisture: weekly deep conditioning mask (30+ min with heat for maximum penetration)',
      '6. Protective styling: eliminate all heat; no further chemical services',
      '7. Trim: every 6-8 weeks, removing most damaged ends',
      '8. Timeline: 3-6 months of consistent care typically needed; severe damage may require "big chop"',
    ],
    realistic_expectation: 'Severely bleach-damaged hair (mushy, snapping, unable to hold style) cannot always be fully recovered. Cutting the damaged length is sometimes the best decision for overall hair health.',
  },
  heat_damage: {
    protocol: 'Heat Damage Recovery Protocol',
    note: 'Permanent heat damage (altered curl pattern) cannot be reversed with products — only cutting off the damaged section solves it.',
    steps: [
      '1. Stop all heat styling immediately',
      '2. Deep moisture: weekly deep conditioning; cold water rinses',
      '3. Protein treatments: monthly to strengthen remaining hair',
      '4. Protective styling: braids, twists, or wigs to protect hair while waiting for new growth',
      '5. Trim: trim off most damaged ends as they become noticeable',
      '6. Patience: curl pattern grows back on new growth only — existing heat-damaged hair will not revert',
    ],
  },
  relaxer_transition: {
    protocol: 'Transitioning from Relaxer to Natural Protocol',
    line_of_demarcation: 'The most fragile point in transitioning hair. Treat with extreme care. Avoid manipulation at this junction.',
    steps: [
      '1. Decision: "gradual grow-out" (protective styles; regular trims) or "big chop" (cut off all relaxed hair)',
      '2. Protective styles: twists, braids, extensions to protect the transitioning hair',
      '3. Moisturise heavily: two-strand twists sealed with oil/butter nightly',
      '4. Protein: monthly lightweight protein to strengthen line of demarcation',
      '5. Minimal manipulation: avoid excessive combing or styling at junctions',
      '6. Gradual trim: every 8-12 weeks, trim more relaxed ends',
      '7. Timeline: at least 12 months for significant natural growth; often 18-24 months for full transition before big chop',
    ],
  },
  general_recovery: {
    daily_habits: [
      'Gentle detangling on wet, conditioned hair only',
      'Sleep on satin/silk pillowcase or in satin bonnet',
      'Protective styles to reduce manipulation',
      'No heat until fully recovered',
      'Regular deep conditioning',
      'Trim split ends consistently (they travel up the shaft)',
      'Stay hydrated — water is the first ingredient in hair moisture',
    ],
  },
};

// ─── ETHNIC HAIR DAMAGE NOTES ────────────────────────────────────────────────

export const ETHNIC_HAIR_DAMAGE = {
  west_african_hair: {
    common_damage: 'Relaxer damage; heat straightening damage; traction alopecia from tight braids and extensions.',
    specific_vulnerability: 'Type 4 coily structure means each coil is a potential breakage point. The natural curl requires excellent moisture-protein balance.',
    recovery_priority: 'Moisture first; then bond repair; eliminate chemical processing if possible.',
  },
  south_asian_hair: {
    common_damage: 'Heat styling from frequent blow-drying; some chemical straightening; colour damage; hard water damage (very common in South Asia).',
    specific_vulnerability: 'Long, thick hair creates tension on individual strands from weight; scalp often becomes dry from heavy oil applications without proper cleansing.',
    recovery_priority: 'Chelating shampoo for hard water mineral build-up; protein treatment for heat damage; proper scalp hygiene.',
  },
  caribbean_hair: {
    common_damage: 'Mix of Type 3-4 hair; significant relaxer use historically; chlorine damage from beach/pool; heat damage.',
    specific_vulnerability: 'Tropical humidity causes swelling and contraction of hair shaft; combined with mechanical manipulation creates significant damage.',
    recovery_priority: 'Bond repair; humidity-sealing products; protective styles.',
  },
  arab_hair: {
    common_damage: 'Heat styling damage; bleach/colour damage; sun/UV damage from outdoor lifestyles.',
    specific_vulnerability: 'Long, thick hair prone to weight-related breakage; hair dyeing very common (grey coverage) and cumulative colour damage.',
    recovery_priority: 'Protein treatment for colour damage; UV protection; argan oil for moisture.',
  },
  latina_hair: {
    common_damage: 'Wide variety of hair types (Type 2-4); relaxer damage in Afro-Latina communities; heat damage; colour damage.',
    specific_vulnerability: 'Varies significantly by hair type. Afro-Latina Type 4: same as Type 4 vulnerabilities. Type 2: more mechanical/heat damage.',
    recovery_priority: 'Identify hair type first; protein and moisture balance accordingly; bond repair for colour-treated.',
  },
  east_asian_hair: {
    common_damage: 'Heat styling; bleaching for fashion colour; Korean/Japanese straightening treatments; perm damage.',
    specific_vulnerability: 'East Asian hair typically has larger diameter and more cuticle layers than other hair types — quite resilient — but chemical bleaching (lifting from black to blonde requires multiple sessions) causes severe damage.',
    recovery_priority: 'Bond repair essential for bleach damage; protein for texture restoration; toning for brassiness from bleach.',
  },
  east_african_hair: {
    common_damage: 'Similar to West African Type 4 challenges; traditional butter/oil treatments sometimes trapping bacteria; traction from tight braiding.',
    specific_vulnerability: 'Type 4 coily; protein-depleted from styling practices.',
    recovery_priority: 'Moisture balance; protein treatment; scalp health; gentle protective styles.',
  },
  south_african_hair: {
    common_damage: 'Legacy of chemical relaxers and skin lightening culture; transition to natural movement growing; traction alopecia.',
    recovery_priority: 'Bond repair; moisture-protein balance; natural hair education and pride.',
  },
  black_american_hair: {
    common_damage: 'Extensive history with chemical relaxers; heat styling; protective style tension; TWA (teenie weenie afro) to long natural hair journey.',
    specific_vulnerability: 'Type 3-4 hair; entire natural hair care movement was born from the need to understand and care for this hair type without chemical alteration.',
    recovery_priority: 'Low porosity hair care if applicable; LOC/LCO method moisture retention; bond repair; protective styles.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairStructureGuide() { return HAIR_STRUCTURE; }
export function getDamageType(type) {
  return DAMAGE_TYPES[type?.toLowerCase()] || Object.values(DAMAGE_TYPES);
}
export function getBondRepairScience() { return BOND_REPAIR_SCIENCE; }
export function getProteinTreatmentGuide() { return PROTEIN_TREATMENTS; }
export function getRecoveryProtocol(damageType) {
  return DAMAGE_RECOVERY_PROTOCOLS[damageType?.toLowerCase()] || DAMAGE_RECOVERY_PROTOCOLS;
}
export function getEthnicHairDamageNotes(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_HAIR_DAMAGE[key + '_hair'] || Object.values(ETHNIC_HAIR_DAMAGE);
}

