import type { RootState } from "#application/store.ts";
import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

export const catalogThreatsSelectors = catalogThreatsAdapter.getSelectors((state: RootState) => state.catalogThreats);
