import type { RootState } from "#application/store.ts";
import { measureImpactsAdapter } from "#application/adapters/measureImpactsAdapter.ts";

export const measureImpactsSelectors = measureImpactsAdapter.getSelectors((state: RootState) => state.measureImpacts);
