import type { RootState } from "#application/store.ts";
import { catalogMeasuresAdapter } from "#application/adapters/catalog-measures.adapter.ts";

export const catalogMeasuresSelectors = catalogMeasuresAdapter.getSelectors(
    (state: RootState) => state.catalogMeasures
);
