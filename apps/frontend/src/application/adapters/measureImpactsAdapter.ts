/**
 * @module measureImpacts.adapter - Defines the adapter
 *     for the measures.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";

export const measureImpactsAdapter = createEntityAdapter<MeasureImpact>();
