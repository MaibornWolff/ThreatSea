/**
 * @module catalog-threats.adapter - Defines the adapter
 *     for the catalogue threats.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";

export const catalogThreatsAdapter = createEntityAdapter<CatalogThreat>();
