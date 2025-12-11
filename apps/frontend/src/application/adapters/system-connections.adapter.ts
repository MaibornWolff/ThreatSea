/**
 * @module system-connections.adapter - Defines the adapter
 *     for the system connections.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { SystemConnection } from "#api/types/system.types.ts";

export const systemConnectionsAdapter = createEntityAdapter<SystemConnection>();
