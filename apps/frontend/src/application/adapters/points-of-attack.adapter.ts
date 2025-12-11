/**
 * @module points-of-attack.adapter - Defines the adapter
 *     for the points of attack.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { SystemPointOfAttack } from "#api/types/system.types.ts";

export const pointsOfAttackAdapter = createEntityAdapter<SystemPointOfAttack>();
