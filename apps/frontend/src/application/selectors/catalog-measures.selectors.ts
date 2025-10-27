import type { RootState } from "#application/store.ts";
import { catalogMeasuresAdapter } from "../adapters/catalog-measures.adapter";

export const catalogMeasuresSelectors = catalogMeasuresAdapter.getSelectors(
    (state: RootState) => state.catalogMeasures
);
