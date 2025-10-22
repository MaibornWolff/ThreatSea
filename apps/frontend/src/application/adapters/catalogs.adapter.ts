/**
 * @module catalogs.adapter - Defines the adapter
 *     for the catalogue.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";

export const catalogsAdapter = createEntityAdapter<CatalogWithRole>();
