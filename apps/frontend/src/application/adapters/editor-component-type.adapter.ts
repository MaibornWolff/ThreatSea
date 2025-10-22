/**
 * @module component-type.adapter - Defines the adapter
 *     for the component types.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

export interface EditorComponentType {
    id: string | number;
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    symbol: string | null;
    isStandard?: boolean;
    projectId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const editorComponentTypeAdapter = createEntityAdapter<EditorComponentType>();
