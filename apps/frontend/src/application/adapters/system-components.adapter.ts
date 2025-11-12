/**
 * @module system-components.adapter - Defines the adapter
 *     for the system components.
 */
import type { SystemComponent } from "#api/types/system.types.ts";
import { createEntityAdapter } from "@reduxjs/toolkit";

export const systemComponentsAdapter = createEntityAdapter<SystemComponent>();
