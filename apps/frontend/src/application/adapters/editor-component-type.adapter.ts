/**
 * @module component-type.adapter - Defines the adapter
 *     for the component types.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";

export interface EditorComponentType {
    id: STANDARD_COMPONENT_TYPES | number;
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    symbol: string | null;
    isStandard?: boolean;
    projectId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const editorComponentTypeAdapter = createEntityAdapter<EditorComponentType>();
