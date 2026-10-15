/**
 * @module protection-goals.types - Defines the protection goals (confidentiality, integrity, availability).
 */

export const PROTECTION_GOALS = ["confidentiality", "integrity", "availability"] as const;

export type ProtectionGoal = (typeof PROTECTION_GOALS)[number];
