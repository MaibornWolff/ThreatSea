/**
 * @module system-connections.adapter - Defines the adapter
 *     for the system connections.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Connection } from "#api/types/system.types.ts";

export interface SystemConnection extends Connection {
    visible?: boolean;
    communicationInterfaceId?: string | null;
    communicationInterface: string | null;
}

export const systemConnectionsAdapter = createEntityAdapter<SystemConnection>();
