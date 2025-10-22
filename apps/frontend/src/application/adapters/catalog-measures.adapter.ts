/**
 * @module catalog-measures.adapter - Adapter for
 *     the measures of the catalogue.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";

export const catalogMeasuresAdapter = createEntityAdapter<CatalogMeasure>();
