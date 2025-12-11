/**
 * @module measures.adapter - Defines the adapter
 *     for the measures.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Measure } from "#api/types/measure.types.ts";

export const measuresAdapter = createEntityAdapter<Measure>();
