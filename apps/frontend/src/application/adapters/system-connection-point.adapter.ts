/**
 * @module system-connection-point.adapter - Defines the adapter
 *     for the system connection points.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ConnectionPoint } from "#api/types/system.types.ts";

export interface SystemConnectionPoint extends ConnectionPoint {
    componentId: string | null;
    componentName: string | null;
    description?: string | null;
}

export const systemConnectionPointsAdapter = createEntityAdapter<SystemConnectionPoint>();
