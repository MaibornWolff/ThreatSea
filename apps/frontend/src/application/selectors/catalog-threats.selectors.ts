import type { RootState } from "#application/store.ts";
import { catalogThreatsAdapter } from "#application/adapters/catalog-threats.adapter.ts";

export const catalogThreatsSelectors = catalogThreatsAdapter.getSelectors((state: RootState) => state.catalogThreats);
