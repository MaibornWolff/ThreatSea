/**
 * @module threats.adapter - Defines the adapter
 *     for the threats.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

export const threatAdapter = createEntityAdapter<ExtendedThreat>();
