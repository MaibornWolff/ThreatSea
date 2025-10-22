/**
 * @module points-of-attack.adapter - Defines the adapter
 *     for the points of attack.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { PointOfAttack } from "#api/types/system.types.ts";

export interface SystemPointOfAttack extends PointOfAttack {
    componentName: string | null;
}

export const pointsOfAttackAdapter = createEntityAdapter<SystemPointOfAttack>();
