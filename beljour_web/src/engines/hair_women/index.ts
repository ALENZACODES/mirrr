export * from "./contracts.js";
export * from "./engine.js";
export * from "./evaluation.js";
export * from "./timeline.js";
export { HairStyleSession, renderStyle, STYLES, SIMULATION_LABEL } from "./short-sides.js";
export type { StyleId, StyleOptions, StyleResult, Texture } from "./short-sides.js";

// Lane C r25c-cp2: stable public interfaces for women hair consultation guides.
export { DEFINITIONS, STYLE_KEYS, TEXTURES, definition as styleGuideDefinition, guideFields } from "./style-guides.js";
export type { GuideField, StyleDefinition, StyleKey, TextureKey } from "./style-guides.js";
export { StyleGuideSession, renderStyleGuide } from "./style-preview.js";
export type { PrimaryBox, StyleOptions as GuideStyleOptions, StylePreview } from "./style-preview.js";
export { auditStyle, assertEvidenceSchema, countGroups, monotoneCoverage } from "./style-audit.js";
export type { AuditStatus, EvidenceCount, StylePixelEvidence } from "./style-audit.js";
export { checkedChoices, comparison as compareStyleGuides, safeRecipe as safeStyleRecipe } from "./style-compare.js";
export type { Comparison, ComparisonOptions, ComparisonPanel, StyleChoice } from "./style-compare.js";
