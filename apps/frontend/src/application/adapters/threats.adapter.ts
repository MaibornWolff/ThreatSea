/**
 * @module threats.adapter - Defines the adapter
 *     for the threats.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

export const threatAdapter = createEntityAdapter<ExtendedThreat>({
    sortComparer: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
});
